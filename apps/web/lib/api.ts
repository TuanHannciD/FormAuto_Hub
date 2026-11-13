import { clearStoredSession, getSessionBoundary, getStoredSession, getValidAccessToken, refreshSession, SessionExpiredError } from "@/lib/auth";
import { readNckhGoogleAuthorizationError } from "@/lib/nckh-google-auth";

export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000");

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

type RequestOptions = RequestInit & {
  json?: unknown;
  skipAuth?: boolean;
};

export type ApiErrorKind = "http" | "network" | "invalid-response";

export class ApiError extends Error {
  readonly status: number | null;
  readonly method: string;
  readonly path: string;
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>;
  readonly traceId?: string;
  readonly kind: ApiErrorKind;
  readonly code?: string;

  constructor(kind: ApiErrorKind, method: string, path: string, status: number | null = null,
    metadata: { fieldErrors?: Record<string, string[]>; traceId?: string; code?: string } = {}) {
    super(kind === "network"
      ? "Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại."
      : kind === "invalid-response"
        ? "Phản hồi từ máy chủ chưa hợp lệ. Vui lòng tải lại dữ liệu."
        : status === 400
          ? "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại."
          : status === 403
            ? "Bạn không có quyền thực hiện thao tác này."
            : status === 404
              ? "Không tìm thấy dữ liệu được yêu cầu."
              : status === 409
                ? "Chưa thực hiện được thao tác. Vui lòng kiểm tra dữ liệu hiện tại."
                : status === 429
                  ? "Có quá nhiều yêu cầu. Vui lòng thử lại sau."
                  : "Yêu cầu chưa thành công. Vui lòng thử lại sau.");
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.method = method.toUpperCase();
    this.path = path.split(/[?#]/, 1)[0].slice(0, 256);
    this.fieldErrors = metadata.fieldErrors ?? {};
    this.traceId = metadata.traceId;
    this.code = metadata.code;
  }
}

// Retain field identity, never the server's validation text or submitted values.
const validationGuidance: Record<string, string> = {
  Email: "Vui lòng kiểm tra email.",
  Password: "Vui lòng kiểm tra mật khẩu.",
  FullName: "Vui lòng kiểm tra họ tên.",
  CurrentPassword: "Vui lòng kiểm tra mật khẩu hiện tại.",
  NewPassword: "Vui lòng kiểm tra mật khẩu mới.",
  ConfirmPassword: "Vui lòng kiểm tra xác nhận mật khẩu.",
  Name: "Vui lòng kiểm tra tên.",
  Credits: "Vui lòng kiểm tra số credit.",
  Price: "Vui lòng kiểm tra giá."
};

function isAbort(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function request(path: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new ApiError("network", options.method ?? "GET", path);
  }
}

async function httpError(response: Response, method: string, path: string): Promise<ApiError> {
  const fieldErrors: Record<string, string[]> = {};
  let traceId: string | undefined;
  let code: string | undefined;
  try {
    const text = await response.text();
    // Oversized/unstructured bodies are never kept as diagnostics or UI copy.
    const problem: unknown = text.length <= 32_768 ? JSON.parse(text) : null;
    if (problem && typeof problem === "object" && !Array.isArray(problem)) {
      const { errors, traceId: trace } = problem as { errors?: unknown; traceId?: unknown };
      const candidate = (problem as { code?: unknown }).code;
      if (typeof candidate === "string" && historyProblemCodes.has(candidate)) code = candidate;
      if (errors && typeof errors === "object" && !Array.isArray(errors)) {
        for (const [field, guidance] of Object.entries(validationGuidance)) {
          const messages = (errors as Record<string, unknown>)[field];
          if (Array.isArray(messages) && messages.some(message => typeof message === "string")) {
            fieldErrors[field] = [guidance];
          }
        }
      }
      // Existing ASP.NET trace formats only; arbitrary token-like identifiers are dropped.
      if (typeof trace === "string" && /^(?:00-[a-f0-9]{32}-[a-f0-9]{16}-[a-f0-9]{2}|[A-Z0-9]{10,32}:[A-F0-9]{8})$/.test(trace)) {
        traceId = trace;
      }
    }
  } catch (error) {
    if (isAbort(error)) throw error;
    // Empty, malformed and unreadable error bodies retain HTTP classification.
  }
  return new ApiError("http", method, path, response.status, { fieldErrors, traceId, code });
}

const historyProblemCodes = new Set(["ClientUpgradeRequired", "ActiveSubmissionJob", "HistoryExpired", "FormIncompatible", "FormEvidenceUnavailable", "InsufficientAvailableCredit", "CommandConflict", "OutcomeUnresolved", "ConcurrentAdmission"]);

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const owner = options.skipAuth ? null : getStoredSession()?.userId;
  const boundary = options.skipAuth ? null : getSessionBoundary();
  const result = await apiFetchInternal<T>(path, options, false, owner, boundary);
  if (!options.skipAuth && (getStoredSession()?.userId !== owner || getSessionBoundary() !== boundary)) throw new SessionExpiredError();
  return result;
}

export async function apiFetchBlob(path: string, retried = false): Promise<Blob> {
  const headers = new Headers();
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new SessionExpiredError();
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await request(path, {
    headers,
    cache: "no-store"
  });

  if (response.status === 401) {
    const googleError = await readNckhGoogleAuthorizationError(path, response);
    if (googleError) throw googleError;
    const refreshed = !retried ? await refreshSession(accessToken) : null;
    if (refreshed) {
      return apiFetchBlob(path, true);
    }
    if (getStoredSession()?.accessToken === accessToken) clearStoredSession();
    throw new SessionExpiredError();
  }

  if (!response.ok) {
    throw await httpError(response, "GET", path);
  }

  try {
    return await response.blob();
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new ApiError("network", "GET", path, response.status);
  }
}

async function apiFetchInternal<T>(path: string, options: RequestOptions, retried: boolean, owner?: string | null, boundary?: number | null): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (/\/api\/projects\/[^/]+\/(?:responses|ai-responses)\/generate$/.test(path)) headers.set("X-FormAuto-Contract-Version", "2");

