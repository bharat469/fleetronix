import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import messaging, { getInitialNotification, onMessage, onNotificationOpenedApp, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';

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
      id: 'high_importance_channel',
      name: 'High Importance Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    // Handle foreground notification clicks
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('[NotificationService] User pressed notification in foreground', detail.notification);
        // Add navigation logic here if needed
      }
    });
  }

  /**
   * Setup FCM listeners
   */
  async setupFCM() {
    // 1. Request permission (iOS + Android 13+)
    const authStatus = await requestPermission(messaging());
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    // Additionally request permission directly through Notifee to ensure Android 13+ POST_NOTIFICATIONS
    await notifee.requestPermission();

    if (!enabled) {
      console.log('[NotificationService] Notification permission denied');
      return;
    }

    // 2. Handle foreground messages
    const unsubscribe = onMessage(messaging(), async remoteMessage => {
      console.log('[NotificationService] Foreground message received:', remoteMessage);
      
      const { notification, data } = remoteMessage;
      // In foreground, FCM doesn't show notifications automatically, so we must trigger Notifee
      await this.showLocalNotification(
        String(notification?.title || data?.title || 'New Message'),
        String(notification?.body || data?.body || ''),
        data
      );
    });

    // 3. Handle notification clicks (when app is in background/quit)
    onNotificationOpenedApp(messaging(), remoteMessage => {
      console.log('[NotificationService] Notification caused app to open from background:', remoteMessage);
    });

    getInitialNotification(messaging()).then(remoteMessage => {
      if (remoteMessage) {
        console.log('[NotificationService] Notification caused app to open from quit state:', remoteMessage);
      }
    });

    return unsubscribe;
  }

  /**
   * Display a local notification immediately
   */
  async showLocalNotification(title: string, body: string, data?: any) {
    await notifee.displayNotification({
      title,
      body,
      data: data,
      android: {
        channelId: 'high_importance_channel',
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher', // TODO: Change to 'ic_notification' once generated
        color: '#000000', // Set to primary app color
        pressAction: { 
          id: 'default',
          launchActivity: 'default' // Required for some Android 12+ devices to open app
        },
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
