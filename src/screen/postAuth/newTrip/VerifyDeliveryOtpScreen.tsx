import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../helpers/values/colors';
import { getFontFamily } from '../../../helpers/fonts';
import { moderateScale, scale, verticalScale } from '../../../helpers/dimension';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import OTPInput from '../../../components/otpComponents';
import { useMutation } from '@tanstack/react-query';
import { verifyDeliveryOtp } from '../../../services/tripApi';
import BottomSheetComponent from '../../../components/bottomsheet';
import ErrorBottomSheet from '../../../components/ErrorBottomSheet';
import { BackArrowIcon } from '../../../assets/svgIcons';
import { Trip } from '../../../types/trip';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyDeliveryOtp'>;

const VerifyDeliveryOtpScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const tripRedux = useSelector((state: RootState) => state.trip);
  const { trip } = route.params;
  const tripId = tripRedux.tripId || trip?.trip_id;

  console.log('sdjhjklsd', trip)

  const [currentOtp, setCurrentOtp] = useState('');
  const [isOtpError, setIsOtpError] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState('');

  const resetOtpError = () => {
    setIsOtpError(false);
    setOtpErrorMessage('');
  };

  const { mutate, isPending } = useMutation({
    mutationFn: verifyDeliveryOtp,
    onSuccess: () => {
      navigation.navigate('ConfirmDelivery', { trip });
    },
    onError: (error: Error) => {
      setOtpErrorMessage(error.message ?? 'Invalid OTP. Please try again.');
      setIsOtpError(true);
    },
  });

  const handleNext = () => {
    if (currentOtp.length === 4) {
      mutate({ tripId, otp: currentOtp });
    }
  };

  if (!tripId || !trip) {
    console.warn('[VerifyDeliveryOtpScreen] No trip data found in Redux');
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Delivery</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>
                {t('enter', 'Enter')} <Text style={styles.otpHighlight}>{t('otp_upper', 'OTP')}</Text>
              </Text>
            </View>

            <Text style={styles.description}>
              Please enter the 4 digit delivery code provided by the customer to confirm arrival.
            </Text>
          </View>

          <View style={styles.otpWrapper}>
            <OTPInput 
              length={4} 
              onChangeOTP={(val) => setCurrentOtp(val)} 
            />
          </View>

          <TouchableOpacity
            style={[styles.nextButton, (currentOtp.length < 4 || isPending) && styles.disabledButton]}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={currentOtp.length < 4 || isPending}
          >
            {isPending ? (
              <ActivityIndicator color={COLORS.secondary} />
            ) : (
              <Text style={styles.nextButtonText}>{t('confirm_upper', 'CONFIRM')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <BottomSheetComponent isVisible={isOtpError} onBackdropPress={resetOtpError}>
        <ErrorBottomSheet 
          title="Invalid OTP"
          message={otpErrorMessage ?? 'The OTP you entered is incorrect. Please try again.'}
          onClose={resetOtpError} 
        />
      </BottomSheetComponent>
    </SafeAreaView>
  );
};

export default VerifyDeliveryOtpScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  backBtn: {
    marginRight: scale(15),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#1E1B4B',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(20),
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: verticalScale(40),
  },
  titleContainer: {
    marginTop: verticalScale(10),
  },
  titleText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(28),
    color: COLORS.textColor.color1,
    fontWeight: '700',
  },
  otpHighlight: {
    color: COLORS.primary,
  },
  description: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(14),
    color: COLORS.textColor.color2.one,
    marginTop: verticalScale(16),
    lineHeight: verticalScale(20),
  },
  otpWrapper: {
    marginBottom: verticalScale(40),
  },
  nextButton: {
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
  },
  nextButtonText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(16),
    color: COLORS.secondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  disabledButton: {
    backgroundColor: COLORS.textColor.color2.two,
    shadowOpacity: 0,
    elevation: 0,
  },
});
