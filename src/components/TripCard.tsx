import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Trip } from '../types/trip';
import { COLORS } from '../helpers/values/colors';
import { scale, verticalScale, moderateScale } from '../helpers/dimension';
import { PhoneIcon, ProfileIcon } from '../assets/svgIcons';
import Config from 'react-native-config';


interface TripCardProps {
  trip: Trip;
  onPress?: (trip: Trip) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onPress }) => {
  const getStatusDetails = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return { label: 'Assigned', bgColor: '#E0F2FE', textColor: '#0369A1' }; // Blue
      case 'started':
      case 'in_progress':
      case 'ongoing':
        return { label: 'Ongoing', bgColor: '#FEF3C7', textColor: '#B45309' }; // Amber/Yellow
      case 'completed':
        return { label: 'Completed', bgColor: '#DCFCE7', textColor: '#15803D' }; // Green
      default:
        return { label: status || 'Pending', bgColor: '#F3F4F6', textColor: '#374151' }; // Gray
    }
  };

  const statusDetails = getStatusDetails(trip.status);

  // Compute shipper name display values
  const hasShipperNameParts = !!(trip.shipper_name_first || trip.shipper_name_last);
  const displayShipperName = hasShipperNameParts
    ? `${trip.shipper_name_first || ''} ${trip.shipper_name_last || ''}`.trim()
    : (trip.shipperName || '').split(' ')[0] || 'Name';

  const fullShipperName = hasShipperNameParts
    ? `${trip.shipper_name_first || ''} ${trip.shipper_name_last || ''}`.trim()
    : trip.shipperName || 'N/A';

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={() => onPress?.(trip)}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.loadId}>Load Id - #{trip.load_number || trip.load_id || trip.trip_number}</Text>
          {!!trip.trip_number && (
            <Text style={styles.tripNumber}>Trip Number - #{trip.trip_number}</Text>
          )}
        </View>
        {trip.status && (
          <View style={[styles.statusTag, { backgroundColor: statusDetails.bgColor }]}>
            <Text style={[styles.statusText, { color: statusDetails.textColor }]}>{statusDetails.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.mainContent}>
        <View style={styles.profileSection}>
          <View style={styles.imageWrapper}>
            {!!(trip.driver_photo_url || trip.image) ? (
              <Image
                source={{
                  uri: String(trip.driver_photo_url || trip.image).startsWith('http')
                    ? (trip.driver_photo_url || trip.image)
                    : `${Config.IMAGE_BASE_URL}${trip.driver_photo_url || trip.image}`
                }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profilePlaceholder]}>
                <ProfileIcon color="#858080" width={scale(40)} height={scale(40)} />
              </View>
            )}
            {
              (trip.driver_photo_url || trip.image) && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )
            }
          </View>
          <Text style={styles.nameText}>{displayShipperName}</Text>
        </View>

        <View style={styles.detailsGrid}>
          <DetailRow label="Shipper Name" value={fullShipperName} />
          <DetailRow label="Task" value={trip.task || "Chemical Delivery"} />
          <DetailRow label="Pickup" value={trip.source_city || trip.pickup_city || 'N/A'} />
          <DetailRow label="Drop" value={trip.destination_city || trip.drop_city || 'N/A'} />
          <DetailRow label="Trip Estimate" value={`Rs ${trip.trip_cost || trip.trip_estimate || '0'}`} />
        </View>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.contactContainer} activeOpacity={0.6}>
        <PhoneIcon color={COLORS.primary} width={20} height={20} />
        <Text style={styles.contactText}>Get in Contact</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: scale(30),
    padding: scale(20),
    marginVertical: verticalScale(10),
    marginHorizontal: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  loadId: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#000',
  },
  tripNumber: {
    fontSize: moderateScale(11),
    fontWeight: '500',
    color: '#858080',
    marginTop: verticalScale(2),
  },
  statusTag: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
  },
  statusText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileSection: {
    alignItems: 'center',
    width: scale(70),
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: '#F5F5F5',
  },
  profilePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    left: 0,
    top: verticalScale(2),
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: '#4CD964',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  checkMark: {
    color: 'white',
    fontSize: scale(8),
    fontWeight: 'bold',
  },
  nameText: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#000',
  },
  detailsGrid: {
    flex: 1,
    marginLeft: scale(20),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },
  label: {
    fontSize: moderateScale(12),
    color: '#858080',
    width: '45%',
  },
  value: {
    fontSize: moderateScale(12),
    color: '#333333',
    fontWeight: '600',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: verticalScale(15),
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scale(5),
  },
  contactText: {
    fontSize: moderateScale(16),
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: scale(10),
  },
});

export default TripCard;
