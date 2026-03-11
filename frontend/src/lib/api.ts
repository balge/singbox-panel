const API_BASE =
  typeof import.meta.env.VITE_API_BASE_URL === "string" &&
  import.meta.env.VITE_API_BASE_URL !== ""
    ? import.meta.env.VITE_API_BASE_URL
    : ""

import { getToken } from "./token"

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE}${p}`
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = apiUrl(path)
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(url, {
    ...init,
    headers,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? "Request failed")
  }
  return res.json() as Promise<T>
}

export type LoginPayload = { username: string; password: string }
export type LoginResult = { access_token: string; token_type: string }
export type MeResult = { username: string }

export const authApi = {
  login: (payload: LoginPayload) =>
    apiFetch<LoginResult>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => apiFetch<MeResult>("/api/auth/me"),
  logout: () =>
    apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
}

export const configApi = {
  getModule: (module: string) =>
    apiFetch<unknown>(`/api/config/${module}`),
  saveModule: (module: string, data: unknown) =>
    apiFetch<{ ok: boolean }>(`/api/config/${module}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}
