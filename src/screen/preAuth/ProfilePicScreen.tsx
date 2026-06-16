import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
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
import { setProfileImage } from '../../redux/slices/registrationSlice';
import ImagePickerModal from '../../components/common/ImagePickerModal';
import { useImageSelection } from '../../helpers/useImageSelection';
import { Asset } from 'react-native-image-picker';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfilePic'>;

const ProfilePicScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const profileImage = useAppSelector((state) => state.registration.profileImage);

  const { isPickerVisible, setIsPickerVisible, pickImage, takePhoto } = useImageSelection((asset) => {
    dispatch(setProfileImage(asset));
  });

  const handleNext = () => {
    navigation.navigate('ReadyToDrive');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {renderProgress()}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.stepInfo}>{t('step_2_of_3_photo', 'Step 2 of 3 - Profile Photo')}</Text>
          <Text style={styles.title}>{t('upload_profile_photo_title', 'Upload your profile photo')}</Text>
          <Text style={styles.description}>
            {t('upload_profile_photo_desc', 'Please upload a clear, front-facing picture of yourself. This helps transporters and shippers recognize you.')}
          </Text>

          <View style={styles.uploadCard}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => setIsPickerVisible(true)}
              activeOpacity={0.8}
            >
              {profileImage?.uri ? (
                <Image source={{ uri: profileImage.uri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <SvgIcon name="accountMenuIcon" width={scale(60)} height={scale(60)} color="#A0A0A0" />
                  <View style={styles.cameraBadge}>
                    <SvgIcon name="camerIcon" width={scale(16)} height={scale(16)} color="#FFFFFF" />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setIsPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.uploadButtonText}>
                {profileImage?.uri ? t('change_photo', 'Change Photo') : t('select_photo', 'Select Profile Photo')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.mainButton, !profileImage && styles.mainButtonDisabled]}
            onPress={handleNext}
            disabled={!profileImage}
            activeOpacity={0.8}
          >
            <Text style={styles.mainButtonText}>{t('next', 'NEXT')}</Text>
          </TouchableOpacity>
        </View>

        <ImagePickerModal
          isVisible={isPickerVisible}
          onClose={() => setIsPickerVisible(false)}
          onCameraPress={takePhoto}
          onGalleryPress={pickImage}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(24),
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
  scrollContent: {
    flexGrow: 1,
  },
  stepInfo: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(14),
    color: COLORS.textColor.color2.one,
    marginBottom: verticalScale(8),
  },
  title: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(26),
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
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: verticalScale(40),
    paddingHorizontal: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: verticalScale(30),
  },
  avatarContainer: {
    width: scale(130),
    height: scale(130),
    borderRadius: scale(65),
    backgroundColor: '#F3F4F6',
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    marginBottom: verticalScale(30),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: scale(65),
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: scale(2),
    right: scale(2),
    backgroundColor: COLORS.primary,
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  uploadButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(24),
  },
  uploadButtonText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(14),
    color: COLORS.primary,
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

export default ProfilePicScreen;
