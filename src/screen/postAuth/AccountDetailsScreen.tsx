import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useDriverInfo, useUpdateDriver } from '../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Asset } from 'react-native-image-picker';
import i18next from 'i18next';
import { pickImageFromLibrary, takePhoto as takePhotoHelper } from '../../helpers/imagePickerHelper';
import { COLORS } from '../../helpers/values/colors';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { AlertHelper } from '../../components/common/AlertPopup';
import {
  BackArrowIcon,
  EditPenIcon,
  HomeHouseIcon,
  MoreDotsIcon,
  ShareArrowIcon,
  CloseCircleIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  EyeIcon,
  DownloadIcon,
} from '../../assets/svgIcons';
import SvgIcon from '../../helpers/svgComponents';
import DriverProfileHeader from '../../components/common/DriverProfileHeader';

import ImagePickerModal from '../../components/common/ImagePickerModal';
import { useImageSelection } from '../../helpers/useImageSelection';
import { resolveImageUrl } from '../../helpers/urlHelper';
import { downloadFile } from '../../helpers/downloadHelper';

const InputField = ({ label, value, onChangeText, keyboardType = 'default', prefix = '', errorKey, errors, setErrors }: any) => (
  <View style={styles.inputContainer}>
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, errors[errorKey] ? styles.inputWrapperError : null]}>
        {prefix ? (
          <View style={styles.prefixContainer}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        ) : null}
        <TextInput
          style={[styles.input, prefix ? styles.inputWithPrefix : null]}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            if (errors[errorKey]) setErrors((prev: any) => ({ ...prev, [errorKey]: null }));
          }}
          keyboardType={keyboardType}
          placeholderTextColor={COLORS.textColor.color2.three}
        />
      </View>
    </View>
    {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
  </View>
);