  if (!options.skipAuth) {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new SessionExpiredError();
    }
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    if (getStoredSession()?.userId !== owner || getSessionBoundary() !== boundary) throw new SessionExpiredError();
  }

  let body = options.body;
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  }

  const { json, skipAuth, ...fetchOptions } = options;
  const response = await request(path, {
    ...fetchOptions,
    headers,
    body,
    cache: "no-store"
  });

  if (response.status === 401 && !options.skipAuth) {
    const googleError = await readNckhGoogleAuthorizationError(path, response);
    if (googleError) throw googleError;
    const rejectedToken = headers.get("Authorization")?.replace(/^Bearer /, "");
    const refreshed = !retried ? await refreshSession(rejectedToken) : null;
    if (refreshed) {
      return apiFetchInternal<T>(path, options, true, owner, boundary);
    }
    if (getStoredSession()?.accessToken === rejectedToken) clearStoredSession();
    throw new SessionExpiredError();
  }

  if (!response.ok) {
    throw await httpError(response, options.method ?? "GET", path);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new ApiError("invalid-response", options.method ?? "GET", path, response.status);
  }
}

export type AuthTokenResponse = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type TopupOrder = {
  id: string;
  userId?: string;
  userEmail?: string;
  packageId: string;
  packageName?: string;
  credits: number;
  amount: number;
  status: string;
  paymentMethod: string;
  paymentNote: string;
  evidenceFileId?: string | null;
  createdAt: string;
  paidAt?: string | null;
  approvedAt?: string | null;
};

export type UploadTopupEvidenceResponse = {
  fileId: string;
  fileName: string;
  contentType: string;
  length: number;
  createdAt: string;
};

export type ManualCreditGrantResponse = {
  userId: string;
  userEmail: string;
  creditTransactionId: string;
  balanceAfter: number;
};

export type ManualCreditHistoryItem = {
  id: string; userId: string; userEmail: string; userFullName: string; credits: number;
  balanceAfter: number; reason: string; createdAt: string;
  adminId: string | null; adminEmail: string | null; adminFullName: string | null;
};
export type ManualCreditHistoryResponse = {
  items: ManualCreditHistoryItem[]; page: number; pageSize: number; totalItems: number; totalPages: number;
};

export type AdminCreditUserOption = {
  id: string;
  email: string;
  fullName: string;
};

export type AdminCreditUserOptionListResponse = {
  items: AdminCreditUserOption[];
};

export type CreatePayosTopupOrderResponse = {
  topupOrderId: string;
  packageId: string;
  credits: number;
  amount: number;
  paymentProvider: string;
  checkoutUrl: string;
  paymentLinkId: string;
  status: string;
  createdAt: string;
};

export type UsageLog = {
  id: string;
  toolName: string;
  action: string;
  creditsUsed: number;
  status: string;
  description: string;
  projectId?: string | null;
  createdAt: string;
};

export type DashboardSummary = {
  currentCreditBalance: number;
  reservedCreditBalance: number;
  availableCreditBalance: number;
  totalCreditsDeposited: number;
  totalCreditsUsed: number;
  pendingTopupOrders: number;
  recentTopupOrders: TopupOrder[];
  recentUsageLogs: UsageLog[];
};

export type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  price: number;
  isActive: boolean;
  createdAt: string;
};

export type CreditPackageListResponse = {
  items: CreditPackage[];
};

export type CreditPackageRequest = {
  name: string;
  credits: number;
  price: number;
  isActive: boolean;
};

