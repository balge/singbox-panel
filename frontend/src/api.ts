const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function login(username: string, password: string): Promise<{ access_token: string }> {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(e.detail || 'Login failed');
  }
  return r.json();
}

export async function getConfig<T = Record<string, unknown>>(): Promise<T> {
  const token = getToken();
  const r = await fetch(`${API_BASE}/config`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function putConfig(config: Record<string, unknown>): Promise<void> {
  const token = getToken();
  const r = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(config),
  });
  if (!r.ok) throw new Error(await r.text());
}

export async function getPanelConfig<T = Record<string, unknown>>(): Promise<T> {
  const token = getToken();
  const r = await fetch(`${API_BASE}/panel-config`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function putPanelConfig(data: Record<string, unknown>): Promise<void> {
  const token = getToken();
  const r = await fetch(`${API_BASE}/panel-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
}

export async function fetchSubscription(url: string): Promise<{ outbounds: Record<string, unknown>[] }> {
  const token = getToken();
  const r = await fetch(`${API_BASE}/subscription/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ url }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(e.detail || 'Fetch failed');
  }
  return r.json();
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}
