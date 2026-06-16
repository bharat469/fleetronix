import apiClient from '../api/apiClient';
import { TripResponse, TripParams } from '../types/trip';
import { store } from '../redux/store';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';
import { storage } from '../helpers/asyncHelper';
import { updateTokens } from '../redux/slices/authSlice';
import Config from 'react-native-config';
import axios from 'axios';
const BASE_URL = Config.API_BASE_URL;

/**
 * Generic authenticated fetcher to be used with TanStack Query
 */
export const fetchTrips = async ({ filter, page, per_page }: TripParams): Promise<TripResponse> => {
  const url = `driver/trips/?filter=${filter}&page=${page}&per_page=${per_page}`;
  console.log(`[${new Date().toLocaleTimeString()}] [tripApi] GET Trips List`);

  const response = await apiClient.get(url);
  console.log(`[${new Date().toLocaleTimeString()}] [tripApi] Trips List Success`);
  return response.data as TripResponse;
};

/**
 * Fetch a single trip by ID
 */
export const fetchTripById = async (tripId: string): Promise<any> => {
  const url = `driver/trips/${tripId}`;
  console.log(`[${new Date().toLocaleTimeString()}] [tripApi] GET Trip Details`);
  try {
    const response = await apiClient.get(url);
    const json = response.data;

    let tripData = json.data !== undefined ? json.data : json;
    if (Array.isArray(tripData)) tripData = tripData[0];

    console.log('[tripApi] ✅ Success!', tripData?.trip_id);
    return tripData;
  } catch (error) {
    console.error('[tripApi] ❌ Failed:', error);
    throw error;
  }
};
export const fetchTripBreifById = async (tripId: string): Promise<any> => {
  const url = `driver/trips/${tripId}/brief`;
  try {
    const response = await apiClient.get(url);
    const json = response.data;
    let tripData = json.data !== undefined ? json.data : json;
    if (Array.isArray(tripData)) tripData = tripData[0];
    console.log('[tripApi] ✅ Brief Success!', tripData?.trip_id);
    return tripData;
  } catch (error) {
    console.error('[tripApi] ❌ Brief Failed:', error);
    throw error;
  }
};

/**
 * POST driver/trips/{tripId}/location
 * Sends driver's current GPS coordinates to the backend.
 * Body: { locations: [{ latitude, longitude, timestamp }] }
 */
export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string; // ISO 8601 e.g. "2026-04-22T10:00:00Z"
}

export const postDriverLocation = async (
  tripId: string,
  point: LocationPoint,
): Promise<any> => {
  const url = `driver/trips/${tripId}/location`;
  console.log(`[tripApi] POST location | ${point.latitude},${point.longitude}`);
  try {
    const response = await apiClient.post(url, {
      locations: [point],
    });
    return response.data;
  } catch (error: any) {
    // Non-fatal — log and swallow so tracking keeps running
    console.warn('[tripApi] ⚠️ Location post failed:', error?.message);
  }
};

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * POST driver/trips/{tripId}/verify-pickup-otp
 * Body: { otp: string }
 *
 * Success: { success: true, message: { ... } }
 * Error:   { success: false, message: 'Invalid OTP' }
 */
export const verifyPickupOtp = async ({
  tripId,
  otp,
}: {
  tripId: string;
  otp: string;
}): Promise<any> => {
  console.log(`[tripApi] POST verify-pickup-otp | tripId=${tripId}`);
  try {
    const response = await apiClient.post(`driver/trips/${tripId}/verify-pickup-otp`, { otp });
    const json = response.data;
    if (json.success === false) {
      throw new Error(json.message ?? 'Invalid OTP');
    }
    console.log('[tripApi] ✅ OTP verified');
    return json;
  } catch (error: any) {
    // Surface backend error message if available
    const msg = error?.response?.data?.message ?? error?.message ?? 'OTP verification failed';
    console.error('[tripApi] ❌ OTP error:', msg);
    throw new Error(msg);
  }
};

/**
 * POST driver/trips/{tripId}/start
 * Triggers trip lifecycle → started
 */
