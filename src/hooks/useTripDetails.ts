import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchTripBreifById, fetchTripById, sendSOSAlert } from '../services/tripApi';

export const useTripDetails = (tripId?: string) => {
  return useQuery({
    queryKey: ['tripDetails', tripId],
    queryFn: () => fetchTripById(tripId!),
    enabled: !!tripId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
};


export const useTripBreif = (tripId?: string, isTripActive: boolean = false) => {
  return useQuery({
    queryKey: ['tripBreif', tripId],
    queryFn: () => fetchTripBreifById(tripId!),
    enabled: !!tripId,
    staleTime: isTripActive ? 0 : 1000 * 60 * 5, // 5 minutes
    refetchInterval: isTripActive ? 15_000 : false, // poll only if active
    refetchOnWindowFocus: true,
  });
};

export const useSendSOS = (options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (params: {
      tripId: string;
      type: 'accident' | 'truck_failure';
      lat?: string | number;
      long?: string | number;
    }) => sendSOSAlert(params),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
