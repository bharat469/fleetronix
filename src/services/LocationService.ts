import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';

export class LocationService {
  /**
   * Request location permissions
   */
  static async requestPermission() {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
    } else {
      await Geolocation.requestAuthorization('whenInUse');
    }
  }

  /**
   * Start tracking (simplified for foreground)
   */
  static async startTracking() {
    await this.requestPermission();
    // In this simplified version, tracking is handled by the screen or hooks
    console.log('[LocationService] Foreground tracking available');
  }

  /**
   * Stop all tracking
   */
  static async stopTracking() {
    Geolocation.stopObserving();
  }

  /**
   * Get current device location
   */
  static async getCurrentLocation(): Promise<any> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  }
}
