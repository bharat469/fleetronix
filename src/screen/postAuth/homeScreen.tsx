import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Dimensions,

} from 'react-native';
import { COLORS } from '../../helpers/values/colors';
import ActionCard from '../../components/ActionCard';
import {
  LocationIcon,
  TruckIcon,
  SignpostIcon,
  MoneyBagIcon,
  SupportIcon,
  RoadIcon,
  TransporterIcon,
} from '../../assets/svgIcons';

import LinearGradient from 'react-native-linear-gradient';

import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale, SCREEN } from '../../helpers/dimension';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useDriverInfo, useUpdateDriver } from '../../hooks/useAuth';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ActivityIndicator, PermissionsAndroid, Platform, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { useReverseGeocode } from '../../hooks/useGeocoding';
import { useQueryClient } from '@tanstack/react-query';



const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const { driverId, userToken } = useSelector((state: RootState) => state.auth);
  const { data: driverResponse, isLoading, isError, refetch } = useDriverInfo(
    driverId || '',
    userToken || '',
    !!driverId && !!userToken
  );

  useFocusEffect(
    React.useCallback(() => {
      refetch();
      queryClient.invalidateQueries();
    }, [refetch, queryClient])
  );

  const driverData = driverResponse?.data;
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (driverData) {
      setIsEnabled(driverData.is_active);
    }
  }, [driverData]);

  const { mutate: updateProfile } = useUpdateDriver({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverInfo', driverId] });
      refetch();
    },
    onError: (error: any) => {
      setIsEnabled((previousState) => !previousState);
      Alert.alert('Error', error.message || 'Failed to update active status');
    }
  });

  const toggleSwitch = () => {
    const nextValue = !isEnabled;
    setIsEnabled(nextValue);
    
    // Set status to available if true, on_leave (sleeping) if false
    const nextStatus = nextValue ? 'available' : 'on_leave';

    updateProfile({
      driverId: driverId || '',
      token: userToken || '',
      data: {
        is_active: nextValue,
        status: nextStatus
      }
    });
  };

  const [currentAddress, setCurrentAddress] = useState('Detecting...');

  const { mutateAsync: getAddress } = useReverseGeocode();

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
      return (
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  };

  const handleLocationFetch = React.useCallback(async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setCurrentAddress('Location denied');
        return;
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          try {
            const address = await getAddress({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            if (address) {
              const parts = address.split(',').map(p => p.trim());

              const city = parts.length >= 3 ? parts[parts.length - 3] : parts[0];
              setCurrentAddress(city || 'Unknown');
            }
          } catch (err) {
            console.log('Geocoding error:', err);
            setCurrentAddress('Address error');
          }
        },
        (error) => {
          console.log('[Location Error]:', error.code, error.message);
          setCurrentAddress('Location error');
        },
        {
          enableHighAccuracy: false, // Much faster as it uses WiFi/Cell instead of GPS satellites
          timeout: 10000,
          maximumAge: 60000 // Use a location cached in the last minute for instant loading
        }
      );
    } catch (err) {
      console.log('[Location Fetch Catch]:', err);
    }
  }, [getAddress]);

  useEffect(() => {
    handleLocationFetch();
  }, [handleLocationFetch]);


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <ImageBackground
          source={require('../../assets/images/pexels-photoscom-93398 1.png')}
          style={styles.headerBackground}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.4)']}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.topRow}>
              <Text ></Text>
              <View style={styles.locationContainer}>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.currentAddressLabel}>{t('current_address')}</Text>
                  <Text style={styles.locationText}>
                    {currentAddress}
                  </Text>
                </View>
                <LocationIcon />
              </View>
            </View>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>{t('welcome_upper')}</Text>
              <View style={styles.welcomeUnderline} />
              {isLoading ? (
                <ActivityIndicator color="white" style={{ alignSelf: 'flex-start', marginTop: verticalScale(15) }} />
              ) : (
                <>
                  <Text style={styles.driverName}>{driverData?.full_name || driverData?.first_name || 'Driver'}</Text>
                  <View style={styles.driverStats}>
                    <Text style={styles.statText}>
                      {t('driver_id')}: <Text style={styles.statValue}>{driverId || '---'}</Text>
                    </Text>
                  </View>
                </>
              )}
            </View>
            <View style={styles.actionRow}>
              <View style={styles.switchContainer}>
                <Switch
                  trackColor={{ false: '#767577', true: '#4CD964' }}
                  thumbColor={isEnabled ? '#f4f3f4' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={toggleSwitch}
                  value={isEnabled}
                />
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
        <View style={styles.dashboardContainer}>
          <View style={styles.handle} />
          <View style={styles.grid}>
            {/* Hiding New Trip until further notice
            <ActionCard
              title={t('new_trip')}
              subtitle={t('trip_card_desc')}
              Icon={TruckIcon}
              iconBgColor="rgba(255, 107, 0, 0.1)"
              onPress={() => navigation.navigate('NewTripLocation')}
            />
            */}
            <ActionCard
              title={t('all_trips')}
              subtitle={t('trip_card_desc')}
              Icon={SignpostIcon}
              iconBgColor="rgba(255, 0, 255, 0.1)"
              onPress={() => navigation.navigate('AllLoads', { initialTab: 'all' })}
            />
            {driverData?.driver_source === 'managed' && (
              <ActionCard
                title={t('expenses')}
                subtitle={t('trip_card_desc')}
                Icon={MoneyBagIcon}
                iconBgColor="rgba(0, 200, 83, 0.1)"
                onPress={() => navigation.navigate('ExpenseDashboard')}
              />
            )}
            <ActionCard
              title={t('support')}
              subtitle={t('trip_card_desc')}
              Icon={SupportIcon}
              iconBgColor="rgba(211, 47, 47, 0.1)"
              onPress={() => navigation.navigate('Support' as any)}
            />
            <ActionCard
              title={t('pod')}
              subtitle={t('trip_card_desc')}
              Icon={RoadIcon}
              iconBgColor="rgba(141, 110, 99, 0.1)"
              onPress={() => navigation.navigate('POD' as any)}
            />
            {driverData?.driver_source !== 'managed' && (
              <ActionCard
                title={t('transporter')}
                subtitle={t('transporter_desc')}
                Icon={TransporterIcon}
                iconBgColor="rgba(255, 152, 0, 0.15)"
                onPress={() => navigation.navigate('TransporterScreen')}
              />
            )}
          </View>
          <View style={styles.sliderIndicatorContainer}>
            <View style={styles.sliderTrack}><View style={styles.sliderActive} /></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerBackground: {
    width: '100%',
    height: SCREEN.HEIGHT * 0.45,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(40),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    alignItems: 'flex-end',
    marginRight: scale(8),
  },
  currentAddressLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: moderateScale(10),
  },
  locationText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  welcomeSection: {
    marginTop: verticalScale(30),
  },
  welcomeText: {
    color: 'white',
    fontSize: moderateScale(32),
    fontWeight: '800',
    letterSpacing: 1,
  },
  welcomeUnderline: {
    height: 2,
    backgroundColor: 'white',
    width: scale(120),
    marginTop: verticalScale(4),
  },
  driverName: {
    color: 'white',
    fontSize: moderateScale(22),
    fontWeight: '600',
    marginTop: verticalScale(15),
  },
  driverStats: {
    marginTop: verticalScale(10),
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: moderateScale(10),
    lineHeight: verticalScale(16),
  },
  statValue: {
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: verticalScale(60),
  },
  switchContainer: {
    transform: [{ scale: 1.2 }],
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: verticalScale(-40),
    borderTopLeftRadius: scale(40),
    borderTopRightRadius: scale(40),
    paddingTop: verticalScale(12),
    paddingHorizontal: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handle: {
    width: scale(60),
    height: 4,
    backgroundColor: '#D1D1D1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: verticalScale(25),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sliderIndicatorContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(20),
  },
  sliderTrack: {
    width: SCREEN.WIDTH * 0.7,
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    flexDirection: 'row',
  },
  sliderActive: {
    width: '50%',
    height: '100%',
    backgroundColor: '#CC2B2B',
    borderRadius: 3,
  },
});


export default HomeScreen;