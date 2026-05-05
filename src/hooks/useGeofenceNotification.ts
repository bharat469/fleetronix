import { useEffect, useCallback } from 'react';
import { GeofenceManager, GeofenceConfig } from '../services/GeofenceManager';

/**
 * Reusable hook to manage geofencing for a specific screen or component.
 */
export const useGeofenceNotification = () => {
  
  /**
   * Setup a geofence for a location
   */
  const setupGeofence = useCallback(async (config: GeofenceConfig) => {
    try {
      await GeofenceManager.init();
      await GeofenceManager.addGeofence(config);
    } catch (error) {
      console.error('[useGeofenceNotification] Setup error:', error);
    }
  }, []);

  /**
   * Clear all monitored zones
   */
  const clearAllGeofences = useCallback(async () => {
    try {
      await GeofenceManager.removeAllGeofences();
    } catch (error) {
      console.error('[useGeofenceNotification] Clear error:', error);
    }
  }, []);

  return {
    setupGeofence,
    clearAllGeofences,
  };
};
