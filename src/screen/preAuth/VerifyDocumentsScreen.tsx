import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../helpers/values/colors';
import { getFontFamily } from '../../helpers/fonts';
import { moderateScale, scale, verticalScale } from '../../helpers/dimension';
import SvgIcon from '../../helpers/svgComponents';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { setLicenseImage, setAdharImage } from '../../redux/slices/registrationSlice';
import { pickImageFromLibrary, takePhoto } from '../../helpers/imagePickerHelper';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyDocuments'>;

type subStep = 'LICENSE_EMPTY' | 'LICENSE_PREVIEW' | 'ADHAR_EMPTY' | 'ADHAR_PREVIEW';

const VerifyDocumentsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { licenseImage, adharImage } = useAppSelector((state) => state.registration);

  const [currentStep, setCurrentStep] = useState<subStep>('LICENSE_EMPTY');

  const handleImagePicker = (type: 'license' | 'adhar') => {
    Alert.alert(
      t('select_image', 'Select Image'),
      t('choose_source', 'Choose a source to upload your document'),
      [
        {
          text: t('camera', 'Camera'),
          onPress: async () => {
            const result = await takePhoto();
            if (result.assets && result.assets.length > 0) {
              const uri = result.assets[0].uri || null;
              if (type === 'license') {
                dispatch(setLicenseImage(uri));
                setCurrentStep('LICENSE_PREVIEW');
              } else {
                dispatch(setAdharImage(uri));
                setCurrentStep('ADHAR_PREVIEW');
              }
            }
          },
        },
        {
          text: t('gallery', 'Gallery'),
          onPress: async () => {
            const result = await pickImageFromLibrary();
            if (result.assets && result.assets.length > 0) {
              const uri = result.assets[0].uri || null;
              if (type === 'license') {
                dispatch(setLicenseImage(uri));
                setCurrentStep('LICENSE_PREVIEW');
              } else {
                dispatch(setAdharImage(uri));
                setCurrentStep('ADHAR_PREVIEW');
              }
            }
          },
        },
        { text: t('cancel', 'Cancel'), style: 'cancel' },
      ]
    );
  };

  const handleNext = () => {
    if (currentStep === 'LICENSE_PREVIEW') {
      setCurrentStep('ADHAR_EMPTY');
    } else if (currentStep === 'ADHAR_PREVIEW') {
      navigation.navigate('ReadyToDrive');
    }
  };

  const handleRetake = () => {
    if (currentStep === 'LICENSE_PREVIEW') {
      setCurrentStep('LICENSE_EMPTY');
    } else if (currentStep === 'ADHAR_PREVIEW') {
      setCurrentStep('ADHAR_EMPTY');
    }
  };

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressCircle, styles.progressCirclePast]}>
        <SvgIcon name="checkIcon" width={scale(14)} height={scale(14)} color={COLORS.secondary} />
      </View>
      <View style={styles.progressLine} />
      <View style={[styles.progressCircle, styles.progressCirclePast]}>
        <SvgIcon name="checkIcon" width={scale(14)} height={scale(14)} color={COLORS.secondary} />
      </View>
      <View style={styles.progressLine} />
      <View style={[styles.progressCircle, styles.progressCircleActive]}>
        <Text style={styles.progressTextActive}>3</Text>
      </View>
    </View>
  );

  const renderEmptyState = (type: 'license' | 'adhar') => (
    <View style={styles.content}>
      <Text style={styles.stepInfo}>{t('step_2_of_3', 'Step 2 of 3')}</Text>
      <Text style={styles.title}>
        {type === 'license' ? t('verify_license_title', "Let's Verify your driver license") : t('verify_adhar_title', "Let's upload your Adhar Card")}
      </Text>
      <Text style={styles.description}>
        {type === 'license'
          ? t('verify_license_desc', 'Upload a legible picture of your driver license to verify it')
          : t('verify_adhar_desc', 'Upload a legible picture of your Adhar card to verify it')}
      </Text>

      <TouchableOpacity
        style={styles.uploadBox}
        onPress={() => handleImagePicker(type)}
        activeOpacity={0.8}
      >
        <SvgIcon name="cloudUpload" width={scale(48)} height={verticalScale(48)} color="#CC2B2B" />
        <Text style={styles.uploadText}>{t('choose_or_capture', 'Choose a image or Capture image')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreviewState = (type: 'license' | 'adhar') => {
    const uri = type === 'license' ? licenseImage : adharImage;
    const title = type === 'license'
      ? t('verify_license_title_preview', "Let's Verify your driver license")
      : t('verify_adhar_title_preview', "Let's Verify your Adhar Card");

    return (
      <View style={styles.content}>
        <Text style={styles.stepInfo}>{t('step_2_of_3', 'Step 2 of 3')}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>
          {t('verify_license_preview_desc', 'Upload a legible picture of your driver license to verify it')}
        </Text>

        <View style={styles.previewBox}>
          {uri ? (
            <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {renderProgress()}

        <ScrollView showsVerticalScrollIndicator={false}>
          {currentStep === 'LICENSE_EMPTY' && renderEmptyState('license')}
          {currentStep === 'LICENSE_PREVIEW' && renderPreviewState('license')}
          {currentStep === 'ADHAR_EMPTY' && renderEmptyState('adhar')}
          {currentStep === 'ADHAR_PREVIEW' && renderPreviewState('adhar')}
        </ScrollView>

        <View style={styles.footer}>
          {(currentStep === 'LICENSE_PREVIEW' || currentStep === 'ADHAR_PREVIEW') && (
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <View style={styles.retakeContent}>
                <SvgIcon name="camerIcon" width={scale(20)} height={verticalScale(20)} color="#CC2B2B" />
                <Text style={styles.retakeText}>{t('retake_image', 'RETAKE IMAGE')}</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.mainButton,
              (currentStep === 'LICENSE_EMPTY' || currentStep === 'ADHAR_EMPTY') && styles.mainButtonDisabled
            ]}
            onPress={handleNext}
            disabled={currentStep === 'LICENSE_EMPTY' || currentStep === 'ADHAR_EMPTY'}
          >
            <Text style={styles.mainButtonText}>
              {currentStep === 'LICENSE_PREVIEW' ? t('verify_license_btn', 'Verify License')
                : currentStep === 'ADHAR_PREVIEW' ? t('verify_adhar_btn', 'Verify Aadhar Card')
                  : t('next', 'NEXT')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default VerifyDocumentsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(30),
  },
  progressCircle: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCirclePast: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  progressCircleActive: {
    borderColor: COLORS.primary,
  },
  progressTextActive: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(16),
    color: COLORS.primary,
  },
  progressLine: {
    width: scale(60),
    height: 1.5,
    backgroundColor: COLORS.primary,
    marginHorizontal: scale(8),
  },
  content: {
    flex: 1,
  },
  stepInfo: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(14),
    color: COLORS.textColor.color2.one,
    marginBottom: verticalScale(8),
  },
  title: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(24),
    color: COLORS.textColor.color1,
    fontWeight: '700',
    marginBottom: verticalScale(12),
  },
  description: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(16),
    color: COLORS.textColor.color2.one,
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(40),
  },
  uploadBox: {
    width: '100%',
    height: verticalScale(200),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    marginTop: verticalScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(16),
    color: COLORS.textColor.color2.one,
  },
  previewBox: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  retakeButton: {
    marginBottom: verticalScale(16),
    width: '100%',
    height: verticalScale(50),
    borderWidth: 1,
    borderColor: COLORS.textColor.color1,
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  retakeText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(14),
    color: COLORS.textColor.color1,
  },
  footer: {
    paddingVertical: verticalScale(20),
  },
  mainButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  mainButtonText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(16),
    color: COLORS.secondary,
  },
});
