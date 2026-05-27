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
  packageId: string;
  credits: number;
  amount: number;
  status: string;
  paymentMethod: string;
  paymentNote: string;
  createdAt: string;
  paidAt?: string | null;
  approvedAt?: string | null;
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

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
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
  previewText: string;
  answers: GeneratedAnswer[];
  createdAt: string;
};

export type GenerateResponsesResult = {
  items: GeneratedResponse[];
  creditsUsed: number;
  balanceAfter: number;
  requestedCount: number;
  generatedCount: number;
  missingCredits: number;
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
