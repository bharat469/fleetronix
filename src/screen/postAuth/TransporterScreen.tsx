import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../helpers/values/colors';
import { BackArrowIcon, PhoneIcon } from '../../assets/svgIcons';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePublicRequests } from '../../hooks/usePublicRequests';
import { useTripRequests } from '../../hooks/useTripRequests';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { respondToTripRequest } from '../../services/tripApi';

type TabType = 'request' | 'public_posting' | 'assigned' | 'completed';

interface TransporterLoad {
  id: string;
  loadId: string;
  transporter_company_name: string;
  task: string;
  pickup: string;
  drop: string;
  tripEstimate: string;
  contactPerson: string;
  phoneNumber: string;
  status: TabType;
  request_id?: string;
}

// Mapper function to transform API response to TransporterLoad
const mapPublicRequestToTransporterLoad = (item: any): TransporterLoad => {
  const transporterCompany = item.transporter_company_name || (item.transporter && item.transporter.company_name) || item.shipperName || item.owner_name || 'N/A';
  const source = item.origin || item.source_address || item.pickup_city || item.source_city || item.pickup || 'N/A';
  const dest = item.destination || item.destination_address || item.drop_city || item.destination_city || item.drop || 'N/A';

  return {
    id: String(item.id || item.trip_id || item.load_id || Math.random().toString()),
    loadId: item.load_id || item.load_number || item.trip_number || item.trip_id || 'N/A',
    transporter_company_name: transporterCompany,
    task: item.task || item.vehicle_type || 'General Cargo',
    pickup: source,
    drop: dest,
    tripEstimate: item.total_trip_cost ? `Rs ${item.total_trip_cost}` : (item.trip_estimate || item.price || 'N/A'),
    contactPerson: item.customer_name || item.contactPerson || transporterCompany || 'Shipper',
    phoneNumber: item.customer_mobile || item.phoneNumber || item.driver_mobile || (item.transporter && item.transporter.mobile) || '',
    status: 'public_posting',
    request_id: item.id || '',
  };
};

// Mapper function to transform GET Trip Requests API response to TransporterLoad
const mapTripRequestToTransporterLoad = (item: any, statusType: TabType): TransporterLoad => {
  const transporterCompany = item.transporter_company_name || (item.transporter && item.transporter.company_name) || item.shipperName || item.owner_name || 'N/A';
  const source = item.origin || item.source_address || item.pickup_city || item.source_city || item.pickup || 'N/A';
  const dest = item.destination || item.destination_address || item.drop_city || item.destination_city || item.drop || 'N/A';

  // Only expose request_id (for Accept/Reject actions) on 'request' tab (where status is pending)
  const reqId = statusType === 'request' ? (item.request_number || item.id || '') : undefined;

  return {
    id: String(item.id || item.request_number || Math.random().toString()),
    loadId: item.request_number || item.load_id || item.load_number || item.trip_number || 'N/A',
    transporter_company_name: transporterCompany,
    task: item.task || item.vehicle_type || 'General Cargo',
    pickup: source,
    drop: dest,
    tripEstimate: item.total_trip_cost ? `Rs ${item.total_trip_cost}` : (item.trip_estimate || item.price || 'N/A'),
    contactPerson: item.customer_name || item.contactPerson || transporterCompany || 'Shipper',
    phoneNumber: item.customer_mobile || item.phoneNumber || item.driver_mobile || (item.transporter && item.transporter.mobile) || '',
    status: statusType,
    request_id: reqId,
  };
};

interface ShipmentCardProps {
  item: TransporterLoad;
  onContactPress: (phoneNumber: string, name: string) => void;
  onRespondPress: (requestNumber: string, action: 'accept' | 'decline') => void;
}

