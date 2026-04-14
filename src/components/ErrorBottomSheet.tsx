import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../helpers/values/colors';
import { getFontFamily } from '../helpers/fonts';
import { moderateScale, scale, verticalScale } from '../helpers/dimension';
import SvgIcon from '../helpers/svgComponents';

interface ErrorBottomSheetProps {

  message: string;
  onClose: () => void;
  title?: string;
}

const ErrorBottomSheet: React.FC<ErrorBottomSheetProps> = ({

  message,
  onClose,
  title,
}) => {
  const { t } = useTranslation();

  return (


      <View style={styles.content}>
        <View style={styles.indicator} />
        
        <View style={styles.header}>
           <View style={styles.iconContainer}>
              <Text style={styles.exclamation}>!</Text>
           </View>
           <Text style={styles.title}>{title || t('error', 'Error')}</Text>
        </View>

        <Text style={styles.message}>{message}</Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{t('try_again', 'Try Again')}</Text>
        </TouchableOpacity>
      </View>

  
  );
};

export default ErrorBottomSheet;

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: moderateScale(24),
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(40),
    paddingTop: verticalScale(12),
    alignItems: 'center',
    justifyContent:'flex-end',
    marginHorizontal:scale(16)
  },
  indicator: {
    width: scale(40),
    height: verticalScale(5),
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: verticalScale(24),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  iconContainer: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  exclamation: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
  title: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(20),
    color: COLORS.textColor.color1,
    fontWeight: '700',
  },
  message: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(16),
    color: COLORS.textColor.color2.one,
    textAlign: 'center',
    marginBottom: verticalScale(32),
    lineHeight: verticalScale(22),
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(16),
    color: 'white',
    fontWeight: '700',
  },
});
