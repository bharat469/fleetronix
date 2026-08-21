/**
 * useStartTrip.ts
 *
 * TanStack Query mutations for the OTP verification + trip start flow.
 *
 * Flow:
 *  1. verifyOtpMutation.mutate({ tripId, otp })
 *  2. On success → gets current GPS position
 *  3. Fires startTripMutation({ tripId, coords })
 *  4. On startTrip success → Redux updated, navigate to LiveTracking
 */

import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

import { verifyPickupOtp, startTrip } from '../services/tripApi';
import {
  setOtpVerified,
  setOtpError,
  setLifecycle,
  setActiveTripData,
} from '../redux/slices/tripSlice';
import { RootStackParamList } from '../navigation/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get current GPS coords; falls back to (0, 0) if permission denied. */
const getCurrentCoords = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise(async (resolve) => {
    const perm = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    const result = await request(perm);
    if (result !== RESULTS.GRANTED) {
      console.warn('[useStartTrip] Location permission denied — using fallback coords');
      return resolve({ latitude: 0, longitude: 0 });
    }

    Geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        console.warn('[useStartTrip] GPS error:', err.message, '— using fallback');
        resolve({ latitude: 0, longitude: 0 });
      },
      { accuracy: { android: 'high', ios: 'best' }, timeout: 8_000, maximumAge: 10_000 },
    );
  });
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useStartTrip = (trip?: any) => {
  const dispatch   = useDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ── Mutation 2: Start Trip (with coords) ──────────────────────────────────
  const startTripMutation = useMutation({
    mutationFn: ({ tripId, coords, trip }: { tripId: string; coords: { latitude: number; longitude: number }; trip?: any }) =>
      startTrip(tripId, coords),
    retry: 2,
    onMutate: () => {
      dispatch(setLifecycle('starting'));
    },
    onSuccess: (data, variables) => {
      if (data?.message && typeof data.message === 'object') {
        dispatch(setActiveTripData(data.message));
      } else if (data?.data && typeof data.data === 'object') {
        dispatch(setActiveTripData(data.data));
      } else if (variables.trip && typeof variables.trip === 'object') {
        dispatch(setActiveTripData(variables.trip));
      }

      dispatch(setLifecycle('started'));

      let finalTrip = variables.trip;
      if (!finalTrip && data?.message && typeof data.message === 'object') {
        finalTrip = data.message;
      }
      if (!finalTrip && data?.data && typeof data.data === 'object') {
        finalTrip = data.data;
      }
      if (!finalTrip) {
        finalTrip = { id: variables.tripId, trip_id: variables.tripId };
      }

      navigation.navigate('LiveTracking', { trip: finalTrip });
    },
    onError: (error: Error) => {
      console.error('[useStartTrip] startTrip failed:', error.message);
      dispatch(setLifecycle('otp_verified')); // allow retry
    },
  });

  // ── Mutation 1: Verify OTP → get GPS → start ──────────────────────────────
  const verifyOtpMutation = useMutation({
    mutationFn: ({ tripId, otp }: { tripId: string; otp: string }) =>
      verifyPickupOtp({ tripId, otp }),
    retry: 1,
    onMutate: () => {
      dispatch(setLifecycle('otp_pending'));
    },
    onSuccess: async (data, variables) => {
      dispatch(setOtpVerified());

      // Get GPS position before starting trip (required by API)
      const coords = await getCurrentCoords();
      
      const resolvedTrip = trip ?? data?.message ?? data?.data ?? data;

      startTripMutation.mutate({
        tripId: variables.tripId,
        coords,
        trip: (resolvedTrip && typeof resolvedTrip === 'object') ? resolvedTrip : undefined
      });
    },
    onError: (error: Error) => {
      const msg = error.message ?? 'Invalid OTP. Please try again.';
      dispatch(setOtpError(msg));
    },
  });

  const isLoading = verifyOtpMutation.isPending || startTripMutation.isPending;

  const loadingPhase: 'verifying' | 'locating' | 'starting' | null =
    verifyOtpMutation.isPending ? 'verifying' :
    startTripMutation.isPending ? 'starting'  : null;

  return {
    verifyOtpMutation,
    startTripMutation,
    isLoading,
    loadingPhase,
    isOtpError:      verifyOtpMutation.isError,
    otpErrorMessage: (verifyOtpMutation.error as Error | null)?.message,
    isStartError:    startTripMutation.isError,
    resetOtpError:   () => verifyOtpMutation.reset(),
  };
};
