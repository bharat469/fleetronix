import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Pressable,
  FlatList,
} from 'react-native';
import BottomSheetComponent from '../../components/bottomsheet';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../helpers/values/colors';
import { getFontFamily } from '../../helpers/fonts';
import { moderateScale, scale, verticalScale } from '../../helpers/dimension';
import SvgIcon from '../../helpers/svgComponents';
import { useAppSelector } from '../../hooks/reduxHooks';
import { useUpdateDriver } from '../../hooks/useAuth';
import { ActivityIndicator } from 'react-native';
import { RootState } from '../../redux/store';

import { useLanguage } from '../../hooks/useLanguage';

type Props = NativeStackScreenProps<RootStackParamList, 'ReadyToDrive'>;

const ReadyToDriveScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { selectedTrucks, selectedStates, licenseImage, adharImage } = useAppSelector((state) => state.registration);
  const { driverId, userToken } = useAppSelector((state: RootState) => state.auth);
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const { mutate: updateDriverMutate, isPending } = useUpdateDriver({
    onSuccess: (data) => {
      console.log('[ReadyToDrive] Driver update Success:', JSON.stringify(data, null, 2));
      navigation.navigate('CallVerification');
    },
    onError: (err) => {
      console.error('[ReadyToDrive] Driver update Error:', err.message);
      setTimeout(() => {
        Alert.alert(t('error', 'Error'), err.message);
      }, 100);
    },
  });



  const handleContinue = () => {
    if (accepted && driverId) {
      // Map short language codes to full names
      const languageMap: Record<string, string> = {
        'en': 'english',
        'hi': 'hindi',
        'te': 'telugu',
        'kn': 'kannada',
        'bn': 'bengali',
        'mr': 'marathi'
      };

      const data: any = {
        vehicle_experienced: selectedTrucks.map(truck => truck.id).join(','),
        operating_state_ids: selectedStates.map(state => state.id).join(','),
        is_active: true,
        language_preference: languageMap[currentLanguage] || 'english',
      };

      if (licenseImage) data.driving_licence = licenseImage;
      if (adharImage) data.aadhar = adharImage;

      updateDriverMutate({ driverId, token: userToken || '', data });
    } else if (!driverId) {
      setTimeout(() => {
        Alert.alert(t('error', 'Error'), 'Driver ID not found. Please log in again.');
      }, 100);
    }
  };

  const handleTermsPress = () => {
    setShowTerms(true);
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
      <View style={[styles.progressCircle, styles.progressCirclePast]}>
        <SvgIcon name="checkIcon" width={scale(14)} height={scale(14)} color={COLORS.secondary} />
      </View>
    </View>
  );

  const renderTermSection = ({ item: section }: { item: typeof TERMS_DATA[0] }) => (
    <View style={styles.termsSection}>
      <Text style={styles.termsSectionTitle}>{section.title}</Text>
      {section.items.map((item, itemIndex) => (
        <View key={itemIndex} style={styles.termsItemRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.termsItemText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {renderProgress()}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.stepInfo}>{t('step_3_of_3', 'Step 3 of 3')}</Text>
          <Text style={styles.title}>{t('ready_to_drive_title', 'Your are Ready to Drive')}</Text>

          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/truck.png')}
              style={styles.truckImage}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.subtitle}>
            {t('ready_to_drive_subtitle', "Your account setup is done. Let's book your load.")}
          </Text>

        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.termsRow}>
            <TouchableOpacity
              style={[styles.checkbox, accepted && styles.checkboxActive]}
              onPress={() => setAccepted(!accepted)}
              activeOpacity={0.7}
            >
              {accepted && <SvgIcon name="checkIcon" width={scale(12)} height={scale(12)} color={COLORS.secondary} />}
            </TouchableOpacity>

            <Text style={styles.termsLabel}>
              {t('i_accept', 'I Accept this ')}
              <Text style={styles.termsLink} onPress={handleTermsPress}>
                {t('terms_and_conditions', 'Terms and Conditions')}
              </Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.mainButton, (!accepted || isPending) && styles.mainButtonDisabled]}
            onPress={handleContinue}
            disabled={!accepted || isPending}
          >
            {isPending ? (
              <ActivityIndicator color={COLORS.secondary} />
            ) : (
              <Text style={styles.mainButtonText}>{t('continue_btn', 'Continue')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <BottomSheetComponent
          isVisible={showTerms}
          onBackdropPress={() => setShowTerms(false)}
          onBackButtonPress={() => setShowTerms(false)}
        >
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.handle} />
            <FlatList
              data={TERMS_DATA}
              renderItem={renderTermSection}
              keyExtractor={(_, index) => index.toString()}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.termsScroll}
              nestedScrollEnabled={true}
            />
          </View>
        </BottomSheetComponent>
      </View>
    </SafeAreaView>
  );
};

