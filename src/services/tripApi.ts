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
  const refreshToken = state.auth.refreshToken;

  if (!refreshToken) throw new Error('No refresh token available');

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        Accept: 'application/json',
      },
    });

    const json = await response.json();
    if (!response.ok) throw new Error(json?.message ?? 'Refresh token failed');

    const accessToken = json.access_token || json.accessToken;
    const newRefreshToken = json.refresh_token || json.refreshToken;

    store.dispatch(updateTokens({
      accessToken: accessToken || '',
      refreshToken: newRefreshToken || refreshToken
    }));

    if (accessToken) await storage.set('userToken', accessToken);
    if (newRefreshToken) await storage.set('refreshToken', newRefreshToken);

    return accessToken;

  } catch (error) {
    store.dispatch(logout());
    throw error;
  }
};

/**
 * Generic authenticated fetcher to be used with TanStack Query
 */
export const fetchTrips = async ({ filter, page, per_page }: TripParams): Promise<TripResponse> => {
  const state = store.getState();
  let token = state.auth.userToken || '';





  const url = `${BASE_URL}/driver/trips/?filter=${filter}&page=${page}&per_page=${per_page}`;
  console.log('[tripApi] URL:', url);

  const makeRequest = async (tokenToUse: string) => {
    return fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenToUse}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  };

  let response = await makeRequest(token);
  console.log('[tripApi] Status:', response.status);


  // Handle 401 Unauthorized (Token expired)
  if (response.status === 401) {
    try {
      const newToken = await performTokenRefresh();
      response = await makeRequest(newToken);
    } catch (refreshError) {
      throw new Error('Session expired. Please login again.');
    }
  }

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message ?? `Request failed with status ${response.status}`);
  }

  return json as TripResponse;
};

/**
 * Fetch a single trip by ID
 */
export const fetchTripById = async (tripId: string): Promise<any> => {
  const state = store.getState();
  let token = state.auth.userToken || '';


  console.log('[tripApi] Fetching trip:', tripId);
  console.log('[tripApi] Token:', token ? `${token.substring(0, 10)}...` : 'MISSING');

  const url = `${BASE_URL}/driver/trips/${tripId}`;
  console.log('[tripApi] URL:', url);

  const makeRequest = async (tokenToUse: string) => {
    return fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenToUse}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  };

  let response;
  try {
    response = await makeRequest(token);
    console.log('[tripApi] Status:', response.status);
  } catch (err) {
    console.error('[tripApi] Fetch Error:', err);
    throw err;
  }


  if (response.status === 401) {
    try {
      const newToken = await performTokenRefresh();
      response = await makeRequest(newToken);
    } catch (refreshError) {
      throw new Error('Session expired. Please login again.');
    }
  }

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message ?? `Request failed with status ${response.status}`);
  }

  return json.data; // Assuming data contains the trip object
};

