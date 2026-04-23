import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
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
  SearchIcon,
  EditPenIcon,
  LocationIcon,
  ChevronRightIcon,
} from '../../assets/svgIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import * as authApi from '../../api/authApi';
import { AlertHelper } from '../../components/common/AlertPopup';
import DriverProfileHeader from '../../components/common/DriverProfileHeader';
import { useUpdateDriver } from '../../hooks/useAuth';
import { Asset } from 'react-native-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import ImagePickerModal from '../../components/common/ImagePickerModal';
import { useImageSelection } from '../../helpers/useImageSelection';



const AreaIcon = () => (
  <View style={{ width: scale(20), height: scale(20), borderWidth: 1, borderColor: '#424242', borderStyle: 'dashed', borderRadius: 4 }} />
);

const EnterAddressScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EnterAddress'>>();
  const queryClient = useQueryClient();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);
  const { data: driverData, refetch } = useDriverInfo(driverId || '', userToken || '');
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

  const [formData, setFormData] = useState({
    houseNo: '',
    area: '',
    landmark: '',
    pincode: '',
  });

  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    // Priority 1: Data passed from AddAddressScreen (Selected on map)
    if (route.params?.initialAddress) {
      const fullAddress = route.params.initialAddress;
      const parts = fullAddress.split(',').map((p: string) => p.trim());
      
      // Extract pincode using a more robust regex that searches the entire string
      const pincodeMatch = fullAddress.match(/\b\d{6}\b/);
      
      setFormData({
        houseNo: parts[0] || '',
        area: parts[1] || '',
        landmark: parts.length > 3 ? parts[2] : '',
        pincode: pincodeMatch ? pincodeMatch[0] : '',
      });

      if (route.params.coordinates) {
        setRegion({
          ...region,
          latitude: route.params.coordinates.latitude,
          longitude: route.params.coordinates.longitude,
        });
      }
    }
    // Priority 2: Existing driver data from API
    else if (driver?.address) {
      const parts = driver.address.split(', ');
      if (parts.length >= 3) {
        setFormData({
          houseNo: parts[0] || '',
          area: parts[1] || '',
          landmark: parts.length > 3 ? parts[2] : '',
          pincode: parts[parts.length - 1] || '',
        });
      }
    }
  }, [driver, route.params]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.houseNo || !formData.area || !formData.pincode) {
      AlertHelper.error('Required Fields', 'Please fill in all required fields marked with *');
      return;
    }

    setLoading(true);
    try {
      // Join whole address as one string
      const joinedAddress = `${formData.houseNo}, ${formData.area}${formData.landmark ? `, ${formData.landmark}` : ''}, ${formData.pincode}`;

      const response = await authApi.updateDriver({
        driverId: driverId || '',
        token: userToken || '',
        data: { address: joinedAddress }
      });

      if (response.success) {
        AlertHelper.success('Success', 'Address updated successfully!', () => {
          navigation.navigate('KYC');
        }, 'Next');
        refetch();
      } else {
        AlertHelper.error('Error', response.message || 'Failed to update address');
      }
    } catch (error) {
      console.error('[EnterAddress] Submit Error:', error);
      AlertHelper.error('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <DriverProfileHeader
          driver={driver}
          imageSize={60}
          showEditButton={true}
          isUpdating={isUpdatingProfilePic}
          onEditPress={() => setIsPickerVisible(true)}
          containerStyle={{ paddingHorizontal: scale(20), marginVertical: verticalScale(10), marginBottom: verticalScale(30) }}
        />



        {/* Map Preview Section */}
        <View style={styles.mapPreviewContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
              <View style={styles.customMarker}>
                <LocationIcon color="#FF3B30" width={40} height={40} />
              </View>
            </Marker>
          </MapView>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.mainTitle}>Enter Complete Address</Text>
          <View style={styles.divider} />
          {/* Form Fields */}
          <View style={styles.form}>
            <Text style={styles.label}>Flat / House no / Floor / Building*</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <LocationIcon color="#424242" width={18} height={18} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Flat / House no / Floor / Building*"
                placeholderTextColor="#9E9E9E"
                value={formData.houseNo}
                onChangeText={(text) => handleInputChange('houseNo', text)}
              />
            </View>

            <Text style={styles.label}>Area / Sector / Locality*</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <AreaIcon />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Area / Sector / Locality*"
                placeholderTextColor="#9E9E9E"
                value={formData.area}
                onChangeText={(text) => handleInputChange('area', text)}
              />
            </View>

            <Text style={styles.label}>Nearby landmark (optional)</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <LocationIcon color="#424242" width={18} height={18} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Nearby landmark"
                placeholderTextColor="#9E9E9E"
                value={formData.landmark}
                onChangeText={(text) => handleInputChange('landmark', text)}
              />
            </View>

            <Text style={styles.label}>Pincode*</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <LocationIcon color="#424242" width={18} height={18} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Pincode*"
                placeholderTextColor="#9E9E9E"
                keyboardType="numeric"
                value={formData.pincode}
                onChangeText={(text) => handleInputChange('pincode', text)}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              activeOpacity={0.8}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitBtnText}>Save and Submit</Text>
              )}
            </TouchableOpacity>
          </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: COLORS.textColor.color5,
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
    color: COLORS.textColor.color2.one,
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
  contentCard: {
    backgroundColor: 'white',
    flex: 1,
    borderTopLeftRadius: scale(35),
    borderTopRightRadius: scale(35),
    padding: scale(25),
    minHeight: Dimensions.get('window').height * 0.7,
    marginTop: verticalScale(-35),
  },
  mapPreviewContainer: {
    height: verticalScale(200),
    width: '100%',
    zIndex: -1,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#000',
    marginBottom: verticalScale(25),
  },
  form: {
    gap: verticalScale(15),
  },
  label: {
    fontSize: moderateScale(13),
    color: '#424242',
    fontWeight: '500',
    marginBottom: verticalScale(-5),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: scale(12),
    height: verticalScale(55),
    paddingHorizontal: scale(15),
  },
  iconContainer: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#000',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: verticalScale(55),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(20),
  },
  submitBtnText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  addAddressBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    marginHorizontal: scale(20),
    marginTop: verticalScale(10),
  },
  addAddressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  addAddressText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#1E1A57',
  },
  backBtn: {
    marginRight: scale(15),
  },
  divider: {
    height: verticalScale(1),
    backgroundColor: COLORS.borderColor.color3,
    marginBottom: verticalScale(20),

  },
});

export default EnterAddressScreen;
