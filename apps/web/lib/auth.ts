"use client";

export const AUTH_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

const SESSION_KEY = "formauto.auth.session";
const EXPIRY_BUFFER_MS = 60_000;

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

  const accessExpiresAt = new Date(session.accessTokenExpiresAt).getTime();
  if (accessExpiresAt > Date.now() + EXPIRY_BUFFER_MS) {
    return session.accessToken;
  }

  const refreshed = await refreshSession();
  return refreshed?.accessToken ?? null;
}

export async function refreshSession(): Promise<AuthSession | null> {
  const session = getStoredSession();
  if (!session) {
    return null;
  }

  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      cache: "no-store"
    });

    if (!response.ok) {
      clearStoredSession();
      return null;
    }

    const nextSession = (await response.json()) as AuthSession;
    saveSession(nextSession);
    return nextSession;
  } catch {
    clearStoredSession();
    return null;
  }
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
