/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging, { setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Register background handler
setBackgroundMessageHandler(messaging(), async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  
  const { notification, data } = remoteMessage;
  
  // Create channel if it doesn't exist
  await notifee.createChannel({
    id: 'high_importance_channel',
    name: 'High Importance Channel',
    importance: AndroidImportance.HIGH,
  });

  // If notification block exists, FCM automatically displays it. 
  // We only display via Notifee if it's a data-only payload to avoid duplicates.
  if (!notification && data) {
    await notifee.displayNotification({
      title: String(data?.title || 'New Notification'),
      body: String(data?.body || ''),
      data: data,
      android: {
        channelId: 'high_importance_channel',
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher', // TODO: Change to 'ic_notification' once generated in res/drawable
        pressAction: { id: 'default', launchActivity: 'default' },
      },
    });
  }
});

// Register Notifee background event handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  if (type === EventType.PRESS) {
    console.log('User pressed notification in background', notification);
  }
});

AppRegistry.registerComponent(appName, () => App);
