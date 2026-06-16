import apiClient from './apiClient';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  notification_type: string;
  created_at: string;
  updated_at: string;
  data?: Record<string, any>;
}

export interface GetNotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: NotificationItem[];
    unread_count: number;
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface GetNotificationsParams {
  page?: number;
  per_page?: number;
  is_read?: boolean;
  notification_type?: string;
}

export const getNotifications = async (
  params?: GetNotificationsParams
): Promise<GetNotificationsResponse> => {
  console.log('[getNotifications] 📥 Fetching notifications...', params);
  const response = await apiClient.get('driver/notifications', { params });
  return response.data as GetNotificationsResponse;
};

export const markAllNotificationsRead = async (): Promise<any> => {
  console.log('[markAllNotificationsRead] 📤 Marking all as read...');
  const response = await apiClient.post('driver/notifications/mark-all-read', {});
  return response.data;
};

export const markNotificationRead = async (notificationId: string): Promise<any> => {
  console.log(`[markNotificationRead] 📤 Marking notification ${notificationId} as read...`);
  const response = await apiClient.post(`driver/notifications/${notificationId}/read`, {});
  return response.data;
};
