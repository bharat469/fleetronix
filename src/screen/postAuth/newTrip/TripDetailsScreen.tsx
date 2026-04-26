import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { COLORS } from '../../../helpers/values/colors';
import { BackArrowIcon, PhoneIcon, LocationIcon } from '../../../assets/svgIcons';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useTripDetails } from '../../../hooks/useTripDetails';
import { ActivityIndicator } from 'react-native';



const TripDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TripDetails'>>();

  const { tripId, loadNumber } = route.params || { tripId: '69e5fa1075ff18906134d252', loadNumber: '283492' };

  const { data: trip, isLoading, error, refetch } = useTripDetails(tripId);

  // Log the result as requested
  React.useEffect(() => {
    if (trip) {
      console.log('[TripDetailsScreen] API Result:', JSON.stringify(trip, null, 2));
    }
    // if (error) {
    //   console.error('[TripDetailsScreen] API Error:', error);
    // }
  }, [trip, error]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching trip details...</Text>
      </View>
    );
  }

  if (error || !trip) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error instanceof Error ? error.message : 'Failed to load trip details'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>#{loadNumber}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Info Card */}
        <View style={styles.topCard}>
          <Text style={styles.loadIdLabel}>Load Id - #{loadNumber}</Text>

          <View style={styles.cardMain}>
            <View style={styles.leftColumn}>
              <View style={styles.profileWrapper}>
                <Image
                  source={{ uri: trip.driver_photo_url || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                  style={styles.profilePic}
                />
                <View style={styles.verifiedBadge}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              </View>
              <Text style={styles.driverNameLarge}>{trip.driver_name?.split(' ')[0]}</Text>
            </View>

            <View style={styles.rightColumn}>
              <MetricRow label="Task" value={trip.task || 'General Delivery'} />
              <MetricRow label="Assigned At" value={trip.assigned_at} />
              <MetricRow label="Current Status" value={trip.status} />
              <MetricRow label="Trip Estimate" value={`Rs ${trip.trip_estimate}`} />
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardBottom}>
            <TouchableOpacity style={styles.contactActionBtn}>
              <PhoneIcon color="#CA2027" width={18} height={18} />
              <Text style={styles.contactActionText}>Get in Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={true} style={{ opacity: 0.5 }}>
              <Text style={[styles.declineText, { color: '#858080' }]}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Truck Info Section (Red Box) */}
        <View style={styles.truckInfoBox}>
          <Text style={styles.boxTitle}>Truck info</Text>
          <TableInfoRow label="Vehicle Number" value={trip.vehicle_number || 'N/A'} />
          <TableInfoRow label="Owner Name" value={trip.owner_name || 'Fleetronix'} />
          <TableInfoRow label="Driver Name" value={trip.driver_name || 'N/A'} />
          <TableInfoRow label="Driver Mobile" value={trip.driver_mobile || 'N/A'} />
          <TableInfoRow label="Status" value={trip.status || 'N/A'} />
          <TableInfoRow label="Assigned At" value={trip.assigned_at || 'N/A'} />
        </View>

        {/* Map Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Map</Text>
        </View>
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: parseFloat(trip.pickup_lat) || 30.3165,
              longitude: parseFloat(trip.pickup_lng) || 78.0322,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            scrollEnabled={false}
          >
            <Marker coordinate={{
              latitude: parseFloat(trip.pickup_lat) || 30.3165,
              longitude: parseFloat(trip.pickup_lng) || 78.0322
            }}>
              <LocationIcon color="#CA2027" width={30} height={30} />
            </Marker>
          </MapView>
        </View>

        {/* Route Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Route</Text>
        </View>
        <View style={styles.routeCard}>
          <RoutePoint
            title={`${trip.pickup_address || ''}, ${trip.pickup_city}`}
            time="Pick Up Point"
            type="start"
          />
          <View style={styles.routeConnector} />
          <RoutePoint
            title={`${trip.drop_address || ''}, ${trip.drop_city}`}
            time="Drop Off Point"
            type="end"
            extra="Final Destination"
          />
        </View>

        {/* Basis Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Financials</Text>
        </View>
        <View style={styles.basisCard}>
          <BasisRow label="Total trip estimate" value={`Rs ${trip.trip_estimate || trip.estimate || '0'}`} />
          <BasisHeader title="Location Details" />
          <BasisRow label="From" value={trip.pickup_city || trip.pickup} />
          <BasisRow label="To" value={trip.drop_city || trip.drop} />

          <BasisHeader title="Schedule" />
          <BasisRow label="Assigned At" value={trip.assigned_at || 'N/A'} />
          <BasisRow label="Est. Delivery" value={trip.estimated_delivery || 'N/A'} />
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.startBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('StartTrip', { trip })}
        >
          <Text style={styles.startBtnText}>Start Trip</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};


const MetricRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const TableInfoRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.tableRow}>
    <Text style={styles.tableLabel}>{label}</Text>
    <Text style={styles.tableValue}>{value}</Text>
  </View>
);

const RoutePoint = ({ title, time, type, extra }: { title: string, time: string, type: string, extra?: string }) => (
  <View style={styles.routePoint}>
    <View style={styles.pointDotContainer}>
      <View style={[
        styles.pointDot,
        type === 'start' ? styles.startDot : type === 'end' ? styles.endDot : styles.midDot
      ]} />
    </View>
    <View style={styles.pointContent}>
      <Text style={styles.pointTitle}>{title}</Text>
      <Text style={styles.pointTime}>{time}</Text>
      {extra && <Text style={styles.pointExtra}>{extra}</Text>}
    </View>
  </View>
);

const BasisHeader = ({ title }: { title: string }) => (
  <Text style={styles.basisHeader}>{title}</Text>
);

const BasisRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.basisBox}>
    <Text style={styles.basisLabel}>{label}</Text>
    <Text style={styles.basisValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    marginRight: scale(15),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#000',
  },
  scrollContent: {
    paddingBottom: verticalScale(50),
  },
  topCard: {
    margin: scale(20),
    padding: scale(25),
    borderRadius: scale(35),
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  loadIdLabel: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#000',
    marginBottom: verticalScale(20),
  },
  cardMain: {
    flexDirection: 'row',
  },
  leftColumn: {
    alignItems: 'center',
    width: scale(90),
  },
  profileWrapper: {
    position: 'relative',
    marginBottom: verticalScale(10),
  },
  profilePic: {
    width: scale(75),
    height: scale(75),
    borderRadius: scale(37.5),
    backgroundColor: '#F5F5F5',
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
  driverNameLarge: {
    fontSize: moderateScale(28),
    fontWeight: '800',
    color: '#000',
  },
  rightColumn: {
    flex: 1,
    marginLeft: scale(15),
    paddingTop: verticalScale(5),
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },
  metricLabel: {
    fontSize: moderateScale(11),
    color: '#858080',
    width: '45%',
  },
  metricValue: {
    fontSize: moderateScale(11),
    color: '#000',
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: verticalScale(20),
    width: '100%',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(5),
  },
  contactActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  contactActionText: {
    color: '#CA2027',
    fontWeight: '700',
    fontSize: moderateScale(17),
  },
  declineText: {
    color: '#FF4D4D',
    fontWeight: '600',
    fontSize: moderateScale(17),
  },
  truckInfoBox: {
    backgroundColor: '#CC2B2B',
    marginHorizontal: scale(20),
    borderRadius: scale(15),
    padding: scale(20),
  },
  boxTitle: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(15),
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  tableLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: moderateScale(12),
  },
  tableValue: {
    color: 'white',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: scale(25),
    marginTop: verticalScale(25),
    marginBottom: verticalScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#000',
  },
  mapContainer: {
    height: verticalScale(150),
    marginHorizontal: scale(20),
    borderRadius: scale(15),
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  routeCard: {
    marginHorizontal: scale(20),
    padding: scale(20),
    borderRadius: scale(15),
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  routePoint: {
    flexDirection: 'row',
  },
  pointDotContainer: {
    width: 20,
    alignItems: 'center',
  },
  pointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  startDot: { backgroundColor: '#888' },
  midDot: { backgroundColor: 'white', borderWidth: 2, borderColor: '#888' },
  endDot: { backgroundColor: '#CA2027' },
  routeConnector: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginLeft: 9,
    marginVertical: 2,
  },
  pointContent: {
    marginLeft: 15,
    flex: 1,
  },
  pointTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#000',
  },
  pointTime: {
    fontSize: moderateScale(11),
    color: '#888',
    marginTop: 2,
  },
  pointExtra: {
    fontSize: moderateScale(10),
    color: '#CA2027',
    marginTop: 2,
  },
  basisCard: {
    marginHorizontal: scale(20),
    padding: scale(20),
    borderRadius: scale(15),
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  basisBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  basisLabel: {
    fontSize: moderateScale(12),
    color: '#888',
  },
  basisValue: {
    fontSize: moderateScale(12),
    color: '#000',
    fontWeight: '600',
  },
  basisHeader: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#000',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(5),
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    marginHorizontal: scale(40),
    marginTop: verticalScale(40),
    height: verticalScale(55),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: verticalScale(15),
    fontSize: moderateScale(16),
    color: '#858080',
  },
  errorText: {
    fontSize: moderateScale(16),
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: scale(30),
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
  },
  retryText: {
    color: 'white',
    fontWeight: '700',
  },
});


export default TripDetailsScreen;
