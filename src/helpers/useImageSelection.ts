import { useState } from 'react';
import { Asset } from 'react-native-image-picker';
import { pickImageFromLibrary, takePhoto as takePhotoHelper } from './imagePickerHelper';

/**
 * Hook to handle image selection from library or camera
 */
export const useImageSelection = (onImageSelected: (asset: Asset) => void) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const pickImage = async () => {
    try {
      const response = await pickImageFromLibrary({ quality: 0.7 });
      if (response.assets && response.assets.length > 0) {
        onImageSelected(response.assets[0]);
        setIsPickerVisible(false);
      }
    } catch (error) {
      console.error('Pick image error:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const response = await takePhotoHelper({ quality: 0.7 });
      if (response.assets && response.assets.length > 0) {
        onImageSelected(response.assets[0]);
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
