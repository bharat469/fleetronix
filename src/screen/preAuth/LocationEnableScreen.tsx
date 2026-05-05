import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,

} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../helpers/values/colors';
import { getFontFamily } from '../../helpers/fonts';
import { moderateScale, scale, verticalScale } from '../../helpers/dimension';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import SvgIcon from '../../helpers/svgComponents';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import { storage } from '../../helpers/asyncHelper';
import { useReverseGeocode } from '../../hooks/useGeocoding';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationEnable'>;

const LocationEnableScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { mutateAsync: getAddress } = useReverseGeocode();

  useEffect(() => {
    checkSavedLocation();
  }, []);

  const checkSavedLocation = async () => {
    const savedAddress = await storage.get('CURRENT_LOCATION_ADDRESS');
    if (savedAddress) {
      console.log('Location already saved, redirecting...');
      navigation.navigate('SelectTruck');
    }
  };

  const handleUseLocation = async () => {
    console.log('Requesting location permission...');
    const coords = await getCurrentLocation();

    if (coords) {
      try {
        const address = await getAddress({
          lat: coords.latitude,
          lng: coords.longitude
        });

        if (address) {
          console.log('Fetched Address:', address);
          await storage.set('CURRENT_LOCATION_ADDRESS', address);
          navigation.navigate('SelectTruck');
        } else {
          console.log('Could not fetch address');
          navigation.navigate('SelectTruck');
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        navigation.navigate('SelectTruck');
      }
    }
  };



  const handleSkip = () => {
    navigation.navigate('SelectTruck');
  };

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

  const getCurrentLocation = async (): Promise<any> => {
    try {
      const hasPermission = await requestLocationPermission();
      console.log(hasPermission, 'hasPermission')

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            console.log('[Location Success]:', position.coords);
            resolve(position.coords);
          },
          (error) => {
            console.log('[Location Error]:', error.code, error.message);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
            forceRequestLocation: true,
            showLocationDialog: true,
          }
        );
      });
    } catch (err) {
      console.log('[Crash Catch]:', err);
      return null;
    }
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.illustrationContainer}>
          <SvgIcon
            name="locationIllustration"
            width={scale(300)}
            height={verticalScale(300)}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {t('enable_location', 'Enable Your')}{'\n'}
            <Text style={styles.locationHighlight}>{t('location', 'Location')}</Text>
          </Text>

          <Text style={styles.description}>
            {t('location_desc', 'To search for the best nearby driver, we want to know your current location')}
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleUseLocation}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{t('use_current_location', 'Use current location')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.6}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>{t('skip_for_now', 'Skip for now')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LocationEnableScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(24),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(40),
  },
  illustrationContainer: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(32),
    color: COLORS.textColor.color1,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: verticalScale(16),
  },
  locationHighlight: {
    color: COLORS.primary,
  },
  description: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(16),
    color: COLORS.textColor.color2.one,
    textAlign: 'center',
    paddingHorizontal: scale(20),
    lineHeight: verticalScale(24),
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: verticalScale(18),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: verticalScale(20),
  },
  buttonText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(18),
    color: COLORS.secondary,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: verticalScale(10),
  },
  skipText: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(16),
    color: COLORS.textColor.color2.one,
  },
});
