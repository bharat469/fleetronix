import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Trip } from '../types/trip';
import { COLORS } from '../helpers/values/colors';
import { scale, verticalScale, moderateScale } from '../helpers/dimension';
import { PhoneIcon } from '../assets/svgIcons';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useDriverInfo } from '../hooks/useAuth';

interface TripCardProps {
  trip: Trip;
  onPress?: (trip: Trip) => void;
  onContactPress?: (trip: Trip) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onPress, onContactPress }) => {
  const { t } = useTranslation();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);
  const { data: driverResponse } = useDriverInfo(driverId || '', userToken || '', !!driverId && !!userToken);
  const driver = driverResponse?.data;
  const isDriverSelf = driver?.driver_source === 'self' || trip.driver_source === 'self';

  const handleContactPress = () => {
    if (onContactPress) {
      onContactPress(trip);
      return;
    }
    const phone = trip.customer_mobile ||
      trip.driver_mobile ||
      (trip as any).phoneNumber ||
      ((trip as any).transporter && (trip as any).transporter.mobile) ||
      '';
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert(t('error', 'Error'), t('contact_phone_not_available', 'Contact phone number not available.'));
    }
  };

  const getStatusDetails = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return { label: t('assigned', 'Assigned'), bgColor: '#E0F2FE', textColor: '#0369A1' }; // Blue
      case 'started':
      case 'in_progress':
      case 'ongoing':
        return { label: t('ongoing', 'Ongoing'), bgColor: '#FEF3C7', textColor: '#B45309' }; // Amber/Yellow
      default:
        return { label: status || t('pending', 'Pending'), bgColor: '#F3F4F6', textColor: '#374151' }; // Gray
    }
  };

  const statusDetails = getStatusDetails(trip.status);

  // Compute shipper name display values
  const hasShipperNameParts = !!(trip.shipper_name_first || trip.shipper_name_last);
  const fullShipperName = hasShipperNameParts
    ? `${trip.shipper_name_first || ''} ${trip.shipper_name_last || ''}`.trim()
    : trip.shipperName || '--';

  const transporterName = (trip as any).transporter_company_name ||
    ((trip as any).transporter && (trip as any).transporter.company_name) ||
    trip.owner_name ||
    '--';

  const pickup = trip.source_city || trip.pickup_city || '--';
  const drop = trip.destination_city || trip.drop_city || '--';

  // Format currency/amount
  const formatAmount = (cost: any) => {
    if (!cost) return '₹ 12,000';
    const cleanCost = String(cost).replace(/₹|Rs\.?\s?/g, '').trim();
    return `₹ ${cleanCost}`;
  };

  const isCompleted = trip.status?.toLowerCase() === 'completed';
  const ratingValue = (trip as any).rating || (trip as any).trip_rating || (trip as any).feedback?.rating;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={() => onPress?.(trip)}
    >
      <View style={styles.headerRow}>
        <View style={styles.routeContainer}>
          <Text style={styles.routeText}>{`${pickup} ➜ ${drop}`}</Text>
        </View>

        {isCompleted ? (
          <View style={styles.completedBadgeContainer}>
            <Text style={styles.completedRatingText}>{ratingValue || '4.3'} ⭐</Text>
            <View style={styles.greenTickCircle}>
              <Text style={styles.whiteTickText}>✓</Text>
            </View>
          </View>
        ) : (
          trip.status && (
            <View style={[styles.statusTag, { backgroundColor: statusDetails.bgColor }]}>
              <Text style={[styles.statusText, { color: statusDetails.textColor }]}>{statusDetails.label}</Text>
            </View>
            )
        )}
      </View>

      <Text style={styles.tripIdText}>{t('trip_id_label', 'Trip id')} - #{trip.trip_number || trip.trip_id || trip.load_id || 'N/A'}</Text>

      <View style={styles.gridContainer}>
        <GridRow label={t('shipper', 'Shipper')} value={fullShipperName} />
        <GridRow label={t('transporter', 'Transporter')} value={transporterName} />
        <GridRow label={t('task', 'Task')} value={trip.task || 'Cement'} />
        <GridRow label={t('pickup', 'Pickup')} value={trip.source_address || trip.pickup_city || '12/24 Carol Bagh, New Delhi....'} />
        <GridRow label={t('drop', 'Drop')} value={trip.destination_address || trip.drop_city || '12/34 Church Street, Thane, Mumbai'} />
        {isDriverSelf && (
          <GridRow
            label={t('amount', 'Amount')}
            value={formatAmount(trip.amount || trip.total_trip_cost || trip.price || trip.trip_estimate)}
            valueStyle={styles.earningValueText}
          />
        )}
      </View>

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.contactContainer}
        activeOpacity={0.6}
        onPress={handleContactPress}
      >
        <PhoneIcon color={COLORS.primary} width={scale(18)} height={scale(18)} />
        <Text style={styles.contactText}>{isCompleted ? t('get_support', 'Get Support') : t('get_in_contact', 'Get in Contact')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const GridRow = ({ label, value, valueStyle }: { label: string; value: string; valueStyle?: any }) => (
  <View style={styles.gridRow}>
    <Text style={styles.gridLabel}>{label}</Text>
    <Text style={[styles.gridValue, valueStyle]} numberOfLines={2}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: scale(24),
    padding: scale(20),
    marginVertical: verticalScale(10),
    marginHorizontal: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeContainer: {
    flex: 1,
    marginRight: scale(10),
  },
  routeText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#000',
  },
  tripIdText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#858080',
    marginTop: verticalScale(4),
    marginBottom: verticalScale(15),
  },
  statusTag: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
  },
  statusText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  completedBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  completedRatingText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#333',
  },
  greenTickCircle: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: '#00C853', // green circle
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteTickText: {
    color: 'white',
    fontSize: scale(11),
    fontWeight: 'bold',
    lineHeight: scale(13),
  },
  gridContainer: {
    marginTop: verticalScale(5),
  },
  gridRow: {
    flexDirection: 'row',
    marginVertical: verticalScale(6),
    alignItems: 'flex-start',
  },
  gridLabel: {
    width: scale(100),
    fontSize: moderateScale(14),
    color: '#858080',
    fontWeight: '400',
  },
  gridValue: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#000',
    fontWeight: '600',
  },
  earningValueText: {
    color: '#00C853', // Green text for earning value
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: verticalScale(15),
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(5),
  },
  contactText: {
    fontSize: moderateScale(16),
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: scale(8),
  },
});

export default TripCard;
