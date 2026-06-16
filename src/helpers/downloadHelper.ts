import { Platform, PermissionsAndroid } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { AlertHelper } from '../components/common/AlertPopup';

const requestWritePermission = async () => {
  if (Platform.OS !== 'android') return true;
  
  // For Android 10 (API 29) and above, write permission is not needed for downloads
  if (Number(Platform.Version) >= 29) return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission Required',
        message: 'This app needs access to your storage to download documents.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

/**
 * Downloads a file from a URL to the device storage.
 * On Android, it downloads using the system Download Manager and saves it to the Downloads folder.
 * On iOS, it downloads to a temp/cache directory and opens the native previewer (so the user can save/share it).
 */
export const downloadFile = async (url: string, defaultFileName: string) => {
  try {
    if (!url) {
      AlertHelper.error('Error', 'Invalid file URL');
      return;
    }

    const hasPermission = await requestWritePermission();
    if (!hasPermission) {
      AlertHelper.error('Permission Denied', 'Storage permission is required to download files.');
      return;
    }

    // Determine extension
    const ext = url.split('.').pop()?.split('?')[0] || 'pdf';
    const cleanFileName = defaultFileName.endsWith(`.${ext}`) 
      ? defaultFileName 
      : `${defaultFileName}.${ext}`;

    AlertHelper.success('Download Started', 'Your document is being downloaded.');

    if (Platform.OS === 'android') {
      const { dirs } = ReactNativeBlobUtil.fs;
      const downloadPath = `${dirs.DownloadDir}/${cleanFileName}`;

      const configOptions = {
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: downloadPath,
          description: `Downloading ${defaultFileName}`,
          mime: ext === 'pdf' ? 'application/pdf' : `image/${ext}`,
        },
      };

      await ReactNativeBlobUtil.config(configOptions).fetch('GET', url);
      AlertHelper.success('Download Complete', `File saved to Downloads folder: ${cleanFileName}`);
    } else {
      const { dirs } = ReactNativeBlobUtil.fs;
      const tempPath = `${dirs.CacheDir}/${cleanFileName}`;

      const configOptions = {
        fileCache: true,
        path: tempPath,
      };

      const res = await ReactNativeBlobUtil.config(configOptions).fetch('GET', url);
      const filePath = res.path();
      
      // On iOS, preview the document natively so they can save or share it
      ReactNativeBlobUtil.ios.previewDocument(filePath);
      AlertHelper.success('Success', `Preview opened for: ${cleanFileName}`);
    }
  } catch (error: any) {
    console.error('[downloadHelper] Error downloading file:', error);
    AlertHelper.error('Error', error.message || 'Failed to download file');
  }
};
