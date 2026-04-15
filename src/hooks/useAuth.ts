import { useMutation } from '@tanstack/react-query';
import { sendOtp, SendOtpPayload, SendOtpResponse } from '../api/authApi';

/**
 * TanStack mutation for sending OTP to the driver's phone number.
 *
 * Usage:
 *   const { mutate, isPending, isError, error } = useSendOtp();
 *   mutate({ phone: '9876543210' });
 */
export const useSendOtp = (options?: {
  onSuccess?: (data: SendOtpResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation<SendOtpResponse, Error, SendOtpPayload>({
    mutationFn: sendOtp,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
