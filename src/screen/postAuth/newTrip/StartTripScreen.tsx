import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  PanResponder,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { scale, verticalScale, moderateScale, SCREEN } from '../../../helpers/dimension';
import { BackArrowIcon, LocationIcon } from '../../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import BottomSheetComponent from '../../../components/bottomsheet';
import ErrorBottomSheet from '../../../components/ErrorBottomSheet';
import { useTranslation } from 'react-i18next';
import SvgIcon from '../../../helpers/svgComponents';
import { COLORS } from '../../../helpers/values/colors';

const SLIDER_WIDTH = SCREEN.WIDTH - scale(50);
const BUTTON_WIDTH = scale(60);

const OTPInput = ({ length, onChangeOTP }: { length: number, onChangeOTP: (val: string) => void }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = React.useRef<any[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    onChangeOTP(newOtp.join(''));

    // Move to next input
    if (text.length !== 0 && index < length - 1) {
      inputs.current[index + 1].focus();
    }
  };

  return (
    <View style={styles.otpContainer}>
      {otp.map((val, i) => (
        <View key={i} style={styles.otpBox}>
          <TextInput
            ref={(ref) => { inputs.current[i] = ref; }}
            style={styles.otpText}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(text) => handleChange(text, i)}
            value={val}
            textAlign="center"
          />
        </View>
      ))}
    </View>
  );
};

const StartTripScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'StartTrip'>>();
  const { trip } = route.params;

  const [tripState, setTripState] = useState<'PRE_START' | 'STARTED'>('PRE_START');
  const [showSlider, setShowSlider] = useState(false);
  const [currentOtp, setCurrentOtp] = useState('');
  const [isOtpErrorVisible, setIsOtpErrorVisible] = useState(false);
  const { t } = useTranslation();

  // Pan Responder for Slider
  const translateX = useState(new Animated.Value(0))[0];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx >= 0 && gestureState.dx <= SLIDER_WIDTH - BUTTON_WIDTH) {
        translateX.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx >= SLIDER_WIDTH - BUTTON_WIDTH - 20) {
        // Successful slide
        Animated.timing(translateX, {
          toValue: SLIDER_WIDTH - BUTTON_WIDTH,
          duration: 100,
          useNativeDriver: false,
        }).start(() => {
          navigation.navigate('ConfirmDelivery');
        });
      } else {
        // Reset slider
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const handleConfirm = () => {
    if (currentOtp === '1234') {
      setTimeout(() => {
        setTripState('STARTED');
        setTimeout(() => {
          setShowSlider(true);
        }, 3000);
      }, 2000);
    } else {
      setIsOtpErrorVisible(true);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: 28.6441,
              longitude: 77.2173,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Polyline
              coordinates={[
                { latitude: 28.6550, longitude: 77.2200 },
                { latitude: 28.6441, longitude: 77.2173 },
              ]}
              strokeColor="#007AFF"
              strokeWidth={4}
            />
            <Marker coordinate={{ latitude: 28.6441, longitude: 77.2173 }}>
              <View style={styles.blueDot} />
            </Marker>
          </MapView>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>#{trip.id}</Text>

          <View style={styles.profileFloatContainer}>
            {tripState === 'PRE_START' && (
              <View style={styles.profileWrapper}>
                <Image
                  source={{ uri: trip.image }}
                  style={styles.profilePic}
                />
                <View style={styles.verifiedBadge}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.bottomCard}>
            {tripState === 'PRE_START' ? (
              <>
                <View style={styles.loadIdSection}>
                   <Text style={styles.loadIdText}>Load Id - #{trip.id}</Text>
                   <Text style={styles.driverNameBig}>{trip.shipperName.split(' ')[0]}</Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Task</Text>
                    <View style={[styles.pill, styles.redPill]}>
                      <Text style={styles.redPillText}>{trip.task}</Text>
                    </View>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Call</Text>
                    <View style={[styles.pill, styles.greenPill]}>
                      <Text style={styles.greenPillText}>+91 9211420420</Text>
                    </View>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Distance</Text>
                    <View style={[styles.pill, styles.bluePill]}>
                      <Text style={styles.bluePillText}>~1500 Km</Text>
                    </View>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Delivery Time</Text>
                    <View style={[styles.pill, styles.purplePill]}>
                      <Text style={styles.purplePillText}>~3-4 days</Text>
                    </View>
                  </View>
                </View>

                <OTPInput
                  length={4}
                  onChangeOTP={(val) => setCurrentOtp(val)}
                />

                <TouchableOpacity
                  style={[styles.confirmBtn, currentOtp.length < 4 && styles.disabledConfirmBtn]}
                  onPress={handleConfirm}
                  disabled={currentOtp.length < 4}
                >
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.startedContent}>
                <View style={styles.customerHeader}>
                  <View style={styles.customerProfileWrapper}>
                    <Image source={{ uri: trip.image }} style={styles.customerPic} />
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{trip.shipperName}</Text>
                    <Text style={styles.customerRating}>4.9 based on 100 ratings</Text>
                  </View>
                </View>

                <View style={styles.deliveryDetails}>
                  <View style={styles.detailItem}>
                    <View style={styles.iconBox}>
                      <SvgIcon name="clock" width={moderateScale(24)} height={moderateScale(24)} color="#CA2027" />
                    </View>
                    <View style={styles.detailTxtRow}>
                      <Text style={styles.detailLabelSmall}>Your delivery time</Text>
                      <Text style={styles.detailValueBold}>30 Dec, 9:00 AM</Text>
                    </View>
                  </View>

                  <View style={styles.dottedConnector} />

                  <View style={styles.detailItem}>
                    <View style={styles.iconBox}>
                      <SvgIcon name="pin" width={moderateScale(24)} height={moderateScale(24)} color="#CA2027" />
                    </View>
                    <View style={styles.detailTxtRow}>
                      <Text style={styles.detailLabelSmall}>Your address</Text>
                      <Text style={styles.detailValueBold}>{trip.drop}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.callFloatingBtn}>
                  <SvgIcon name="phoneActions" width={moderateScale(18)} height={moderateScale(18)} color="white" />
                </TouchableOpacity>

                {showSlider && (
                  <View style={styles.sliderContainer}>
                    <View style={styles.sliderTrack}>
                      <Text style={styles.sliderPromptInner}>Slide to Deliver...</Text>
                      <Animated.View
                        style={[
                          styles.sliderFill,
                          {
                            width: Animated.add(translateX, scale(55)),
                          },
                        ]}
                      />
                      <Animated.View
                        style={[styles.sliderThumb, { transform: [{ translateX }] }]}
                        {...panResponder.panHandlers}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      <BottomSheetComponent
        isVisible={isOtpErrorVisible}
        onBackdropPress={() => setIsOtpErrorVisible(false)}
        onBackButtonPress={() => setIsOtpErrorVisible(false)}
      >
        <ErrorBottomSheet
          title={t('invalid_otp', 'Invalid OTP')}
          message={t('otp_error_msg', 'The OTP you entered is incorrect. Please try again.')}
          onClose={() => setIsOtpErrorVisible(false)}
        />
      </BottomSheetComponent>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  backBtn: {
    position: 'absolute',
    top: verticalScale(50),
    left: scale(20),
    backgroundColor: 'white',
    width: scale(45),
    height: scale(45),
    borderRadius: scale(22.5),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
  },
  headerTitle: {
    position: 'absolute',
    top: verticalScale(58),
    left: scale(80),
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#000',
    zIndex: 10,
  },
  profileFloatContainer: {
    position: 'absolute',
    bottom: verticalScale(380),
    alignSelf: 'center',
    zIndex: 10,
  },
  profileWrapper: {
    position: 'relative',
  },
  profilePic: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    borderWidth: 3,
    borderColor: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    left: -2,
    top: 6,
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: '#4CD964',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  checkIcon: {
    color: 'white',
    fontSize: moderateScale(9),
    fontWeight: 'bold',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: scale(35),
    borderTopRightRadius: scale(35),
    padding: scale(25),
    paddingTop: verticalScale(40),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
    minHeight: verticalScale(420),
  },
  loadIdSection: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  loadIdText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#858080',
  },
  driverNameBig: {
    fontSize: moderateScale(28),
    fontWeight: '800',
    color: '#000',
    marginTop: verticalScale(5),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
  },
  statItem: {
    width: '48%',
    marginBottom: verticalScale(15),
  },
  statLabel: {
    fontSize: moderateScale(12),
    color: '#858080',
    marginBottom: verticalScale(5),
  },
  pill: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    alignItems: 'center',
  },
  redPill: { backgroundColor: '#FFEBEE' },
  redPillText: { color: '#CA2027', fontSize: moderateScale(11), fontWeight: '700' },
  greenPill: { backgroundColor: '#E8F5E9' },
  greenPillText: { color: '#4CAF50', fontSize: moderateScale(11), fontWeight: '700' },
  bluePill: { backgroundColor: '#E3F2FD' },
  bluePillText: { color: '#2196F3', fontSize: moderateScale(11), fontWeight: '700' },
  purplePill: { backgroundColor: '#F3E5F5' },
  purplePillText: { color: '#9C27B0', fontSize: moderateScale(11), fontWeight: '700' },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(15),
    marginBottom: verticalScale(25),
  },
  otpBox: {
    width: scale(45),
    height: scale(45),
    borderRadius: scale(10),
    backgroundColor: '#FFF9F9',
    borderWidth: 1,
    borderColor: '#AAAAAA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpText: {
    flex: 1,
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#000',
  },
  confirmBtn: {
    height: verticalScale(55),
    borderRadius: scale(15),
    backgroundColor: '#CA2027',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledConfirmBtn: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  confirmBtnText: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: 'white',
  },
  startedContent: {
    paddingTop: verticalScale(10),
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(25),
  },
  customerProfileWrapper: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    borderWidth: 3,
    borderColor: '#CA2027',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerPic: {
    width: '100%',
    height: '100%',
    borderRadius: scale(35),
  },
  customerInfo: {
    flex: 1,
    marginLeft: scale(20),
  },
  customerName: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#1E1B4B',
  },
  customerRating: {
    fontSize: moderateScale(13),
    color: '#858080',
    marginTop: 2,
  },
  deliveryDetails: {
    marginTop: verticalScale(20),
    marginLeft: scale(5),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTxtRow: {
    marginLeft: scale(15),
  },
  dottedConnector: {
    width: 1,
    height: verticalScale(25),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    marginLeft: scale(20),
    marginVertical: 2,
  },
  detailLabelSmall: {
    fontSize: moderateScale(11),
    color: '#858080',
  },
  detailValueBold: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1E1B4B',
    marginTop: 2,
  },
  callFloatingBtn: {
    position: 'absolute',
    right: 0,
    bottom: verticalScale(110),
    width: scale(55),
    height: scale(55),
    borderRadius: scale(27.5),
    backgroundColor: '#CA2027',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  sliderContainer: {
    marginTop: verticalScale(40),
  },
  sliderTrack: {
    height: scale(60),
    backgroundColor: '#E0E0E0',
    borderRadius: scale(30),
    padding: scale(5),
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  sliderPromptInner: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: moderateScale(14),
    color: '#666',
    fontWeight: '600',
  },
  sliderThumb: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    borderRadius: scale(30),
  },
  blueDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default StartTripScreen;
