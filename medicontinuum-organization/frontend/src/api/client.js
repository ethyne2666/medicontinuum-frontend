const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';
const KEY = 'mc-org-token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } },
};

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.message ?? 'Request failed');
    this.status = status;
    this.code = payload?.code;
    this.fields = payload?.fields ?? {};
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, { message: `Cannot reach the Organization API at ${BASE}. Is the backend running?` });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(res.status, data?.error);
  }
  return data;
}

const qs = (params = {}) => {
  const p = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
  return p.toString() ? `?${p}` : '';
};

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  signup: (body) => request('/auth/signup', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  stats: () => request('/public/stats'),
  network: (params) => request(`/network/organizations${qs(params)}`),
  shares: (params) => request(`/shares${qs(params)}`),
  summary: () => request('/shares/summary'),
  createShare: (body) => request('/shares', { method: 'POST', body }),
  respond: (id, body) => request(`/shares/${id}/respond`, { method: 'POST', body }),
  fulfil: (id) => request(`/shares/${id}/fulfil`, { method: 'POST' }),
  cancel: (id) => request(`/shares/${id}/cancel`, { method: 'POST' }),
};
