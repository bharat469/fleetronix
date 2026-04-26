import Config from 'react-native-config';
import { store } from '../redux/store';
import { TripResponse, TripParams } from '../types/trip';
import { updateTokens, logout } from '../redux/slices/authSlice';
import { storage } from '../helpers/asyncHelper.tsx';

const BASE_URL = Config.API_BASE_URL;

/**
 * Helper to refresh token if needed
 */
const performTokenRefresh = async () => {
  const state = store.getState();
  // Sanitize token: remove quotes and whitespace
  const refreshToken = (state.auth.refreshToken || '').trim().replace(/^"|"$/g, '');

  if (!refreshToken) throw new Error('No refresh token available');

  try {
    const url = `${BASE_URL}/auth/refresh`;
    console.log(`[${new Date().toLocaleTimeString()}] [tripApi] Refreshing Token...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        Accept: 'application/json',
      },
    });

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error(`Refresh failed: Server returned non-JSON (${response.status})`);
    }

    if (!response.ok) {
      throw new Error(json?.message ?? 'Refresh token failed');
    }

    const accessToken = json.access_token || json.accessToken;
    const newRefreshToken = json.refresh_token || json.refreshToken;

    store.dispatch(updateTokens({
      accessToken: accessToken || '',
      refreshToken: newRefreshToken || refreshToken
    }));

    if (accessToken) await storage.set('userToken', accessToken);
    if (newRefreshToken) await storage.set('refreshToken', newRefreshToken);

    return accessToken;

  } catch (error: any) {
    console.error(`[${new Date().toLocaleTimeString()}] [tripApi] Token Refresh Failed:`, error.message);
    store.dispatch(logout());
    throw error;
  }
};

/**
 * Centralized fetcher with sanitization and error handling
 */
const apiFetch = async (url: string, token: string): Promise<Response> => {
  const cleanToken = (token || '').trim().replace(/^"|"$/g, '');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (err: any) {
    console.error(`[${new Date().toLocaleTimeString()}] [tripApi] Network Exception for ${url}:`, err.message);
    throw new Error(`Network Error: ${err.message}. Check your connectivity.`);
  }
};

/**
 * Safely parse JSON or handle HTML error pages
 */
const safeParseJson = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`[${new Date().toLocaleTimeString()}] [tripApi] Parse Error. Status: ${response.status}`);
    throw new Error(`Server returned status ${response.status} but not valid JSON.`);
  }
};

/**
 * Generic authenticated fetcher to be used with TanStack Query
 */
export const fetchTrips = async ({ filter, page, per_page }: TripParams): Promise<TripResponse> => {
  const state = store.getState();
  const token = state.auth.userToken || '';

  const url = `${BASE_URL}/driver/trips/?filter=${filter}&page=${page}&per_page=${per_page}`;
  console.log(`[${new Date().toLocaleTimeString()}] [tripApi] GET Trips List`);

  let response = await apiFetch(url, token);

  if (response.status === 401) {
    try {
      const newToken = await performTokenRefresh();
      response = await apiFetch(url, newToken);
    } catch (refreshError) {
      throw new Error('Session expired. Please login again.');
    }
  }

  const json = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(json?.message ?? `Request failed with status ${response.status}`);
  }

  console.log(`[${new Date().toLocaleTimeString()}] [tripApi] Trips List Success`);
  return json as TripResponse;
};

/**
 * Fetch a single trip by ID
 */
export const fetchTripById = async (tripId: string): Promise<any> => {
  const state = store.getState();
  const token = state.auth.userToken || '';

  const url = `${BASE_URL}/driver/trips/${tripId}`;
  console.log(`[${new Date().toLocaleTimeString()}] [tripApi] GET Trip Detail:`, tripId);

  let response = await apiFetch(url, token);

  if (response.status === 401) {
    try {
      const newToken = await performTokenRefresh();
      response = await apiFetch(url, newToken);
    } catch (refreshError) {
      throw new Error('Session expired. Please login again.');
    }
  }

  const json = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(json?.message ?? `Request failed with status ${response.status}`);
  }

  if (!json.data) {
    console.warn(`[${new Date().toLocaleTimeString()}] [tripApi] API returned success but no data property`);
  }

  console.log(`[${new Date().toLocaleTimeString()}] [tripApi] Trip Detail Success`);
  return json.data; 
};
