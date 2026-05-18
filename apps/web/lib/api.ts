export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

const demoUserId = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001";

type RequestOptions = RequestInit & {
  json?: unknown;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-FormAuto-UserId", demoUserId);

  let body = options.body;
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `Request failed with HTTP ${response.status}.`;
    try {
      const problem = (await response.json()) as { detail?: string; title?: string };
      message = problem.detail || problem.title || message;
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

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
