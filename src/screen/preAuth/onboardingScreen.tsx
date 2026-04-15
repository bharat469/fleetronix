import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { getFontFamily } from '../../helpers/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, scale, SCREEN, verticalScale } from '../../helpers/dimension';
import { COLORS } from '../../helpers/values/colors';
import SvgIcon from '../../helpers/svgComponents';
import { t } from 'i18next';


const OnboardingScreen = ({ navigation }: any) => {
  return (
    <ImageBackground
      source={require('../../assets/images/splashScreen.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.contentContainer}>
              <SvgIcon name="fleetronixLogo" width={scale(253)} height={verticalScale(39)} color={COLORS.secondary}/>
              <Text style={styles.subtitle}>{t('start_earning', 'Start Earning Today')}</Text>

              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('LanguageSelection')}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Continue</Text>
                <SvgIcon name="arrowRight" width={scale(20)} height={verticalScale(20)} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: SCREEN.WIDTH,
  },
  safeArea: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(100),
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    shadowColor: COLORS.textColor.color3,
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    elevation: 8,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(22),
    color: COLORS.secondary,
    textAlign: 'center',
    marginVertical: verticalScale(24),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
  },
  buttonText: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(16),
    color: COLORS.secondary,
  },
});
