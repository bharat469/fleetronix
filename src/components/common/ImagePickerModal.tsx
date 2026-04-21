import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { COLORS } from '../../helpers/values/colors';
import { CameraIcon, GalleryIcon } from '../../assets/svgIcons';

interface ImagePickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCameraPress: () => void;
  onGalleryPress: () => void;
  title?: string;
}

const ImagePickerModal = ({
  isVisible,
  onClose,
  onCameraPress,
  onGalleryPress,
  title = 'Update Profile Photo',
}: ImagePickerModalProps) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      backdropOpacity={0.5}
    >
      <View style={styles.pickerContainer}>
        <View style={styles.pickerHeader}>
          <View style={styles.pickerHandle} />
          <Text style={styles.pickerTitle}>{title}</Text>
        </View>
        <View style={styles.pickerOptions}>
          <TouchableOpacity style={styles.pickerOption} onPress={onCameraPress}>
            <View style={[styles.pickerIconWrapper, { backgroundColor: '#E3F2FD' }]}>
              <CameraIcon color="#2196F3" />
            </View>
            <Text style={styles.pickerOptionText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerOption} onPress={onGalleryPress}>
            <View style={[styles.pickerIconWrapper, { backgroundColor: '#E8F5E9' }]}>
              <GalleryIcon color="#4CAF50" />
            </View>
            <Text style={styles.pickerOptionText}>Gallery</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: scale(25),
    borderTopRightRadius: scale(25),
    paddingBottom: verticalScale(30),
    paddingHorizontal: scale(20),
  },
  pickerHeader: {
    alignItems: 'center',
    paddingVertical: verticalScale(15),
  },
  pickerHandle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: '#E0E0E0',
    borderRadius: scale(2),
    marginBottom: verticalScale(10),
  },
  pickerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: COLORS.textColor.color1,
  },
  pickerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: verticalScale(20),
  },
  pickerOption: {
    alignItems: 'center',
    gap: verticalScale(10),
  },
  pickerIconWrapper: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerOptionText: {
    fontSize: moderateScale(14),
    color: COLORS.textColor.color4,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: verticalScale(10),
    paddingVertical: verticalScale(15),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default ImagePickerModal;