export type PayosProviderSettings = {
  provider: string;
  clientId: string;
  hasApiKey: boolean;
  hasChecksumKey: boolean;
  apiKeyPreview: string;
  checksumKeyPreview: string;
  returnUrl: string;
  cancelUrl: string;
  isEnabled: boolean;
  lastCheckedAt?: string | null;
  lastCheckStatus: string;
  lastCheckMessage: string;
  updatedAt?: string | null;
};

export type CheckPayosProviderSettingsResponse = {
  status: string;
  message: string;
  checkedAt: string;
};

export type AiProviderSettings = {
  provider: string;
  displayName: string;
  hasApiKey: boolean;
  apiKeyPreview: string;
  baseUrl: string;
  defaultModel: string;
  allowedModels: string[];
  isEnabled: boolean;
  lastCheckedAt?: string | null;
  lastCheckStatus: string;
  lastCheckMessage: string;
  updatedAt?: string | null;
};

export type CheckAiProviderSettingsResponse = {
  status: string;
  message: string;
  checkedAt: string;
};

export type AdminPayment = {
  id: string;
  topupOrderId: string;
  userId: string;
  userEmail: string;
  provider: string;
  providerOrderCode: string;
  providerPaymentLinkId: string;
  amount: number;
  credits: number;
  currency: string;
  providerStatus: string;
  topupOrderStatus: string;
  createdAt: string;
  completedAt?: string | null;
  lastWebhookAt?: string | null;
};

export type AdminRevenueSummary = {
  totalRevenue: number;
  creditSold: number;
  creditUsed: number;
  successfulTopupOrders: number;
  pendingTopupOrders: number;
  failedPayments: number;
  recentPayments: AdminPayment[];
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  googleLinked?: boolean;
  googleEmail?: string | null;
};

export type FormQuestion = {
  id: string;
  projectId: string;
  label: string;
  entryId: string;
  questionType: string;
  options: string[];
  required: boolean;
  orderIndex: number;
};

export type AnalyzeFormResponse = {
  projectId: string;
  name: string;
  formUrl: string;
  formTitle: string;
  status: string;
  questions: FormQuestion[];
  createdAt: string;
};

export type GeneratedAnswer = {
  questionId: string;
  entryId: string;
  label: string;
  questionType: string;
  values: string[];
};

export type GeneratedResponse = {
  id: string;
  projectId: string;
  status: string;
  source: string;
  isReadOnly: boolean;
  previewText: string;
  answers: GeneratedAnswer[];
  createdAt: string;
};

export type GeneratedResponseListResponse = {
  items: GeneratedResponse[];
};

export type GenerateResponsesResult = {
  generationBatchId: string | null;
  generationFeePerResponse: number;
  credits: CreditAvailability;
  items: GeneratedResponse[];
  creditsUsed: number;
  balanceAfter: number;
  requestedCount: number;
  generatedCount: number;
  missingCredits: number;
};

