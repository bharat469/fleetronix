import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { COLORS } from '../../helpers/values/colors';

type SOSType = 'accident' | 'truck_failure';

interface SOSBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (type: SOSType) => Promise<void> | void;
  isLoading?: boolean;
  onSuccessDone?: () => void;
}

const SOSBottomSheet: React.FC<SOSBottomSheetProps> = ({
  isVisible,
  onClose,
  onSubmit,
  isLoading = false,
  onSuccessDone,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [wasSubmittedOnHide, setWasSubmittedOnHide] = useState(false);
  const [selectedType, setSelectedType] = useState<SOSType | null>(null);

  const handleSubmit = async (type: SOSType) => {
    setSelectedType(type);
    try {
      await onSubmit(type);
      setSubmitted(true);
    } catch (error) {
      console.error('[SOSBottomSheet] Submit error:', error);
    }
  };

  const handleClose = () => {
    if (submitted) {
      setWasSubmittedOnHide(true);
    }
    setSubmitted(false);
    setSelectedType(null);
    onClose();
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      onModalHide={() => {
        if (wasSubmittedOnHide) {
          setWasSubmittedOnHide(false);
          if (onSuccessDone) {
            onSuccessDone();
          }
        }
      }}
      style={styles.modal}
      backdropOpacity={0.6}
      useNativeDriver={false}
      statusBarTranslucent
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={styles.container}>
        <View style={styles.handle} />

        {/* Title */}
        <Text style={styles.title}>EMERGENCY</Text>

        {submitted ? (
          /* ── Success State ── */
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successText}>
              Request sent someone will get back to you shortly.{'\n'}
              Be Patient, try to calm yourself
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Options State ── */
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.accidentButton}
              onPress={() => handleSubmit('accident')}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading && selectedType === 'accident' ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.accidentButtonText}>Accident</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.truckFailureButton}
              onPress={() => handleSubmit('truck_failure')}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading && selectedType === 'truck_failure' ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.truckFailureButtonText}>Truck Failure</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  container: {
    width: '85%',
    backgroundColor: '#1A1A2E',
    borderRadius: scale(20),
    paddingVertical: verticalScale(30),
    paddingHorizontal: scale(25),
    alignItems: 'center',
  },
  handle: {
    width: scale(40),
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: verticalScale(20),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: 'white',
    letterSpacing: 3,
    marginBottom: verticalScale(30),
  },
  optionsContainer: {
    width: '100%',
    gap: verticalScale(14),
  },
  accidentButton: {
    backgroundColor: '#CC2B2B',
    paddingVertical: verticalScale(16),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(54),
  },
  accidentButtonText: {
    color: 'white',
    fontSize: moderateScale(17),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  truckFailureButton: {
    backgroundColor: '#2C2C3E',
    paddingVertical: verticalScale(16),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minHeight: verticalScale(54),
  },
  truckFailureButtonText: {
    color: 'white',
    fontSize: moderateScale(17),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: scale(10),
  },
  successIconContainer: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  successIcon: {
    color: 'white',
    fontSize: moderateScale(24),
    fontWeight: 'bold',
  },
  successText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(24),
  },
  doneButton: {
    backgroundColor: '#CC2B2B',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(50),
    borderRadius: scale(12),
  },
  doneButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
});

export default SOSBottomSheet;
