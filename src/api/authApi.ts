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
