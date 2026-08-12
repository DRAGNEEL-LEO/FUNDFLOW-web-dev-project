// API helper for making authenticated requests

const API_TOKEN_KEY = "fundflow_token";
const API_AUTH_KEY = "fundflow_auth";

export interface AuthData {
  token: string;
  role: "admin" | "member";
  name: string;
  email: string;
}

export function getStoredAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem(API_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeAuth(auth: AuthData): void {
  localStorage.setItem(API_AUTH_KEY, JSON.stringify(auth));
}

export function clearAuth(): void {
  localStorage.removeItem(API_AUTH_KEY);
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
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? `Request failed (${res.status})`);
  }

  return res.json();
}
