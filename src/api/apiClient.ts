import axios from 'axios';
import Config from 'react-native-config';
import { store } from '../redux/store';
import { updateTokens, logout } from '../redux/slices/authSlice';
import { storage } from '../helpers/asyncHelper.tsx';

const BASE_URL = Config.API_BASE_URL || '';

// Ensure baseURL always ends with a slash and is a clean string
const normalizedBaseURL = BASE_URL.trim()
  ? BASE_URL.trim().endsWith('/')
    ? BASE_URL.trim()
    : `${BASE_URL.trim()}/`
  : '';

console.log('[apiClient] baseURL:', normalizedBaseURL);

const apiClient = axios.create({
  baseURL: normalizedBaseURL,
  timeout: 20000,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sanitizeToken = (token: string) =>
  String(token).trim().replace(/^\"|\"$/g, '');

/** Base64 decode that works on Hermes (no atob) */
const base64Decode = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  // Pad to multiple of 4
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + ((4 - (str.length % 4)) % 4),
    '=',
  );
  let output = '';
  let i = 0;
  while (i < padded.length) {
    const e1 = chars.indexOf(padded[i++]);
    const e2 = chars.indexOf(padded[i++]);
    const e3 = chars.indexOf(padded[i++]);
    const e4 = chars.indexOf(padded[i++]);
    output += String.fromCharCode(
      (e1 << 2) | (e2 >> 4),
      ((e2 & 15) << 4) | (e3 >> 2),
      ((e3 & 3) << 6) | e4,
    );
  }
  return output;
};

/** Decode JWT exp without any library — Hermes safe */
const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(base64Decode(payload));
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
};

/** True if the token expires within the next 60 seconds */
const isTokenExpiredOrExpiringSoon = (token: string): boolean => {
  const exp = getTokenExpiry(token);
  if (!exp) return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const secondsLeft = exp - nowInSeconds;
  console.log(`[Axios] 🕐 Token expires in ${secondsLeft}s`);
  return secondsLeft < 60;
};

// ─── Token Refresh ────────────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const performTokenRefresh = async (): Promise<string> => {
  const state = store.getState();
  const refreshToken = state.auth.refreshToken;

  if (!refreshToken) throw new Error('No refresh token available');

  const cleanRefresh = sanitizeToken(refreshToken);
  const refreshURL = `${normalizedBaseURL}auth/refresh`;

  console.log(`[Axios] 🔄 Refreshing token → ${refreshURL}`);

  // Use a plain axios instance (not apiClient) to avoid interceptor loops
  const response = await axios.post(
    refreshURL,
    {},
    {
      headers: { Authorization: `Bearer ${cleanRefresh}` },
      timeout: 15000,
    },
  );

  const { access_token, refresh_token } = response.data;

  if (!access_token) throw new Error('Refresh response missing access_token');

  // If server returns a new refresh token, use it; otherwise keep the old one
  const newRefreshToken = refresh_token ? sanitizeToken(refresh_token) : cleanRefresh;

  // ── Persist to Redux ──
  store.dispatch(updateTokens({ accessToken: access_token, refreshToken: newRefreshToken }));

  // ── Persist to storage so token survives app restarts ──
  storage.set('userToken', access_token);
  storage.set('refreshToken', newRefreshToken);

  console.log('[Axios] ✅ Token refreshed successfully');
  return access_token;
};

// ─── Request Interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config) => {
    const state = store.getState();
    let token = state.auth.userToken;

    // ── Proactive refresh: renew before the token actually expires ──
    if (token && isTokenExpiredOrExpiringSoon(token)) {
      console.warn('[Axios] ⚠️  Token expiring soon — proactive refresh...');
      try {
        token = await performTokenRefresh();
      } catch (e) {
        console.error('[Axios] ❌ Proactive refresh failed, logging out:', e);
        store.dispatch(logout());
        return Promise.reject(e);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${sanitizeToken(token)}`;
    }

    if (config.url?.startsWith('/')) {
      console.warn(
        `[Axios Warning] URL '${config.url}' starts with a slash — this may bypass the baseURL path.`,
      );
    }

    const fullURL = `${config.baseURL ?? ''}${config.url ?? ''}`;
    console.log(`[Axios] 🚀 ${config.method?.toUpperCase()} | ${fullURL}`);

    return config;
  },
  (error) => {
    console.error('[Axios Request Error]', error);
    return Promise.reject(error);
  },
);

// ─── Response Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[Axios] ✅ ${response.status} | ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ── Detailed error logging ──
    if (error.response) {
      console.error(
        `[Axios Error] ❌ Status: ${error.response.status} | URL: ${originalRequest?.url}`,
      );
      console.error('[Axios Error Data]', error.response.data);
    } else if (error.request) {
      console.error(
        `[Axios Error] ❌ No response received | URL: ${originalRequest?.url}`,
      );
      console.error(
        '[Axios Error] Likely causes: expired/malformed token causing server to drop the connection, server crash, or network unavailable.',
      );
    } else {
      console.error('[Axios Error]', error.message);
    }

    // ── 401: Reactive token refresh ──
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        // Another request is already refreshing — queue this one
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await performTokenRefresh();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
function atob(payload: string): string {
  throw new Error('Function not implemented.');
}

