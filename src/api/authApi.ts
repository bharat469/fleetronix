const BASE_URL = 'http://103.197.76.50:8087/api';

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
  data: Record<string, any>; // Using any to allow strings, arrays, booleans, and Asset objects
}

export const sendOtp = async (payload: SendOtpPayload): Promise<SendOtpResponse> => {
  console.log('[sendOtp] 📤 Request payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}/driver/auth/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    console.error('[sendOtp] ❌ Error response:', response.status, JSON.stringify(json, null, 2));
    throw new Error(json?.message ?? `Request failed with status ${response.status}`);
  }

  console.log('[sendOtp] ✅ Success response:', JSON.stringify(json, null, 2));
  return json as SendOtpResponse;
};

export const resendOtp = async (payload: ResendOtpPayload): Promise<ResendOtpResponse> => {
  console.log('[resendOtp] 📤 Request payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}/driver/auth/resend-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    console.error('[resendOtp] ❌ Error response:', response.status, JSON.stringify(json, null, 2));
    throw new Error(json?.message ?? `Request failed with status ${response.status}`);
  }

  console.log('[resendOtp] ✅ Success response:', JSON.stringify(json, null, 2));
  return json as ResendOtpResponse;
};

export const checkMobile = async (payload: CheckMobilePayload): Promise<CheckMobileResponse> => {
  console.log('[checkMobile] 📤 Request payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}/driver/auth/check-mobile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    console.error('[checkMobile] ❌ Error response:', response.status, JSON.stringify(json, null, 2));
    throw new Error(json?.message ?? `Request failed with status ${response.status}`);
  }

  console.log('[checkMobile] ✅ Success response:', JSON.stringify(json, null, 2));
  return json as CheckMobileResponse;
};

export const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  console.log('[register] 📤 Request payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}/driver/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    console.error('[register] ❌ Error response:', response.status, JSON.stringify(json, null, 2));
    throw new Error(json?.message ?? `Request failed with status ${response.status}`);
  }

  console.log('[register] ✅ Success response:', JSON.stringify(json, null, 2));
  return json as RegisterResponse;
};

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  console.log('[login] 📤 Request payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}/driver/auth/login-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    console.error('[login] ❌ Error response:', response.status, JSON.stringify(json, null, 2));
    throw new Error(json?.message ?? `Request failed with status ${response.status}`);
  }

  console.log('[login] ✅ Success response:', JSON.stringify(json, null, 2));
  return json as LoginResponse;
};

import ReactNativeBlobUtil from 'react-native-blob-util';

export const updateDriver = async (payload: UpdateDriverPayload): Promise<any> => {
  const { driverId, token, data } = payload;
  const url = `${BASE_URL}/driver/${driverId}`;

  console.log('[updateDriver] 📤 Request start (react-native-blob-util)');

  const multipartBody: any[] = [];

  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value === null || value === undefined) return;

    // 1. Array → comma spearated
    if (Array.isArray(value)) {
      multipartBody.push({ name: key, data: value.join(',') });
      return;
    }

    // 2. File handling
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

      // react-native-blob-util needs the path without file://
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

    // 3. Normal fields
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