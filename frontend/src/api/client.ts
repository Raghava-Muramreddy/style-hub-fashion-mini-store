const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

type ValidationItem = { msg?: string };
type ErrorPayload = { detail?: string | ValidationItem[] };

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function extractMessage(payload: ErrorPayload | null): string {
  if (!payload?.detail) return 'Request failed';
  if (typeof payload.detail === 'string') return payload.detail;
  return payload.detail.map((item) => item.msg?.replace(/^Value error, /, '')).filter(Boolean).join('. ') || 'Request failed';
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', 'Bearer ' + token);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot reach the server. Please try again.');
  }

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 401 && token) unauthorizedHandler?.();
    throw new Error(extractMessage(payload as ErrorPayload | null));
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: 'GET' }, token),
  post: <T>(path: string, body: unknown, token?: string) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),
  patch: <T>(path: string, body: unknown, token?: string) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, token),
  del: <T>(path: string, token?: string) => request<T>(path, { method: 'DELETE' }, token),
};

export { API_BASE_URL };
