import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { getFontFamily } from '../../helpers/fonts';
import { BackArrowIcon, PhoneIcon } from '../../assets/svgIcons';
import Svg, { Path } from 'react-native-svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// Custom warning triangle SVG icon
const WarningTriangleIcon = () => (
  <Svg width={scale(28)} height={scale(28)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 22H22L12 2Z"
      stroke="#CA2027"
      strokeWidth="2"
      fill="#CA2027"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 9V13"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 17H12.01"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Custom truck icon specifically matching the wireframe style
const CustomTruckIcon = () => (
  <Svg width={scale(28)} height={scale(28)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 18C19 19.1 18.1 20 17 20C15.9 20 15 19.1 15 18M19 18H21C21.6 18 22 17.6 22 17V13.5L19 10H14V18H15M19 18C19 16.9 18.1 16 17 16C15.9 16 15 16.9 15 18M7 18C7 19.1 6.1 20 5 20C3.9 20 3 19.1 3 18M7 18H15M7 18C7 16.9 6.1 16 5 16C3.9 16 3 16.9 3 18M3 18H2V5C2 4.4 2.4 4 3 4H14V18M11 7H5V11H11V7Z"
      stroke="#000000"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Custom phone/app support icon matching the wireframe style
const CustomSmartphoneIcon = () => (
  <Svg width={scale(28)} height={scale(28)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 2H7C5.9 2 5 2.9 5 4V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V4C19 2.9 18.1 2 17 2Z"
      stroke="#000000"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 18H12.01"
      stroke="#000000"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SupportScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleCall = (phoneNumber: string, typeLabel: string) => {
    Alert.alert(
      'Call Support',
      `Would you like to place a call to ${typeLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Immediate Assistance Card */}
        <View style={styles.immediateCard}>
          <Text style={styles.immediateTitle}>Need immediate assistance?</Text>
          <Text style={styles.immediateDesc}>
            Our dispatchers are available 24/7 to help you with any on-road issues.
          </Text>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall('+919154306966', 'Emergency Hotline')}
            activeOpacity={0.8}
          >
            <PhoneIcon color="white" width={scale(18)} height={scale(18)} />
            <Text style={styles.callButtonText}>Call Support</Text>
          </TouchableOpacity>
        </View>

        {/* Roadside Assistance Card */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <CustomTruckIcon />
          </View>
          <Text style={styles.cardTitle}>Roadside Assistance</Text>
          <Text style={styles.cardDesc}>
            Breakdowns, flat tires, or mechanical failures.
          </Text>
          <TouchableOpacity
            style={styles.cardOverlayBtn}
            onPress={() => handleCall('1800987654', 'Roadside Assistance')}
          />
        </View>

        {/* Report an Accident Card */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, styles.accidentIconContainer]}>
            <WarningTriangleIcon />
          </View>
          <Text style={styles.cardTitle}>Report an Accident</Text>
          <Text style={styles.cardDesc}>
            Immediate reporting protocol for any collision.
          </Text>
          <TouchableOpacity
            style={styles.cardOverlayBtn}
            onPress={() => handleCall('18005550199', 'Accident Reporting')}
          />
        </View>

        {/* App Tech Support Card */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <CustomSmartphoneIcon />
          </View>
          <Text style={styles.cardTitle}>App Tech Support</Text>
          <Text style={styles.cardDesc}>
            Login issues, GPS errors, or logging problems.
          </Text>
          <TouchableOpacity
            style={styles.cardOverlayBtn}
            onPress={() => handleCall('18004443322', 'Technical Support')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    backgroundColor: '#F9FAFB',
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
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#1E1A57',
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(40),
  },
  immediateCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: scale(16),
    padding: scale(24),
    marginBottom: verticalScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFE3E3',
  },
  immediateTitle: {
    fontSize: moderateScale(22),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
    marginBottom: verticalScale(8),
  },
  immediateDesc: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#4B5563',
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(20),
  },
  callButton: {
    flexDirection: 'row',
    backgroundColor: '#CA2027',
    borderRadius: scale(10),
    paddingVertical: verticalScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#CA2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  callButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    marginLeft: scale(8),
  },
  card: {
    backgroundColor: 'white',
    borderRadius: scale(16),
    paddingVertical: verticalScale(28),
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ECEEF2',
    position: 'relative',
  },
  iconContainer: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(12),
    backgroundColor: '#EDF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  accidentIconContainer: {
    backgroundColor: '#FFEAEA',
  },
  cardTitle: {
    fontSize: moderateScale(20),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
    marginBottom: verticalScale(8),
  },
  cardDesc: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  cardOverlayBtn: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: scale(16),
  },
});

export default SupportScreen;
