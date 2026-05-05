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
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Config from 'react-native-config';
import { useSelector, useDispatch } from 'react-redux';
import { notificationService } from '../../../services/NotificationService';

import { RootState } from '../../../redux/store';
import { setLiveLocation } from '../../../redux/slices/tripSlice';
import { scale, verticalScale, moderateScale, SCREEN } from '../../../helpers/dimension';
import { RootStackParamList } from '../../../navigation/types';
import Svg, { Path, Circle } from 'react-native-svg';

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

// MOCK MODE - disabled real tracking on this screen only
const MOCK_MODE = true; 
// TODO: Re-enable real live tracking later

const LiveTrackingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<RootStackParamList, 'LiveTracking'>>();
  const dispatch  = useDispatch();
  const mapRef    = useRef<MapView>(null);
  const tripRedux = useSelector((state: RootState) => state.trip);
  const tripId    = (route.params as any)?.tripId ?? tripRedux.tripId;

  // Revert to manual state/effects as per user's earlier monolithic design
  const lastLoc = tripRedux.liveLocation;
  const animatedRegion = useRef(
    new AnimatedRegion({
      latitude:       lastLoc?.latitude  ?? tripRedux.sourceLatitude  ?? 30.3165,
      longitude:      lastLoc?.longitude ?? tripRedux.sourceLongitude ?? 78.0322,
      latitudeDelta:  0.03,
      longitudeDelta: 0.03,
    }),
  ).current;

  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simIdxRef     = useRef(0);

  const liveCoord = tripRedux.liveLocation;
  const [nearDestination, setNearDestination] = useState(false);

  const [routeCoords,    setRouteCoords]    = useState<LatLng[]>([]);
  const [completedRoute, setCompletedRoute] = useState<LatLng[]>([]);
  const [remainingRoute, setRemainingRoute] = useState<LatLng[]>([]);
  const [tripMetrics, setTripMetrics] = useState({ distance: '', duration: '' });

  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 11 }).start();
  }, []);

  // MOCK MODE TIMER
  useEffect(() => {
    if (MOCK_MODE) {
      const timer = setTimeout(() => {
        setNearDestination(true);
        // Trigger navigation automatically after 10 seconds
        navigation.navigate('Delivery', { trip: tripRedux.tripData });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [navigation, tripRedux.tripData]);

  const pickup = {
    latitude:  tripRedux.sourceLatitude       ?? 30.3165,
    longitude: tripRedux.sourceLongitude      ?? 78.0322,
  };
  const dest = {
    latitude:  tripRedux.destinationLatitude  ?? 30.3630,
    longitude: tripRedux.destinationLongitude ?? 78.1460,
  };

  const driverName  = tripRedux.driverName ?? (tripRedux.tripData as any)?.driver_name ?? 'Driver';
  const driverPhoto = tripRedux.driverPhoto ?? (tripRedux.tripData as any)?.driver_photo_url
    ?? 'https://randomuser.me/api/portraits/men/32.jpg';
  const driverPhone = tripRedux.driverMobile ?? (tripRedux.tripData as any)?.driver_mobile;
  const destAddress = (tripRedux.tripData as any)?.destination_address || 'Destination';
  const sourceAddress = (tripRedux.tripData as any)?.source_address || 'Logistics Hub';
  const deliveryTime = (tripRedux.tripData as any)?.estimated_delivery_time || '~3-4 days';

  const moveTruckTo = useCallback((coord: LatLng) => {
    animatedRegion.timing({
      latitude: coord.latitude,
      longitude: coord.longitude,
      duration: 1500,
      useNativeDriver: false,
      toValue: 0
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
    if (MOCK_MODE) return; // MOCK MODE - disabled real tracking on this screen only
    if (!liveCoord) return;
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    moveTruckTo(liveCoord);
  }, [liveCoord?.latitude, liveCoord?.longitude]);

  useEffect(() => {
    if (MOCK_MODE) return; // MOCK MODE - disabled real tracking on this screen only
    if (routeCoords.length < 2 || liveCoord) return;

    if (simulationRef.current) clearInterval(simulationRef.current);

    simulationRef.current = setInterval(() => {
      simIdxRef.current += 1;
      if (simIdxRef.current >= routeCoords.length) simIdxRef.current = 0;
      moveTruckTo(routeCoords[simIdxRef.current]);
    }, 2500);

    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, [routeCoords, liveCoord]);

  useEffect(() => {
    notificationService.initialize();
    notificationService.setupGeofencing([
      { id: 'pickup',      latitude: pickup.latitude, longitude: pickup.longitude, radius: 500 },
      { id: 'destination', latitude: dest.latitude,   longitude: dest.longitude,   radius: 500 }
    ]);
    return () => notificationService.stop();
  }, [pickup.latitude, pickup.longitude, dest.latitude, dest.longitude]);

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
        {!MOCK_MODE && (
          <MapViewDirections
            origin={pickup}
            destination={dest}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={0}
            strokeColor="transparent"
            onReady={(result) => {
              setRouteCoords(result.coordinates);
              setTripMetrics({
                distance: `${result.distance.toFixed(1)} km`,
                duration: `${Math.ceil(result.duration)} mins`
              });
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 100, right: 40, bottom: 320, left: 40 },
                animated: true,
              });
            }}
          />
        )}

        {completedRoute.length > 1 && <Polyline coordinates={completedRoute} strokeColor="#4CAF50" strokeWidth={5} />}
        {remainingRoute.length > 1 && <Polyline coordinates={remainingRoute} strokeColor="#2196F3" strokeWidth={5} />}

        <Marker coordinate={pickup} anchor={{ x: 0.5, y: 0.5 }}><View style={styles.pickupDot} /></Marker>
        <Marker coordinate={dest} anchor={{ x: 0.5, y: 1 }}>
          <View style={styles.destPin}><View style={styles.destPinInner} /></View>
        </Marker>

        <Marker.Animated coordinate={animatedRegion as any} anchor={{ x: 0.5, y: 0.5 }} flat>
          <TruckMapIcon />
        </Marker.Animated>
      </MapView>

      <SafeAreaView style={styles.topControls} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><BackIcon /></TouchableOpacity>
      </SafeAreaView>

    

      <Animated.View style={[styles.card, { transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [350, 0] }) }] }]}>
        <View style={styles.driverRow}>
          <View style={styles.driverInfoRow}>
            <View style={styles.avatarRing}><Image source={{ uri: driverPhoto }} style={styles.avatarImg} /></View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driverName}</Text>
              {MOCK_MODE && nearDestination ? (
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
          <TouchableOpacity style={styles.callBtn} onPress={() => { if (driverPhone) Linking.openURL(`tel:${driverPhone}`); }}><PhoneIcon /></TouchableOpacity>
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
        </View>

        {nearDestination && (
          <TouchableOpacity style={styles.arriveBtn} onPress={() => navigation.navigate('Delivery', { trip: tripRedux.tripData })}>
            <Text style={styles.arriveBtnText}>I Have Arrived</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
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
});

export default LiveTrackingScreen;