export type AiQuestionPrompt = {
  id: string;
  profileId: string;
  questionId: string;
  prompt: string;
  useAi: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AiPromptProfile = {
  id: string;
  projectId: string;
  userId: string;
  mode: string;
  audienceJson: string;
  globalPrompt: string;
  questions: AiQuestionPrompt[];
  createdAt: string;
  updatedAt: string;
};

export type AiPromptAutoFillResponse = {
  mode: string;
  audienceJson: string;
  globalPrompt: string;
  questions: Array<{
    questionId: string;
    prompt: string;
    useAi: boolean;
  }>;
};

export type AiGenerateResponsesResult = {
  generationBatchId: string | null;
  generationFeePerResponse: number;
  credits: CreditAvailability;
  runId: string;
  status: string;
  requestedCount: number;
  generatedCount: number;
  multiplier: number;
  creditsUsed: number;
  missingCredits: number;
  balanceAfter: number;
  generatedPreviewIds: string[];
  errorMessage?: string | null;
};

export type SubmissionJob = {
  commandId?: string | null;
  contractVersion?: number | null;
  batchId?: string | null;
  unknownCount?: number | null;
  notDispatchedCount?: number | null;
  heldCount?: number | null;
  runnerAcknowledgedAt?: string | null;
  fees?: SubmissionFees | null;
  items?: Array<{ itemId: string; responseId: string; attemptState: string; settlementState: string; maximumSendCredits: number; settledCredits: number; evidenceCode: string | null }>;
  id: string;
  projectId: string;
  total: number;
  successCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  logs: Array<{
    id: string;
    responseId: string;
    status: string;
    errorMessage: string;
    submittedAt?: string | null;
  }>;
};
export type CreditAvailability = { balance: number; reserved: number; available: number };
export type SubmissionFees = { reservationId: string; maximumSendCredits: number; heldCredits: number; settledCredits: number; releasedCredits: number; unknownCount: number; notDispatchedCount: number; runnerAcknowledged: boolean; credits: CreditAvailability };
export type HistoryOutcomes = { successfulAttempts: number; rejectedAttempts: number; unknownAttempts: number; neverAttemptedResponses: number };
export type GenerationHistoryRun = { batchId: string; projectId: string; formName: string; mode: string; createdAt: string; requestedCount: number; generatedCount: number; generationCredits: number; pricingPolicy: string; outcomes: HistoryOutcomes };
export type GenerationHistoryPage = { items: GenerationHistoryRun[]; page: number; pageSize: number; totalItems: number; totalPages: number };
export type HistoryResponseItem = { ordinal: number; response: GeneratedResponse; prepaidFirstSuccessAvailable: boolean; sendBlocked: boolean; blockReason: string | null; outcomes: HistoryOutcomes };
export type GenerationHistoryDetail = { run: GenerationHistoryRun; formUrl: string; observation: { questions: Array<{ questionId: string | null; entryId: string | null; questionType: string | null; required: boolean | null; options: string[] | null; constraintsJson: string | null; provenance: string }>; completeness: string; receiptCapability: string }; responses: HistoryResponseItem[]; credits: CreditAvailability };
// ── NCKH Survey Module ──────────────────────────────────────────

export type NckhGoogleLinkRequest = {
  authorizationCode: string;
  redirectUri: string;
};

export type NckhGoogleLinkResponse = {
  linked: boolean;
  email: string;
};

export type NckhFormQuestion = {
  id: string;
  googleQuestionId: string;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  orderIndex: number;
};

export type NckhFormItem = {
  id: string;
  googleFormId: string;
  formUrl?: string;
  title: string;
  status: string;
  questionCount: number;
  importedAt: string;
};

export type NckhFormListResponse = {
  items: NckhFormItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type NckhFormDetailResponse = {
  id: string;
  googleFormId: string;
  formUrl?: string;
  title: string;
  status?: string;
  questions: NckhFormQuestion[];
  importedAt?: string;
};

export type NckhImportFormRequest = {
  formUrl: string;
};

export type NckhImportFormResponse = {
  id: string;
  googleFormId: string;
  formUrl?: string;
  title: string;
  status: string;
  questionCount: number;
  importedAt: string;
};

export type NckhResearchModel = {
  id: string;
  formId: string;
  name: string;
  description?: string | null;
  status: string;
  formTitle: string;
  variableCount: number;
  hasGeneratedForm?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NckhResearchModelListResponse = {
  items: NckhResearchModel[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type NckhVariable = {
  id: string;
  modelId: string;
  name: string;
  code: string;
  variableType: string;
  scaleType: string;
  scalePoint?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type NckhVariableListResponse = {
  items: NckhVariable[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type NckhMapping = {
  id: string;
  variableId: string;
  modelId: string;
  formQuestionId: string;
  observedCode: string;
  questionText: string;
  questionType: string;
  sortOrder: number;
  createdAt: string;
};

export type NckhMappingListResponse = {
  items: NckhMapping[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type NckhRelation = {
  id: string;
  modelId: string;
  fromVariableId: string;
  fromVariableName: string;
  fromVariableCode: string;
  toVariableId: string;
  toVariableName: string;
  toVariableCode: string;
  direction: string;
  hypothesisCode: string;
  hypothesisText: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type NckhRelationListResponse = {
  items: NckhRelation[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type NckhPosition = {
  id: string;
  nodeType: string;
  variableId?: string | null;
  relationId?: string | null;
  positionX: number;
  positionY: number;
  updatedAt: string;
};

export type NckhPositionListResponse = {
  items: NckhPosition[];
};

export type NckhGenerateFormResponse = {
  formId: string;
  googleFormId: string;
  formUrl: string;
  questionsCreated: number;
  questionsUpdated: number;
  questionsDeleted: number;
  reimported: boolean;
};

export type NckhCollectResponsesResponse = {
  logId: string;
  responsesCollected: number;
  responsesSkipped: number;
  status: string;
  errorMessage?: string | null;
};

export type NckhRawResponse = {
  id: string;
  googleResponseId: string;
  respondentId?: string | null;
  responseTimestamp?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NckhRawResponseListResponse = {
  items: NckhRawResponse[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type NckhNormalizeResponsesResponse = {
  respondentsProcessed: number;
  variablesComputed: number;
  missingDataCount: number;
  staleDatasetsMarked: number;
};

export type NckhDatasetRow = {
  respondentId?: string | null;
  values: Record<string, string | number | boolean | null>;
  isStale: boolean;
  normalizedAt: string;
};

export type NckhDatasetListResponse = {
  columns: string[];
  hasStaleData: boolean;
  items: NckhDatasetRow[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