const ShipmentCard = React.memo(({ item, onContactPress, onRespondPress }: ShipmentCardProps) => {
  return (
    <View style={styles.card}>
      {/* Route Header */}
      <Text style={styles.cardRouteHeader}>{item.pickup} → {item.drop}</Text>

      {/* Content Row */}
      <View style={styles.cardBody}>
        {/* Left Column: Avatar */}
        <View style={styles.avatarColumn}>
          <View style={styles.imageWrapper}>
            <Image
              source={require('../../assets/images/shipper_avatar.png')}
              style={styles.avatarImage}
            />
            {/* Verified Checkmark Badge */}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedCheck}>✓</Text>
            </View>
          </View>
          <Text style={styles.avatarName}>{item.contactPerson}</Text>
        </View>

        {/* Right Column: Details */}
        <View style={styles.detailsColumn}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transporter</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{item.transporter_company_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Task</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{item.task}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{item.pickup}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Drop</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{item.drop}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trip Estimate</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{item.tripEstimate}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Footer Contact and Actions Row */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => onContactPress(item.phoneNumber, item.transporter_company_name)}
          activeOpacity={0.7}
        >
          <PhoneIcon color="#CC2B2B" width={scale(15)} height={scale(15)} />
          <Text style={styles.contactButtonText}>Get in Contact</Text>
        </TouchableOpacity>

        {item.request_id ? (
          <View style={styles.cardFooterActions}>
            <TouchableOpacity
              onPress={() => onRespondPress(item.request_id!, 'accept')}
              activeOpacity={0.7}
              style={styles.actionTextButton}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onRespondPress(item.request_id!, 'decline')}
              activeOpacity={0.7}
              style={styles.actionTextButton}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
});

const TransporterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<TabType>('request');

  const CATEGORIES = useMemo<{ label: string; value: TabType }[]>(() => [
    { label: 'Request', value: 'request' },
    { label: 'public posting', value: 'public_posting' },
    { label: 'assigined', value: 'assigned' },
    { label: 'completed', value: 'completed' },
  ], []);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Helper to map tab selection to status filter for trip requests api
  const getStatusFromTab = useCallback((tab: TabType): 'pending' | 'accepted' | 'rejected' | null => {
    switch (tab) {
      case 'request':
        return 'pending';
      case 'assigned':
        return 'accepted';
      case 'completed':
        return 'rejected';
      default:
        return null;
    }
  }, []);

  const activeStatus = getStatusFromTab(activeTab);

  // Call TanStack query hook. Enabled only when public posting tab is active.
  const {
    data: publicRequestsData,
    isLoading: isPublicRequestsLoading,
    isRefetching: isPublicRequestsRefetching,
    error: publicRequestsError,
    refetch: refetchPublicRequests,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicRequests(activeTab === 'public_posting');

  // Call TanStack query hook for status-based requests. Enabled when tab is 'request', 'assigned', or 'completed'.
  const {
    data: tripRequestsData,
    isLoading: isTripRequestsLoading,
    isRefetching: isTripRequestsRefetching,
    error: tripRequestsError,
    refetch: refetchTripRequests,
    fetchNextPage: fetchNextPageTrip,
    hasNextPage: hasNextPageTrip,
    isFetchingNextPage: isFetchingNextPageTrip,
  } = useTripRequests(activeStatus || 'pending', activeStatus !== null);

  // Mutation to respond to a trip request (accept/decline)
  const respondMutation = useMutation({
    mutationFn: ({ requestNumber, action }: { requestNumber: string; action: 'accept' | 'decline' }) =>
      respondToTripRequest(requestNumber, action),
    onSuccess: (data, variables) => {
      Alert.alert('Success', `Successfully ${variables.action}ed the request.`);
      queryClient.invalidateQueries({ queryKey: ['publicRequestsInfinite'] });
      queryClient.invalidateQueries({ queryKey: ['tripRequestsInfinite'] });
    },
    onError: (error: any) => {
      const errMsg = error?.response?.data?.message || error?.message || 'Failed to respond to request.';
      Alert.alert('Error', errMsg);
    },
  });

  const handleRespond = useCallback((requestNumber: string, action: 'accept' | 'decline') => {
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Request`,
      `Are you sure you want to ${action} this trip request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            respondMutation.mutate({ requestNumber, action });
          },
        },
      ]
    );
  }, [respondMutation]);

  const handleRefresh = useCallback(async () => {
    if (activeTab === 'public_posting') {
      await refetchPublicRequests();
    } else if (activeStatus !== null) {
      await refetchTripRequests();
    } else {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [activeTab, activeStatus, refetchPublicRequests, refetchTripRequests]);

  const filteredLoads = useMemo(() => {
    if (activeTab === 'public_posting') {
      const apiItems = publicRequestsData?.pages?.flatMap(page => page.data || []) || [];
      return apiItems.map(mapPublicRequestToTransporterLoad);
    }
    if (activeStatus !== null) {
      const apiItems = tripRequestsData?.pages?.flatMap(page => page.data || []) || [];
      return apiItems.map(item => mapTripRequestToTransporterLoad(item, activeTab));
    }
    return [];
  }, [activeTab, activeStatus, publicRequestsData, tripRequestsData]);


  const handleContactPress = useCallback((phoneNumber: string, name: string) => {
    Alert.alert(
      'Contact Shipper',
      `Would you like to call ${name} at ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`).catch(() => {
              Alert.alert('Error', 'Unable to initiate call on this device');
            });
          },
        },
      ]
    );
  }, []);

  const renderCard = useCallback(({ item }: { item: TransporterLoad }) => {
    return (
      <ShipmentCard
        item={item}
        onContactPress={handleContactPress}
        onRespondPress={handleRespond}
      />
    );
  }, [handleContactPress, handleRespond]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Trip</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.tabContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveTab(item.value)}
              activeOpacity={0.8}
              style={[
                styles.tabItem,
                activeTab === item.value && styles.activeTabItem,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === item.value && styles.activeTabText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Loadings/Cards List */}
      {activeTab === 'public_posting' ? (
        isPublicRequestsLoading && !isPublicRequestsRefetching ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading public postings...</Text>
          </View>
        ) : publicRequestsError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load public postings.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetchPublicRequests()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null
      ) : activeStatus !== null ? (
        isTripRequestsLoading && !isTripRequestsRefetching ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : tripRequestsError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load requests.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetchTripRequests()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null
      ) : null}

      {!(
        (activeTab === 'public_posting' && isPublicRequestsLoading && !isPublicRequestsRefetching) ||
        (activeTab === 'public_posting' && publicRequestsError) ||
        (activeStatus !== null && isTripRequestsLoading && !isTripRequestsRefetching) ||
        (activeStatus !== null && tripRequestsError)
      ) && (
        <FlatList
          data={filteredLoads}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={
                activeTab === 'public_posting'
                  ? isPublicRequestsRefetching
                  : activeStatus !== null
                  ? isTripRequestsRefetching
                  : isRefreshing
              }
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No shipments found for this category.</Text>
            </View>
          }
          onEndReached={
            activeTab === 'public_posting'
              ? hasNextPage && !isFetchingNextPage
                ? () => fetchNextPage()
                : undefined
              : activeStatus !== null
              ? hasNextPageTrip && !isFetchingNextPageTrip
                ? () => fetchNextPageTrip()
                : undefined
              : undefined
          }
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            activeTab === 'public_posting' && isFetchingNextPage ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.footerLoader} />
            ) : activeStatus !== null && isFetchingNextPageTrip ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.footerLoader} />
            ) : null
          }
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    backgroundColor: 'white',
  },
  backBtn: {
    marginRight: scale(15),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#000000',
  },
  tabContainer: {
    backgroundColor: 'white',
    paddingBottom: verticalScale(12),
  },
  tabContent: {
    paddingHorizontal: scale(20),
    gap: scale(10),
  },
  tabItem: {
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabItem: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: moderateScale(14),
    color: '#858080',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(25),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(20),
    padding: scale(18),
    marginHorizontal: scale(20),
    marginVertical: verticalScale(8),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },

  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarColumn: {
    alignItems: 'center',
    width: scale(80),
    marginRight: scale(12),
  },
  imageWrapper: {
    position: 'relative',
    width: scale(64),
    height: scale(64),
  },
  avatarImage: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: '#E1E3E6',
  },
  verifiedBadge: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  verifiedCheck: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    fontWeight: 'bold',
    lineHeight: scale(11),
  },
  avatarName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#000000',
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
  detailsColumn: {
    flex: 1,
    paddingTop: verticalScale(2),
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: verticalScale(6),
  },
  detailLabel: {
    width: scale(105),
    fontSize: moderateScale(12),
    color: '#858080',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: moderateScale(12),
    color: '#1E0909',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: verticalScale(14),
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(4),
  },
  contactButtonText: {
    fontSize: moderateScale(14),
    color: '#CC2B2B',
    fontWeight: '700',
    marginLeft: scale(8),
  },
  emptyContainer: {
    alignItems: 'center',
    padding: scale(30),
    marginTop: verticalScale(50),
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: '#858080',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: moderateScale(14),
    color: '#858080',
  },
  errorText: {
    fontSize: moderateScale(14),
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(8),
    borderRadius: scale(8),
  },
  retryText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  cardRouteHeader: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#000000',
    textDecorationLine: 'underline',
    marginBottom: verticalScale(12),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  actionTextButton: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
  },
  acceptButtonText: {
    fontSize: moderateScale(14),
    color: COLORS.greenColor.color1,
    fontWeight: '700',
  },
  rejectButtonText: {
    fontSize: moderateScale(14),
    color: COLORS.primary,
    fontWeight: '700',
  },
  footerLoader: {
    marginVertical: verticalScale(15),
  },
});

export default TransporterScreen;