const DocumentItem = ({ label, docName, onPick, onRemove, onView, onDownload, errorKey, errors }: any) => (
  <View style={styles.inputContainer}>
    <View style={styles.docRow}>
      <Text style={styles.docLabelSide}>{label}</Text>
      <View style={styles.docActions}>
        <TouchableOpacity
          style={[styles.docUploadArea, errors[errorKey] ? styles.docUploadAreaError : null]}
          onPress={onPick}
          activeOpacity={0.7}
        >
          <Text style={[styles.docName, !docName && errors[errorKey] ? styles.docNameError : null]} numberOfLines={1}>
            {docName?.fileName || (typeof docName === 'string' ? docName : 'Upload Document')}
          </Text>
        </TouchableOpacity>
        {docName ? (
          <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
            <CloseCircleIcon />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>

    {docName && (onView || onDownload) ? (
      <View style={styles.docActionRow}>
        {onView && (
          <TouchableOpacity style={styles.actionBtnOutline} onPress={onView} activeOpacity={0.7}>
            <EyeIcon color="#CA2027" width={14} height={14} style={styles.actionBtnIcon} />
            <Text style={styles.actionBtnLabel}>View Document</Text>
          </TouchableOpacity>
        )}
        {onDownload && (
          <TouchableOpacity style={styles.actionBtnOutline} onPress={onDownload} activeOpacity={0.7}>
            <DownloadIcon color="#CA2027" width={14} height={14} style={styles.actionBtnIcon} />
            <Text style={styles.actionBtnLabel}>Download</Text>
          </TouchableOpacity>
        )}
      </View>
    ) : null}

    {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
  </View>
);

const AccountDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);

  const { data: driverData, isLoading } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

  const { mutate: updateDriverProfile, isPending: isUpdatingProfilePic } = useUpdateDriver({
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

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateDriver({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverInfo', driverId] });
      AlertHelper.success('Success', 'Profile updated successfully');
    },
    onError: (error) => {
      AlertHelper.error('Error', error.message || 'Failed to update profile');
    }
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    mobile: '',
  });

  const [documents, setDocuments] = useState<any>({
    aadhar: '',
    pan: '',
    license: '',
  });

  const [errors, setErrors] = useState<any>({});
  const [showAddressMenu, setShowAddressMenu] = useState(false);

  React.useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.first_name || driver.full_name?.split(' ')[0] || '',
        lastName: driver.last_name || driver.full_name?.split(' ').slice(1).join(' ') || '',
        mobile: driver.phone_number || '',
      });
      setDocuments({
        aadhar: driver.aadhar_path ? driver.aadhar_path.split('/').pop() : '',
        pan: driver.pan_card_path ? driver.pan_card_path.split('/').pop() : '',
        license: driver.driving_licence_path ? driver.driving_licence_path.split('/').pop() : '',
      });
    }
  }, [driver]);

  const validate = () => {
    let newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = 'Required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Required';



    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Required';
    } else if (formData.mobile.replace(/[^0-9]/g, '').length !== 10) {
      newErrors.mobile = 'Must be 10 digits';
    }

    if (!documents.aadhar) newErrors.aadhar = 'Upload Aadhaar';
    if (!documents.pan) newErrors.pan = 'Upload PAN';
    if (!documents.license) newErrors.license = 'Upload License';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeleteAddress = () => {
    AlertHelper.confirm(
      'Delete Address',
      'Are you sure you want to delete this address?',
      () => {
        const payload = {
          driverId: driverId || '',
          token: userToken || '',
          data: { address: '' }
        };
        updateProfile(payload);
        setShowAddressMenu(false);
      }
    );
  };

  const removeDoc = (docKey: keyof typeof documents) => {
    setDocuments((prev: any) => ({ ...prev, [docKey]: '' }));
  };



  const validateAsset = (asset: any): boolean => {
    const isHighRes = (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) ||
                      (asset.width && asset.width > 3000) ||
                      (asset.height && asset.height > 3000);
    if (isHighRes) {
      Alert.alert(
        i18next.t('error', 'Error'),
        i18next.t('high_res_error', 'High-resolution image cannot be uploaded. Please upload a smaller or compressed image.')
      );
      return false;
    }
    return true;
  };

  const handlePickImage = (docKey: keyof typeof documents) => {
    Alert.alert(
      'Upload Document',
      'Select the source for your document image',
      [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const response = await takePhotoHelper({ quality: 0.8 });
              if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                if (!validateAsset(asset)) return;
                setDocuments((prev: any) => ({ ...prev, [docKey]: asset }));
                setErrors((prev: any) => ({ ...prev, [docKey]: null }));
              }
            } catch (error) {
              console.error('Take photo error:', error);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            try {
              const response = await pickImageFromLibrary({ quality: 0.8 });
              if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                if (!validateAsset(asset)) return;
                setDocuments((prev: any) => ({ ...prev, [docKey]: asset }));
                setErrors((prev: any) => ({ ...prev, [docKey]: null }));
              }
            } catch (error) {
              console.error('Pick image error:', error);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleViewDocument = async (docKey: 'aadhar' | 'pan' | 'license') => {
    try {
      const doc = documents[docKey];
      let url = '';
      if (doc && typeof doc === 'object' && doc.uri) {
        url = doc.uri;
      } else {
        const path = 
          docKey === 'aadhar' ? driver?.aadhar_path :
          docKey === 'pan' ? driver?.pan_card_path :
          driver?.driving_licence_path;
          
        url = path 
          ? resolveImageUrl(path) 
          : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      }

      if (!url) {
        AlertHelper.error('Error', 'No document file URL found.');
        return;
      }

      await Linking.openURL(url);
    } catch (error: any) {
      AlertHelper.error('Error', 'Unable to open document: ' + error.message);
    }
  };

  const handleDownloadDocument = async (docKey: 'aadhar' | 'pan' | 'license') => {
    const doc = documents[docKey];
    if (doc && typeof doc === 'object' && doc.uri) {
      AlertHelper.show('info', 'Local File', 'This document is selected locally from your device and is not yet uploaded to the server.');
      return;
    }

    const path = 
      docKey === 'aadhar' ? driver?.aadhar_path :
      docKey === 'pan' ? driver?.pan_card_path :
      driver?.driving_licence_path;
      
    const url = path 
      ? resolveImageUrl(path) 
      : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    const label = 
      docKey === 'aadhar' ? 'Aadhaar' :
      docKey === 'pan' ? 'PAN_Card' :
      'Driving_License';

    await downloadFile(url, label);
  };

  const handleSubmit = () => {
    if (validate()) {
      const changedData: any = {};

      // Compare text fields with original driver data
      if (formData.name !== (driver?.first_name || '')) {
        changedData.first_name = formData.name;
      }
      if (formData.lastName !== (driver?.last_name || '')) {
        changedData.last_name = formData.lastName;
      }

      if (formData.mobile !== (driver?.phone_number || '')) {
        changedData.phone_number = formData.mobile;
      }

      // Documents: only send if a new one was picked (which stores an object instead of a string/path)
      if (documents.aadhar && typeof documents.aadhar === 'object') {
        changedData.aadhar = documents.aadhar;
      }
      if (documents.license && typeof documents.license === 'object') {
        changedData.driving_licence = documents.license;
      }
      if (documents.pan && typeof documents.pan === 'object') {
        changedData.pan_card = documents.pan;
      }

      if (Object.keys(changedData).length === 0) {
        navigation.navigate('AddAddress');
        return;
      }

      const payload = {
        driverId: driverId || '',
        token: userToken || '',
        data: changedData
      };
      updateProfile(payload);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <DriverProfileHeader
            driver={driver}
            imageSize={70}
            showEditButton={true}
            isUpdating={isUpdatingProfilePic}
            onEditPress={() => setIsPickerVisible(true)}
            containerStyle={{ marginVertical: verticalScale(20) }}
          />

          {/* Dynamic Address Section */}
          {!driver?.address ? (
            <TouchableOpacity
              style={styles.addAddressBar}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AddAddress')}
            >
              <View style={styles.addAddressInner}>
                <View style={styles.plusIconWrapper}>
                  <Text style={styles.plusText}>+</Text>
                </View>
                <Text style={styles.addAddressLabelText}>Add Addresses</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
          ) : (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <HomeHouseIcon />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressTitle}>Home</Text>
                  <Text style={styles.addressText}>{driver.address}</Text>
                  <View style={styles.addressActions}>
                    <View style={{ position: 'relative' }}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => setShowAddressMenu(!showAddressMenu)}
                      >
                        <MoreDotsIcon />
                      </TouchableOpacity>

                      {showAddressMenu && (
                        <View style={styles.addressPopup}>
                          <TouchableOpacity
                            style={styles.popupItem}
                            onPress={() => {
                              setShowAddressMenu(false);
                              navigation.navigate('AddAddress');
                            }}
                          >
                            <Text style={styles.popupText}>Edit</Text>
                          </TouchableOpacity>
                          <View style={styles.popupDivider} />
                          <TouchableOpacity
                            style={styles.popupItem}
                            onPress={handleDeleteAddress}
                          >
                            <Text style={styles.popupText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity style={styles.iconBtn}><ShareArrowIcon /></TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Form Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <InputField
              label="Name"
              errorKey="name"
              errors={errors}
              setErrors={setErrors}
              value={formData.name}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, name: text }))}
            />
            <InputField
              label="Last Name"
              errorKey="lastName"
              errors={errors}
              setErrors={setErrors}
              value={formData.lastName}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, lastName: text }))}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Details</Text>
            <InputField
              label="Mobile"
              errorKey="mobile"
              errors={errors}
              setErrors={setErrors}
              value={formData.mobile}
              prefix="+91"
              keyboardType="phone-pad"
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, mobile: text }))}
            />

          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <DocumentItem
              label="Aadhaar"
              errorKey="aadhar"
              errors={errors}
              docName={documents.aadhar}
              onPick={() => handlePickImage('aadhar')}
              onRemove={() => removeDoc('aadhar')}
              onView={() => handleViewDocument('aadhar')}
              onDownload={() => handleDownloadDocument('aadhar')}
            />
            <DocumentItem
              label="PAN"
              errorKey="pan"
              errors={errors}
              docName={documents.pan}
              onPick={() => handlePickImage('pan')}
              onRemove={() => removeDoc('pan')}
              onView={() => handleViewDocument('pan')}
              onDownload={() => handleDownloadDocument('pan')}
            />
            <DocumentItem
              label="License"
              errorKey="license"
              errors={errors}
              docName={documents.license}
              onPick={() => handlePickImage('license')}
              onRemove={() => removeDoc('license')}
              onView={() => handleViewDocument('license')}
              onDownload={() => handleDownloadDocument('license')}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isUpdating && { opacity: 0.7 }]}
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
        </ScrollView>
      </KeyboardAvoidingView>

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
    color: '#1E1A57', // Dark navy blue from SS
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(30),
  },
  addressCard: {
    backgroundColor: 'rgba(255, 245, 245, 0.5)',
    borderRadius: scale(15),
    padding: scale(15),
    marginVertical: verticalScale(10),
  },
  addressHeader: {
    flexDirection: 'row',
  },
  addressInfo: {
    flex: 1,
    marginLeft: scale(15),
  },
  addressTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1E0909',
  },
  addressText: {
    fontSize: moderateScale(13),
    color: COLORS.textColor.color2.one,
    marginTop: verticalScale(4),
    lineHeight: verticalScale(18),
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: verticalScale(10),
  },
  iconBtn: {
    marginRight: scale(15),
  },
  addressPopup: {
    position: 'absolute',
    top: verticalScale(30),
    left: 0,
    backgroundColor: 'white',
    width: scale(100),
    borderRadius: scale(8),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  popupItem: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
  },
  popupText: {
    fontSize: moderateScale(14),
    color: '#1E0909',
    fontWeight: '400',
  },
  popupDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  section: {
    marginTop: verticalScale(30),
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: COLORS.textColor.color2.one,
    marginBottom: verticalScale(10),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: moderateScale(14),
    color: COLORS.textColor.color2.one,
    width: '30%',
  },
  inputWrapper: {
    flexDirection: 'row',
    width: '65%',
    height: verticalScale(45),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputWrapperError: {
    borderColor: COLORS.primary,
  },
  inputContainer: {
    marginBottom: verticalScale(15),
  },
  errorText: {
    color: COLORS.primary,
    fontSize: moderateScale(11),
    textAlign: 'right',
    marginTop: verticalScale(2),
  },
  prefixContainer: {
    height: '100%',
    paddingHorizontal: scale(10),
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  prefixText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: COLORS.textColor.color1,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: scale(15),
    fontSize: moderateScale(14),
    color: COLORS.textColor.color1,
    fontWeight: '500',
  },
  inputWithPrefix: {
    paddingLeft: scale(10),
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docLabelSide: {
    fontSize: moderateScale(16),
    color: '#8E8E93',
    width: '30%',
    fontWeight: '400',
  },
  docActions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '65%',
    justifyContent: 'space-between',
  },
  docUploadArea: {
    flex: 1,
    height: verticalScale(50),
    borderRadius: scale(25),
    borderWidth: 1.5,
    borderColor: '#CA2027',
    borderStyle: 'dashed',
    justifyContent: 'center',
    paddingHorizontal: scale(20),
    backgroundColor: '#FFF9F9',
  },
  docUploadAreaError: {
    borderColor: '#FF3B30',
  },
  docName: {
    fontSize: moderateScale(14),
    color: '#444',
    textAlign: 'center',
    fontWeight: '500',
  },
  docNameError: {
    color: '#FF3B30',
  },
  removeBtn: {
    marginLeft: scale(10),
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: verticalScale(60),
    borderRadius: scale(15),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(40),
  },
  submitBtnText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginLeft: scale(10),
  },
  addAddressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    marginBottom: verticalScale(10),
  },
  addAddressInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusIconWrapper: {
    width: scale(20),
    height: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  plusText: {
    fontSize: moderateScale(20),
    color: '#CA2027',
    fontWeight: '400',
    marginTop: -verticalScale(2),
  },
  addAddressLabelText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#1E1A57',
  },
  docActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(10),
    paddingLeft: '30%',
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
    fontSize: moderateScale(11),
    color: '#CA2027',
    fontWeight: '600',
  },
});

export default AccountDetailsScreen;
