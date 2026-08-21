import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
  BackHandler,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { COLORS } from '../../../helpers/values/colors';
import { BackArrowIcon, PhoneIcon } from '../../../assets/svgIcons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useDriverInfo } from '../../../hooks/useAuth';
import { resolveImageUrl } from '../../../helpers/urlHelper';
import { RootStackParamList } from '../../../navigation/types';
import { useTripBreif, useTripDetails } from '../../../hooks/useTripDetails';
import { setTripId } from '../../../redux/slices/tripSlice';
import Config from 'react-native-config';
import { useMutation } from '@tanstack/react-query';
import { sendTripOtp } from '../../../services/tripApi';
import { LocationService } from '../../../services/LocationService';
import TripCard from '../../../components/TripCard';


/** Converts ISO timestamp → 'Apr 20, 2026 · 10:04 AM' */
const formatDate = (iso?: string | null): string => {
  if (!iso) return 'N/A';
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} · ${time}`;
  } catch {
    return iso;
  }
};

const TripDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);
  const { data: driverResponse } = useDriverInfo(driverId || '', userToken || '', !!driverId && !!userToken);
  const driver = driverResponse?.data;
  const route = useRoute<RouteProp<RootStackParamList, 'TripDetails'>>();
  const { tripId, loadNumber, tripData } = route.params || {};
  const mapRef = React.useRef<MapView>(null);
  const [routeMetrics, setRouteMetrics] = useState<{ distance: string; duration: string } | null>(null);
  // Road-following coords from Directions API; falls back to straight line
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  // Fetch live trip details
  const { data: apiData } = useTripDetails(tripId);
  const { data: apiBriefData } = useTripBreif(tripId);
  console.log(apiData)

  // OMG! TanStack Query mutation to send our super cool OTP! 🚀🔥
  // We want our driver to start the trip with style and ease! 😎
  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      console.log('🛸 Sending OTP for starting the trip, trip ID is:', tripId);
      let latitude: number | undefined;
      let longitude: number | undefined;
      try {
        const position = await LocationService.getCurrentLocation();
        if (position?.coords) {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }
      } catch (err: any) {
        console.warn('[TripDetailsScreen] Could not retrieve GPS location for OTP:', err.message);
      }
      return sendTripOtp({
        tripId: tripId || '',
        codeType: 'pickup',
        latitude,
        longitude,
      });
    },
    onSuccess: (data) => {
      console.log('🎉 WHOOO! OTP sent successfully on Start Trip click!', data);
    },
    onError: (err) => {
      console.error('🙀 Oh no! Failed to send OTP on start trip click:', err.message);
    },
  });


  // Console log the result
  useEffect(() => {
    if (tripId) {
      console.log('✅ [TripDetails] Storing tripId in Redux:', tripId);
      dispatch(setTripId(tripId));
    }
  }, [apiData, apiBriefData]);

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Home');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  const data = { ...apiData, ...apiBriefData }

  const isDeliveryVerified =
    data?.delivery_code_verified === true ||
    data?.delivery_code_verified === 1 ||
    data?.delivery_code_verified === 'true' ||
    (tripData && (tripData.delivery_code_verified === true || (tripData.delivery_code_verified as any) === 1 || (tripData.delivery_code_verified as any) === 'true'));




  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>#{data.load_number}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Info Card */}
        <TripCard trip={data as any} />

        {/* Truck Info Section (Red Box) */}
        <View style={styles.truckInfoBox}>
          <Text style={styles.boxTitle}>Trip Info</Text>
          <TableInfoRow label="Vehicle Number" value={data?.vehicle_number || 'N/A'} />
          <TableInfoRow label="Owner Name" value={data?.owner_name || 'Fleetronix'} />
          <TableInfoRow label="Registering authority" value={data?.registration_state_name || 'N/A'} />
          <TableInfoRow label="Fuel Type" value={data?.fuel_type || 'N/A'} />
          <TableInfoRow label="Emission Norms" value={data?.emission_norm || 'N/A'} />
          <TableInfoRow label="Vehicle Age" value={data?.vehicle_age || 'N/A'} />
          <TableInfoRow label="Status" value={data?.status || 'N/A'} />
        </View>

        {/* Map Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Map</Text>
        </View>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: ((parseFloat(data?.source_latitude) || 25.7919) + (parseFloat(data?.destination_latitude) || 23.4559)) / 2,
              longitude: ((parseFloat(data?.source_longitude) || 73.1721) + (parseFloat(data?.destination_longitude) || 85.2557)) / 2,
              latitudeDelta: Math.abs((parseFloat(data?.source_latitude) || 25.7919) - (parseFloat(data?.destination_latitude) || 23.4559)) * 1.5 + 0.5,
              longitudeDelta: Math.abs((parseFloat(data?.source_longitude) || 73.1721) - (parseFloat(data?.destination_longitude) || 85.2557)) * 1.5 + 0.5,
            }}
            scrollEnabled={false}
          >
            {/* Road-following route via Directions API (best effort) */}
            {data?.source_latitude && data?.destination_latitude && (
              <MapViewDirections
                origin={{
                  latitude: parseFloat(data.source_latitude),
                  longitude: parseFloat(data.source_longitude),
                }}
                destination={{
                  latitude: parseFloat(data.destination_latitude),
                  longitude: parseFloat(data.destination_longitude),
                }}
                apikey={Config.GOOGLE_MAPS_API_KEY ?? ''}
                strokeWidth={0}       /* hidden — Polyline below handles drawing */
                strokeColor="transparent"
                lineDashPattern={[]}
                onReady={(result) => {
                  setRouteCoords(result.coordinates);
                  setRouteMetrics({
                    distance: `${result.distance.toFixed(1)} km`,
                    duration: `${Math.ceil(result.duration)} mins`,
                  });
                  mapRef.current?.fitToCoordinates(result.coordinates, {
                    edgePadding: { top: 30, right: 30, bottom: 30, left: 30 },
                    animated: false,
                  });
                }}
                onError={(err) => console.warn('[TripDetails] Directions API error:', err)}
              />
            )}

            {/* Always-visible connector — road route when available, straight line as fallback */}
            {data?.source_latitude && data?.destination_latitude && (
              <>
                {/* Glow Underlay */}
                <Polyline
                  coordinates={
                    routeCoords.length >= 2
                      ? routeCoords
                      : [
                        { latitude: parseFloat(data.source_latitude), longitude: parseFloat(data.source_longitude) },
                        { latitude: parseFloat(data.destination_latitude), longitude: parseFloat(data.destination_longitude) },
                      ]
                  }
                  strokeColor="rgba(33, 150, 243, 0.25)"
                  strokeWidth={10}
                  lineCap="round"
                  lineJoin="round"
                />
                {/* Core route */}
                <Polyline
                  coordinates={
                    routeCoords.length >= 2
                      ? routeCoords
                      : [
                        { latitude: parseFloat(data.source_latitude), longitude: parseFloat(data.source_longitude) },
                        { latitude: parseFloat(data.destination_latitude), longitude: parseFloat(data.destination_longitude) },
                      ]
                  }
                  strokeColor="#2196F3"
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                />
              </>
            )}

            {/* Dynamic ETA Badges on the road route */}
            {routeCoords.length >= 2 && (
              <>
                {/* Primary ETA Badge (Middle) */}
                {routeCoords[Math.floor(routeCoords.length / 2)] && (
                  <Marker
                    coordinate={routeCoords[Math.floor(routeCoords.length / 2)]}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View style={styles.etaRouteBadge}>
                      <Text style={styles.etaRouteText}>
                        {routeMetrics?.duration ? `${routeMetrics.duration} • Fastest` : 'Fastest'}
                      </Text>
                    </View>
                  </Marker>
                )}

                {/* Alternate ETA Badge 1 (1/3 of route) */}
                {routeCoords[Math.floor(routeCoords.length / 3)] && (
                  <Marker
                    coordinate={routeCoords[Math.floor(routeCoords.length / 3)]}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View style={[styles.etaRouteBadge, styles.etaAlternateBadge]}>
                      <Text style={[styles.etaRouteText, styles.etaAlternateText]}>+3 min</Text>
                    </View>
                  </Marker>
                )}

                {/* Alternate ETA Badge 2 (2/3 of route) */}
                {routeCoords[Math.floor((routeCoords.length * 2) / 3)] && (
                  <Marker
                    coordinate={routeCoords[Math.floor((routeCoords.length * 2) / 3)]}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View style={[styles.etaRouteBadge, styles.etaAlternateBadge]}>
                      <Text style={[styles.etaRouteText, styles.etaAlternateText]}>+5 min</Text>
                    </View>
                  </Marker>
                )}
              </>
            )}

            {/* ── Pickup marker (green) ── */}
            {data?.source_latitude && (
              <Marker
                coordinate={{
                  latitude: parseFloat(data.source_latitude),
                  longitude: parseFloat(data.source_longitude),
                }}
                title="Pickup"
                description={data?.source_address || data?.source_city}
                anchor={{ x: 0.5, y: 1 }}
              >
                <View style={styles.pickupPin}>
                  <View style={styles.pickupPinInner} />
                </View>
              </Marker>
            )}

            {/* ── Destination marker (red) ── */}
            {data?.destination_latitude && (
              <Marker
                coordinate={{
                  latitude: parseFloat(data.destination_latitude),
                  longitude: parseFloat(data.destination_longitude),
                }}
                title="Destination"
                description={data?.destination_address || data?.destination_city}
                anchor={{ x: 0.5, y: 1 }}
              >
                <View style={styles.destPin}>
                  <View style={styles.destPinInner} />
                </View>
              </Marker>
            )}
          </MapView>

          {/* ── Distance / ETA badge ── */}
          {routeMetrics && (
            <View style={styles.routeBadge}>
              <View style={styles.routeBadgeItem}>
                <Text style={styles.routeBadgeIcon}>📍</Text>
                <Text style={styles.routeBadgeValue}>{routeMetrics.distance}</Text>
                <Text style={styles.routeBadgeLabel}>Distance</Text>
              </View>
              <View style={styles.routeBadgeDivider} />
              <View style={styles.routeBadgeItem}>
                <Text style={styles.routeBadgeIcon}>⏱</Text>
                <Text style={styles.routeBadgeValue}>{routeMetrics.duration}</Text>
                <Text style={styles.routeBadgeLabel}>Est. Time</Text>
              </View>
            </View>
          )}
        </View>

        {/* Route Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Route</Text>
        </View>
        <View style={styles.routeCard}>
          <RoutePoint
            title={`${data?.trip_direction?.starting_point || ''}`}
            time="Pick Up Point"
            type="start"
          />
          <View style={styles.routeConnector} />
          <RoutePoint
            title={`${data?.trip_direction?.ending_point || ''}`}
            time="Drop Off Point"
            type="end"
            extra="Final Destination"
          />
        </View>






        {/* Start Button */}
        {data?.status !== 'completed' && (
          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (isDeliveryVerified && data?.status !== 'completed') {
                console.log('🏁 Delivery is verified! Navigating directly to ConfirmDelivery.');
                navigation.navigate('ConfirmDelivery', { trip: { ...tripData, ...data } });
                return;
              }

              const isPickupVerified =
                data?.pickup_code_verified === true ||
                data?.pickup_code_verified === 1 ||
                data?.pickup_code_verified === 'true' ||
                data?.status === 'ongoing' ||
                data?.status === 'started' ||
                data?.status === 'in_progress';

              if (isPickupVerified) {
                console.log('🚚 Pickup is verified! Navigating directly to LiveTracking.');
                navigation.navigate('LiveTracking', { trip: { ...tripData, ...data } });
                return;
              }

              // Only trigger OTP send if the trip has NOT started yet!
              console.log('🚀 Whoosh! Sending OTP now!');
              sendOtpMutation.mutate();
              navigation.navigate('StartTrip', { trip: data });
            }}
          >
            <Text style={styles.startBtnText}>
              {(data?.pickup_code_verified === true ||
                data?.pickup_code_verified === 1 ||
                data?.pickup_code_verified === 'true' ||
                data?.status === 'ongoing' ||
                data?.status === 'started' ||
                data?.status === 'in_progress' ||
                isDeliveryVerified)
                ? 'Continue'
                : 'Start Trip'}
            </Text>
          </TouchableOpacity>
        )}


      </ScrollView>
    </SafeAreaView>
  );
};


function MetricRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function TableInfoRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{label}</Text>
      <Text style={styles.tableValue}>{value}</Text>
    </View>
  );
}

function RoutePoint({ title, time, type, extra }: { title: string, time: string, type: string, extra?: string }) {
  return (
    <View style={styles.routePoint}>
      <View style={styles.pointDotContainer}>
        <View style={[
          styles.pointDot,
          type === 'start' ? styles.startDot : type === 'end' ? styles.endDot : styles.midDot
        ]} />
      </View>
      <View style={styles.pointContent}>
        <Text style={styles.pointTitle}>{title}</Text>
        <Text style={styles.pointTime}>{time}</Text>
        {extra && <Text style={styles.pointExtra}>{extra}</Text>}
      </View>
    </View>
  );
}

function BasisHeader({ title }: { title: string }) {
  return <Text style={styles.basisHeader}>{title}</Text>;
}

function BasisRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.basisBox}>
      <Text style={styles.basisLabel}>{label}</Text>
      <Text style={styles.basisValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    marginRight: scale(15),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#000',
  },
  scrollContent: {
    paddingBottom: verticalScale(50),
  },
  topCard: {
    margin: scale(20),
    padding: scale(25),
    borderRadius: scale(35),
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  loadIdLabel: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#000',
    marginBottom: verticalScale(20),
  },
  cardMain: {
    flexDirection: 'row',
  },
  leftColumn: {
    alignItems: 'center',
    width: scale(90),
  },
  profileWrapper: {
    position: 'relative',
    marginBottom: verticalScale(10),
  },
  profilePic: {
    width: scale(75),
    height: scale(75),
    borderRadius: scale(37.5),
    backgroundColor: '#F5F5F5',
  },
  verifiedBadge: {
    position: 'absolute',
    left: -2,
    top: 6,
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: '#4CD964',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  checkIcon: {
    color: 'white',
    fontSize: moderateScale(9),
    fontWeight: 'bold',
  },
  driverNameLarge: {
    fontSize: moderateScale(28),
    fontWeight: '800',
    color: '#000',
  },
  ratingText: {
    fontSize: moderateScale(12),
    color: '#F5A623',
    fontWeight: '700',
    marginTop: verticalScale(2),
  },
  tripsText: {
    fontSize: moderateScale(11),
    color: '#858080',
    marginTop: verticalScale(1),
  },
  rightColumn: {
    flex: 1,
    marginLeft: scale(15),
    paddingTop: verticalScale(5),
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },
  metricLabel: {
    fontSize: moderateScale(11),
    color: '#858080',
    width: '45%',
  },
  metricValue: {
    fontSize: moderateScale(11),
    color: '#000',
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: verticalScale(20),
    width: '100%',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(5),
  },
  contactActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  contactActionText: {
    color: '#CA2027',
    fontWeight: '700',
    fontSize: moderateScale(17),
  },
  declineText: {
    color: '#FF4D4D',
    fontWeight: '600',
    fontSize: moderateScale(17),
  },
  truckInfoBox: {
    backgroundColor: '#CC2B2B',
    marginHorizontal: scale(20),
    borderRadius: scale(15),
    padding: scale(20),
  },
  boxTitle: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(15),
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  tableLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: moderateScale(12),
  },
  tableValue: {
    color: 'white',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: scale(25),
    marginTop: verticalScale(25),
    marginBottom: verticalScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#000',
  },
  mapContainer: {
    height: verticalScale(250),
    marginHorizontal: scale(20),
    borderRadius: scale(15),
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  // ── Custom map markers ──
  pickupPin: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  pickupPinInner: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: 'white',
  },
  destPin: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: '#CA2027',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  destPinInner: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: 'white',
  },
  // ── Route info badge ──
  routeBadge: {
    position: 'absolute',
    bottom: scale(10),
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: scale(20),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    gap: scale(12),
    alignItems: 'center',
  },
  routeBadgeItem: {
    alignItems: 'center',
    gap: 2,
  },
  routeBadgeIcon: {
    fontSize: moderateScale(14),
  },
  routeBadgeValue: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#1A1A2E',
  },
  routeBadgeLabel: {
    fontSize: moderateScale(9),
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeBadgeDivider: {
    width: 1,
    height: verticalScale(28),
    backgroundColor: '#F0F0F0',
  },
  routeCard: {
    marginHorizontal: scale(20),
    padding: scale(20),
    borderRadius: scale(15),
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  routePoint: {
    flexDirection: 'row',
  },
  pointDotContainer: {
    width: 20,
    alignItems: 'center',
  },
  pointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  startDot: { backgroundColor: '#888' },
  midDot: { backgroundColor: 'white', borderWidth: 2, borderColor: '#888' },
  endDot: { backgroundColor: '#CA2027' },
  routeConnector: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginLeft: 9,
    marginVertical: 2,
  },
  pointContent: {
    marginLeft: 15,
    flex: 1,
  },
  pointTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#000',
  },
  pointTime: {
    fontSize: moderateScale(11),
    color: '#888',
    marginTop: 2,
  },
  pointExtra: {
    fontSize: moderateScale(10),
    color: '#CA2027',
    marginTop: 2,
  },
  basisCard: {
    marginHorizontal: scale(20),
    padding: scale(20),
    borderRadius: scale(15),
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  basisBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  basisLabel: {
    fontSize: moderateScale(12),
    color: '#888',
  },
  basisValue: {
    fontSize: moderateScale(12),
    color: '#000',
    fontWeight: '600',
  },
  basisHeader: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#000',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(5),
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    marginHorizontal: scale(40),
    marginTop: verticalScale(40),
    height: verticalScale(55),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: verticalScale(15),
    fontSize: moderateScale(16),
    color: '#858080',
  },
  errorText: {
    fontSize: moderateScale(16),
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: scale(30),
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
  },
  retryText: {
    color: 'white',
    fontWeight: '700',
  },
  // center: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   backgroundColor: 'white',
  //   padding: scale(20),
  // },
  // loadingText: {
  //   marginTop: verticalScale(15),
  //   fontSize: moderateScale(16),
  //   color: '#666',
  // },
  // errorText: {
  //   fontSize: moderateScale(16),
  //   color: COLORS.primary,
  //   textAlign: 'center',
  //   marginBottom: verticalScale(20),
  // },
  // retryButton: {
  //   paddingHorizontal: scale(30),
  //   paddingVertical: verticalScale(12),
  //   backgroundColor: COLORS.primary,
  //   borderRadius: scale(10),
  // },
  // retryText: {
  //   color: 'white',
  //   fontSize: moderateScale(16),
  //   fontWeight: '600',
  // },
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


export default TripDetailsScreen;
