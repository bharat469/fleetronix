/**
 * LiveTrackingScreen.tsx
 *
 * UI matches the dispatch-grade design (driver card + slide-to-deliver).
 * Functionality:
 *  - Real GPS via useLocationTracking (posts every 10s to backend)
 *  - Split polyline: green (completed) / blue (remaining)
 *  - animateMarkerToCoordinate for smooth truck movement
 *  - Proximity detection → shows "Slide to Deliver" when within 500m
 *  - Successful slide → navigate to ConfirmDelivery (proof of delivery)
 *  - SOS emergency button with long-press activation
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Linking,
  StatusBar,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Config from 'react-native-config';
import { useSelector, useDispatch } from 'react-redux';
import { notificationService } from '../../../services/NotificationService';

import { RootState } from '../../../redux/store';
import { setLiveLocation, setTripId, resetTrip } from '../../../redux/slices/tripSlice';
import { scale, verticalScale, moderateScale, SCREEN } from '../../../helpers/dimension';
import { RootStackParamList } from '../../../navigation/types';
import Svg, { Path, Circle } from 'react-native-svg';
import { useLocationTracking } from '../../../hooks/useLocationTracking';
import { useTripBreif, useTripDetails, useSendSOS } from '../../../hooks/useTripDetails';
import { useDriverInfo } from '../../../hooks/useAuth';
import { resolveImageUrl } from '../../../helpers/urlHelper';
import { getDistance } from 'geolib';
import SOSButton from '../../../components/SOSButton';
import SOSBottomSheet from '../../../components/common/SOSBottomSheet';

const GOOGLE_MAPS_API_KEY = Config.GOOGLE_MAPS_API_KEY ?? '';
const NEAR_DEST_KM  = 0.5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type LatLng = { latitude: number; longitude: number };

const distSq = (a: LatLng, b: LatLng) =>
  Math.pow(a.latitude - b.latitude, 2) + Math.pow(a.longitude - b.longitude, 2);

/** Haversine distance in km */
const haversineKm = (a: LatLng, b: LatLng): number => {
  const R = 6371;
  const dLat = ((b.latitude  - a.latitude)  * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude  * Math.PI) / 180) *
    Math.cos((b.latitude  * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const splitRoute = (
  coords: LatLng[],
  current: LatLng,
): { completed: LatLng[]; remaining: LatLng[] } => {
  if (coords.length < 2) return { completed: [], remaining: coords };
  let minIdx = 0;
  let minD   = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = distSq(coords[i], current);
    if (d < minD) { minD = d; minIdx = i; }
  }
  return {
    completed: [...coords.slice(0, minIdx + 1), current],
    remaining: [current, ...coords.slice(minIdx + 1)],
  };
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24">
    <Path d="M15 18l-6-6 6-6" stroke="#222" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

const ClockIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" stroke="#CA2027" strokeWidth={2} fill="none" />
    <Path d="M12 6v6l4 2" stroke="#CA2027" strokeWidth={2} strokeLinecap="round" fill="none" />
  </Svg>
);

const CircleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="6" stroke="#4CAF50" strokeWidth={3} fill="none" />
  </Svg>
);

const PinIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="#CA2027" />
  </Svg>
);

const PhoneIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.9 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012.81 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" fill="white" />
  </Svg>
);


