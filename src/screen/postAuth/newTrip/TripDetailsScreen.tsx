import React, { useState } from 'react';
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useTripBreif, useTripDetails } from '../../../hooks/useTripDetails';
import Config from 'react-native-config';

/** Converts ISO timestamp → 'Apr 20, 2026 · 10:04 AM' */
const formatDate = (iso?: string | null): string => {
  if (!iso) return 'N/A';
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} · ${time}`;
  } catch {
    return iso;
  }
};

const TripDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TripDetails'>>();
  const { tripId, loadNumber, } = route.params || {};
  const mapRef = React.useRef<MapView>(null);

  // Fetch live trip details
  const { data: apiData } = useTripDetails(tripId);
  const { data: apiBriefData } = useTripBreif(tripId);

  // Console log the result
  React.useEffect(() => {
    if (apiData) {
      console.log('✅ [TripDetails API Result]:', apiData);
    }
  }, [apiData]);

  const data = { ...apiData, ...apiBriefData }

  console.log('sdhks', data)
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
                  source={{ uri: data?.driver_photo_url || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                  style={styles.profilePic}
                />
                <View style={styles.verifiedBadge}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              </View>
              <Text style={styles.driverNameLarge}>{data?.driver_name?.split(' ')[0] || 'N/A'}</Text>
            </View>

            <View style={styles.rightColumn}>
              <MetricRow label="Task" value={data?.task || 'General Delivery'} />
              <MetricRow label="Assigned At" value={formatDate(data?.assigned_at)} />
              <MetricRow label="Current Status" value={data?.status} />
              <MetricRow label="Trip Estimate" value={`Rs ${data?.trip_cost}`} />
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
          <TableInfoRow label="Vehicle Number" value={data?.vehicle_number || 'N/A'} />
          <TableInfoRow label="Owner Name" value={data?.owner_name || 'Fleetronix'} />
          <TableInfoRow label="Driver Name" value={data?.driver_name || 'N/A'} />
          <TableInfoRow label="Driver Mobile" value={data?.driver_mobile || 'N/A'} />
          <TableInfoRow label="Status" value={data?.status || 'N/A'} />
          <TableInfoRow label="Assigned At" value={formatDate(data?.assigned_at)} />
        </View>

        {/* Map Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Map</Text>
        </View>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              // Centre between pickup and destination
              latitude: ((parseFloat(data?.source_latitude) || 25.7919) + (parseFloat(data?.destination_latitude) || 23.4559)) / 2,
              longitude: ((parseFloat(data?.source_longitude) || 73.1721) + (parseFloat(data?.destination_longitude) || 85.2557)) / 2,
              latitudeDelta: Math.abs((parseFloat(data?.source_latitude) || 25.7919) - (parseFloat(data?.destination_latitude) || 23.4559)) * 1.5 + 0.5,
              longitudeDelta: Math.abs((parseFloat(data?.source_longitude) || 73.1721) - (parseFloat(data?.destination_longitude) || 85.2557)) * 1.5 + 0.5,
            }}
            scrollEnabled={false}
          >
            {/* Google Directions route line */}
            {data?.source_latitude && data?.destination_latitude && (
              <MapViewDirections
                origin={{
                  latitude: parseFloat(data.source_latitude),
                  longitude: parseFloat(data.source_longitude),
                }}
                destination={{
                  latitude: parseFloat(data.destination_latitude),
                  longitude: parseFloat(data.destination_longitude),
                }}
                apikey={Config.GOOGLE_MAPS_API_KEY ?? ''}
                strokeWidth={4}
                strokeColor="#CA2027"
                onReady={(result) => {
                  // Fit map to show full route
                  mapRef.current?.fitToCoordinates(result.coordinates, {
                    edgePadding: { top: 20, right: 20, bottom: 20, left: 20 },
                    animated: false,
                  });
                }}
              />
            )}

            {/* Pickup marker */}
            {data?.source_latitude && (
              <Marker
                coordinate={{
                  latitude: parseFloat(data.source_latitude),
                  longitude: parseFloat(data.source_longitude),
                }}
                title="Pickup"
                description={data?.source_address || data?.source_city}
                pinColor="#4CAF50"
              />
            )}

            {/* Destination marker */}
            {data?.destination_latitude && (
              <Marker
                coordinate={{
                  latitude: parseFloat(data.destination_latitude),
                  longitude: parseFloat(data.destination_longitude),
                }}
                title="Destination"
                description={data?.destination_address || data?.destination_city}
              >
                <LocationIcon color="#CA2027" width={30} height={30} />
              </Marker>
            )}
          </MapView>
        </View>

        {/* Route Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Route</Text>
        </View>
        <View style={styles.routeCard}>
          <RoutePoint
            title={`${data?.trip_direction?.starting_point || ''}`}
            time="Pick Up Point"
            type="start"
          />
          <View style={styles.routeConnector} />
          <RoutePoint
            title={`${data?.trip_direction?.ending_point || ''}`}
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
          <BasisRow label="Total trip estimate" value={`Rs ${data?.total_trip_cost || data?.estimate || '0'}`} />
          <BasisHeader title="Location Details" />
          <BasisRow label="From" value={data?.trip_direction?.starting_point || data?.pickup} />
          <BasisRow label="To" value={data?.trip_direction?.ending_point || data?.drop} />

          <BasisHeader title="Schedule" />
          <BasisRow label="Assigned At" value={formatDate(data?.assigned_at)} />
          <BasisRow label="Est. Delivery" value={formatDate(data?.delivery_time ?? data?.estimated_delivery)} />
        </View>




        {/* Start Button */}
        {data?.status !== 'completed' && (
          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StartTrip', { trip: data })}
          >
            <Text style={styles.startBtnText}>Start Trip</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};


function MetricRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function TableInfoRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{label}</Text>
      <Text style={styles.tableValue}>{value}</Text>
    </View>
  );
}

function RoutePoint({ title, time, type, extra }: { title: string, time: string, type: string, extra?: string }) {
  return (
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
}

function BasisHeader({ title }: { title: string }) {
  return <Text style={styles.basisHeader}>{title}</Text>;
}

function BasisRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.basisBox}>
      <Text style={styles.basisLabel}>{label}</Text>
      <Text style={styles.basisValue}>{value}</Text>
    </View>
  );
}

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
  ratingText: {
    fontSize: moderateScale(12),
    color: '#F5A623',
    fontWeight: '700',
    marginTop: verticalScale(2),
  },
  tripsText: {
    fontSize: moderateScale(11),
    color: '#858080',
    marginTop: verticalScale(1),
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
    height: verticalScale(220),
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
  // center: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   backgroundColor: 'white',
  //   padding: scale(20),
  // },
  // loadingText: {
  //   marginTop: verticalScale(15),
  //   fontSize: moderateScale(16),
  //   color: '#666',
  // },
  // errorText: {
  //   fontSize: moderateScale(16),
  //   color: COLORS.primary,
  //   textAlign: 'center',
  //   marginBottom: verticalScale(20),
  // },
  // retryButton: {
  //   paddingHorizontal: scale(30),
  //   paddingVertical: verticalScale(12),
  //   backgroundColor: COLORS.primary,
  //   borderRadius: scale(10),
  // },
  // retryText: {
  //   color: 'white',
  //   fontSize: moderateScale(16),
  //   fontWeight: '600',
  // },
});


export default TripDetailsScreen;
