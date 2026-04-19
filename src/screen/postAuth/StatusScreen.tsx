import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useDriverInfo } from '../../hooks/useAuth';
import { COLORS } from '../../helpers/values/colors';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import {
  BackArrowIcon,
  SearchIcon,
  EditPenIcon,
  ShieldCheckIcon,
} from '../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import SvgIcon from '../../helpers/svgComponents';
import { useUpdateDriver } from '../../hooks/useAuth';
import { AlertHelper } from '../../components/common/AlertPopup';
import { useQueryClient } from '@tanstack/react-query';

const StatusRow = ({ label, iconName, isActive, onToggle }: any) => (
  <View style={styles.statusRowItem}>
    <View style={styles.statusLabelGroup}>
      <View style={styles.statusIconBox}>
        <SvgIcon name={iconName} width={24} height={24} color={isActive ? '#CA2027' : '#8E8E93'} />
      </View>
      <Text style={[styles.statusLabelText, isActive && styles.activeLabelText]}>{label}</Text>
    </View>
    <Switch
      trackColor={{ false: '#D1D1D1', true: 'rgba(202, 32, 39, 0.4)' }}
      thumbColor={isActive ? '#CA2027' : '#F4F3F4'}
      ios_backgroundColor="#D1D1D1"
      onValueChange={onToggle}
      value={isActive}
    />
  </View>
);

const StatusScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);
  const { data: driverData, refetch } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateDriver({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverInfo', driverId] });
      AlertHelper.success('Success', 'Status updated successfully', () => {
        navigation.navigate('Home');
      });
    },
    onError: (error) => {
      AlertHelper.error('Error', error.message || 'Failed to update status');
    }
  });

  const [statuses, setStatuses] = useState({
    available: driver?.status === 'available',
    sleeping: driver?.status === 'sleeping',
    driving: driver?.status === 'driving',
  });

  const handleToggle = (key: string) => {
    // Mutual exclusivity: only one can be true at a time
    setStatuses({
      available: key === 'available',
      sleeping: key === 'sleeping',
      driving: key === 'driving',
    });
  };

  const handleSubmit = () => {
    let currentStatus = 'available';
    if (statuses.sleeping) currentStatus = 'on_leave';
    if (statuses.driving) currentStatus = 'assigned';

    // is_active is false if sleeping, true otherwise
    const isActivePayload = currentStatus !== 'on_leave';

    const payload = {
      driverId: driverId || '',
      token: userToken || '',
      data: {
        status: currentStatus,
        is_active: isActivePayload
      }
    };

    updateProfile(payload);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Status</Text>
        </View>
        <TouchableOpacity>
          <SearchIcon />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profilePicWrapper}>
            <Image
              source={{ uri: driver?.photo_path || 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.profilePic}
            />
            <View style={styles.editPicBtn}>
              <EditPenIcon />
            </View>
          </View>
          <View style={styles.profileInfo}>
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

        <View style={styles.content}>
          <StatusRow
            label="Available"
            iconName="accountMenuIcon"
            isActive={statuses.available}
            onToggle={() => handleToggle('available')}
          />
          <StatusRow
            label="Sleeping"
            iconName="sleepIcon"
            isActive={statuses.sleeping}
            onToggle={() => handleToggle('sleeping')}
          />
          <StatusRow
            label="Driving"
            iconName="drivingIcon"
            isActive={statuses.driving}
            onToggle={() => handleToggle('driving')}
          />
        </View>
      </ScrollView>

      {/* Primary Submit Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.submitBtn}
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <ShieldCheckIcon />
              <Text style={styles.submitBtnText}>Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: scale(15),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#1E1A57',
  },
  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    marginVertical: verticalScale(15),
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  profilePicWrapper: {
    position: 'relative',
  },
  profilePic: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: '#F5F5F5',
  },
  editPicBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  profileInfo: {
    marginLeft: scale(15),
  },
  userName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1E1A57',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(2),
  },
  statusDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: COLORS.greenColor.color1,
    marginRight: scale(6),
  },
  statusText: {
    fontSize: moderateScale(12),
    color: '#666',
  },
  kycBadge: {
    backgroundColor: COLORS.yellowColor.color1,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(2),
    borderRadius: scale(8),
    marginTop: verticalScale(4),
    alignSelf: 'flex-start',
  },
  kycText: {
    fontSize: moderateScale(10),
    color: COLORS.yellowColor.color2,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: scale(20),
    gap: verticalScale(25),
  },
  statusRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(5),
  },
  statusLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconBox: {
    width: scale(40),
    alignItems: 'center',
  },
  statusLabelText: {
    fontSize: moderateScale(16),
    color: '#1E1A57',
    marginLeft: scale(10),
    fontWeight: '400',
  },
  activeLabelText: {
    fontWeight: '500',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingBottom: verticalScale(40),
    paddingHorizontal: scale(30),
  },
  submitBtn: {
    backgroundColor: '#CA2027',
    height: verticalScale(55),
    borderRadius: scale(12),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: scale(10),
  },
});

export default StatusScreen;