export const startTrip = async (
  tripId: string,
  coords: { latitude: number; longitude: number },
): Promise<any> => {
  console.log(`[tripApi] POST start | tripId=${tripId} | ${coords.latitude},${coords.longitude}`);
  try {
    const response = await apiClient.post(`driver/trips/${tripId}/start`, {
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    const json = response.data;
    if (json.success === false) {
      throw new Error(json.message ?? 'Failed to start trip');
    }
    console.log('[tripApi] ✅ Trip started');
    return json;
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? error?.message ?? 'Failed to start trip';
    console.error('[tripApi] ❌ Start trip error:', msg);
    throw new Error(msg);
  }
};

/**
 * POST driver/trips/{tripId}/arrive
 * Informs backend that driver has arrived at destination.
 * Backend validates GPS vs destination coords.
 */
export const postTripArrive = async (
  tripId: string,
  coords: { latitude: number; longitude: number },
): Promise<any> => {
  console.log(`[tripApi] POST arrive | tripId=${tripId} | ${coords.latitude},${coords.longitude}`);
  try {
    const response = await apiClient.post(`driver/trips/${tripId}/arrive`, {
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    const json = response.data;
    if (json.success === false) {
      throw new Error(json.message ?? 'Arrival validation failed');
    }
    console.log('[tripApi] ✅ Arrival confirmed by backend');
    return json;
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? error?.message ?? 'Arrival failed';
    console.error('[tripApi] ❌ Arrive error:', msg);
    throw new Error(msg);
  }
};

// ─── Confirm Delivery ─────────────────────────────────────────────────────────

export interface ConfirmDeliveryPayload {
  tripId: string;
  recipientName: string;
  deliveryDate: string;   // YYYY-MM-DD
  deliveryTime: string;   // HH:MM
  confirmationNumber?: string;
  remark?: string;
  latitude?: number;
  longitude?: number;
  documents?: Array<{ uri: string; name: string; type: string }>;
  token?: string;
}

/**
 * POST driver/trips/{tripId}/confirm-delivery
 * Content-Type: multipart/form-data
 * Sends POD form data + optional document images to the server.
 */


export const confirmDelivery = async (payload: ConfirmDeliveryPayload): Promise<any> => {
  const {
    tripId,
    recipientName,
    deliveryDate,
    deliveryTime,
    confirmationNumber,
    remark,
    latitude,
    longitude,
    documents,
    token,
  } = payload;

  const url = `${BASE_URL}/driver/trips/${tripId}/confirm-delivery`;

  console.log('[confirmDelivery] 📤 Request start (BlobUtil)');

  const multipartBody: any[] = [];

  // 🔹 Text fields
  multipartBody.push({ name: 'recipient_name', data: recipientName });
  multipartBody.push({ name: 'delivery_date', data: deliveryDate });
  multipartBody.push({ name: 'delivery_time', data: deliveryTime });
  multipartBody.push({ name: 'confirmation_number', data: confirmationNumber ?? '' });
  multipartBody.push({ name: 'remark', data: remark ?? '' });
  multipartBody.push({ name: 'latitude', data: String(latitude ?? 0) });
  multipartBody.push({ name: 'longitude', data: String(longitude ?? 0) });

  // 🔹 File uploads
  if (documents?.length) {
    documents.forEach((doc, index) => {
      const uri = doc.uri;
      const cleanPath = uri.startsWith('file://')
        ? decodeURIComponent(uri.replace('file://', ''))
        : uri;

      console.log(`[tripApi] 📂 Attaching file: key="documents", filename="${doc.name || `document_${index}.jpg`}", path="${cleanPath}", type="${doc.type || 'image/jpeg'}"`);

      multipartBody.push({
        name: 'documents', // IMPORTANT: same key for multiple files
        filename: doc.name || `document_${index}.jpg`,
        type: doc.type || 'image/jpeg',
        data: ReactNativeBlobUtil.wrap(cleanPath),
      });
    });
  } else {
    multipartBody.push({ name: 'documents', data: '' });
  }

  try {
    const response = await ReactNativeBlobUtil.fetch(
      'POST',
      url,
      {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
      multipartBody
    );

    const status = response.info().status;

    let json = null;
    try {
      json = response.json();
    } catch {
      try {
        json = JSON.parse(response.data);
      } catch {
        json = response.data;
      }
    }

    // 🔁 Token refresh logic (same as updateDriver)
    if (status === 401) {
      try {
        const state = store.getState();
        const refreshToken = state.auth.refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const refreshResponse = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );

        const { access_token } = refreshResponse.data;

        store.dispatch(updateTokens({
          accessToken: access_token,
          refreshToken: ''
        }));

        await storage.set('userToken', access_token);

        // 🔁 Retry request
        const retryResponse = await ReactNativeBlobUtil.fetch(
          'POST',
          url,
          {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
          },
          multipartBody
        );

        const retryStatus = retryResponse.info().status;
        const retryJson = retryResponse.json();

        if (retryStatus >= 200 && retryStatus < 300) {
          console.log('[confirmDelivery] ✅ Success after refresh:', retryJson);
          return retryJson;
        }

      } catch (refreshError) {
        throw new Error('Session expired. Please login again.');
      }
    }

    // ❌ Error handling
    if (status < 200 || status >= 300) {
      console.error('[confirmDelivery] ❌ Error:', status, json);
      throw new Error(typeof json === 'object' ? json?.message || 'Delivery failed' : 'Delivery failed');
    }

    console.log('[confirmDelivery] ✅ Success:', json);
    return json;

  } catch (error: any) {
    console.error('[confirmDelivery] ❌ ERROR:', error);
    throw error;
  }
};

/**
 * POST driver/trips/{tripId}/verify-delivery-otp
 */
export const verifyDeliveryOtp = async ({
  tripId,
  otp,
}: {
  tripId: string;
  otp: string;
}): Promise<any> => {
  console.log(`[tripApi] POST verify-delivery-otp | tripId=${tripId}`);
  try {
    const response = await apiClient.post(`driver/trips/${tripId}/verify-delivery-otp`, { otp });
    const json = response.data;
    if (json.success === false) throw new Error(json.message ?? 'Invalid OTP');
    console.log('[tripApi] ✅ Delivery OTP verified');
    return json;
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? error?.message ?? 'OTP verification failed';
    console.error('[tripApi] ❌ Delivery OTP error:', msg);
    throw new Error(msg);
  }
};

/**
 * POST driver/trips/{tripId}/feedback
 */
export const postFeedback = async ({
  tripId,
  rating,
  comment,
  token,
}: {
  tripId: string;
  rating: number;
  comment?: string;
  token?: string;
}): Promise<any> => {
  console.log(`[tripApi] POST feedback | tripId=${tripId}`);
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await apiClient.post(
      `driver/trips/${tripId}/feedback`,
      { rating, comment: comment ?? '' },
      config
    );
    return response.data;
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? error?.message ?? 'Feedback failed';
    console.error('[tripApi] ❌ Feedback error:', msg);
    throw new Error(msg);
  }
};

/**
 * POST driver/trips/{tripId}/trip-feedback
 */
export const postTripFeedback = async ({
  tripId,
  reason,
  comment,
  token,
}: {
  tripId: string;
  reason: string;
  comment?: string;
  token?: string;
}): Promise<any> => {
  console.log(`[tripApi] POST trip-feedback | reason=${reason}`);
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await apiClient.post(
      `driver/trips/${tripId}/trip-feedback`,
      { reason, comment: comment ?? '' },
      config
    );
    return response.data;
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? error?.message ?? 'Trip feedback failed';
    console.error('[tripApi] ❌ Trip feedback error:', msg);
    throw new Error(msg);
  }
};

export interface PublicRequestsParams {
  show_responded: boolean;
  page: number;
  per_page: number;
  sort_order: 'asc' | 'desc';
}

export const fetchPublicRequests = async (params: Partial<PublicRequestsParams> = {}): Promise<any> => {
  const {
    show_responded = false,
    page = 1,
    per_page = 20,
    sort_order = 'desc',
  } = params;
  const url = `driver/trips/public-requests?show_responded=${show_responded}&page=${page}&per_page=${per_page}&sort_order=${sort_order}`;
  console.log(`[${new Date().toLocaleTimeString()}] [tripApi] GET Public Requests List`);

  const response = await apiClient.get(url);
  console.log(`[${new Date().toLocaleTimeString()}] [tripApi] Public Requests Success`);
  return response.data;
};

export const respondToTripRequest = async (
  requestNumber: string,
  action: 'accept' | 'reject',
  notes: string = ''
): Promise<any> => {
  const url = `driver/trips/requests/${requestNumber}/respond`;
  console.log(`[${new Date().toLocaleTimeString()}] [tripApi] POST respond request=${requestNumber} action=${action}`);
  const response = await apiClient.post(url, { action, notes });
  return response.data;
};

export interface TripRequestsParams {
  status: 'pending' | 'accepted' | 'rejected';
  page: number;
  per_page: number;
}

export const fetchTripRequests = async (params: TripRequestsParams): Promise<any> => {
  const { status, page = 1, per_page = 20 } = params;
  const url = `driver/trips/requests?page=${page}&per_page=${per_page}`;
  console.log(`[${new Date().toLocaleTimeString()}] [tripApi] GET Trip Requests status=${status} page=${page}`);
  const response = await apiClient.get(url);
  return response.data;
};

