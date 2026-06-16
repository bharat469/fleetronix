import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  GetNotificationsParams,
  GetNotificationsResponse
} from '../api/notificationApi';

export const useNotifications = (params?: GetNotificationsParams, enabled: boolean = true) => {
  return useQuery<GetNotificationsResponse, Error>({
    queryKey: ['notifications', params],
    queryFn: () => getNotifications(params),
    enabled,
    refetchInterval: 30000, // Optionally poll every 30 seconds to keep unread count fresh
    staleTime: 10000,       // Keep data fresh for 10 seconds to avoid duplicate requests
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, void, { previousQueries: [any, any][] }>({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      // Cancel any outgoing refetches for notifications so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Snapshot the previous value
      const previousQueries = queryClient.getQueriesData({ queryKey: ['notifications'] });

      // Optimistically update each query matching the key in cache
      previousQueries.forEach(([queryKey, oldData]: [any, any]) => {
        if (oldData?.data) {
          queryClient.setQueryData(queryKey, {
            ...oldData,
            data: {
              ...oldData.data,
              unread_count: 0,
              notifications: oldData.data.notifications.map((notif: any) => ({
                ...notif,
                is_read: true,
              })),
            },
          });
        }
      });

      // Return a context object with the snapshotted values
      return { previousQueries };
    },
    onError: (err, variables, context) => {
      // Rollback to the snapshotted state on failure
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, oldData]: [any, any]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
    },
    onSettled: () => {
      // Invalidate queries to sync status with database
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string, { previousQueries: [any, any][] }>({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onMutate: async (notificationId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Snapshot previous value
      const previousQueries = queryClient.getQueriesData({ queryKey: ['notifications'] });

      // Optimistically update matching query
      previousQueries.forEach(([queryKey, oldData]: [any, any]) => {
        if (oldData?.data) {
          let decrementedCount = 0;
          const updatedNotifications = oldData.data.notifications.map((notif: any) => {
            const matchesId = notif.id === notificationId || notif._id === notificationId;
            if (matchesId && !notif.is_read) {
              decrementedCount = 1;
              return { ...notif, is_read: true };
            }
            return notif;
          });

          queryClient.setQueryData(queryKey, {
            ...oldData,
            data: {
              ...oldData.data,
              unread_count: Math.max(0, oldData.data.unread_count - decrementedCount),
              notifications: updatedNotifications,
            },
          });
        }
      });

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      // Rollback on failure
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, oldData]: [any, any]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
