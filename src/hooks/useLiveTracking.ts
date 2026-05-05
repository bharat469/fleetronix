import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatedRegion, LatLng } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform, Animated } from 'react-native';
import { getDistance } from 'geolib';
import { locationQueueService } from '../services/LocationQueueService';
import { useDispatch } from 'react-redux';
import { setLiveLocation } from '../redux/slices/tripSlice';

interface UseLiveTrackingProps {
  tripId: string;
  destination: LatLng;
  routeCoords: LatLng[];
  proximityThreshold?: number; // meters
}

/**
 * useLiveTracking
 * 
 * Production-ready hook for real-time truck tracking.
 * Handles: GPS watching, Animated movement, API syncing, and Route splitting.
 */
export const useLiveTracking = ({
  tripId,
  destination,
  routeCoords,
  proximityThreshold = 500
}: UseLiveTrackingProps) => {
  const dispatch = useDispatch();
  
  // 1. Animated Region for smooth marker movement
  const animatedRegion = useRef(new AnimatedRegion({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  })).current;

  // 2. Animated Rotation for the truck
  const truckRotation = useRef(new Animated.Value(0)).current;

  const [isNearDestination, setIsNearDestination] = useState(false);
  const [completedRoute, setCompletedRoute] = useState<LatLng[]>([]);
  const [remainingRoute, setRemainingRoute] = useState<LatLng[]>([]);
  const [speed, setSpeed] = useState(0);

  const watchId = useRef<number | null>(null);
  const lastLocation = useRef<LatLng | null>(null);

  /**
   * Request Location Permissions
   */
  const requestPermissions = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('always');
      return auth === 'granted';
    }
    
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  /**
   * Smoothly animate marker and split route
   */
  const handleLocationUpdate = useCallback((point: LatLng, heading: number, currentSpeed: number) => {
    // A. Animate Marker Position
    animatedRegion.timing({
      latitude: point.latitude,
      longitude: point.longitude,
      duration: 1500,
      useNativeDriver: false,
      toValue: 0,
    } as any).start();

    // B. Animate Marker Rotation
    Animated.timing(truckRotation, {
      toValue: heading,
      duration: 500,
      useNativeDriver: false,
    }).start();

    setSpeed(currentSpeed);

    // C. Proximity Check
    const dist = getDistance(point, destination);
    if (dist <= proximityThreshold) setIsNearDestination(true);

    // D. Route Splitting (Optimized)
    if (routeCoords.length > 0) {
      let nearestIdx = 0;
      let minD = Infinity;
      routeCoords.forEach((c, i) => {
        const d = Math.pow(c.latitude - point.latitude, 2) + Math.pow(c.longitude - point.longitude, 2);
        if (d < minD) { minD = d; nearestIdx = i; }
      });
      setCompletedRoute(routeCoords.slice(0, nearestIdx + 1));
      setRemainingRoute(routeCoords.slice(nearestIdx));
    }

    // E. Global Sync
    dispatch(setLiveLocation(point));
    locationQueueService.enqueue(point.latitude, point.longitude);
    lastLocation.current = point;
  }, [destination, routeCoords, proximityThreshold, dispatch]);

  /**
   * Start GPS Tracking
   */
  useEffect(() => {
    let active = true;

    const startTracking = async () => {
      const hasPermission = await requestPermissions();
      if (!hasPermission || !active) return;

      locationQueueService.start(tripId);

      watchId.current = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading, speed: s } = position.coords;
          handleLocationUpdate(
            { latitude, longitude }, 
            heading ?? 0, 
            s ?? 0
          );
        },
        (error) => console.warn('[useLiveTracking] GPS Error:', error),
        {
          enableHighAccuracy: true,
          distanceFilter: 5,
          interval: 5000,
          fastestInterval: 2000,
        }
      );
    };

    startTracking();

    return () => {
      active = false;
      if (watchId.current !== null) Geolocation.clearWatch(watchId.current);
      locationQueueService.stop();
    };
  }, [tripId, handleLocationUpdate]);

  return {
    animatedRegion,
    truckRotation,
    isNearDestination,
    completedRoute,
    remainingRoute,
    speed,
    currentLocation: lastLocation.current,
  };
};
