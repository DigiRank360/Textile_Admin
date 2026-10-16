export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const TOKEN_KEY = "hummo_admin_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const imgUrl = (p) =>
  !p ? "" : /^https?:\/\//.test(p) ? p : `${API_URL}${p}`;

export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = body instanceof FormData;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("hummo-logout"));
  }
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}
