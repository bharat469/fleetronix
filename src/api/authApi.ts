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
  data: Record<string, any>;
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

export const updateDriver = async (payload: UpdateDriverPayload): Promise<any> => {
  const formData = new FormData();

  Object.keys(payload.data).forEach(key => {
    const value = payload.data[key];
    console.log(value)
    if (Array.isArray(value)) {
      value.forEach(item => {
        const val = typeof item === 'object' && item !== null ? JSON.stringify(item) : item;
        formData.append(key, val); // Removed [] as per ideal response keys
      });
    } else {
      const isFile = typeof value === 'string' && (value.startsWith('file://') || value.startsWith('content://') || value.startsWith('ph://'));

      if (isFile) {
        let uri = value as string;
        // On Android, ensure file:// prefix if it's a local path
        if (uri.startsWith('/') && !uri.startsWith('file://')) {
          uri = `file://${uri}`;
        }


        const filename = uri.split('/').pop() || 'file';
        const ext = filename.split('.').pop()?.toLowerCase();

        let type = 'image/jpeg';
        if (ext === 'pdf') type = 'application/pdf';
        else if (ext === 'png') type = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
        console.log('kgfgn', key)
        formData.append(key, {
          uri,
          name: filename,
          type,
        } as any);
      } else if (value !== null && value !== undefined) {
        const val = typeof value === 'object' ? JSON.stringify(value) : value;
        formData.append(key, val);
      }
    }
  });

  // Use getParts() to log the actual structure of the FormData before sending
  console.log('[updateDriver] 📦 FormData Payload:', (formData as any).getParts());

  const url = `${BASE_URL}/driver/${payload.driverId}`;
  console.log('[updateDriver] 🚀 Request URL:', url);
  console.log('[updateDriver] 🔑 Token:', payload.token ? 'Present' : 'MISSING');

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${payload.token}`,
      },
      body: formData,
    });

    let json = null;
    try {
      json = await response.json();
    } catch { }

    if (!response.ok) {
      console.error('[updateDriver] ❌', response.status, json);
      throw new Error(json?.message ?? 'Request failed');
    }

    return json;

  } catch (error: any) {
    console.log(error, 'ERROR');

    if (error.message === 'Network request failed') {
      console.error('💡 Check API URL / FormData / device network');
    }

    throw error;
  }
};
