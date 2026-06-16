import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTrips } from '../services/tripApi';
import { TripParams } from '../types/trip';

/**
 * Hook for fetching trips with infinite scroll support
 * @param filter 'all' | 'assigned' | 'ongoing' | 'completed'
 * @param perPage Number of items per page
 */
export const useTrips = (
  filter: TripParams['filter'],
  perPage: number = 20,
  enabled: boolean = true
) => {
  return useInfiniteQuery({
    queryKey: ['trips', filter],
    queryFn: ({ pageParam = 1 }) => 
      fetchTrips({ filter, page: pageParam as number, per_page: perPage }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.pagination) return undefined;
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
};
