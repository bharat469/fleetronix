import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../helpers/values/colors';
import { getFontFamily } from '../../helpers/fonts';
import { moderateScale, scale, verticalScale } from '../../helpers/dimension';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationEnable'>;

const LocationEnableScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  const handleUseLocation = () => {
    // Logic to request location permission would go here
    console.log('Requesting location permission...');
    navigation.navigate('Home');
  };

  const handleSkip = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../../assets/images/location_illustration.png')}
            style={styles.illustration}
            resizeMode="contain"
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
    backgroundColor: '#FFFFFF',
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
    color: '#858080', // As per color2.one but fixed if needed
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
    color: 'white',
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: verticalScale(10),
  },
  skipText: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(16),
    color: '#858080',
  },
});
