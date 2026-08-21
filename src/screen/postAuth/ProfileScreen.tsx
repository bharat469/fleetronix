import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useDriverInfo, useUpdateDriver } from '../../hooks/useAuth';
import { logout } from '../../redux/slices/authSlice';
import { resetTrip } from '../../redux/slices/tripSlice';
import { resetRegistrationData } from '../../redux/slices/registrationSlice';
import { storage } from '../../helpers/asyncHelper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  LogoutMenuIcon,
  ChevronRightIcon,
  LanguageMenuIcon,
} from '../../assets/svgIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { SVG_Url } from '../../helpers/values/imageUrl';
import { COLORS } from '../../helpers/values/colors';
import Config from 'react-native-config';
import DriverProfileHeader from '../../components/common/DriverProfileHeader';
import { useQueryClient } from '@tanstack/react-query';
import { AlertHelper } from '../../components/common/AlertPopup';
import ImagePickerModal from '../../components/common/ImagePickerModal';
import { useImageSelection } from '../../helpers/useImageSelection';
import { Asset } from 'react-native-image-picker';

const { accountMenuIcon, kycMenuIcon, statusMenuIcon, notificationMenuIcon } = SVG_Url;

const MenuItem = ({ icon: Icon, label, onPress, isLogout = false }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuItemLeft}>
      <View style={styles.iconWrapper}>
        <Icon width={24} height={24} />
      </View>
      <Text style={[styles.menuLabel, isLogout && styles.logoutLabel]}>{label}</Text>
    </View>
    <ChevronRightIcon />
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);

  const { data: driverData } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

  const { mutate: updateDriverProfile, isPending: isUpdating } = useUpdateDriver({
    onSuccess: (responseData: any) => {
      console.log('[ProfileScreen] ✅ Upload success response:', JSON.stringify(responseData, null, 2));
      console.log('[ProfileScreen] 🖼️ photo_path in response:', responseData?.data?.photo_path || responseData?.photo_path || 'NOT FOUND');
      queryClient.invalidateQueries({ queryKey: ['driverInfo', driverId] });
      AlertHelper.success('Success', 'Profile picture updated successfully');
      setIsPickerVisible(false);
    },
    onError: (error: any) => {
      console.error('[ProfileScreen] ❌ Upload error:', error.message, error);
      AlertHelper.error('Error', error.message || 'Failed to update profile picture');
    }
  });

  const onImageSelected = (asset: Asset) => {
    console.log('[ProfileScreen] 📸 Image selected:', {
      uri: asset.uri,
      type: asset.type,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
    });
    if (asset.uri) {
      updateDriverProfile({
        driverId: driverId || '',
        token: userToken || '',
        data: {
          driver_photo: {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `profile_${Date.now()}.jpg`,
          },
        },
      });
    }
  };

  const { isPickerVisible, setIsPickerVisible, pickImage, takePhoto } = useImageSelection(onImageSelected);

  const handleLogout = async () => {
    try {
      await storage.clear();
      queryClient.clear();
      dispatch(logout());
      dispatch(resetTrip());
      dispatch(resetRegistrationData());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile_tab', 'Profile')}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DriverProfileHeader
          driver={driver}
          showEditButton={true}
          isUpdating={isUpdating}
          onEditPress={() => setIsPickerVisible(true)}
          containerStyle={{ paddingHorizontal: scale(20) }}
        />
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingLabel}>{t('overall_rating', 'Overall Rating')}</Text>
          <Text style={styles.ratingValue}>{driver?.rating || '0.0'}</Text>
          <Text style={styles.starIcon}>★</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.menuContainer}>
          <MenuItem icon={accountMenuIcon} label={t('account', 'Account')} onPress={() => navigation.navigate('AccountDetails')} />
          <MenuItem icon={kycMenuIcon} label={t('kyc', 'KYC')} onPress={() => navigation.navigate('KYC')} />
          <MenuItem icon={statusMenuIcon} label={t('status', 'Status')} onPress={() => navigation.navigate('Status')} />
          {driver?.driver_source !== 'managed' && (
            <MenuItem icon={notificationMenuIcon} label={t('preferences', 'Preferences')} onPress={() => navigation.navigate('Preferences')} />
          )}
          <MenuItem icon={LanguageMenuIcon} label={t('languages', 'Languages')} onPress={() => navigation.navigate('LanguageSelection', { fromProfile: true })} />
          <View style={{ height: 100 }} />
          <MenuItem icon={LogoutMenuIcon} label={t('logout', 'Logout')} onPress={handleLogout} isLogout={true} />
        </View>
      </ScrollView>

      <ImagePickerModal
        isVisible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        onCameraPress={takePhoto}
        onGalleryPress={pickImage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    backgroundColor: COLORS.secondary,
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '500',
    color: COLORS.textColor.color1,
  },
  menuContainer: {
    marginTop: verticalScale(10),
    paddingHorizontal: scale(20),
  },
  divider: {
    height: verticalScale(2),
    backgroundColor: COLORS.borderColor.color3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(18),
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderColor.color2,
    marginHorizontal: scale(12),
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: moderateScale(16),
    color: COLORS.textColor.color4,
    fontWeight: '400',
    marginLeft: scale(15),
  },
  logoutLabel: {
    color: COLORS.primary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(194, 190, 190, 0.4)',
    borderRadius: scale(20),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(16),
    backgroundColor: 'white',
    alignSelf: 'center',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(15),
  },
  ratingLabel: {
    fontSize: moderateScale(15),
    color: COLORS.textColor.color5,
    fontWeight: '500',
    marginRight: scale(10),
  },
  ratingValue: {
    fontSize: moderateScale(15),
    color: COLORS.textColor.color1,
    fontWeight: '700',
  },
  starIcon: {
    fontSize: moderateScale(14),
    color: '#FFB300',
    marginLeft: scale(4),
  },
});

export default ProfileScreen;
