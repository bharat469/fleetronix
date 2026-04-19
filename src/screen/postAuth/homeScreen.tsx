import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Dimensions,

} from 'react-native';
import { COLORS } from '../../helpers/values/colors';
import ActionCard from '../../components/ActionCard';
import {
  BellIcon,
  LocationIcon,
  TruckIcon,
  SignpostIcon,
  MoneyBagIcon,
  SupportIcon,
  RoadIcon,
  LedgerIcon,
} from '../../assets/svgIcons';

import LinearGradient from 'react-native-linear-gradient';

import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale, SCREEN } from '../../helpers/dimension';



const HomeScreen = () => {
  const { t } = useTranslation();
  const [isEnabled, setIsEnabled] = useState(true);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <ImageBackground
          source={require('../../assets/images/pexels-photoscom-93398 1.png')}
          style={styles.headerBackground}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.4)']}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.topRow}>
              <Text style={styles.timeText}>9:41</Text>
              <View style={styles.locationContainer}>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.currentAddressLabel}>{t('current_address')}</Text>
                  <Text style={styles.locationText}>Hyderabad, India</Text>
                </View>
                <LocationIcon />
              </View>
            </View>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>{t('welcome_upper')}</Text>
              <View style={styles.welcomeUnderline} />
              <Text style={styles.driverName}>Sahil Kumar</Text>
              <View style={styles.driverStats}>
                <Text style={styles.statText}>
                  {t('driver_id')}: <Text style={styles.statValue}>EXAPR06F52</Text>
                </Text>
                <Text style={styles.statText}>
                  {t('vehicle_number')}: <Text style={styles.statValue}>UK07 EXAP 5254</Text>
                </Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.notificationBtn}>
                <BellIcon /><View style={styles.notificationDot} />
              </TouchableOpacity>
              <View style={styles.switchContainer}>
                <Switch
                  trackColor={{ false: '#767577', true: '#4CD964' }}
                  thumbColor={isEnabled ? '#f4f3f4' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={toggleSwitch}
                  value={isEnabled}
                />
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
        <View style={styles.dashboardContainer}>
          <View style={styles.handle} />
          <View style={styles.grid}>
            <ActionCard
              title={t('new_trip')}
              subtitle={t('trip_card_desc')}
              Icon={TruckIcon}
              iconBgColor="rgba(255, 107, 0, 0.1)"
            />
            <ActionCard
              title={t('all_trips')}
              subtitle={t('trip_card_desc')}
              Icon={SignpostIcon}
              iconBgColor="rgba(255, 0, 255, 0.1)"
            />
            <ActionCard
              title={t('expenses')}
              subtitle={t('trip_card_desc')}
              Icon={MoneyBagIcon}
              iconBgColor="rgba(0, 200, 83, 0.1)"
            />
            <ActionCard
              title={t('support')}
              subtitle={t('trip_card_desc')}
              Icon={SupportIcon}
              iconBgColor="rgba(211, 47, 47, 0.1)"
            />
            <ActionCard
              title={t('pod')}
              subtitle={t('trip_card_desc')}
              Icon={RoadIcon}
              iconBgColor="rgba(141, 110, 99, 0.1)"
            />
            <ActionCard
              title={t('ledger')}
              subtitle={t('trip_card_desc')}
              Icon={LedgerIcon}
              iconBgColor="rgba(255, 204, 128, 0.2)"
            />
          </View>
          <View style={styles.sliderIndicatorContainer}>
            <View style={styles.sliderTrack}><View style={styles.sliderActive} /></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerBackground: {
    width: '100%',
    height: SCREEN.HEIGHT * 0.45,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(40),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    alignItems: 'flex-end',
    marginRight: scale(8),
  },
  currentAddressLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: moderateScale(10),
  },
  locationText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  welcomeSection: {
    marginTop: verticalScale(30),
  },
  welcomeText: {
    color: 'white',
    fontSize: moderateScale(32),
    fontWeight: '800',
    letterSpacing: 1,
  },
  welcomeUnderline: {
    height: 2,
    backgroundColor: 'white',
    width: scale(120),
    marginTop: verticalScale(4),
  },
  driverName: {
    color: 'white',
    fontSize: moderateScale(22),
    fontWeight: '600',
    marginTop: verticalScale(15),
  },
  driverStats: {
    marginTop: verticalScale(10),
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: moderateScale(10),
    lineHeight: verticalScale(16),
  },
  statValue: {
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: verticalScale(60),
  },
  notificationBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: verticalScale(10),
    right: scale(10),
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#FF6B00',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  switchContainer: {
    transform: [{ scale: 1.2 }],
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: verticalScale(-40),
    borderTopLeftRadius: scale(40),
    borderTopRightRadius: scale(40),
    paddingTop: verticalScale(12),
    paddingHorizontal: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handle: {
    width: scale(60),
    height: 4,
    backgroundColor: '#D1D1D1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: verticalScale(25),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sliderIndicatorContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(20),
  },
  sliderTrack: {
    width: SCREEN.WIDTH * 0.7,
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    flexDirection: 'row',
  },
  sliderActive: {
    width: '50%',
    height: '100%',
    backgroundColor: '#CC2B2B',
    borderRadius: 3,
  },
});


export default HomeScreen;