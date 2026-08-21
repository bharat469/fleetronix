import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { COLORS } from '../../../helpers/values/colors';
import { BackArrowIcon } from '../../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import SvgIcon from '../../../helpers/svgComponents';
import { getFontFamily } from '../../../helpers/fonts';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useImageSelection } from '../../../helpers/useImageSelection';
import BottomSheetComponent from '../../../components/bottomsheet';
import FastImage from 'react-native-fast-image';
import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { confirmDelivery } from '../../../services/tripApi';
import { resetTrip, setTripId } from '../../../redux/slices/tripSlice';

const ConfirmDeliveryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const tripRedux = useSelector((state: RootState) => state.trip);
  const token = useSelector((state: RootState) => state.auth.accessToken);

  const { trip } = route.params;
  const tripId = tripRedux.tripId || trip?.trip_id || trip?.id;

  React.useEffect(() => {
    if (tripId && !tripRedux.tripId) {
      dispatch(setTripId(tripId));
    }
  }, [tripId, tripRedux.tripId, dispatch]);

  React.useEffect(() => {
    const backAction = () => {
      const isDeliveryVerified =
        trip?.delivery_code_verified === true ||
        trip?.delivery_code_verified === 1 ||
        trip?.delivery_code_verified === 'true' ||
        tripRedux?.lifecycle === 'delivered';

      if (isDeliveryVerified) {
        navigation.navigate('TripDetails', {
          tripId: tripId || '',
          loadNumber: trip?.load_number || tripRedux.loadNumber || '',
          tripData: { ...tripRedux.tripData, ...trip } as any,
        });
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation, trip, tripRedux, tripId]);

  const handleBack = () => {
    const isDeliveryVerified =
      trip?.delivery_code_verified === true ||
      trip?.delivery_code_verified === 1 ||
      trip?.delivery_code_verified === 'true' ||
      tripRedux?.lifecycle === 'delivered';

    if (isDeliveryVerified) {
      navigation.navigate('TripDetails', {
        tripId: tripId || '',
        loadNumber: trip?.load_number || tripRedux.loadNumber || '',
        tripData: { ...tripRedux.tripData, ...trip } as any,
      });
    } else {
      navigation.goBack();
    }
  };



  const [formData, setFormData] = useState({
    recipientName: '',
    deliveryDate: new Date(),
    deliveryTime: new Date(),
    confirmationNumber: '',
    remark: '',
    podImage: null as any,
  });

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const { setIsPickerVisible, isPickerVisible, takePhoto, pickImage } = useImageSelection((asset: any) => {
    setFormData(prev => ({ ...prev, podImage: asset }));
  });

  // ── TanStack Query mutation ─────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: confirmDelivery,
    onSuccess: () => {
      navigation.navigate('Rating', { trip });
    },
    onError: (error: Error) => {
      Alert.alert('Submission Failed', error.message ?? 'Please try again.');
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      handleInputChange('deliveryDate', selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setTimePickerVisible(false);
    if (selectedTime) {
      handleInputChange('deliveryTime', selectedTime);
    }
  };

  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const formatDateDisplay = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatTime = (date: Date) =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  const formatTimeDisplay = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const isFormValid = formData.recipientName.trim().length > 0;

  const handleSubmit = () => {
    if (!isFormValid || mutation.isPending) return;
    mutation.mutate({
      tripId,
      recipientName: formData.recipientName.trim(),
      deliveryDate: formatDate(formData.deliveryDate),
      deliveryTime: formatTime(formData.deliveryTime),
      confirmationNumber: formData.confirmationNumber || undefined,
      remark: formData.remark || undefined,
      latitude: tripRedux.liveLocation?.latitude,
      longitude: tripRedux.liveLocation?.longitude,
      documents: formData.podImage
        ? [{
          uri: formData.podImage.uri,
          name: formData.podImage.fileName ?? `pod_${Date.now()}.jpg`,
          type: formData.podImage.type ?? 'image/jpeg',
        }]
        : undefined,
      token: token ?? '',
    });
  };

  if (!tripId || !trip) {
    console.warn('[ConfirmDeliveryScreen] No tripId found in Redux');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Delivery</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subTitle}>Proof of delivery (POD)</Text>
        <Text style={styles.description}>
          After filling, users receive a proof of delivery (POD) and invoice/receipt if applicable.
          Drivers provide copies of these documents along with any return labels.
        </Text>

        <View style={styles.formCard}>
          <InputGroup
            label="Recipient's Name"
            placeholder="Recipient's name"
            value={formData.recipientName}
            onChangeText={(text: string) => handleInputChange('recipientName', text)}
            icon='recipentName'
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: scale(10) }}>
              <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                <InputGroup
                  label="Delivery date"
                  placeholder="Delivery date"
                  value={formatDateDisplay(formData.deliveryDate)}
                  icon='deliveryTime'
                  editable={false}
                  pointerEvents="none"
                />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => setTimePickerVisible(true)}>
                <InputGroup
                  label="Delivery Time"
                  placeholder="Delivery time"
                  value={formatTimeDisplay(formData.deliveryTime)}
                  icon='deliveryTime'
                  editable={false}
                  pointerEvents="none"
                />
              </TouchableOpacity>
            </View>
          </View>

          {datePickerVisible && (
            <DateTimePicker
              value={formData.deliveryDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
          )}

          {timePickerVisible && (
            <DateTimePicker
              value={formData.deliveryTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}

          <InputGroup
            label="Confirmation Number"
            placeholder="Confirmation Number"
            value={formData.confirmationNumber}
            onChangeText={(text: string) => handleInputChange('confirmationNumber', text)}
            icon='confirmationNumber'
          />

          <View style={styles.uploadContainer}>
            <Text style={styles.label}>Document Upload</Text>
            {formData.podImage ? (
              <View style={styles.imagePreviewContainer}>
                <FastImage
                  source={{ uri: formData.podImage.uri }}
                  style={styles.podImagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleInputChange('podImage', null)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => setIsPickerVisible(true)}
              >
                <SvgIcon name={'uploadDocument'} width={scale(20)} height={verticalScale(20)} color={COLORS.primary} />
                <Text style={styles.uploadPlaceholder}>Upload attachments</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Remark</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Remark"
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={4}
              value={formData.remark}
              onChangeText={(text) => handleInputChange('remark', text)}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (!isFormValid || mutation.isPending) && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={!isFormValid || mutation.isPending}
        >
          {mutation.isPending ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.submitBtnText}>Submitting...</Text>
            </View>
          ) : (
              <Text style={styles.submitBtnText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Image Picker Bottom Sheet */}
      <BottomSheetComponent
        isVisible={isPickerVisible}
        onBackdropPress={() => setIsPickerVisible(false)}
        onBackButtonPress={() => setIsPickerVisible(false)}
      >
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>Select Document Source</Text>
          <TouchableOpacity style={styles.pickerOption} onPress={takePhoto}>
            <View style={styles.pickerIcon}>
              <SvgIcon name="phoneActions" width={22} height={22} color={COLORS.primary} />
            </View>
            <Text style={styles.pickerOptionText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerOption} onPress={pickImage}>
            <View style={styles.pickerIcon}>
              <SvgIcon name="uploadDocument" width={22} height={22} color={COLORS.primary} />
            </View>
            <Text style={styles.pickerOptionText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerCancel}
            onPress={() => setIsPickerVisible(false)}
          >
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetComponent>
    </SafeAreaView>
  );
};

const InputGroup = ({ label, placeholder, value, icon, onChangeText, editable = true, pointerEvents }: any) => (
  <View style={styles.inputGroup} pointerEvents={pointerEvents}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <View style={styles.iconBox}>
        <SvgIcon name={icon} width={scale(18)} height={verticalScale(18)} color={COLORS.primary} />
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9E9E9E"
        value={value}
        onChangeText={onChangeText}
        editable={editable}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  backBtn: {
    marginRight: scale(15),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#1E1B4B',
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  subTitle: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#1E1B4B',
    marginTop: verticalScale(10),
  },
  description: {
    fontSize: moderateScale(13),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#858080',
    lineHeight: 20,
    marginTop: verticalScale(12),
  },
  formCard: {
    marginTop: verticalScale(25),
    backgroundColor: '#FAFAFA',
    borderRadius: scale(20),
    padding: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: verticalScale(20),
  },
  label: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#1E1B4B',
    marginBottom: verticalScale(8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    paddingHorizontal: scale(5),
    height: verticalScale(55),
  },
  iconBox: {
    width: scale(45),
    height: verticalScale(45),
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#000',
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    paddingLeft: scale(5),
  },
  row: {
    flexDirection: 'row',
  },
  uploadContainer: {
    marginBottom: verticalScale(20),
  },
  uploadBtn: {
    height: verticalScale(55),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderStyle: 'dashed',
    borderRadius: scale(12),
    paddingHorizontal: scale(15),
  },
  uploadPlaceholder: {
    color: '#CA2027',
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    marginLeft: scale(10),
  },
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    padding: scale(15),
    height: verticalScale(120),
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#CA2027',
    height: verticalScale(60),
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(10),
    shadowColor: '#CA2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledBtn: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  pickerSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: scale(25),
    borderTopRightRadius: scale(25),
    padding: scale(25),
    paddingBottom: verticalScale(40),
  },
  pickerTitle: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#1E1B4B',
    marginBottom: verticalScale(20),
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  pickerOptionText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#333',
  },
  pickerCancel: {
    marginTop: verticalScale(15),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#CA2027',
  },
  imagePreviewContainer: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: scale(15),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  podImagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: scale(10),
    right: scale(10),
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ConfirmDeliveryScreen;
