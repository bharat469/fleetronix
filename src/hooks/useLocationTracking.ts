/**
 * useLocationTracking.ts
 *
 * Watches the device's real GPS, posts coordinates to the backend every
 * PUSH_INTERVAL_MS seconds, and keeps Redux in sync.
 *
 * API: POST driver/trips/{tripId}/location
 *       { locations: [{ latitude, longitude, timestamp }] }
 *
 * Usage:
 *   const { liveCoord, isTracking, error } = useLocationTracking(tripId);
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useDispatch } from 'react-redux';
import { setLiveLocation } from '../redux/slices/tripSlice';
import { postDriverLocation, LocationPoint } from '../services/tripApi';

const PUSH_INTERVAL_MS  = 10_000; // post to server every 10 seconds
const GPS_INTERVAL_MS   =  5_000; // watch GPS every 5 seconds
const GPS_ACCURACY_M    =   20;   // min movement to trigger update (meters)

export interface LiveCoord {
  latitude: number;
  longitude: number;
}

export const useLocationTracking = (tripId: string | null, enabled: boolean = true) => {
  const dispatch = useDispatch();
  const [liveCoord, setLocalCoord]  = useState<LiveCoord | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permError,  setPermError]  = useState<string | null>(null);

  const watchId     = useRef<number | null>(null);
  const pushTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingPost = useRef<LocationPoint | null>(null); // latest coord to push

  // ── Request permission ───────────────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const perm = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    const result = await request(perm);
    if (result === RESULTS.GRANTED) return true;

    setPermError('Location permission denied. Please enable it in Settings.');
    return false;
  }, []);

  // ── Push interval: posts pendingPost to backend every 10s ────────────────
  const startPushInterval = useCallback(() => {
    if (pushTimer.current) return;
    pushTimer.current = setInterval(async () => {
      if (!pendingPost.current || !tripId) return;
      await postDriverLocation(tripId, pendingPost.current);
    }, PUSH_INTERVAL_MS);
  }, [tripId]);

  const stopPushInterval = useCallback(() => {
    if (pushTimer.current) {
      clearInterval(pushTimer.current);
      pushTimer.current = null;
    }
  }, []);

  // ── GPS watcher ──────────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return;

    setIsTracking(true);

    watchId.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const timestamp = new Date().toISOString();

        // Update local state for the map marker
        const coord: LiveCoord = { latitude, longitude };
        setLocalCoord(coord);

        // Sync to Redux
        dispatch(setLiveLocation({ latitude, longitude, timestamp }));

        // Queue the latest point for the next push cycle
        pendingPost.current = { latitude, longitude, timestamp };
      },
      (error) => {
        console.warn('[useLocationTracking] GPS error:', error.message);
      },
      {
        accuracy: {
          android: 'high',
          ios: 'bestForNavigation',
        },
        distanceFilter:  GPS_ACCURACY_M,
        interval:        GPS_INTERVAL_MS,
        fastestInterval: GPS_INTERVAL_MS,
        forceRequestLocation: true,
        showLocationDialog: true,
      },
    );

    // Also do an immediate post on start
    Geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const timestamp = new Date().toISOString();
        pendingPost.current = { latitude, longitude, timestamp };
        if (tripId) await postDriverLocation(tripId, { latitude, longitude, timestamp });
      },
      (err) => console.warn('[useLocationTracking] initial position error:', err.message),
      { accuracy: { android: 'high', ios: 'best' }, timeout: 10_000 },
    );

    startPushInterval();
  }, [requestPermission, startPushInterval, dispatch, tripId]);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    stopPushInterval();
    setIsTracking(false);
  }, [stopPushInterval]);

  // ── Lifecycle: start when tripId is available, stop on unmount ───────────
  useEffect(() => {
    if (tripId && enabled) {
      startTracking();
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [tripId, enabled, startTracking, stopTracking]);

  return {
    liveCoord,
    isTracking,
    permError,
    stopTracking,
  };
};
