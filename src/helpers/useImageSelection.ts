import { useState } from 'react';
import { Alert } from 'react-native';
import i18next from 'i18next';
import { Asset } from 'react-native-image-picker';
import { pickImageFromLibrary, takePhoto as takePhotoHelper } from './imagePickerHelper';

/**
 * Hook to handle image selection from library or camera
 */
export const useImageSelection = (onImageSelected: (asset: Asset) => void) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const validateAsset = (asset: Asset): boolean => {
    const isHighRes = (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) ||
                      (asset.width && asset.width > 3000) ||
                      (asset.height && asset.height > 3000);
    if (isHighRes) {
      Alert.alert(
        i18next.t('error', 'Error'),
        i18next.t('high_res_error', 'High-resolution image cannot be uploaded. Please upload a smaller or compressed image.')
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const response = await pickImageFromLibrary({ quality: 0.8 });
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (!validateAsset(asset)) return;
        onImageSelected(asset);
        setIsPickerVisible(false);
      }
    } catch (error) {
      console.error('Pick image error:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const response = await takePhotoHelper({ quality: 0.8 });
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (!validateAsset(asset)) return;
        onImageSelected(asset);
        setIsPickerVisible(false);
      }
    } catch (error) {
      console.error('Take photo error:', error);
    }
  };

  return {
    isPickerVisible,
    setIsPickerVisible,
    pickImage,
    takePhoto,
  };
};
