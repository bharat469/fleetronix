import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { setLiveLocation, setLifecycle, resetTrip } from '../redux/slices/tripSlice';
import locationTrackingManager, { Coordinate } from '../services/LocationTrackingManager';
import { useTripDetails } from '../hooks/useTripDetails';

export const GlobalLocationTracker: React.FC = () => {
  const dispatch = useDispatch();
  const { tripId, lifecycle } = useSelector((state: RootState) => state.trip);

  const { data: tripData } = useTripDetails(tripId ?? undefined);

  // Sync Redux lifecycle state if the active status from backend details matches active states
  useEffect(() => {
    if (tripData?.status) {
      const status = tripData.status;
      if (status === 'started' || status === 'ongoing' || status === 'in_transit') {
        if (lifecycle === 'idle') {
          console.log('[GlobalLocationTracker] Syncing active lifecycle state: started');
          dispatch(setLifecycle('started'));
        }
      } else if (status === 'completed') {
        if (lifecycle !== 'idle') {
          console.log('[GlobalLocationTracker] Trip completed. Resetting active trip state.');
          dispatch(resetTrip());
        }
      } else if (status === 'delivered') {
        if (lifecycle !== 'idle' && lifecycle !== 'delivered') {
          console.log('[GlobalLocationTracker] Syncing delivered lifecycle state');
          dispatch(setLifecycle('delivered'));
        }
      }
    }
  }, [tripData?.status, lifecycle, dispatch]);

  useEffect(() => {
    const isTripActive = 
      !!tripId && 
      (lifecycle === 'started' || lifecycle === 'in_transit' || lifecycle === 'near_destination');

    if (isTripActive) {
      locationTrackingManager.start(tripId!);
    } else {
      locationTrackingManager.stop();
    }

    return () => {
      // Don't stop tracking on unmount of this specific component if a trip is active,
      // but if the app is shutting down, standard cleanup occurs.
    };
  }, [tripId, lifecycle]);

  // Sync tracking manager updates to Redux
  useEffect(() => {
    const handleUpdate = (coord: Coordinate) => {
      dispatch(setLiveLocation({
        latitude: coord.latitude,
        longitude: coord.longitude,
        timestamp: new Date().toISOString(),
      }));
    };

    locationTrackingManager.onLocationUpdate(handleUpdate);

    return () => {
      locationTrackingManager.offLocationUpdate(handleUpdate);
    };
  }, [dispatch]);

  // This is a logic-only component, it doesn't render any UI
  return null;
};

export default GlobalLocationTracker;
