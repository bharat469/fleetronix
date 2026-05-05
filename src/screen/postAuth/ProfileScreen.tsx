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
import { storage } from '../../helpers/asyncHelper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  SearchIcon,
  LogoutMenuIcon,
  ChevronRightIcon,

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverInfo', driverId] });
      AlertHelper.success('Success', 'Profile picture updated successfully');
      setIsPickerVisible(false);
    },
    onError: (error: any) => {
      AlertHelper.error('Error', error.message || 'Failed to update profile picture');
    }
  });

  const onImageSelected = (asset: Asset) => {
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
      await storage.remove('userToken');
      await storage.remove('refreshToken');
      await storage.remove('driverId');
      await storage.remove('purpose');
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity><SearchIcon /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DriverProfileHeader
          driver={driver}
          showEditButton={true}
          isUpdating={isUpdating}
          onEditPress={() => setIsPickerVisible(true)}
          containerStyle={{ paddingHorizontal: scale(20) }}
        />
        <View style={styles.divider} />
        <View style={styles.menuContainer}>
          <MenuItem icon={accountMenuIcon} label="Account" onPress={() => navigation.navigate('AccountDetails')} />
          <MenuItem icon={kycMenuIcon} label="KYC" onPress={() => navigation.navigate('KYC')} />
          <MenuItem icon={statusMenuIcon} label="Status" onPress={() => navigation.navigate('Status')} />
          <MenuItem icon={notificationMenuIcon} label="Notification" onPress={() => { }} />
          <View style={{ height: 100 }} />
          <MenuItem icon={LogoutMenuIcon} label="Logout" onPress={handleLogout} isLogout={true} />
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
});

export default ProfileScreen;
