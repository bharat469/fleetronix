import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useDriverInfo } from '../../hooks/useAuth';
import { COLORS } from '../../helpers/values/colors';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import {
  BackArrowIcon,
  SearchIcon,
  EditPenIcon,
  ChevronRightIcon,
  LocationIcon,
} from '../../assets/svgIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

const PlusIcon = () => (
  <View style={{ width: 14, height: 14, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ position: 'absolute', width: 14, height: 2, backgroundColor: '#CA2027' }} />
    <View style={{ position: 'absolute', width: 2, height: 14, backgroundColor: '#CA2027' }} />
  </View>
);

const TargetIcon = () => (
  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#FF6B00', justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF6B00' }} />
  </View>
);

const AddAddressScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);
  const { data: driverData } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission needed', 'Please allow location permission to use this feature.');
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          setRegion({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        },
        (error) => {
          console.log('[Geolocation Error]', error.code, error.message);
          Alert.alert('Location Error', 'Could not get your location. Please check your GPS.');
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
      );
    } catch (err) {
      console.error('[getCurrentLocation] Error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
        </View>
        <TouchableOpacity>
          <SearchIcon />
        </TouchableOpacity>
      </View>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profilePicWrapper}>
          <Image
            source={{ uri: driver?.photo_path || 'https://randomuser.me/api/portraits/men/32.jpg' }}
            style={styles.profilePic}
          />
          <View style={styles.editPicBtn}>
            <EditPenIcon />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{driver?.full_name || driver?.first_name || 'Driver'}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: driver?.status === 'available' ? COLORS.greenColor.color1 : '#FF3B30' }]} />
            <Text style={styles.statusText}>{driver?.status ? driver.status.charAt(0).toUpperCase() + driver.status.slice(1) : 'Available'}</Text>
          </View>
          <View style={[styles.kycBadge, { backgroundColor: driver?.kyc_status === 'verified' ? '#E8F5E9' : COLORS.yellowColor.color1 }]}>
            <Text style={[styles.kycText, { color: driver?.kyc_status === 'verified' ? '#4CAF50' : COLORS.yellowColor.color2 }]}>
              {driver?.kyc_status ? `KYC ${driver.kyc_status.charAt(0).toUpperCase() + driver.kyc_status.slice(1)}` : 'KYC Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Add Addresses Button */}
      <TouchableOpacity
        style={styles.addAddressBtn}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('EnterAddress', {})}
      >
        <View style={styles.addAddressContent}>
          <PlusIcon />
          <Text style={styles.addAddressText}>Add Addresses</Text>
        </View>
        <ChevronRightIcon />
      </TouchableOpacity>

      {/* Real Map View */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          <Marker
            coordinate={{ latitude: region.latitude, longitude: region.longitude }}
          >
            <View style={styles.customMarker}>
              <LocationIcon color="#FF3B30" width={40} height={40} />
            </View>
          </Marker>
        </MapView>

        {/* Use Current Location Button */}
        <TouchableOpacity
          style={styles.currentLocationBtn}
          activeOpacity={0.9}
          onPress={() => getCurrentLocation()}
        >
          <TargetIcon />
          <Text style={styles.currentLocationText}>Use current location</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Address Card */}
      <View style={styles.bottomCard}>
        <Text style={styles.locationTitle}>Sankarpur</Text>
        <Text style={styles.locationSubtitle}>
          23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197
        </Text>
        <TouchableOpacity
          style={styles.submitBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('EnterAddress', {})}
        >
          <Text style={styles.submitBtnText}>Enter Complete Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: COLORS.textColor.color5,
  },
  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    marginVertical: verticalScale(10),
    alignItems: 'center',
  },
  profilePicWrapper: {
    position: 'relative',
  },
  profilePic: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: '#F5F5F5',
  },
  editPicBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  profileInfo: {
    marginLeft: scale(15),
  },
  userName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1E1A57',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(2),
  },
  statusDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: COLORS.greenColor.color1,
    marginRight: scale(6),
  },
  statusText: {
    fontSize: moderateScale(12),
    color: COLORS.textColor.color2.one,
  },
  kycBadge: {
    backgroundColor: COLORS.yellowColor.color1,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(2),
    borderRadius: scale(8),
    marginTop: verticalScale(4),
    alignSelf: 'flex-start',
  },
  kycText: {
    fontSize: moderateScale(10),
    color: COLORS.yellowColor.color2,
    fontWeight: '600',
  },
  addAddressBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    marginHorizontal: scale(20),
    marginTop: verticalScale(10),
  },
  addAddressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  addAddressText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#1E1A57',
  },
  mapContainer: {
    flex: 1,
    marginTop: verticalScale(20),
    position: 'relative',
  },
  map: {
    flex: 1
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPin: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
  },
  currentLocationBtn: {
    position: 'absolute',
    bottom: verticalScale(20),
    alignSelf: 'center',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(25),
    borderRadius: scale(30),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: scale(10),
  },
  currentLocationText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#1E0909',
  },
  bottomCard: {
    backgroundColor: 'rgba(255, 245, 245, 0.9)',
    borderTopLeftRadius: scale(25),
    borderTopRightRadius: scale(25),
    padding: scale(25),
    paddingBottom: verticalScale(40),
  },
  locationTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#1E1A57',
    marginBottom: verticalScale(4),
  },
  locationSubtitle: {
    fontSize: moderateScale(13),
    color: '#1E1A57',
    lineHeight: verticalScale(18),
    opacity: 0.7,
    marginBottom: verticalScale(25),
  },
  submitBtn: {
    backgroundColor: '#CA2027',
    height: verticalScale(55),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  backBtn: {
    marginRight: scale(15),
  },
});

export default AddAddressScreen;
