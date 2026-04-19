import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { COLORS } from '../../helpers/values/colors';
import { ShieldCheckIcon, CloseCircleIcon } from '../../assets/svgIcons';

type AlertType = 'success' | 'error' | 'info' | 'confirm';

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

let alertConfigCallback: (config: AlertState) => void = () => { };

export const AlertHelper = {
  show: (type: AlertType, title: string, message: string, onConfirm?: () => void) => {
    alertConfigCallback({ visible: true, type, title, message, onConfirm });
  },
  success: (title: string, message: string, onConfirm?: () => void, btnText = 'OK') => {
    alertConfigCallback({ visible: true, type: 'success', title, message, onConfirm, confirmText: btnText });
  },
  error: (title: string, message: string, onConfirm?: () => void, btnText = 'OK') => {
    alertConfigCallback({ visible: true, type: 'error', title, message, onConfirm, confirmText: btnText });
  },
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmText = 'Confirm', cancelText = 'Cancel') => {
    alertConfigCallback({ visible: true, type: 'confirm', title, message, onConfirm, onCancel, confirmText, cancelText });
  },
  hide: () => {
    alertConfigCallback({ visible: false, type: 'info', title: '', message: '' });
  }
};

const AlertPopup = () => {
  const [config, setConfig] = useState<AlertState>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  useEffect(() => {
    alertConfigCallback = setConfig;
  }, []);

  const handleClose = () => {
    setConfig(prev => ({ ...prev, visible: false }));
  };

  const onConfirmPress = () => {
    if (config.onConfirm) {
      config.onConfirm();
    }
    handleClose();
  };

  const onCancelPress = () => {
    if (config.onCancel) {
      config.onCancel();
    }
    handleClose();
  };

  const isSuccess = config.type === 'success';
  const isConfirm = config.type === 'confirm';
  const isError = config.type === 'error';



  return (
    <Modal
      isVisible={config.visible}
      onBackdropPress={handleClose}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropOpacity={0.4}
      useNativeDriver
    >
      <View style={styles.container}>
        <View style={[
          styles.iconWrapper,
          isSuccess ? styles.successBg : isError ? styles.errorBg : styles.infoBg
        ]}>
          {isSuccess ? (
            <ShieldCheckIcon width={scale(40)} height={scale(40)} color="white" />
          ) : isError ? (
            <CloseCircleIcon width={scale(40)} height={scale(40)} color="white" />
          ) : (
            <ShieldCheckIcon width={scale(40)} height={scale(40)} color="white" />
          )}
        </View>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.message}>{config.message}</Text>

        {isConfirm ? (
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, styles.rowBtn, styles.cancelBtn]}
              onPress={onCancelPress}
            >
              <Text style={styles.cancelBtnText}>{config.cancelText || 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.rowBtn, styles.confirmBtn]}
              onPress={onConfirmPress}
            >
              <Text style={styles.btnText}>{config.confirmText || 'Confirm'}</Text>
            </TouchableOpacity>
          </View>
        ) : isSuccess ? (
          <TouchableOpacity
            style={[styles.btn, styles.successBtn]}
            onPress={onConfirmPress}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>{config.confirmText || 'OK'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, styles.errorBtn]}
            onPress={onConfirmPress}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>{config.confirmText || 'Retry'}</Text>
          </TouchableOpacity>
        )}

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: scale(25),
    padding: scale(25),
    alignItems: 'center',
    width: Dimensions.get('window').width * 0.8,
    alignSelf: 'center',
  },
  iconWrapper: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(-60),
    borderWidth: 5,
    borderColor: 'white',
  },
  successBg: {
    backgroundColor: '#4CAF50',
  },
  errorBg: {
    backgroundColor: '#CA2027',
  },
  infoBg: {
    backgroundColor: '#1E1A57',
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#1E1A57',
    marginTop: verticalScale(15),
    textAlign: 'center',
  },
  message: {
    fontSize: moderateScale(14),
    color: '#666',
    textAlign: 'center',
    marginVertical: verticalScale(15),
    lineHeight: verticalScale(20),
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: scale(10),
  },
  btn: {
    width: '100%',
    height: verticalScale(50),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  rowBtn: {
    flex: 1,
    width: undefined, // Let flex handle it
  },
  successBtn: {
    backgroundColor: '#4CAF50',
  },
  errorBtn: {
    backgroundColor: '#CA2027',
  },
  confirmBtn: {
    backgroundColor: '#CA2027',
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5',
  },
  btnText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  cancelBtnText: {
    color: '#666',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

export default AlertPopup;
