import notifee, { AndroidImportance } from '@notifee/react-native';

/**
 * NotificationService
 * 
 * Handles local push notifications.
 */
class NotificationService {
  /**
   * Initialize Notifee channels (Required for Android)
   */
  async initialize() {
    await notifee.createChannel({
      id: 'trip-updates',
      name: 'Trip Updates',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  /**
   * Display a local notification immediately
   */
  async showLocalNotification(title: string, body: string) {
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: 'trip-updates',
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
      },
    });
  }

  /**
   * Setup Geofencing (Stubbed since background-geolocation was removed)
   */
  setupGeofencing(points: { id: string; latitude: number; longitude: number; radius: number }[]) {
    console.log('[NotificationService] Geofencing disabled (Background Geolocation removed)');
  }

  /**
   * Cleanup
   */
  stop() {
    console.log('[NotificationService] Stop called');
  }
}

export const notificationService = new NotificationService();