const TERMS_DATA = [
  {
    title: '1. Eligibility:',
    items: [
      'Drivers must meet the minimum age and licensing requirements as per local laws to be eligible for trip checking and selection.',
      'Drivers must have a valid and up-to-date driver’s license and necessary permits.',
    ],
  },
  {
    title: '2. Trip Availability:',
    items: [
      'Trips are subject to availability based on demand and geographical location.',
      'The platform does not guarantee the availability of trips at all times.',
    ],
  },
  {
    title: '3. Trip Acceptance:',
    items: [
      'Drivers have the option to view and select available trips on the platform.',
      'Once a driver accepts a trip, they are expected to fulfill the commitment unless unforeseen circumstances prevent them from doing so.',
    ],
  },
  {
    title: '4. Cancellation Policy:',
    items: [
      'Drivers must adhere to the platform’s cancellation policy when canceling accepted trips.',
      'Excessive cancellations may result in penalties, including temporary suspension or removal from the platform.',
    ],
  },
  {
    title: '5. Trip Information:',
    items: [
      'Drivers are responsible for reviewing all relevant trip information, including pick-up and drop-off locations, passenger details, and any special instructions provided by the platform.',
    ],
  },
  {
    title: '6. Communication:',
    items: [
      'Drivers are expected to maintain professional communication with the platform and relevant stakeholders.',
    ],
  },
];

export default ReadyToDriveScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(24),
  },
  scrollContent: {
    flexGrow: 1,
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
  progressLine: {
    width: scale(60),
    height: 1.5,
    backgroundColor: COLORS.primary,
    marginHorizontal: scale(8),
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
    marginBottom: verticalScale(24),
  },
  imageContainer: {
    width: '100%',
    height: verticalScale(230),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    marginBottom: verticalScale(24),
  },
  truckImage: {
    width: '100%',
    height: '100%',
  },
  subtitle: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(18),
    color: COLORS.textColor.color2.one,
    lineHeight: verticalScale(26),
    marginBottom: verticalScale(40),
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  checkbox: {
    width: scale(22),
    height: scale(22),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: scale(4),
    marginRight: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsLabel: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(15),
    color: COLORS.textColor.color2.one,
    flex: 1,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
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
    backgroundColor: '#E5A2A2', // Faded red/coral like in image
  },
  mainButtonText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(16),
    color: COLORS.secondary,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FAF7F7',
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    maxHeight: verticalScale(600),
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(30),
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: '#D1D5DB',
    borderRadius: scale(2),
    alignSelf: 'center',
    marginBottom: verticalScale(20),
  },
  termsScroll: {
    paddingBottom: verticalScale(20),
  },
  termsSection: {
    marginBottom: verticalScale(20),
  },
  termsSectionTitle: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(16),
    color: COLORS.textColor.color1,
    marginBottom: verticalScale(8),
  },
  termsItemRow: {
    flexDirection: 'row',
    marginBottom: verticalScale(6),
    paddingLeft: scale(4),
  },
  bullet: {
    fontSize: moderateScale(14),
    marginRight: scale(8),
    color: '#687182',
  },
  termsItemText: {
    flex: 1,
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(14),
    color: '#4B5563',
    lineHeight: verticalScale(20),
  },
});
