import apiClient from './apiClient';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { store } from '../redux/store';
import { updateTokens, logout } from '../redux/slices/authSlice';
import { storage } from '../helpers/asyncHelper.tsx';
import axios from 'axios';
import Config from 'react-native-config';

const BASE_URL = Config.API_BASE_URL;

export interface SendOtpPayload {
  mobile: string;
  purpose: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface CheckMobilePayload {
  mobile: string;
}

export interface CheckMobileResponse {
  success: boolean;
  message: string;
  data: {
    purpose: string;
  };
}

export interface RegisterPayload {
  mobile: string;
  otp: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  access_token: string;
  refresh_token: string;
  data: {
    driver_id: string;
    driver_source: string;
    full_name: string | null;
    phone_number: string;
    shipper_approval: string;
    transporter_approval: string;
  };
}

export interface LoginPayload {
  mobile: string;
  otp: string;
}

export type LoginResponse = RegisterResponse;

export type ResendOtpPayload = SendOtpPayload;
export type ResendOtpResponse = SendOtpResponse;

export interface UpdateDriverPayload {
  driverId: string;
  token: string;
  data: Record<string, any>;
}

export const sendOtp = async (payload: SendOtpPayload): Promise<SendOtpResponse> => {
  console.log('[sendOtp] 📤 Request payload:', JSON.stringify(payload, null, 2));
  const response = await apiClient.post('/driver/auth/send-otp', payload);
  console.log('[sendOtp] ✅ Success response:', JSON.stringify(response.data, null, 2));
  return response.data;
};

export const resendOtp = async (payload: ResendOtpPayload): Promise<ResendOtpResponse> => {
  console.log('[resendOtp] 📤 Request payload:', JSON.stringify(payload, null, 2));
  const response = await apiClient.post('/driver/auth/resend-otp', payload);
  console.log('[resendOtp] ✅ Success response:', JSON.stringify(response.data, null, 2));
  return response.data;
};

export const checkMobile = async (payload: CheckMobilePayload): Promise<CheckMobileResponse> => {
  console.log('[checkMobile] 📤 Request payload:', JSON.stringify(payload, null, 2));
  const response = await apiClient.post('/driver/auth/check-mobile', payload);
  console.log('[checkMobile] ✅ Success response:', JSON.stringify(response.data, null, 2));
  return response.data;
};

export const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  console.log('[register] 📤 Request payload:', JSON.stringify(payload, null, 2));
  const response = await apiClient.post('/driver/auth/register', payload);
  console.log('[register] ✅ Success response:', JSON.stringify(response.data, null, 2));
  return response.data;
};

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  console.log('[login] 📤 Request payload:', JSON.stringify(payload, null, 2));
  const response = await apiClient.post('/driver/auth/login-otp', payload);
  console.log('[login] ✅ Success response:', JSON.stringify(response.data, null, 2));
  return response.data;
};

export const updateDriver = async (payload: UpdateDriverPayload): Promise<any> => {
  const { driverId, token, data } = payload;
  const url = `${BASE_URL}/driver/${driverId}`;

  console.log('[updateDriver] 📤 Request start (react-native-blob-util)');

  const multipartBody: any[] = [];

  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      multipartBody.push({ name: key, data: value.join(',') });
      return;
    }

    const isFile = (typeof value === 'object' && value?.uri) ||
      (typeof value === 'string' && (
        value.startsWith('file://') ||
        value.startsWith('content://') ||
        (value.startsWith('/') && (value.endsWith('.jpg') || value.endsWith('.jpeg') || value.endsWith('.png') || value.endsWith('.pdf')))
      ));

    if (isFile) {
      const uri = typeof value === 'object' ? value.uri : value;
      const fileName = typeof value === 'object' ? (value.fileName || value.name) : null;
      const type = typeof value === 'object' ? value.type : null;

      const cleanPath = uri.replace('file://', '');
      const name = fileName || uri.split('/').pop() || `${key}.jpg`;

      multipartBody.push({
        name: key,
        filename: name,
        type: type || 'image/jpeg',
        data: ReactNativeBlobUtil.wrap(cleanPath)
      });
      return;
    }

    multipartBody.push({ name: key, data: String(value) });
  });

  try {
    const response = await ReactNativeBlobUtil.fetch('PATCH' as any, url, {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
      Accept: 'application/json',
    }, multipartBody);

    const status = response.info().status;
    let json = null;
    try {
      json = response.json();
    } catch (e) {
      try {
        json = JSON.parse(response.data);
      } catch (e2) {
        json = response.data;
      }
    }

    if (status === 401) {
      try {
        // Use logic from performTokenRefresh
        const state = store.getState();
        const refreshToken = state.auth.refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` }
        });

        const { access_token, refresh_token } = refreshResponse.data;
        store.dispatch(updateTokens({ accessToken: access_token, refreshToken: refresh_token }));
        await storage.set('userToken', access_token);
        await storage.set('refreshToken', refresh_token);

        const retryResponse = await ReactNativeBlobUtil.fetch('PATCH' as any, url, {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        }, multipartBody);
        
        const retryStatus = retryResponse.info().status;
        const retryJson = retryResponse.json();
        
        if (retryStatus >= 200 && retryStatus < 300) {
          console.log('[updateDriver] ✅ Success after refresh:', retryJson);
          return retryJson;
        }
      } catch (refreshError) {
        throw new Error('Session expired. Please login again.');
      }
    }

    if (status < 200 || status >= 300) {
      console.error('[updateDriver] ❌ Error:', status, json);
      throw new Error(typeof json === 'object' ? (json?.message || 'Request failed') : 'Request failed');
    }

    console.log('[updateDriver] ✅ Success:', json);
    return json;

  } catch (error: any) {
    console.error('[updateDriver] ❌ ERROR:', error);
    throw error;
  }
};

export const getDriverInfo = async (driverId: string, token: string): Promise<any> => {
  const response = await apiClient.get(`/driver/${driverId}`);
  return response.data;
};