const TruckMapIcon = ({ color = '#CA2027', size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
    <Path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
    <Path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
  </Svg>
);


// ─── Main Screen ──────────────────────────────────────────────────────────────

const LiveTrackingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<RootStackParamList, 'LiveTracking'>>();
  const { trip }   = route.params;
  const dispatch  = useDispatch();
  const mapRef    = useRef<MapView>(null);
  const markerRef = useRef<any>(null);
  const tripRedux = useSelector((state: RootState) => state.trip);
  const tripId    = tripRedux.tripId || trip?.trip_id || trip?.id;
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);
  const { data: driverResponse } = useDriverInfo(driverId || '', userToken || '', !!driverId && !!userToken);
  const driver = driverResponse?.data;

  // Fetch live trip details — brief refetches every 15 s to keep current_location fresh
  const { data: apiData } = useTripDetails(tripId);

  const lastBriefStatusRef = useRef<string | null>(null);

  const isStatusActive = (status?: string | null) => {
    if (!status) return true;
    const lower = status.toLowerCase();
    return lower !== 'completed' && lower !== 'delivered' && lower !== 'cancelled';
  };

  const isTripActive =
    !!tripId &&
    isStatusActive(apiData?.status) &&
    isStatusActive(lastBriefStatusRef.current) &&
    tripRedux?.lifecycle !== 'delivered';

  const { data: apiBriefData } = useTripBreif(tripId, isTripActive);

  if (apiBriefData?.status) {
    lastBriefStatusRef.current = apiBriefData.status;
  }
  const data = { ...apiBriefData, ...apiData };

  useEffect(() => {
    if (tripId && !tripRedux.tripId) {
      dispatch(setTripId(tripId));
    }
  }, [tripId, tripRedux.tripId, dispatch]);

  useEffect(() => {
    const isCompleted = data?.status === 'completed' || trip?.status === 'completed';
    if (isCompleted) {
      console.log('🎉 [LiveTracking] Trip status is completed. Clearing trip state and resetting stack to Home.');
      dispatch(resetTrip());
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      return;
    }

    const isDeliveryVerified =
      data?.delivery_code_verified === true ||
      data?.delivery_code_verified === 1 ||
      data?.delivery_code_verified === 'true' ||
      trip?.delivery_code_verified === true ||
      trip?.delivery_code_verified === 1 ||
      trip?.delivery_code_verified === 'true' ||
      tripRedux?.lifecycle === 'delivered';

    if (isDeliveryVerified && tripId) {
      console.log('🏁 Delivery is verified! Redirecting to ConfirmDelivery Screen from LiveTracking.');
      navigation.replace('ConfirmDelivery', { trip: { ...trip, ...data } });
    }
  }, [data, trip, tripId, tripRedux?.lifecycle, dispatch, navigation]);

  const liveCoord = tripRedux.liveLocation;

  // ── Dynamic current location from API or local GPS ─────────────────────────
  const currentLocFromApi = apiBriefData?.current_location ?? apiData?.current_location;
  const currentLat = currentLocFromApi?.lat ?? currentLocFromApi?.latitude ?? liveCoord?.latitude;
  const currentLng = currentLocFromApi?.lng ?? currentLocFromApi?.longitude ?? liveCoord?.longitude;

  const hasCurrentLocation = !!(currentLat && currentLng);

  // Real GPS Tracking - always enabled when viewing this screen
  useLocationTracking(tripId, true);

  // Animated marker — starts at current_location if available, else sourceLatitude
  const lastLoc = tripRedux.liveLocation;
  const initLat = currentLat ?? lastLoc?.latitude  ?? tripRedux.sourceLatitude  ?? 28.5698;
  const initLng = currentLng ?? lastLoc?.longitude ?? tripRedux.sourceLongitude ?? 77.4812;
  const animatedRegion = useRef(
    new AnimatedRegion({
      latitude:       initLat,
      longitude:      initLng,
      latitudeDelta:  0.03,
      longitudeDelta: 0.03,
    }),
  ).current;
  const [nearDestination, setNearDestination] = useState(false);
  const [sosVisible, setSOSVisible] = useState(false);
  const [sosLoading, setSOSLoading] = useState(false);
  const { mutateAsync: sendSOS } = useSendSOS();

  const [routeCoords,    setRouteCoords]    = useState<LatLng[]>([]);
  const [completedRoute, setCompletedRoute] = useState<LatLng[]>([]);
  const [remainingRoute, setRemainingRoute] = useState<LatLng[]>([]);
  const [tripMetrics, setTripMetrics] = useState({ distance: '', duration: '' });

  const [directionsOrigin, setDirectionsOrigin] = useState<LatLng | null>(null);
  const lastDirectionsTime = useRef<number>(0);

  // ── Throttled Google Directions API Origin Updates ──────────────────────────
  useEffect(() => {
    if (!currentLat || !currentLng) return;
    const currentLoc = { latitude: currentLat, longitude: currentLng };
    const now = Date.now();

    if (!directionsOrigin) {
      setDirectionsOrigin(currentLoc);
      lastDirectionsTime.current = now;
      console.log('[LiveTracking] Initial Directions Origin Set:', currentLoc);
    } else {
      const distance = getDistance(currentLoc, directionsOrigin);
      const timeElapsed = now - lastDirectionsTime.current;

      // Update directionsOrigin if driver moved > 200m or 5 minutes elapsed
      if (distance >= 200 || timeElapsed >= 5 * 60 * 1000) {
        setDirectionsOrigin(currentLoc);
        lastDirectionsTime.current = now;
        console.log(`[LiveTracking] Directions Origin Updated. Distance: ${distance.toFixed(1)}m, Time Elapsed: ${(timeElapsed / 1000).toFixed(0)}s`);
      }
    }
  }, [currentLat, currentLng, directionsOrigin]);

  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 11 }).start();
  }, []);

  // ── Sync truck marker whenever current_location changes from API ────────────
  useEffect(() => {
    if (!hasCurrentLocation || liveCoord) return; // Skip API updates if we already have local real-time GPS updates
    const coord = { latitude: currentLat!, longitude: currentLng! };
    moveTruckTo(coord);
    // Also update Redux so other screens can read it
    dispatch(setLiveLocation(coord));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLat, currentLng, liveCoord]);


  // Origin = current truck location from API (dynamic)
  const pickup = {
    latitude:  currentLat  ?? (parseFloat(data?.source_latitude)  || tripRedux.sourceLatitude  || 28.5698),
    longitude: currentLng  ?? (parseFloat(data?.source_longitude) || tripRedux.sourceLongitude || 77.4812),
  };

  // Destination — read from every possible source in priority order
  const destLat =
    parseFloat(data?.destination_latitude)   ||
    parseFloat(trip?.destination_latitude)   ||
    tripRedux.destinationLatitude            ||
    13.2277;
  const destLng =
    parseFloat(data?.destination_longitude)  ||
    parseFloat(trip?.destination_longitude)  ||
    tripRedux.destinationLongitude           ||
    92.9395;
  const dest = { latitude: destLat, longitude: destLng };

  // Only render directions when both ends are real coordinates
  const hasValidRoute =
    pickup.latitude  !== 0 && pickup.longitude  !== 0 &&
    dest.latitude    !== 0 && dest.longitude    !== 0 &&
    hasCurrentLocation;

  const driverName  = (driver?.full_name || driver?.first_name || data?.driver_name) ?? tripRedux.driverName ?? (tripRedux.tripData as any)?.driver_name ?? 'Driver';
  const driverPhoto = (resolveImageUrl(driver?.photo_path) || data?.driver_photo_url) ?? tripRedux.driverPhoto ?? (tripRedux.tripData as any)?.driver_photo_url
    ?? 'https://randomuser.me/api/portraits/men/32.jpg';
  const driverPhone = (driver?.phone_number || data?.driver_mobile) ?? tripRedux.driverMobile ?? (tripRedux.tripData as any)?.driver_mobile;
  const shipperPhone = data?.shipper_mobile || '7777777770';
  const destAddress = data?.destination_address || data?.destination_city || (tripRedux.tripData as any)?.destination_address || 'Destination';
  const sourceAddress = data?.source_address || data?.source_city || (tripRedux.tripData as any)?.source_address || 'Logistics Hub';
  const deliveryTime = data?.estimated_delivery_time || (tripRedux.tripData as any)?.estimated_delivery_time || '~3-4 days';

  const moveTruckTo = useCallback((coord: LatLng) => {
    const duration = 1500;
    if (Platform.OS === 'android') {
      if (markerRef.current) {
        markerRef.current.animateMarkerToCoordinate(coord, duration);
      }
    }

    animatedRegion.timing({
      latitude: coord.latitude,
      longitude: coord.longitude,
      duration: duration,
      useNativeDriver: false,
    } as any).start();

    dispatch(setLiveLocation({ latitude: coord.latitude, longitude: coord.longitude }));

    setRouteCoords((prev) => {
      if (prev.length > 1) {
        const { completed, remaining } = splitRoute(prev, coord);
        setCompletedRoute(completed);
        setRemainingRoute(remaining);
      }
      return prev;
    });

    const distKm = haversineKm(coord, dest);
    if (distKm <= NEAR_DEST_KM) setNearDestination(true);

    mapRef.current?.animateToRegion({
      latitude: coord.latitude,
      longitude: coord.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    }, 900);
  }, [dest, dispatch]);

  useEffect(() => {
    if (!liveCoord) return;
    moveTruckTo(liveCoord);
  }, [liveCoord?.latitude, liveCoord?.longitude]);

  useEffect(() => {
    notificationService.initialize();
    notificationService.setupGeofencing([
      { id: 'pickup',      latitude: pickup.latitude, longitude: pickup.longitude, radius: 500 },
      { id: 'destination', latitude: dest.latitude,   longitude: dest.longitude,   radius: 500 }
    ]);
    return () => notificationService.stop();
  }, [pickup.latitude, pickup.longitude, dest.latitude, dest.longitude]);

  if (!tripId) {
    console.warn('[LiveTrackingScreen] No tripId found in Redux');
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude:  (pickup.latitude  + dest.latitude)  / 2,
          longitude: (pickup.longitude + dest.longitude) / 2,
          latitudeDelta:  Math.abs(pickup.latitude  - dest.latitude)  * 2.5 + 0.05,
          longitudeDelta: Math.abs(pickup.longitude - dest.longitude) * 2.5 + 0.05,
        }}
      >
        {hasValidRoute && directionsOrigin && (
          <MapViewDirections
            origin={directionsOrigin}
            destination={dest}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={0}        /* hidden — Polyline below draws */
            strokeColor="transparent"
            onReady={(result) => {
              setRouteCoords(result.coordinates);
              setTripMetrics({
                distance: `${result.distance.toFixed(1)} km`,
                duration: `${Math.ceil(result.duration)} mins`
              });

              // Initialize split routes immediately if current location is available
              const currentCoord = { latitude: currentLat!, longitude: currentLng! };
              if (currentLat && currentLng && result.coordinates.length > 1) {
                const { completed, remaining } = splitRoute(result.coordinates, currentCoord);
                setCompletedRoute(completed);
                setRemainingRoute(remaining);
              }

              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 100, right: 40, bottom: 320, left: 40 },
                animated: true,
              });
            }}
            onError={(err) => console.warn('[LiveTracking] Directions API error:', err)}
          />
        )}

        {/* Fallback straight-line connector — visible immediately, before road route loads */}
        {hasValidRoute && routeCoords.length < 2 && (
          <Polyline
            coordinates={[pickup, dest]}
            strokeColor="#2196F3"
            strokeWidth={3}
            lineDashPattern={[8, 5]}
          />
        )}

        {/* Glow underlays (drawn first, wider, semi-transparent) */}
        {completedRoute.length > 1 && (
          <Polyline
            coordinates={completedRoute}
            strokeColor="rgba(76, 175, 80, 0.25)"
            strokeWidth={10}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {remainingRoute.length > 1 && (
          <Polyline
            coordinates={remainingRoute}
            strokeColor="rgba(33, 150, 243, 0.25)"
            strokeWidth={10}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* If route loaded but no truck movement yet, show full route glow underlay */}
        {routeCoords.length >= 2 && completedRoute.length < 2 && remainingRoute.length < 2 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="rgba(33, 150, 243, 0.25)"
            strokeWidth={10}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Core road routes */}
        {completedRoute.length > 1 && (
          <Polyline
            coordinates={completedRoute}
            strokeColor="#4CAF50"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {remainingRoute.length > 1 && (
          <Polyline
            coordinates={remainingRoute}
            strokeColor="#2196F3"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* If route loaded but no truck movement yet, show full route in blue */}
        {routeCoords.length >= 2 && completedRoute.length < 2 && remainingRoute.length < 2 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#2196F3"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Dynamic Route ETA Badges */}
        {(() => {
          const activeRoute = remainingRoute.length >= 2 ? remainingRoute : routeCoords;
          if (activeRoute.length < 2) return null;
          
          const middleIndex = Math.floor(activeRoute.length / 2);
          const middleCoord = activeRoute[middleIndex];
          
          const firstThirdIndex = Math.floor(activeRoute.length / 3);
          const firstThirdCoord = activeRoute[firstThirdIndex];
          
          const secondThirdIndex = Math.floor((activeRoute.length * 2) / 3);
          const secondThirdCoord = activeRoute[secondThirdIndex];
          
          return (
            <>
              {/* Primary ETA Badge */}
              {middleCoord && (
                <Marker
                  coordinate={middleCoord}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={styles.etaRouteBadge}>
                    <Text style={styles.etaRouteText}>
                      {tripMetrics.duration ? `${tripMetrics.duration} • Fastest` : 'Fastest'}
                    </Text>
                  </View>
                </Marker>
              )}

              {/* Alternate Badge 1 */}
              {activeRoute.length >= 6 && firstThirdCoord && (
                <Marker
                  coordinate={firstThirdCoord}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={[styles.etaRouteBadge, styles.etaAlternateBadge]}>
                    <Text style={[styles.etaRouteText, styles.etaAlternateText]}>+3 min</Text>
                  </View>
                </Marker>
              )}

              {/* Alternate Badge 2 */}
              {activeRoute.length >= 9 && secondThirdCoord && (
                <Marker
                  coordinate={secondThirdCoord}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={[styles.etaRouteBadge, styles.etaAlternateBadge]}>
                    <Text style={[styles.etaRouteText, styles.etaAlternateText]}>+5 min</Text>
                  </View>
                </Marker>
              )}
            </>
          );
        })()}

        <Marker coordinate={pickup} anchor={{ x: 0.5, y: 0.5 }}><View style={styles.pickupDot} /></Marker>
        <Marker coordinate={dest} anchor={{ x: 0.5, y: 1 }}>
          <View style={styles.destPin}><View style={styles.destPinInner} /></View>
        </Marker>

        <Marker.Animated
          ref={markerRef}
          coordinate={animatedRegion as any}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
        >
          <TruckMapIcon />
        </Marker.Animated>
      </MapView>

      <SafeAreaView style={styles.topControls} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><BackIcon /></TouchableOpacity>
      </SafeAreaView>

      {/* Card */}
      <Animated.View style={[styles.card, { transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [350, 0] }) }] }]}>
        <View style={styles.driverRow}>
          <View style={styles.driverInfoRow}>
            <View style={styles.avatarRing}><Image source={{ uri: driverPhoto }} style={styles.avatarImg} /></View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driverName}</Text>
              {nearDestination ? (
                <Text style={[styles.driverRating, { color: '#4CAF50', fontWeight: 'bold' }]}>
                  Location Reached
                </Text>
              ) : (
                <Text style={styles.driverRating}>
                  {tripMetrics.distance ? `${tripMetrics.distance} • ${tripMetrics.duration}` : '4.9 based on 100 ratings'}
                </Text>
              )}
            </View>
          </View>
          <SOSButton
            onLongPress={() => setSOSVisible(true)}
          />
        </View>

        {/* Route Progress Bar */}
        {routeCoords.length > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${((completedRoute.length / routeCoords.length) * 100).toFixed(0)}%` } as any
                ]} 
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>Pickup</Text>
              <Text style={[styles.progressText, { textAlign: 'right' }]}>Drop-off</Text>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <CircleIcon />
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Pickup from</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{sourceAddress}</Text>
          </View>
        </View>

        <View style={styles.dotConnector} />

        <View style={styles.infoRow}>
          <PinIcon />
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Deliver to</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{destAddress}</Text>
          </View>
          <TouchableOpacity style={styles.callBtn} onPress={() => { if (driverPhone) Linking.openURL(`tel:${driverPhone}`); }}><PhoneIcon /></TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.arriveBtn}
          onPress={() => navigation.navigate('VerifyDeliveryOtp', { trip: { ...trip, ...data } })}
        >
          <Text style={styles.arriveBtnText}>
            {nearDestination ? 'I Have Arrived' : 'End Trip'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* SOS Emergency Bottom Sheet */}
      <SOSBottomSheet
        isVisible={sosVisible}
        onClose={() => setSOSVisible(false)}
        isLoading={sosLoading}
        onSubmit={async (type) => {
          setSOSLoading(true);
          try {
            await sendSOS({
              tripId: tripId || '',
              type,
              lat: currentLat ? String(currentLat) : undefined,
              long: currentLng ? String(currentLng) : undefined,
            });
          } catch (err) {
            console.error('Failed to send SOS:', err);
          } finally {
            setSOSLoading(false);
          }
        }}
        onSuccessDone={() => {
          navigation.navigate('Home');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  topControls: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: scale(16), paddingTop: verticalScale(8) },
  backBtn: { width: scale(42), height: scale(42), borderRadius: scale(21), backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  pickupDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'white', borderWidth: 2, borderColor: '#2196F3' },
  destPin: { width: scale(22), height: scale(22), borderRadius: scale(11), backgroundColor: '#CA2027', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white', elevation: 4 },
  destPinInner: { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: 'white' },
  avatarFloat: { position: 'absolute', bottom: verticalScale(280), alignSelf: 'center', zIndex: 20 },
  avatarRing: { width: scale(60), height: scale(60), borderRadius: scale(40), borderWidth: 3, borderColor: '#CA2027', overflow: 'hidden', elevation: 8, backgroundColor: 'white' },
  avatarImg: { width: '100%', height: '100%' },
  card: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: scale(28), borderTopRightRadius: scale(28), paddingHorizontal: scale(24), paddingTop: verticalScale(30), paddingBottom: verticalScale(30), minHeight: verticalScale(240), elevation: 16 },
  driverRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: verticalScale(14),
    gap: scale(10)
  },
  driverInfo: { flex: 1, marginRight: scale(4) },
  driverName: { fontSize: moderateScale(20), fontWeight: '800', color: '#1A1A2E' },
  driverRating: { fontSize: moderateScale(11), color: '#999', marginTop: 1 },
  callBtn: { 
    width: scale(44), 
    height: scale(44), 
    borderRadius: scale(22), 
    backgroundColor: '#CA2027', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 4 
  },
  arriveBtn: { backgroundColor: '#CA2027', height: verticalScale(54), borderRadius: scale(15), justifyContent: 'center', alignItems: 'center', marginTop: verticalScale(20), elevation: 8 },
  arriveBtnText: { color: 'white', fontSize: moderateScale(16), fontWeight: '800', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: verticalScale(16) },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: scale(12) },
  infoText: { flex: 1, marginLeft: scale(8) },
  infoLabel: { fontSize: moderateScale(11), color: '#999' },
  infoValue: { fontSize: moderateScale(15), fontWeight: '700', color: '#1A1A2E', marginTop: 2 },
  dotConnector: { 
    width: 2, 
    height: verticalScale(20), 
    backgroundColor: '#4CAF50', 
    marginLeft: scale(8), 
    marginVertical: verticalScale(-2),
    zIndex: -1 
  },
  driverInfoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: scale(12) },
  progressContainer: { marginBottom: verticalScale(16) },
  progressBarBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressText: { fontSize: moderateScale(10), color: '#999', fontWeight: '600', textTransform: 'uppercase' },
  etaRouteBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaRouteText: {
    fontSize: moderateScale(10),
    fontWeight: 'bold',
    color: '#1A202C',
  },
  etaAlternateBadge: {
    backgroundColor: '#4A5568',
    borderColor: '#4A5568',
  },
  etaAlternateText: {
    color: '#FFFFFF',
  },
});

export default LiveTrackingScreen;
