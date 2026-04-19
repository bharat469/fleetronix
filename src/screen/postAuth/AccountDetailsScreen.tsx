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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useDriverInfo, useUpdateDriver } from '../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { COLORS } from '../../helpers/values/colors';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { AlertHelper } from '../../components/common/AlertPopup';
import {
  BackArrowIcon,
  SearchIcon,
  EditPenIcon,
  HomeHouseIcon,
  MoreDotsIcon,
  ShareArrowIcon,
  CloseCircleIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
} from '../../assets/svgIcons';
import SvgIcon from '../../helpers/svgComponents';

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

const DocumentItem = ({ label, docName, onPick, onRemove, errorKey, errors }: any) => (
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
    {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
  </View>
);

const AccountDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);

  const { data: driverData, isLoading } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

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
    email: '',
  });

  const [documents, setDocuments] = useState<any>({
    aadhar: 'adhar.png',
    pan: 'pan.png',
    license: 'license.png',
  });

  const [errors, setErrors] = useState<any>({});
  const [showAddressMenu, setShowAddressMenu] = useState(false);

  React.useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.first_name || driver.full_name?.split(' ')[0] || '',
        lastName: driver.last_name || driver.full_name?.split(' ').slice(1).join(' ') || '',
        mobile: driver.phone_number || '',
        email: driver.email || '',
      });
      setDocuments({
        aadhar: driver.aadhar_path ? 'adhar.png' : '',
        pan: driver.pan_card_path ? 'pan.png' : '',
        license: driver.driving_licence_path ? 'license.png' : '',
      });
    }
  }, [driver]);

  const validate = () => {
    let newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = 'Required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Required';
    } else if (formData.mobile.replace(/[^0-9]/g, '').length !== 10) {
      newErrors.mobile = 'Must be 10 digits';
    }

    if (!documents.aadhar) newErrors.aadhar = 'Upload Aadhar';
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



  const handlePickImage = (docKey: keyof typeof documents) => {
    // Note: handlePickImage uses a custom Alert with 3 buttons (Camera/Gallery/Cancel).
    // Our AlertHelper currently supports only 2 buttons for confirm.
    // For now, I'll keep this as standard Alert OR update AlertHelper.
    // Given the request, I'll keep this one as standard if I want to maintain 3 buttons, 
    // OR change it to a simpler confirm UI.
    // I will keep it as standard Alert for now because 3-option alerts are specific to pickers.
    // Update: I will convert it to a 2-step process or just leave it for now if focus is on Success/Error.
    
    Alert.alert(
      'Upload Document',
      'Select the source for your document image',
      [
        {
          text: 'Camera',
          onPress: () => {
            launchCamera({ mediaType: 'photo', quality: 0.8 }, (response) => {
              if (response.assets && response.assets.length > 0) {
                setDocuments((prev: any) => ({ ...prev, [docKey]: response.assets![0] }));
                setErrors((prev: any) => ({ ...prev, [docKey]: null }));
              }
            });
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
              if (response.assets && response.assets.length > 0) {
                setDocuments((prev: any) => ({ ...prev, [docKey]: response.assets![0] }));
                setErrors((prev: any) => ({ ...prev, [docKey]: null }));
              }
            });
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
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
      // if (formData.email !== (driver?.email || '')) {
      //   changedData.email = formData.email;
      // }
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
        <TouchableOpacity>
          <SearchIcon />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profilePicWrapper}>
              <Image
                source={{ uri: driver?.photo_path || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                style={styles.profilePic}
              />
              <TouchableOpacity style={styles.editPicBtn}>
                <EditPenIcon />
              </TouchableOpacity>
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
            <InputField
              label="Email"
              errorKey="email"
              errors={errors}
              setErrors={setErrors}
              value={formData.email}
              keyboardType="email-address"
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, email: text }))}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <DocumentItem
              label="Aadhar"
              errorKey="aadhar"
              errors={errors}
              docName={documents.aadhar}
              onPick={() => handlePickImage('aadhar')}
              onRemove={() => removeDoc('aadhar')}
            />
            <DocumentItem
              label="PAN"
              errorKey="pan"
              errors={errors}
              docName={documents.pan}
              onPick={() => handlePickImage('pan')}
              onRemove={() => removeDoc('pan')}
            />
            <DocumentItem
              label="License"
              errorKey="license"
              errors={errors}
              docName={documents.license}
              onPick={() => handlePickImage('license')}
              onRemove={() => removeDoc('license')}
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
  profileSection: {
    flexDirection: 'row',
    marginVertical: verticalScale(20),
    alignItems: 'center',
  },
  profilePicWrapper: {
    position: 'relative',
  },
  profilePic: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: '#F5F5F5',
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
  },
  profileInfo: {
    marginLeft: scale(20),
  },
  userName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
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
    fontSize: moderateScale(14),
    color: COLORS.textColor.color2.one,
    fontWeight: '500',
  },
  kycBadge: {
    backgroundColor: COLORS.yellowColor.color1,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(2),
    borderRadius: scale(10),
    marginTop: verticalScale(6),
    alignSelf: 'flex-start',
  },
  kycText: {
    fontSize: moderateScale(12),
    color: COLORS.yellowColor.color2,
    fontWeight: '600',
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
});

export default AccountDetailsScreen;
