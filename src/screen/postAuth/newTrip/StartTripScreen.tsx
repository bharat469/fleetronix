import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Animated, TextInput,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { BackArrowIcon } from '../../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import BottomSheetComponent from '../../../components/bottomsheet';
import ErrorBottomSheet from '../../../components/ErrorBottomSheet';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { setActiveTripData, setOtpError, setTripId } from '../../../redux/slices/tripSlice';
import { useStartTrip } from '../../../hooks/useStartTrip';
import { Trip } from '../../../types/trip';
import Config from 'react-native-config';
import Geolocation from 'react-native-geolocation-service';
import { getDistance } from 'geolib';
import { COLORS } from '../../../helpers/values/colors';

const GOOGLE_API_KEY = Config.GOOGLE_MAPS_API_KEY ?? '';

// ─── OTP Input ────────────────────────────────────────────────────────────────
const OTPInputLocal = ({ length, onChangeOTP, disabled }: any) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef<any[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    onChangeOTP(newOtp.join(''));
    if (text.length !== 0 && index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) inputs.current[index - 1]?.focus();
  };

  return (
    <View style={styles.otpContainer}>
      {otp.map((val, i) => (
        <View key={i} style={[styles.otpBox, val ? styles.otpBoxFilled : null]}>
          <TextInput
            ref={(ref) => { inputs.current[i] = ref; }}
            style={styles.otpText}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            value={val}
            textAlign="center"
            editable={!disabled}
          />
        </View>
      ))}
    </View>
  );
};

// ─── Pill Badge ───────────────────────────────────────────────────────────────
const Pill = ({ label, value, color, bg }: any) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

const StartTripScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'StartTrip'>>();
  const tripRedux = useSelector((state: RootState) => state.trip);
  const { trip } = route.params;
  const tripId = tripRedux?.tripId || trip?.trip_id || trip?.id;
  const dispatch = useDispatch();

  useEffect(() => {
    if (tripId && !tripRedux.tripId) {
      dispatch(setTripId(tripId));
    }
  }, [tripId, tripRedux.tripId, dispatch]);

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

  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);


  const {
    verifyOtpMutation,
    startTripMutation,
    isLoading,
    loadingPhase,
    isOtpError,
    otpErrorMessage,
    resetOtpError
  } = useStartTrip();

  const [currentOtp, setCurrentOtp] = useState('');
  const cardAnim = useRef(new Animated.Value(0)).current;

  // Tracking state for proximity check
  const [driverLoc, setDriverLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchId = useRef<number | null>(null);
  const NEAR_DISTANCE = 200;

  const srcLat = (tripRedux.sourceLatitude ?? parseFloat(trip?.source_latitude as any)) || 28.6139;
  const srcLng = (tripRedux.sourceLongitude ?? parseFloat(trip?.source_longitude as any)) || 77.2090;
  const dstLat = (tripRedux.destinationLatitude ?? parseFloat(trip?.destination_latitude as any)) || 28.540;
  const dstLng = (tripRedux.destinationLongitude ?? parseFloat(trip?.destination_longitude as any)) || 77.190;

  const distanceInMeters = getDistance(
    { latitude: srcLat, longitude: srcLng },
    { latitude: dstLat, longitude: dstLng }
  );
  const calculatedDistance = (distanceInMeters / 1000).toFixed(1) + ' km';



  // Initial navigation check
  useEffect(() => {
    const tripId = trip?.trip_id || trip?.id || tripRedux.tripId || '';
    if (trip?.pickup_code_verified) {
      navigation.replace('LiveTracking', { trip });
    } else if (trip?.status === 'started') {
      navigation.replace('LiveTracking', { trip });
    }
  }, []);

  // Proximity Watcher
  useEffect(() => {
    if (!isWatching) return;

    watchId.current = Geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDriverLoc({ latitude, longitude });

        const distance = getDistance({ latitude, longitude }, { latitude: srcLat, longitude: srcLng });
        if (distance <= NEAR_DISTANCE) {
          // Transition to LiveTracking once near and trip is "active"
          navigation.replace('LiveTracking', { trip });
        }
      },
      (err) => console.warn(err),
      { accuracy: { android: 'high', ios: 'best' }, distanceFilter: 10 }
    );

    return () => { if (watchId.current !== null) Geolocation.clearWatch(watchId.current); };
  }, [isWatching, srcLat, srcLng]);

  useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 10 }).start();
  }, []);

  const handleConfirm = useCallback(() => {
    if (currentOtp.length === 4) {
      verifyOtpMutation.mutate({ tripId: trip?.trip_id ?? trip?.id ?? '', otp: currentOtp });
    }
  }, [currentOtp, trip]);

  const handleStartTrip = useCallback(async () => {
    setIsWatching(true);
    const tripId = trip?.trip_id ?? trip?.id ?? '';
    Geolocation.getCurrentPosition(
      (p) => {
        const coords = { latitude: p.coords.latitude, longitude: p.coords.longitude };
        setDriverLoc(coords);
        startTripMutation.mutate({ tripId, coords, trip });
      },
      () => startTripMutation.mutate({ tripId, coords: { latitude: 0, longitude: 0 }, trip }),
      { accuracy: { android: 'high', ios: 'best' } }
    );
  }, [trip]);

  const isPreVerified = 
    trip?.pickup_code_verified === true ||
    trip?.pickup_code_verified === 1 ||
    trip?.pickup_code_verified === 'true' ||
    trip?.status === 'ongoing' ||
    tripRedux?.lifecycle === 'started' ||
    tripRedux?.lifecycle === 'in_transit';

  const isOtpVerified = isPreVerified || tripRedux?.otpVerified === true || tripRedux?.lifecycle === 'otp_verified';
  if (!tripId || !trip) {
    if (!tripId) console.warn('[StartTripScreen] No active tripId in Redux');
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: (srcLat + dstLat) / 2,
          longitude: (srcLng + dstLng) / 2,
          latitudeDelta: Math.abs(srcLat - dstLat) * 2 + 0.1,
          longitudeDelta: Math.abs(srcLng - dstLng) * 2 + 0.1,
        }}
      >
        <MapViewDirections
          origin={{ latitude: srcLat, longitude: srcLng }}
          destination={{ latitude: dstLat, longitude: dstLng }}
          apikey={GOOGLE_API_KEY}
          strokeWidth={4}
          strokeColor="#CA2027"
        />
        <Marker coordinate={{ latitude: srcLat, longitude: srcLng }} title="Pickup" pinColor="green" />
        <Marker coordinate={{ latitude: dstLat, longitude: dstLng }} title="Destination" pinColor="red" />
        {driverLoc && <Marker coordinate={driverLoc} title="You" />}
      </MapView>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
        <BackArrowIcon />
      </TouchableOpacity>

      <Animated.View style={[styles.bottomCard, { transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }]}>
        <View style={styles.handleBar} />
        <View style={styles.loadIdSection}>
          <Text style={styles.loadIdText}>LOAD ID: {trip?.load_id || 'N/A'}</Text>
          <Text style={styles.driverNameBig}>{trip?.customer_name || 'Pickup'}</Text>
        </View>

        <View style={styles.statsGrid}>
          <Pill label="Total Distance" value={calculatedDistance} color="#CA2027" bg="#FFF5F5" />
          <Pill label="Weight" value={trip?.item_weight?.total_weight || trip?.weight || '12 Tons'} color="#4CAF50" bg="#E8F5E9" />
          <Pill label="Price" value={`₹${trip?.total_trip_cost || '5000'}`} color="#2196F3" bg="#E3F2FD" />
          <Pill label="Vehicle" value={trip?.truck_type || 'Open Truck'} color="#9C27B0" bg="#F3E5F5" />
        </View>

        {isOtpVerified ? (
          <View style={styles.startTripWrapper}>
            <Text style={styles.otpSuccessText}>OTP Verified successfully!</Text>
            <Text style={styles.proximityHint}>
              {isWatching ? 'Tracking location... Heading to pickup.' : 'Click to start your journey.'}
            </Text>
            <TouchableOpacity
              style={[styles.confirmBtn, isWatching && { backgroundColor: '#888' }]}
              disabled={isWatching || isLoading}
              onPress={handleStartTrip}
            >
              {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.confirmBtnText}>{isWatching ? 'En Route...' : (isPreVerified ? 'Continue' : 'Start Trip')}</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.otpLabel}>Enter Pickup OTP</Text>
            <OTPInputLocal length={4} onChangeOTP={setCurrentOtp} disabled={isLoading} />
            <TouchableOpacity
              style={[styles.confirmBtn, currentOtp.length < 4 && styles.disabledConfirmBtn]}
              onPress={handleConfirm}
                disabled={currentOtp.length < 4 || isLoading}
              >
                {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.confirmBtnText}>Confirm</Text>}
              </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      <BottomSheetComponent isVisible={isOtpError} onBackdropPress={resetOtpError}>
        <ErrorBottomSheet 
          title="Invalid OTP"
          message={otpErrorMessage ?? 'The OTP you entered is incorrect. Please try again.'}
          onClose={resetOtpError} 
        />
      </BottomSheetComponent>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFill },
  backBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: 'white', padding: 10, borderRadius: 25, elevation: 5 },
  bottomCard: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 350, elevation: 20 },
  handleBar: { width: 40, height: 4, backgroundColor: '#EEE', alignSelf: 'center', marginBottom: 20 },
  loadIdSection: { alignItems: 'center', marginBottom: 20 },
  loadIdText: { fontSize: 12, color: '#999', fontWeight: '600' },
  driverNameBig: { fontSize: 24, fontWeight: '800', color: '#111' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statItem: { width: '48%', marginBottom: 12 },
  statLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  pill: { padding: 8, borderRadius: 20 },
  pillText: { fontSize: 11, fontWeight: '700' },
  otpLabel: { textAlign: 'center', color: '#666', marginBottom: 15 },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  otpBox: { width: 50, height: 50, backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#DDD', borderRadius: 10, justifyContent: 'center' },
  otpBoxFilled: { borderColor: '#CA2027', backgroundColor: '#FFF5F5' },
  otpText: { fontSize: 20, fontWeight: '700' },
  confirmBtn: { height: 55, backgroundColor: '#CA2027', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  disabledConfirmBtn: { backgroundColor: '#E0E0E0' },
  confirmBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  startTripWrapper: { alignItems: 'center' },
  otpSuccessText: { color: '#4CAF50', fontWeight: '700', fontSize: 16, marginBottom: 5 },
  proximityHint: { color: '#666', fontSize: 14, marginBottom: 20, textAlign: 'center' },
});

export default StartTripScreen;
