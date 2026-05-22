import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTripRequests } from '../services/tripApi';

export const useTripRequests = (
  status: 'pending' | 'accepted' | 'rejected',
  enabled: boolean = false,
  perPage: number = 20
) => {
  return useInfiniteQuery({
    queryKey: ['tripRequestsInfinite', status],
    queryFn: ({ pageParam = 1 }) =>
      fetchTripRequests({ status, page: pageParam as number, per_page: perPage }),
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
