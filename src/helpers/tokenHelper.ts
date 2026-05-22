import messaging, { getToken, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

/**
 * Helper to fetch FCM token and Device Unique ID
 */
export const getFcmToken = async (): Promise<string | null> => {
  try {
    const authStatus = await requestPermission(messaging());
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      const token = await getToken(messaging());
      return token;
    }
    return null;
  } catch (error) {
    console.error('[tokenHelper] Error getting FCM token:', error);
    return null;
  }
};

export const getDeviceId = async (): Promise<string> => {
  try {
    const uniqueId = await DeviceInfo.getUniqueId();
    return uniqueId;
  } catch (error) {
    console.error('[tokenHelper] Error getting Device ID:', error);
    return 'unknown_device';
  }
};
