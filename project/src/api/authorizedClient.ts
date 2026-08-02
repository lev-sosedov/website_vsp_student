const API_URL = import.meta.env.VITE_API_URL || '';
const ACCESS_TOKEN_KEY = 'vshp_access_token';
const REFRESH_TOKEN_KEY = 'vshp_refresh_token';
const USER_KEY = 'vshp_user';

let refreshInFlight: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) return null;
  const tokens = (await response.json()) as { access_token?: string; refresh_token?: string };
  if (!tokens.access_token || !tokens.refresh_token) return null;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  return tokens.access_token;
}

function isAuthEndpoint(url: string): boolean {
  return /\/auth\/(login|register|refresh|logout)(?:$|[?/#])/.test(url);
}

export async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const url = String(input);
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response = await fetch(input, { ...init, headers });
  if (response.status !== 401 || isAuthEndpoint(url)) return response;
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => { refreshInFlight = null; });
  }
  const refreshed = await refreshInFlight;
  if (!refreshed) {
    clearSession();
    if (window.location.pathname !== '/login') window.location.assign('/login');
    return response;
  }
  const retryHeaders = new Headers(init.headers);
  retryHeaders.set('Authorization', `Bearer ${refreshed}`);
  response = await fetch(input, { ...init, headers: retryHeaders });
  return response;
}

export async function logoutWithRefreshToken(): Promise<void> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  try {
    if (refreshToken) {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } finally {
    clearSession();
  }
}
