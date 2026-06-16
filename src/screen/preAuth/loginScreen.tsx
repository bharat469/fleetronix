import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getFontFamily } from '../../helpers/fonts';
import SvgIcon from '../../helpers/svgComponents';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, scale, verticalScale } from '../../helpers/dimension';
import { COLORS } from '../../helpers/values/colors';
import PhoneConfirmationSheet from '../../components/PhoneConfirmationSheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import BottomSheetComponent from '../../components/bottomsheet';
import ErrorBottomSheet from '../../components/ErrorBottomSheet';
import { useSendOtp, useCheckMobile } from '../../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

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

const LoginScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isApiErrorVisible, setIsApiErrorVisible] = useState(false);
  const [apiErrorTitle, setApiErrorTitle] = useState('Error');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [purpose, setPurpose] = useState('');

  const { mutate: sendOtpMutate, isPending: isSendOtpPending } = useSendOtp({
    onSuccess: () => {
      setIsModalVisible(false);
      navigation.navigate('OTPVerify', { phoneNumber, purpose });
    },
    onError: (err: any) => {
      setIsModalVisible(false);
      const { title, message } = getErrorTitleAndMessage(err, t, t('something_went_wrong', 'Something went wrong. Please try again.'));
      setApiErrorTitle(title);
      setApiErrorMessage(message);
      setIsApiErrorVisible(true);
    },
  });

  const { mutate: checkMobileMutate, isPending: isCheckMobilePending } = useCheckMobile({
    onSuccess: (response) => {
      setPurpose(response.data.purpose);
      setIsModalVisible(true);
    },
    onError: (err: any) => {
      const { title, message } = getErrorTitleAndMessage(err, t, t('something_went_wrong', 'Something went wrong. Please try again.'));
      setApiErrorTitle(title);
      setApiErrorMessage(message);
      setIsApiErrorVisible(true);
    },
  });

  const isPending = isSendOtpPending || isCheckMobilePending;

  const handleSignIn = () => {
    if (phoneNumber.length !== 10) {
      setError(t('invalid_phone', 'Please enter a valid 10-digit number'));
      return;
    }
    setError('');
    setPurpose(''); // Reset purpose before API call
    checkMobileMutate({ mobile: phoneNumber });
  };

  const onConfirm = () => {
    // Call the send-OTP API via TanStack mutation
    sendOtpMutate({ mobile: phoneNumber, purpose: purpose });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.innerContainer}>
                <View style={styles.topContent}>
                  <View style={styles.header}>
                    <SvgIcon name="fleetronixLogo" width={scale(256)} height={verticalScale(50)} color={COLORS.primary} />
                    <Text style={styles.welcomeTitle}>{t('welcome', 'Welcome')}</Text>
                    <Text style={styles.instructionText}>
                      {t('please_enter_details', 'Please enter your sign in details.')}
                    </Text>
                  </View>

                  {/* Input Section */}
                  <View style={styles.formContainer}>
                    <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
                      <View style={styles.labelContainer}>
                        <Text style={styles.labelText}>
                          {t('phone_number_label', 'Phone Number')}
                        </Text>
                      </View>
                      <TextInput
                        style={styles.textInput}
                        placeholder={t('enter_phone', 'Enter Phone Number')}
                        placeholderTextColor={COLORS.textColor.color2.two}
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/[^0-9]/g, '');
                          if (cleaned.length <= 10) {
                            setPhoneNumber(cleaned);
                          }
                        }}
                        maxLength={10}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                      />
                      <View style={styles.iconContainer}>
                        <SvgIcon name="phoneIcon" width={20} height={20} color={COLORS.textColor.color2.two} />
                      </View>
                    </View>
                    {error.length !== 0 && (
                      <Text style={styles.errorMessage}>{error}</Text>
                    )}
                  </View>
                </View>

                {/* Footer Section */}
                <View style={styles.footer}>
                  <Text style={styles.disclaimerText}>
                    {t('disclaimer_text', 'By clicking Next,you agree with our')} {'\n'}
                    <Text style={styles.boldText}>{t('terms_and_conditions', 'Terms and Conditions')}</Text> {t('and', 'and')}{' '}
                    <Text style={styles.boldText}>{t('privacy_policy', 'Privacy Policy')}</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.signInButton, isPending && styles.signInButtonDisabled]}
                    activeOpacity={0.8}
                    onPress={handleSignIn}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.signInButtonText}>{t('sign_in', 'Sign In')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {/* Phone Confirmation Bottom Sheet */}
      <BottomSheetComponent
        isVisible={isModalVisible && !!purpose}
        onBackdropPress={() => setIsModalVisible(false)}
        onBackButtonPress={() => setIsModalVisible(false)}
      >
        <PhoneConfirmationSheet
          phoneNumber={phoneNumber}
          onCancel={() => setIsModalVisible(false)}
          onConfirm={onConfirm}
          isPending={isPending}
        />
      </BottomSheetComponent>

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
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContainer: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    justifyContent: 'space-between',
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(40),
  },
  topContent: {
    width: '100%',
  },
  header: {
    marginBottom: verticalScale(40),
  },

  welcomeTitle: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(28),
    color: COLORS.textColor.color1,
    marginTop: verticalScale(16),
    fontWeight: '700'
  },
  instructionText: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(14),
    color: COLORS.textColor.color2.four,
    marginTop: verticalScale(10),
  },
  formContainer: {
    marginTop: verticalScale(16),
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: COLORS.textColor.color2.two,
    borderRadius: moderateScale(12),
    height: verticalScale(56),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    position: 'relative',
    backgroundColor: COLORS.secondary,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
  },
  labelContainer: {
    position: 'absolute',
    top: verticalScale(-10),
    left: scale(20),
    backgroundColor: COLORS.secondary,
    paddingHorizontal: scale(6),
    zIndex: 1,
  },
  labelText: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(12),
    fontWeight: '400',
    color: COLORS.textColor.color2.one,
  },
  textInput: {
    flex: 1,
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(16),
    color: COLORS.textColor.color1,
    height: '100%',
  },
  iconContainer: {
    marginLeft: scale(10),
  },
  footer: {
    alignItems: 'center',
  },
  disclaimerText: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(14),
    color: COLORS.textColor.color2.one,
    textAlign: 'center',
    marginBottom: verticalScale(20),
    lineHeight: verticalScale(22),
  },
  boldText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: COLORS.textColor.color1,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: verticalScale(18),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  signInButtonDisabled: {
    backgroundColor: COLORS.textColor.color2.two,
    elevation: 0,
    shadowOpacity: 0,
  },
  signInButtonText: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(18),
    color: COLORS.secondary,
  },
  errorMessage: {
    color: COLORS.primary,
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    marginTop: verticalScale(8),
    marginLeft: scale(4),
  },
});