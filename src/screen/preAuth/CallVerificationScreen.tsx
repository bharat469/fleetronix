import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../helpers/values/colors';
import { getFontFamily } from '../../helpers/fonts';
import { moderateScale, scale, verticalScale } from '../../helpers/dimension';
import SvgIcon from '../../helpers/svgComponents';

type Props = NativeStackScreenProps<RootStackParamList, 'CallVerification'>;

const CallVerificationScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <SvgIcon name="callIcon" width={scale(150)} height={verticalScale(150)} color="#CC2B2B" />
          </View>

          <Text style={styles.title}>{t('call_verification_title', 'You got a Call')}</Text>

          <Text style={styles.subtitle}>
            {t('call_verification_desc', "Stay on for support team verification. After completion, you'll be redirected to your Driver Dashboard for seamless navigation and updates. Thank you for your cooperation!")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CallVerificationScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: scale(40),
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: verticalScale(40),
  },
  title: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(32),
    color: '#CC2B2B', // Specific red from image
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  subtitle: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(18),
    color: COLORS.textColor.color1,
    lineHeight: verticalScale(28),
    textAlign: 'center',
  },
});
