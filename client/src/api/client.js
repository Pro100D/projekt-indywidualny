const TOKEN_KEY = 'homevault_token';
const ADDRESS_KEY = 'homevault_address';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getActiveAddressId = () => localStorage.getItem(ADDRESS_KEY);
export const setActiveAddressId = (id) => localStorage.setItem(ADDRESS_KEY, id);
export const clearActiveAddressId = () => localStorage.removeItem(ADDRESS_KEY);

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.error?.message || `Błąd ${res.status}`);
    error.status = res.status;
    error.fields = data?.error?.fields || {};
    error.purchaseCount = data?.error?.purchaseCount;
    throw error;
  }
  return data;
}
