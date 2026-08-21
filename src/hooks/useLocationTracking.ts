import { useEffect, useState } from 'react';
import locationTrackingManager, { Coordinate } from '../services/LocationTrackingManager';

/**
 * useLocationTracking
 * 
 * Interfaces with the global LocationTrackingManager to receive real-time 
 * GPS coordinate updates for local UI rendering (e.g. animating truck markers).
 */
export const useLocationTracking = (tripId: string | null, enabled: boolean = true) => {
  const [liveCoord, setLiveCoord] = useState<Coordinate | null>(null);

  useEffect(() => {
    if (!tripId || !enabled) return;

    const handleUpdate = (coord: Coordinate) => {
      setLiveCoord(coord);
    };

    locationTrackingManager.onLocationUpdate(handleUpdate);
    
    return () => {
      locationTrackingManager.offLocationUpdate(handleUpdate);
    };
  }, [tripId, enabled]);

  return {
    liveCoord,
    isTracking: !!tripId && enabled,
    permError: null,
    stopTracking: () => locationTrackingManager.stop(),
  };
};
export default useLocationTracking;
