"use client";

export const AUTH_API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000");

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

const SESSION_KEY = "formauto.auth.session";
const EXPIRY_BUFFER_MS = 60_000;
let refreshInFlight: Promise<AuthSession | null> | null = null;

export class SessionExpiredError extends Error {
  constructor() {
    super("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    this.name = "SessionExpiredError";
  }
}

export type AuthSession = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("formauto-auth-session-changed"));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("formauto-auth-session-changed"));
}

export function hasUsableSession() {
  const session = getStoredSession();
  if (!session) {
    return false;
  }

  return new Date(session.refreshTokenExpiresAt).getTime() > Date.now();
}

export async function getValidAccessToken(): Promise<string | null> {
  const session = getStoredSession();
  if (!session) {
    return null;
  }
  if (!hasUsableSession()) {
    clearStoredSession();
    throw new SessionExpiredError();
  }

  const accessExpiresAt = new Date(session.accessTokenExpiresAt).getTime();
  if (accessExpiresAt > Date.now() + EXPIRY_BUFFER_MS) {
    return session.accessToken;
  }

  const refreshed = await refreshSession();
  return refreshed?.accessToken ?? null;
}

export async function refreshSession(rejectedAccessToken?: string): Promise<AuthSession | null> {
  const session = getStoredSession();
  if (!session) {
    return null;
  }
  if (rejectedAccessToken && session.accessToken !== rejectedAccessToken) {
    return session;
  }
  if (!hasUsableSession()) {
    clearStoredSession();
    throw new SessionExpiredError();
  }
  if (refreshInFlight) {
    return refreshInFlight;
  }

  async function refreshCurrentSession() {
    const current = getStoredSession();
    if (!current || current.refreshToken !== session!.refreshToken) {
      return current;
    }
    return requestRefresh(current);
  }

  // Coordinate both parallel requests and tabs sharing this origin's session.
  refreshInFlight = (typeof navigator !== "undefined" && navigator.locks
    ? navigator.locks.request("formauto-auth-refresh", refreshCurrentSession)
    : refreshCurrentSession());
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function requestRefresh(session: AuthSession): Promise<AuthSession | null> {
  const response = await fetch(`${AUTH_API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
    cache: "no-store"
  });

  const current = getStoredSession();
  if (!current || current.refreshToken !== session.refreshToken) {
    return current;
  }
  if (response.status === 401) {
    clearStoredSession();
    throw new SessionExpiredError();
  }
  if (!response.ok) {
    throw new Error("Không thể làm mới phiên lúc này. Vui lòng thử lại.");
  }

  const nextSession = (await response.json()) as AuthSession;
  if (getStoredSession()?.refreshToken !== session.refreshToken) {
    return getStoredSession();
  }
  saveSession(nextSession);
  return nextSession;
}

export async function logoutCurrentSession(): Promise<boolean> {
  const session = getStoredSession();
  if (!session) {
    return false;
  }

  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      cache: "no-store"
    });

    return response.ok;
  } finally {
    clearStoredSession();
  }
}
