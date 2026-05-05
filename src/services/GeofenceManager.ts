import { notificationService } from './NotificationService';

export interface GeofenceConfig {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
  title: string;
  body: string;
}

/**
 * GeofenceManager (Stubbed)
 * Background Geolocation removed.
 */
export class GeofenceManager {
  private static isInitialized = false;

  static async init() {
    if (this.isInitialized) return;
    await notificationService.initialize();
    this.isInitialized = true;
    console.log('[GeofenceManager] Stub Initialized');
  }

  static async addGeofence(config: GeofenceConfig) {
    console.log(`[GeofenceManager] Stub: Geofencing disabled for ${config.identifier}`);
  }

  static async removeGeofence(identifier: string) {
    console.log(`[GeofenceManager] Stub: Remove geofence ${identifier}`);
  }

  static async removeAllGeofences() {
    console.log('[GeofenceManager] Stub: Remove all geofences');
  }
}
