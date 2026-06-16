import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../helpers/values/colors';
import { getFontFamily } from '../../helpers/fonts';
import { moderateScale, scale, verticalScale } from '../../helpers/dimension';
import SvgIcon from '../../helpers/svgComponents';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import OTPInput from '../../components/otpComponents';
import { useResendOtp, useRegister, useLogin } from '../../hooks/useAuth';
import BottomSheetComponent from '../../components/bottomsheet';
import ErrorBottomSheet from '../../components/ErrorBottomSheet';
import { ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { setTokens } from '../../redux/slices/authSlice';
import { storage } from '../../helpers/asyncHelper';
import { getFcmToken, getDeviceId } from '../../helpers/tokenHelper';

const getErrorTitleAndMessage = (err: any, t: any, defaultMsg: string = 'Something went wrong. Please try again.') => {
  const rawMessage = err.response?.data?.message || err.response?.data?.error || err.message || defaultMsg;
  let message = rawMessage;
  let title = t('error', 'Error');
  
  if (typeof rawMessage === 'string') {
    const lowerMessage = rawMessage.toLowerCase();
    const isInactive = 
      lowerMessage.includes('inactive') ||
      lowerMessage.includes('deactivated') ||
      lowerMessage.includes('not active') ||
      lowerMessage.includes('not_active') ||
      lowerMessage.includes('disabled') ||
      lowerMessage.includes('blocked');
      
    if (isInactive) {
      title = t('account_inactive', 'Account Inactive');
      if (rawMessage.length < 5 || rawMessage.match(/^\d+$/)) {
        message = t('account_inactive_message', 'Your account is inactive. Please contact support.');
      } else {
        message = rawMessage;
      }
    } else if (err.response?.status === 400) {
      title = t('alert', 'Alert');
      if (rawMessage === '400' || rawMessage.includes('status code 400')) {
        message = defaultMsg;
      }
    } else if (!err.response) {
      title = t('network_error', 'Network Error');
    }
  }
  
  return { title, message };
};

type Props = NativeStackScreenProps<RootStackParamList, 'OTPVerify'>;

const OTPVerifyScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { phoneNumber, purpose } = route.params;
  const [currentOtp, setCurrentOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [isApiErrorVisible, setIsApiErrorVisible] = useState(false);
  const [apiErrorTitle, setApiErrorTitle] = useState('Error');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const dispatch = useDispatch();

  const handleAuthSuccess = async (data: any) => {
    const authData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      driverId: data.data.driver_id,
      purpose: purpose,
    };

    dispatch(setTokens(authData));
    
    // Save to AsyncStorage
    await storage.set('userToken', authData.accessToken);
    await storage.set('refreshToken', authData.refreshToken);
    await storage.set('driverId', authData.driverId);
    await storage.set('purpose', authData.purpose);
    
    if (purpose === 'login') {
      navigation.navigate('Home');
    } else {
      navigation.navigate('LocationEnable');
    }
  };

  const { mutate: registerMutate, isPending: isRegistering } = useRegister({
    onSuccess: (data) => {
      console.log('Registration success:', data);
      handleAuthSuccess(data);
    },
    onError: (err: any) => {
      const { title, message } = getErrorTitleAndMessage(err, t, t('something_went_wrong', 'Something went wrong. Please try again.'));
      setApiErrorTitle(title);
      setApiErrorMessage(message);
      setIsApiErrorVisible(true);
    },
  });

  const { mutate: loginMutate, isPending: isLoggingIn } = useLogin({
    onSuccess: (data) => {
      console.log('Login success:', data);
      handleAuthSuccess(data);
    },
    onError: (err: any) => {
      const { title, message } = getErrorTitleAndMessage(err, t, t('something_went_wrong', 'Something went wrong. Please try again.'));
      setApiErrorTitle(title);
      setApiErrorMessage(message);
      setIsApiErrorVisible(true);
    },
  });

  const isPendingAuth = isRegistering || isLoggingIn;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = async () => {
    if (currentOtp.length === 4) {
      const fcmToken = await getFcmToken();
      const deviceId = await getDeviceId();
      console.log('ajksajshas', fcmToken, deviceId)

      const payload = {
        mobile: phoneNumber,
        otp: currentOtp,
        fcm_token: fcmToken || undefined,
        device_id: deviceId,
      };

      if (purpose === 'register') {
        registerMutate(payload);
      } else {
        loginMutate(payload);
      }
    }
  };

  const formatTimer = (time: number) => {
    return time < 10 ? `0${time}` : time;
  };

  const { mutate: resendOtp, isPending: isResending } = useResendOtp({
    onSuccess: (data) => {
      console.log('Resend OTP response:', data);
      setTimer(30);
    },
    onError: (error) => {
      console.error('Error resending OTP:', error);
    }
  });

  const handleResendOTP = () => {
    if (timer > 0 || isResending) return;
    resendOtp({ mobile: phoneNumber, purpose: purpose });
  };

  const maskedPhone = `+91${phoneNumber.slice(0, 3)}*******`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <SvgIcon name="fleetronixLogo" width={scale(256)} height={verticalScale(50)} color={COLORS.textColor.color3} />

            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>
                {t('enter', 'Enter')} <Text style={styles.otpHighlight}>{t('otp_upper', 'OTP')}</Text>
              </Text>
            </View>

            <Text style={styles.description}>
              {t('otp_description', 'Please enter the 4 digit OTP Code sent on')}
              {'\n'}
              <Text style={styles.phoneNumber}>{maskedPhone}</Text>
            </Text>
          </View>

          <View style={styles.otpWrapper}>
            <OTPInput 
              length={4} 
              onChangeOTP={(val) => setCurrentOtp(val)} 
            />
          </View>

          <TouchableOpacity
            style={[styles.nextButton, (currentOtp.length < 4 || isPendingAuth) && styles.disabledButton]}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={currentOtp.length < 4 || isPendingAuth}
          >
            {isPendingAuth ? (
              <ActivityIndicator color={COLORS.secondary} />
            ) : (
              <Text style={styles.nextButtonText}>{t('next_upper', 'NEXT')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.resendText}>
              {t('didnt_receive', "Didn't receive the code?")}{' '}
              <Text
                style={[styles.resendAction, (timer > 0 || isResending) && styles.disabledResend]}
                onPress={handleResendOTP}
              >
                {isResending ? t('loading', 'Loading...') : `${t('resend', 'Resend')} (${formatTimer(timer)}s)`}
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* API Error Bottom Sheet */}
      <BottomSheetComponent
        isVisible={isApiErrorVisible}
        onBackdropPress={() => setIsApiErrorVisible(false)}
        onBackButtonPress={() => setIsApiErrorVisible(false)}
      >
        <ErrorBottomSheet
          title={apiErrorTitle}
          message={apiErrorMessage}
          onClose={() => setIsApiErrorVisible(false)}
        />
      </BottomSheetComponent>
    </SafeAreaView>
  );
};

export default OTPVerifyScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(40),
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: verticalScale(40),
  },
  titleContainer: {
    marginTop: verticalScale(32),
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
  phoneNumber: {
    color: COLORS.textColor.color2.one,
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
  footer: {
    marginTop: verticalScale(24),
    alignItems: 'center',
  },
  resendText: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(14),
    color: COLORS.textColor.color1,
  },
  resendAction: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  disabledResend: {
    color: COLORS.primary,
    opacity: 0.6,
  },
});
