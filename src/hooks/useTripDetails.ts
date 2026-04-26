import { useQuery } from '@tanstack/react-query';
import { fetchTripById } from '../services/tripApi';

/**
 * Hook to fetch details of a single trip
 * @param tripId The ID of the trip to fetch
 */
export const useTripDetails = (tripId: string) => {
  return useQuery({
    queryKey: ['tripDetails', tripId],
    queryFn: () => fetchTripById(tripId),
    enabled: !!tripId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false, // Prevent extra hits when app returns to foreground
    refetchOnMount: false, // Use cached data if available
    retry: 1, // Minimize multiple hits during debugging
  });
};

