import React, { useState, useEffect } from 'react';
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
  EditPenIcon,
  ShieldCheckIcon,
} from '../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import DriverProfileHeader from '../../components/common/DriverProfileHeader';
import { useUpdateDriver } from '../../hooks/useAuth';
import { Asset } from 'react-native-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { AlertHelper } from '../../components/common/AlertPopup';
import ImagePickerModal from '../../components/common/ImagePickerModal';
import { useImageSelection } from '../../helpers/useImageSelection';
import SvgIcon from '../../helpers/svgComponents';

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
        navigation.navigate('Home', { screen: 'Profile' } as any);
      });
    },
    onError: (error) => {
      AlertHelper.error('Error', error.message || 'Failed to update status');
    }
  });

  const { mutate: updateDriverPhoto, isPending: isUpdatingPhoto } = useUpdateDriver({
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
      updateDriverPhoto({
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

  const [statuses, setStatuses] = useState({
    available: false,
    sleeping: false,
    driving: false,
  });

  useEffect(() => {
    if (driver?.status) {
      setStatuses({
        available: driver.status === 'available',
        sleeping: driver.status === 'on_leave',
        driving: driver.status === 'assigned',
      });
    }
  }, [driver?.status]);

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

    // Driver is active (is_active: true) if status is Available or Driving. If Sleeping (on_leave), they are inactive.
    const isActivePayload = currentStatus === 'available' || currentStatus === 'assigned';

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
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <DriverProfileHeader
          driver={driver}
          imageSize={60}
          showEditButton={true}
          isUpdating={isUpdatingPhoto}
          onEditPress={() => setIsPickerVisible(true)}
          containerStyle={{ paddingHorizontal: scale(20), marginBottom: verticalScale(40) }}
        />

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
