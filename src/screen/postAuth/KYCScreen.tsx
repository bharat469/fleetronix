import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useDriverInfo } from '../../hooks/useAuth';
import { COLORS } from '../../helpers/values/colors';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import {
  BackArrowIcon,
  EditPenIcon,
  ShieldCheckIcon,
  CloseCircleIcon,
  EyeIcon,
  DownloadIcon,
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
import { resolveImageUrl } from '../../helpers/urlHelper';
import { downloadFile } from '../../helpers/downloadHelper';

const FolderIcon = () => (
  <View style={{ width: 24, height: 24 }}>
    <View style={{ position: 'absolute', bottom: 2, width: 20, height: 14, borderWidth: 1.5, borderColor: '#CA2027', borderRadius: 2 }} />
    <View style={{ position: 'absolute', top: 4, width: 10, height: 4, backgroundColor: '#CA2027', borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
  </View>
);

const DocSection = ({ label, fileName, status, statusType, onRemove, onView, onDownload }: any) => {
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

      {(onView || onDownload) && (
        <View style={styles.docActionRow}>
          {onView && (
            <TouchableOpacity style={styles.actionBtnOutline} onPress={onView} activeOpacity={0.7}>
              <EyeIcon color="#CA2027" width={16} height={16} style={styles.actionBtnIcon} />
              <Text style={styles.actionBtnLabel}>View Document</Text>
            </TouchableOpacity>
          )}
          {onDownload && (
            <TouchableOpacity style={styles.actionBtnOutline} onPress={onDownload} activeOpacity={0.7}>
              <DownloadIcon color="#CA2027" width={16} height={16} style={styles.actionBtnIcon} />
              <Text style={styles.actionBtnLabel}>Download</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
  const route = useRoute<RouteProp<RootStackParamList, 'KYC'>>();
  const fromAccount = route.params?.fromAccount;
  const queryClient = useQueryClient();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);
  const { data: driverData } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

  const aadharUrl = driver?.aadhar_path 
    ? resolveImageUrl(driver.aadhar_path) 
    : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    
  const panUrl = driver?.pan_card_path 
    ? resolveImageUrl(driver.pan_card_path) 
    : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    
  const licenseUrl = driver?.driving_licence_path 
    ? resolveImageUrl(driver.driving_licence_path) 
    : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  const handleViewDoc = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error: any) {
      AlertHelper.error('Error', 'Unable to open document: ' + error.message);
    }
  };

  const handleDownloadDoc = async (url: string, label: string) => {
    await downloadFile(url, label);
  };

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

  const handleSubmit = () => {
    AlertHelper.success('Success', 'KYC documents submitted successfully!', () => {
      navigation.navigate('Status');
    });
  };

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
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <DriverProfileHeader
          driver={driver}
          imageSize={60}
          showEditButton={true}
          isUpdating={isUpdating}
          onEditPress={() => setIsPickerVisible(true)}
          containerStyle={styles.profileHeaderContainer}
        />

        <View style={styles.content}>
          <Text style={styles.sectionHeading}>Documents</Text>

          <DocSection
            label="Aadhaar"
            fileName={driver?.aadhar_path ? driver.aadhar_path.split('/').pop() : "Not Uploaded"}
            status={driver?.aadhar_path ? "Aadhaar documents verified" : "Aadhaar not uploaded"}
            statusType={driver?.aadhar_path ? "verified" : "error"}
            onView={driver?.aadhar_path ? () => handleViewDoc(aadharUrl) : undefined}
            onDownload={driver?.aadhar_path ? () => handleDownloadDoc(aadharUrl, 'Aadhaar') : undefined}
          />

          <DocSection
            label="PAN"
            fileName={driver?.pan_card_path ? driver.pan_card_path.split('/').pop() : "Not Uploaded"}
            status={driver?.pan_card_path ? "PAN verified" : "PAN not uploaded or pending verification"}
            statusType={driver?.pan_card_path ? "verified" : "error"}
            onView={driver?.pan_card_path ? () => handleViewDoc(panUrl) : undefined}
            onDownload={driver?.pan_card_path ? () => handleDownloadDoc(panUrl, 'PAN_Card') : undefined}
          />

          <DocSection
            label="License"
            fileName={driver?.driving_licence_path ? driver.driving_licence_path.split('/').pop() : "Not Uploaded"}
            status={driver?.driving_licence_path ? "driving license verified" : "driving license not uploaded"}
            statusType={driver?.driving_licence_path ? "verified" : "error"}
            onView={driver?.driving_licence_path ? () => handleViewDoc(licenseUrl) : undefined}
            onDownload={driver?.driving_licence_path ? () => handleDownloadDoc(licenseUrl, 'Driving_License') : undefined}
          />
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {fromAccount && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.8}
            onPress={handleSubmit}
          >
            <ShieldCheckIcon color="white" />
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}

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
  scrollContent: {
    paddingBottom: verticalScale(100),
  },
  profileHeaderContainer: {
    paddingHorizontal: scale(20),
    marginVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: verticalScale(20),
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
  docActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(15),
    paddingLeft: '25%',
    marginLeft: scale(10),
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CA2027',
    borderRadius: scale(8),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    marginRight: scale(10),
    backgroundColor: '#FFF9F9',
  },
  actionBtnIcon: {
    marginRight: scale(6),
  },
  actionBtnLabel: {
    fontSize: moderateScale(12),
    color: '#CA2027',
    fontWeight: '600',
  },
});

export default KYCScreen;
