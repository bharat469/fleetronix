import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  ImageLibraryOptions,
  CameraOptions,
} from 'react-native-image-picker';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

export const pickImageFromLibrary = async (options?: Partial<ImageLibraryOptions>): Promise<ImagePickerResponse> => {
  const defaultOptions: ImageLibraryOptions = {
    mediaType: 'photo',
    selectionLimit: 1,
    ...options,
  };

  try {
    const result = await launchImageLibrary(defaultOptions);
    return result;
  } catch (error) {
    console.error('[pickImageFromLibrary] Error:', error);
    throw error;
  }
};

export const takePhoto = async (options?: Partial<CameraOptions>): Promise<ImagePickerResponse> => {
  const defaultOptions: CameraOptions = {
    mediaType: 'photo',
    saveToPhotos: true,
    ...options,
  };

  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'App needs camera permission to take photos',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Camera permission denied');
        return { didCancel: true };
      }
    }

    const result = await launchCamera(defaultOptions);
    return result;
  } catch (error) {
    console.error('[takePhoto] Error:', error);
    throw error;
  }
};
