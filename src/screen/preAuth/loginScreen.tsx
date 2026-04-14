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

} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getFontFamily } from '../../helpers/fonts';
import SvgIcon from '../../helpers/svgComponents';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, scale, verticalScale } from '../../helpers/dimension';
import { COLORS } from '../../helpers/values/colors';
import PhoneConfirmationSheet from '../../components/PhoneConfirmationSheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import BottomSheetComponent from '../../components/bottomsheet';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

 

  const handleSignIn = () => {
    if (phoneNumber.length !== 10) {
      setError(t('invalid_phone', 'Please enter a valid 10-digit number'));
      return;
    }
    setIsModalVisible(true);
  };

  const onConfirm = () => {
    setIsModalVisible(false);
    // Navigate to OTP screen
    navigation.navigate('OTPVerify', { phoneNumber: phoneNumber });
  };

  return (
    <LinearGradient
      colors={['rgba(202, 32, 39, 0.12)', 'rgba(255, 255, 255, 0)']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
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
                  onChangeText={setPhoneNumber}
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

            {/* Footer Section */}
            <View style={styles.footer}>
              <Text style={styles.disclaimerText}>
                {t('disclaimer_text', 'By clicking Next,you agree with our')} {'\n'}
                <Text style={styles.boldText}>{t('terms_and_conditions', 'Terms and Conditions')}</Text> {t('and', 'and')}{' '}
                <Text style={styles.boldText}>{t('privacy_policy', 'Privacy Policy')}</Text>
              </Text>
              <TouchableOpacity 
                style={[styles.signInButton]} 
                activeOpacity={0.8}
                onPress={handleSignIn}
               
              >
                <Text style={styles.signInButtonText}>{t('sign_in', 'Sign In')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
    <BottomSheetComponent
    isVisible={isModalVisible}
    onBackdropPress={() => setIsModalVisible(false)}
    onBackButtonPress={() => setIsModalVisible(false)}
    >

    <PhoneConfirmationSheet
          phoneNumber={phoneNumber}
          onCancel={() => setIsModalVisible(false)}
          onConfirm={onConfirm} isVisible={false}    />
    </BottomSheetComponent>
  </LinearGradient>
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
  innerContainer: {
    flex: 1,
    paddingHorizontal: scale(24),
    justifyContent: 'space-between',
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(40),
  },
  header: {
    marginBottom: verticalScale(40),
  },

  welcomeTitle: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(28),
    color: COLORS.textColor.color1,
    marginTop: verticalScale(16),
    fontWeight:'700'
  },
  instructionText: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(14),
    color: COLORS.textColor.color2.one,
    marginTop: verticalScale(10),
  },
  formContainer: {
    flex: 1,
    marginTop: verticalScale(20),
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: COLORS.textColor.color2.two,
    borderRadius: 12,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
  },
  labelContainer: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    zIndex: 1,
  },
  labelText: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(12),
    fontWeight:'400',
    color: COLORS.textColor.color2.one,
  },
  textInput: {
    flex: 1,
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: 16,
    color: '#333333',
    height: '100%',
  },
  iconContainer: {
    marginLeft: 10,
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
    fontSize: 18,
    color: '#FFFFFF',
  },
  errorMessage: {
    color: COLORS.primary,
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    marginTop: verticalScale(8),
    marginLeft: scale(4),
  },
});