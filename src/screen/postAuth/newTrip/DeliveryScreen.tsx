import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import SvgIcon from '../../../helpers/svgComponents';
import SlideToAction from '../../../components/SlideToAction';
import { COLORS } from '../../../helpers/values/colors';
import { BackArrowIcon } from '../../../assets/svgIcons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../redux/store';
import { setTripId } from '../../../redux/slices/tripSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'Delivery'>;

const DeliveryScreen: React.FC<Props> = ({ route, navigation }) => {
  const tripRedux = useSelector((state: RootState) => state.trip);
  const { trip } = route.params;
  const tripId = tripRedux.tripId || trip?.trip_id || trip?.id;
  const dispatch = useDispatch();

  useEffect(() => {
    if (tripId && !tripRedux.tripId) {
      dispatch(setTripId(tripId));
    }
  }, [tripId, tripRedux.tripId, dispatch]);



  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(moderateScale(50))).current;


  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);


  const handleCompleteSlide = () => {
    navigation.navigate('VerifyDeliveryOtp', { trip });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Point</Text>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.arrivalCard}>
          <View style={styles.successIconWrapper}>

            <SvgIcon name='locationSmallIcon' width={moderateScale(40)} height={moderateScale(40)} />

          </View>
          <Text style={styles.arrivalSubtitle}>You are within 200m of the delivery location.</Text>
          <Text style={styles.arrivalTitle}>You have arrived!</Text>
        </View>

        <View style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <Image 
              source={{ uri: trip?.image || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
              style={styles.customerPic} 
            />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{trip?.customer_name || 'Customer'}</Text>
              <Text style={styles.customerLabel}>Receiver</Text>
            </View>
            <TouchableOpacity 
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${trip?.customer_mobile || '911'}`)}
            >
              <SvgIcon name="phoneActions" width={20} height={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Load ID</Text>
              <Text style={styles.detailValue}>{trip?.load_id || 'TRP-9921'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Package</Text>
              <Text style={styles.detailValue}>{trip?.truck_type || 'General'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Instruction</Text>
          <Text style={styles.instructionText}>
            Please ensure you have parked safely and have all documents ready before verifying the delivery code with the customer.
          </Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <SlideToAction 
          label="Slide to Deliver →" 
          onComplete={handleCompleteSlide} 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    backgroundColor: 'white',
  },
  backBtn: {
    padding: scale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#111',
    marginLeft: scale(10),
  },
  content: {
    flex: 1,
    padding: scale(20),
  },
  arrivalCard: {
    alignItems: 'center',
    marginBottom: verticalScale(25),
  },
  successIconWrapper: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  successIcon: {
    fontSize: moderateScale(35),
  },
  iconText: {
    fontSize: moderateScale(40),
  },
  arrivalTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#111',
    marginBottom: verticalScale(5),
  },
  arrivalSubtitle: {
    fontSize: moderateScale(14),
    color: '#666',
    textAlign: 'center',
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: scale(20),
    padding: scale(20),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: verticalScale(20),
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerPic: {
    width: scale(55),
    height: scale(55),
    borderRadius: scale(27.5),
  },
  customerInfo: {
    flex: 1,
    marginLeft: scale(15),
  },
  customerName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#111',
  },
  customerLabel: {
    fontSize: moderateScale(12),
    color: '#999',
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: COLORS.primary,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: verticalScale(18),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
  },
  detailLabel: {
    fontSize: moderateScale(12),
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#111',
  },
  instructionCard: {
    paddingHorizontal: scale(5),
  },
  instructionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#111',
    marginBottom: verticalScale(8),
  },
  instructionText: {
    fontSize: moderateScale(14),
    color: '#666',
    lineHeight: verticalScale(20),
  },
  footer: {
    backgroundColor: 'white',
    paddingBottom: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
});

export default DeliveryScreen;
