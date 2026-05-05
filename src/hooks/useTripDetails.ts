import { useQuery } from '@tanstack/react-query';
import { fetchTripBreifById, fetchTripById } from '../services/tripApi';

export const useTripDetails = (tripId?: string) => {
  return useQuery({
    queryKey: ['tripDetails', tripId],
    queryFn: () => fetchTripById(tripId!),
    enabled: !!tripId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
};


export const useTripBreif = (tripId?: string) => {
  return useQuery({
    queryKey: ['tripBreif', tripId],
    queryFn: () => fetchTripBreifById(tripId!),
    enabled: !!tripId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
};
