import { getValidAccessToken, refreshSession } from "@/lib/auth";

export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000");

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

type RequestOptions = RequestInit & {
  json?: unknown;
  skipAuth?: boolean;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return apiFetchInternal<T>(path, options, false);
}

export async function apiFetchBlob(path: string): Promise<Blob> {
  const headers = new Headers();
  const accessToken = await getValidAccessToken();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    cache: "no-store"
  });

  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetchBlob(path);
    }
  }

  if (!response.ok) {
    throw new Error(`Không tải được tệp. Mã lỗi HTTP ${response.status}.`);
  }

  return response.blob();
}

async function apiFetchInternal<T>(path: string, options: RequestOptions, retried: boolean): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (!options.skipAuth) {
    const accessToken = await getValidAccessToken();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  let body = options.body;
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  }

  const { json, skipAuth, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    body,
    cache: "no-store"
  });

  if (response.status === 401 && !retried && !options.skipAuth) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetchInternal<T>(path, options, true);
    }
  }

  if (!response.ok) {
    let message = `Yêu cầu không thành công. Mã lỗi HTTP ${response.status}.`;
    try {
      const text = await response.text();
      if (text) {
        try {
          const problem = JSON.parse(text) as { detail?: string; title?: string };
          message = problem.detail || problem.title || text;
        } catch {
          message = text;
        }
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
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

export type UsageLogPageResponse = {
  items: UsageLog[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type DashboardSummary = {
  currentCreditBalance: number;
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

export type CreditTransaction = {
  id: string;
  amount: number;
  balanceAfter: number;
  type: string;
  description: string;
  referenceType: string;
  referenceId?: string | null;
  createdAt: string;
};

export type CreditTransactionPageResponse = {
  items: CreditTransaction[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
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
  runId: string;
  status: string;
  requestedCount: number;
  generatedCount: number;
  multiplier: number;
  creditsUsed: number;
  missingCredits: number;
  balanceAfter: number;
  generatedPreviewIds: string[];
};

export type SubmissionJob = {
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
