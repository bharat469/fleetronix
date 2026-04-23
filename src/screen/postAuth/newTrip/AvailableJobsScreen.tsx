import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { COLORS } from '../../../helpers/values/colors';
import { BackArrowIcon, LocationIcon } from '../../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useDriverInfo } from '../../../hooks/useAuth';
import { resolveImageUrl } from '../../../helpers/urlHelper';



const MenuIcon = () => (
  <View style={styles.iconCircle}>
    <View style={{ width: scale(18), height: 2, backgroundColor: '#000', marginVertical: 2, borderRadius: 1 }} />
    <View style={{ width: scale(12), height: 2, backgroundColor: '#000', marginVertical: 2, borderRadius: 1 }} />
    <View style={{ width: scale(18), height: 2, backgroundColor: '#000', marginVertical: 2, borderRadius: 1 }} />
  </View>
);

import Svg, { Path } from 'react-native-svg';

const PhoneIcon = () => (
  <View style={{ marginRight: scale(10) }}>
    <Svg width={scale(18)} height={scale(18)} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
        stroke={COLORS.primary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

const AvailableJobsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [status, setStatus] = useState<'searching' | 'matched'>('searching');
  const progressWidth = useRef(new Animated.Value(0)).current;

  const { userToken, driverId } = useSelector((state: RootState) => state.auth);
  const { data: driverData } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

  useEffect(() => {
    // Progress bar animation
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 3500,
      useNativeDriver: false,
    }).start();

    // Transition to matched after 3.5 seconds
    const timer = setTimeout(() => {
      setStatus('matched');
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const mapRegion = {
    latitude: 17.3850,
    longitude: 78.4867,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={mapRegion}
        customMapStyle={mapStyle}
      >
        <Marker coordinate={{ latitude: 17.3950, longitude: 78.4967 }}>
          <View style={styles.blueMarker}>
            <View style={styles.innerBlueMarker} />
          </View>
        </Marker>
        <Circle
          center={{ latitude: 17.3950, longitude: 78.4967 }}
          radius={800}
          fillColor="rgba(33, 150, 243, 0.15)"
          strokeColor="transparent"
        />

        <Marker coordinate={{ latitude: 17.3750, longitude: 78.4767 }}>
          <View style={styles.greenMarker}>
            <View style={styles.innerGreenMarker} />
          </View>
        </Marker>
        <Circle
          center={{ latitude: 17.3750, longitude: 78.4767 }}
          radius={1000}
          fillColor="rgba(76, 175, 80, 0.15)"
          strokeColor="transparent"
        />

        {/* Decorative markers based on SS */}
        <Marker coordinate={{ latitude: 17.3800, longitude: 78.4900 }}>
          <View style={[styles.miniMarker, { backgroundColor: '#F44336' }]} />
        </Marker>
        <Marker coordinate={{ latitude: 17.4000, longitude: 78.4800 }}>
          <View style={[styles.miniMarker, { backgroundColor: '#F44336' }]} />
        </Marker>
      </MapView>

      {/* Top Overlays */}
      <View style={styles.topOverlay}>
        <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
          <MenuIcon />
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileBtn}>
          <Image
            source={{ uri: resolveImageUrl(driver?.photo_path) || 'https://randomuser.me/api/portraits/men/32.jpg' }}
            style={styles.topProfilePic}
          />
          <View style={styles.activeDot} />
        </TouchableOpacity>
      </View>

      <View style={styles.googleAttribution}>
        <Image
          source={{ uri: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png' }}
          style={styles.googleLogo}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Sheet UI */}
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            {status === 'searching' ? 'Finding Job' : 'Matched Opportunities'}
          </Text>
          <Text style={styles.sheetSubtitle}>
            {status === 'searching'
              ? 'Effortlessly find your perfect job match with our streamlined "Finding Job" feature.'
              : 'Select Jobs for Matched Opportunities'}
          </Text>
        </View>

        <View style={styles.jobCard}>
          <View style={styles.cardMain}>
            <View style={styles.picContainer}>
              <Image
                source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                style={styles.cardProfilePic}
              />
              <View style={styles.verifiedBadge}>
                <Text style={{ fontSize: 8, color: 'white' }}>✓</Text>
              </View>
            </View>
            <Text style={styles.driverName}>{'Name'}</Text>
          </View>

          <View style={styles.cardDetails}>
            <DetailRow label="Task" value="Chemical Delivery" />
            <DetailRow label="Departed" value="20 Feb, 05:00 PM" />
            <DetailRow label="Current Location" value="123 Main Street, Anytown, IND 845103" />
            <DetailRow label="Trip Cost" value="Rs 10000" />
          </View>
        </View>
        <View style={styles.divider} />
        {status === 'searching' ? (
          <View style={styles.loaderContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]}
            />
          </View>
        ) : (
          <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8}>
            <PhoneIcon />
            <Text style={styles.contactText}>Get in Contact</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const mapStyle = [
  {
    "featureType": "poi",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit",
    "stylers": [{ "visibility": "off" }]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  topOverlay: {
    position: 'absolute',
    top: verticalScale(50),
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    zIndex: 10,
  },
  topBtn: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  iconCircle: {
    alignItems: 'center',
  },
  profileBtn: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'white',
    padding: 3,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  topProfilePic: {
    width: '100%',
    height: '100%',
    borderRadius: scale(25),
  },
  activeDot: {
    position: 'absolute',
    right: 0,
    bottom: verticalScale(5),
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#00C853',
    borderWidth: 2,
    borderColor: 'white',
  },
  googleAttribution: {
    position: 'absolute',
    top: verticalScale(500),
    left: scale(20),
    zIndex: 5,
  },
  googleLogo: {
    width: scale(60),
    height: verticalScale(20),
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    paddingBottom: verticalScale(40),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handle: {
    width: scale(60),
    height: verticalScale(5),
    backgroundColor: '#E0E0E0',
    borderRadius: scale(5),
    alignSelf: 'center',
    marginTop: verticalScale(15),
  },
  sheetHeader: {
    paddingHorizontal: scale(30),
    marginTop: verticalScale(20),
  },
  sheetTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#000',
  },
  sheetSubtitle: {
    fontSize: moderateScale(13),
    color: '#888',
    marginTop: verticalScale(8),
    lineHeight: verticalScale(18),
  },
  jobCard: {
    flexDirection: 'row',
    marginTop: verticalScale(25),
    paddingHorizontal: scale(30),
    gap: scale(20),
  },
  cardMain: {
    alignItems: 'center',
    width: scale(80),
  },
  picContainer: {
    position: 'relative',
  },
  cardProfilePic: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: '#f0f0f0',
  },
  verifiedBadge: {
    position: 'absolute',
    left: scale(-5),
    top: verticalScale(10),
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  driverName: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#000',
  },
  cardDetails: {
    flex: 1,
    gap: verticalScale(5),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: moderateScale(11),
    color: '#888',
    width: '45%',
  },
  detailValue: {
    fontSize: moderateScale(11),
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  loaderContainer: {
    height: verticalScale(6),
    backgroundColor: '#f0f0f0',
    marginTop: verticalScale(40),
    marginHorizontal: scale(30),
    borderRadius: scale(3),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: verticalScale(25),
    alignSelf: 'flex-start',
    marginLeft: scale(48),
  },
  contactText: {
    fontSize: moderateScale(15),
    color: COLORS.primary,
    fontWeight: '600',
  },
  blueMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBlueMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: 'white',
  },
  greenMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerGreenMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: 'white',
  },
  miniMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  divider: {
    height: verticalScale(2),
    marginTop: verticalScale(20),
    backgroundColor: COLORS.borderColor.color3,
  },
});

export default AvailableJobsScreen;
