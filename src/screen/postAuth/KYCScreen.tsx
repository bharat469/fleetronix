import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
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
  CloseCircleIcon,
} from '../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

const FolderIcon = () => (
  <View style={{ width: 24, height: 24 }}>
    <View style={{ position: 'absolute', bottom: 2, width: 20, height: 14, borderWidth: 1.5, borderColor: '#CA2027', borderRadius: 2 }} />
    <View style={{ position: 'absolute', top: 4, width: 10, height: 4, backgroundColor: '#CA2027', borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
  </View>
);

const DocSection = ({ label, fileName, status, statusType, onRemove }: any) => {
  const isVerified = statusType === 'verified';
  const isError = statusType === 'error';

  return (
    <View style={styles.docSection}>
      <View style={styles.docMainRow}>
        <Text style={styles.docLabelTitle}>{label}</Text>
        <View style={styles.dashInputWrapper}>
          <Text style={styles.fileNameText} numberOfLines={1}>{fileName || `Upload ${label}`}</Text>
        </View>
        <TouchableOpacity style={styles.docActionIcon}>
          {isVerified || isError ? (
             <CloseCircleIcon color="#D1D1D1" />
          ) : (
            <FolderIcon />
          )}
        </TouchableOpacity>
      </View>

      {status && (
        <View style={[
          styles.statusBanner,
          isVerified && styles.verifiedBanner,
          isError && styles.errorBanner
        ]}>
          <View style={styles.statusInner}>
             <Text style={styles.emojiText}>{isVerified ? '✌️' : '⚠️'}</Text>
             <Text style={[
               styles.statusTextContent,
               isVerified && styles.verifiedText,
               isError && styles.errorText
             ]}>
               {status}
             </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const KYCScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);
  const { data: driverData } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KYC</Text>
        </View>
        <TouchableOpacity>
          <SearchIcon />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.sectionHeading}>Documents</Text>

          <DocSection
            label="Aadhar"
            fileName="Aadhar453.pdf"
            status="Aadhar documents verified"
            statusType="verified"
          />

          <DocSection
            label="PAN"
            fileName="PAN Card.pdf"
            status="PAN not verified due to mismatch of address proof."
            statusType="error"
          />

          <DocSection
            label="License"
            fileName="drivinglicense.pdf"
            status="driving license verified"
            statusType="verified"
          />
        </View>
      </ScrollView>

      {/* Primary Submit Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.submitBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Status')}
        >
          <ShieldCheckIcon />
          <Text style={styles.submitBtnText}>Submit</Text>
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
  scrollContent: {
    paddingBottom: verticalScale(100),
  },
  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    marginVertical: verticalScale(15),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: verticalScale(20),
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
    marginTop: verticalScale(10),
  },
  sectionHeading: {
    fontSize: moderateScale(12),
    color: '#A0A0A0',
    marginBottom: verticalScale(20),
  },
  docSection: {
    marginBottom: verticalScale(30),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: verticalScale(25),
  },
  docMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(15),
  },
  docLabelTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#424242',
    width: '25%',
  },
  dashInputWrapper: {
    flex: 1,
    height: verticalScale(45),
    borderWidth: 1.5,
    borderColor: 'rgba(202, 32, 39, 0.3)',
    borderStyle: 'dashed',
    borderRadius: scale(12),
    justifyContent: 'center',
    paddingHorizontal: scale(15),
    marginHorizontal: scale(10),
  },
  fileNameText: {
    fontSize: moderateScale(12),
    color: '#A0A0A0',
  },
  docActionIcon: {
    width: scale(24),
    alignItems: 'center',
  },
  statusBanner: {
    width: '100%',
    borderRadius: scale(15),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
  },
  verifiedBanner: {
    backgroundColor: '#E8F5E9',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
  },
  statusInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: moderateScale(16),
    marginRight: scale(10),
  },
  statusTextContent: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    flex: 1,
  },
  verifiedText: {
    color: '#2E7D32',
  },
  errorText: {
    color: '#000',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: scale(10),
  },
});

export default KYCScreen;
