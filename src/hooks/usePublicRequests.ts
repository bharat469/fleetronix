import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPublicRequests } from '../services/tripApi';

export const usePublicRequests = (enabled: boolean = false, perPage: number = 20) => {
  return useInfiniteQuery({
    queryKey: ['publicRequestsInfinite'],
    queryFn: ({ pageParam = 1 }) =>
      fetchPublicRequests({ show_responded: false, page: pageParam as number, per_page: perPage, sort_order: 'desc' }),
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
