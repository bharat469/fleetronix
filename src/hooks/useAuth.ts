import { useMutation } from '@tanstack/react-query';
import { 
  sendOtp, SendOtpPayload, SendOtpResponse,
  resendOtp, ResendOtpPayload, ResendOtpResponse,
  checkMobile, CheckMobilePayload, CheckMobileResponse,
  register, RegisterPayload, RegisterResponse,
  login, LoginPayload, LoginResponse,
  updateDriver, UpdateDriverPayload
} from '../api/authApi';

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

export const useResendOtp = (options?: {
  onSuccess?: (data: ResendOtpResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation<ResendOtpResponse, Error, ResendOtpPayload>({
    mutationFn: resendOtp,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

export const useCheckMobile = (options?: {
  onSuccess?: (data: CheckMobileResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation<CheckMobileResponse, Error, CheckMobilePayload>({
    mutationFn: checkMobile,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

export const useRegister = (options?: {
  onSuccess?: (data: RegisterResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: register,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

export const useLogin = (options?: {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: login,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

export const useUpdateDriver = (options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation<any, Error, UpdateDriverPayload>({
    mutationFn: updateDriver,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
