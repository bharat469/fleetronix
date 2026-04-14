import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Modal from 'react-native-modal';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../helpers/values/colors';
import { getFontFamily } from '../helpers/fonts';
import { moderateScale, scale, verticalScale } from '../helpers/dimension';

interface PhoneConfirmationSheetProps {
  isVisible: boolean;
  phoneNumber: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const PhoneConfirmationSheet: React.FC<PhoneConfirmationSheetProps> = ({
  isVisible,
  phoneNumber,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
 
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {t('sign_in_with_phone', 'Sign In with phone number')}
          </Text>
          
          <Text style={styles.phoneNumber}>
            (+91) {phoneNumber.slice(0, 5)} {phoneNumber.slice(5)}
          </Text>

          <Text style={styles.description}>
            {t('confirmation_desc', 'We will send the authentication code to the phone number you entered. Do you want continue?')}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              onPress={onCancel} 
              activeOpacity={0.7}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>
                {t('cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onConfirm} 
              activeOpacity={0.8}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>
                {t('next', 'Next')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
 
  );
};

export default PhoneConfirmationSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(18),
    color: COLORS.textColor.color2.one,
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  phoneNumber: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(24),
    color: COLORS.textColor.color1,
    textAlign: 'center',
    marginBottom: verticalScale(16),
    fontWeight: '700',
  },
  description: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(14),
    color: COLORS.textColor.color2.one,
    textAlign: 'center',
    lineHeight: verticalScale(20),
    marginBottom: verticalScale(24),
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: scale(12),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(18),
    color: COLORS.primary,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(18),
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
