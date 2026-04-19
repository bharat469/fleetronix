import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useDriverInfo } from '../../hooks/useAuth';
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
  EditPenIcon,
} from '../../assets/svgIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { SVG_Url } from '../../helpers/values/imageUrl';
import { COLORS } from '../../helpers/values/colors';

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
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);

  const { data: driverData, isLoading } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

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
        <View style={styles.userInfoSection}>
          <View style={styles.profilePicWrapper}>
            <Image
              source={{ uri: driver?.photo_path || 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.profilePic}
            />
            <TouchableOpacity
              style={styles.editPicBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AccountDetails')}
            >
              <EditPenIcon />
            </TouchableOpacity>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{driver?.full_name || driver?.first_name || 'Driver'}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: driver?.status === 'available' ? COLORS.greenColor.color1 : '#FF3B30' }]} />
              <Text style={styles.statusText}>{driver?.status ? driver.status.charAt(0).toUpperCase() + driver.status.slice(1) : 'Available'}</Text>
            </View>
            <View style={[styles.kycBadge, { backgroundColor: driver?.kyc_status === 'verified' ? '#E8F5E9' : COLORS.yellowColor.color1 }]}>
              <Text style={[styles.kycText, { color: driver?.kyc_status === 'verified' ? '#4CAF50' : COLORS.yellowColor.color2 }]}>
                {driver?.kyc_status ? `KYC ${driver.kyc_status.charAt(0).toUpperCase() + driver.kyc_status.slice(1)}` : 'KYC Pending'}
              </Text>
            </View>
          </View>
        </View>
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
  userInfoSection: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(20),
    alignItems: 'center',
  },
  profilePicWrapper: {
    position: 'relative',
  },
  profilePic: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
  },
  editPicBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userDetails: {
    marginLeft: scale(20),
  },
  userName: {
    fontSize: moderateScale(15),
    fontWeight: '500',
    color: COLORS.textColor.color5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  statusDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: COLORS.greenColor.color1,
    marginRight: scale(8),
  },
  statusText: {
    fontSize: moderateScale(12),
    color: COLORS.textColor.color2.one,
    fontWeight: '500',
  },
  kycBadge: {
    backgroundColor: COLORS.yellowColor.color1,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(10),
    marginTop: verticalScale(8),
    alignSelf: 'flex-start',
  },
  kycText: {
    fontSize: moderateScale(12),
    color: COLORS.yellowColor.color2,
    fontWeight: '600',
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
