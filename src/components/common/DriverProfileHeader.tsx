import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { COLORS } from '../../helpers/values/colors';
import { EditPenIcon } from '../../assets/svgIcons';
import { resolveImageUrl } from '../../helpers/urlHelper';

const DEFAULT_PROFILE_PIC = 'https://randomuser.me/api/portraits/men/32.jpg';

interface DriverProfileHeaderProps {
  driver: any;
  onEditPress?: () => void;
  showEditButton?: boolean;
  isUpdating?: boolean;
  containerStyle?: ViewStyle;
  imageSize?: number;
}

const DriverProfileHeader = ({
  driver,
  onEditPress,
  showEditButton = false,
  isUpdating = false,
  containerStyle,
  imageSize = 80,
}: DriverProfileHeaderProps) => {
  const scaledSize = scale(imageSize);
  const borderRadius = scaledSize / 2;
  const [imageError, setImageError] = useState(false);

  // Reset error state when photo path changes (e.g., after upload)
  React.useEffect(() => {
    setImageError(false);
  }, [driver?.photo_path]);

  const resolvedUrl = resolveImageUrl(driver?.photo_path);
  console.log('[DriverProfileHeader] 🔍 driver.photo_path:', driver?.photo_path, '→ resolved:', resolvedUrl);
  const imageSource = imageError
    ? { uri: DEFAULT_PROFILE_PIC }
    : { uri: resolvedUrl };

  return (
    <View style={[styles.userInfoSection, containerStyle]}>
      <View style={styles.profilePicWrapper}>
        <Image
          source={imageSource}
          style={[
            styles.profilePic,
            { width: scaledSize, height: scaledSize, borderRadius }
          ]}
          onError={(e) => {
            console.warn('[DriverProfileHeader] Image load failed:', resolvedUrl, e.nativeEvent.error);
            setImageError(true);
          }}
        />
        {isUpdating && (
          <View style={[styles.loadingOverlay, { borderRadius }]}>
            <ActivityIndicator color="white" />
          </View>
        )}
        {showEditButton && (
          <TouchableOpacity
            style={styles.editPicBtn}
            activeOpacity={0.8}
            onPress={onEditPress}
            disabled={isUpdating}
          >
            <EditPenIcon />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.userDetails}>
        <Text style={styles.userName}>{driver?.full_name || driver?.first_name || 'Driver'}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: driver?.status === 'available' ? COLORS.greenColor.color1 : '#FF3B30' },
            ]}
          />
          <Text style={styles.statusText}>
            {driver?.status ? driver.status.charAt(0).toUpperCase() + driver.status.slice(1) : 'Available'}
          </Text>
        </View>
        <View
          style={[
            styles.kycBadge,
            { backgroundColor: driver?.kyc_status === 'verified' ? '#E8F5E9' : COLORS.yellowColor.color1 },
          ]}
        >
          <Text
            style={[
              styles.kycText,
              { color: driver?.kyc_status === 'verified' ? '#4CAF50' : COLORS.yellowColor.color2 },
            ]}
          >
            {driver?.kyc_status
              ? `KYC ${driver.kyc_status.charAt(0).toUpperCase() + driver.kyc_status.slice(1)}`
              : 'KYC Pending'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userInfoSection: {
    flexDirection: 'row',
    paddingVertical: verticalScale(20),
    alignItems: 'center',
  },
  profilePicWrapper: {
    position: 'relative',
  },
  profilePic: {
    backgroundColor: '#F0F0F0',
  },
  editPicBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default DriverProfileHeader;
