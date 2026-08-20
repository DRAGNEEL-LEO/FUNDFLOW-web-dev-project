// API helper for making authenticated requests

const API_AUTH_KEY = "fundflow_auth";
const SESSION_AUTH_KEY = "fundflow_auth_session";

export interface AuthData {
  token: string;
  role: "admin" | "member";
  name: string;
  email: string;
  orgName?: string;
  orgId?: string;
}

export function getStoredAuth(): AuthData | null {
  try {
    // 1. Check tab-isolated sessionStorage first
    const sessionRaw = sessionStorage.getItem(SESSION_AUTH_KEY);
    if (sessionRaw) {
      return JSON.parse(sessionRaw);
    }

    // 2. Fallback to localStorage (e.g. newly opened tab)
    const localRaw = localStorage.getItem(API_AUTH_KEY);
    if (!localRaw) return null;
    const data = JSON.parse(localRaw);
    // Initialize current tab's sessionStorage with the stored login
    try {
      sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(data));
    } catch {
      // Ignore if sessionStorage quota error
    }
    return data;
  } catch {
    return null;
  }
}

export function storeAuth(auth: AuthData): void {
  try {
    sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(auth));
    localStorage.setItem(API_AUTH_KEY, JSON.stringify(auth));
  } catch (e) {
    console.error("Failed to store auth:", e);
  }
}

export function clearAuth(): void {
  try {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    localStorage.removeItem(API_AUTH_KEY);
  } catch (e) {
    console.error("Failed to clear auth:", e);
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
  } = {}
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401 && token) {
      clearAuth();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("fundflow_auth_expired"));
      }
    }
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? `Request failed (${res.status})`);
  }

  return res.json();
}

