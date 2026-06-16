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

type TabType = 'request' | 'public_posting';

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
  rawStatus?: string;
  driver_response?: any;
  transporter_action?: string;
  from_date?: string;
  to_date?: string;
  transporter_first_name?: string;
  transporter_last_name?: string;
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
    rawStatus: item.status,
    driver_response: item.driver_response || item.my_response,
    transporter_action: item.transporter_action,
    from_date: item.from_date || '2026-06-01T00:00:00',
    to_date: item.to_date || '2026-06-03T23:59:59',
    transporter_first_name: item.transporter_first_name || (item.transporter && item.transporter.first_name) || 'Ajay',
    transporter_last_name: item.transporter_last_name || (item.transporter && item.transporter.last_name) || 'transporter',
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
    rawStatus: item.status,
    driver_response: item.driver_response || item.my_response,
    transporter_action: item.transporter_action,
    from_date: item.from_date || '2026-06-01T00:00:00',
    to_date: item.to_date || '2026-06-03T23:59:59',
    transporter_first_name: item.transporter_first_name || (item.transporter && item.transporter.first_name) || 'Ajay',
    transporter_last_name: item.transporter_last_name || (item.transporter && item.transporter.last_name) || 'transporter',
  };
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateString;
  }
};

interface DriverRequestStatusInfo {
  label: string;
  showButtons: boolean;
  labelColor: string;
  badgeBg: string;
}

const getDriverRequestStatus = (item: TransporterLoad): DriverRequestStatusInfo => {
  const status = item.rawStatus || 'pending';
  let driverResponseStatus = 'pending';
  if (item.driver_response) {
    if (typeof item.driver_response === 'object' && item.driver_response.status) {
      driverResponseStatus = item.driver_response.status;
    } else if (typeof item.driver_response === 'string') {
      driverResponseStatus = item.driver_response;
    }
  }
  const transporterAction = item.transporter_action || 'pending';

  // 1. NEW REQUEST
  if (status === 'pending' && driverResponseStatus === 'pending') {
    return {
      label: 'New Request',
      showButtons: true,
      labelColor: '#007AFF', // Premium Blue
      badgeBg: 'rgba(0, 122, 255, 0.08)',
    };
  }

  // 2. WAITING FOR TRANSPORTER
  if (status === 'pending' && driverResponseStatus === 'accepted' && transporterAction === 'pending') {
    return {
      label: 'Requested',
      showButtons: false,
      labelColor: '#FF9500', // Premium Warning/Orange
      badgeBg: 'rgba(255, 149, 0, 0.08)',
    };
  }

  // 3. DRIVER REJECTED
  if (driverResponseStatus === 'rejected') {
    return {
      label: 'Rejected',
      showButtons: false,
      labelColor: '#FF3B30', // Premium Red
      badgeBg: 'rgba(255, 59, 48, 0.08)',
    };
  }

  // 4. DRIVER SELECTED
  if ((status === 'contracted' || status === 'accepted') && driverResponseStatus === 'accepted' && transporterAction === 'accepted') {
    return {
      label: 'Accepted',
      showButtons: false,
      labelColor: '#34C759', // Premium Green
      badgeBg: 'rgba(52, 199, 89, 0.08)',
    };
  }

  // 5. REQUEST CANCELLED
  if (status === 'cancelled') {
    return {
      label: 'Request Cancelled',
      showButtons: false,
      labelColor: '#8E8E93', // Premium Gray
      badgeBg: 'rgba(142, 142, 147, 0.08)',
    };
  }

  // If driver response is accepted or outer status is accepted (but other conditions not fully satisfied), still hide buttons:
  if (driverResponseStatus === 'accepted' || status === 'accepted') {
    return {
      label: 'Accepted',
      showButtons: false,
      labelColor: '#34C759',
      badgeBg: 'rgba(52, 199, 89, 0.08)',
    };
  }

  return {
    label: '',
    showButtons: false,
    labelColor: '#8E8E93',
    badgeBg: 'transparent',
  };
};

interface ShipmentCardProps {
  item: TransporterLoad;
  onContactPress: (phoneNumber: string, name: string) => void;
  onRespondPress: (requestNumber: string, action: 'accept' | 'reject') => void;
}

const ShipmentCard = React.memo(({ item, onContactPress, onRespondPress }: ShipmentCardProps) => {
  const statusInfo = useMemo(() => getDriverRequestStatus(item), [item]);

  return (
    <View style={styles.card}>
      {/* Route Header Row */}
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardRouteHeader} numberOfLines={1}>{item.pickup} → {item.drop}</Text>
        {statusInfo.label ? (
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.badgeBg }]}>
            <Text style={[styles.statusBadgeText, { color: statusInfo.labelColor }]}>
              {statusInfo.label}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Content Row */}
      <View style={styles.cardBody}>
        {/* Left Column: Avatar */}
        <View style={styles.avatarColumn}>
          <View style={styles.imageWrapper}>
            <Image
              source={require('../../assets/images/shipper_avatar.jpg')}
              style={styles.avatarImage}
            />
            {/* Verified Checkmark Badge */}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedCheck}>✓</Text>
            </View>
          </View>
        </View>

        {/* Right Column: Details */}
        <View style={styles.detailsColumn}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transporter</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{item.transporter_company_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From Date</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{formatDate(item.from_date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To Date</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{formatDate(item.to_date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fleet Type</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{item.task}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.avatarName}>
        {item.transporter_first_name} {item.transporter_last_name}
      </Text>

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

        {statusInfo.showButtons && item.id ? (
          <View style={styles.cardFooterActions}>
            <TouchableOpacity
              onPress={() => onRespondPress(item.id!, 'accept')}
              activeOpacity={0.7}
              style={styles.actionTextButton}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onRespondPress(item.id!, 'reject')}
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
    { label: 'Public Posting', value: 'public_posting' },
  ], []);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

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

  // Call TanStack query hook for status-based requests. Enabled when tab is 'request'.
  const {
    data: tripRequestsData,
    isLoading: isTripRequestsLoading,
    isRefetching: isTripRequestsRefetching,
    error: tripRequestsError,
    refetch: refetchTripRequests,
    fetchNextPage: fetchNextPageTrip,
    hasNextPage: hasNextPageTrip,
    isFetchingNextPage: isFetchingNextPageTrip,
  } = useTripRequests('pending', activeTab === 'request');

  // Mutation to respond to a trip request (accept/decline)
  const respondMutation = useMutation({
    mutationFn: ({ requestNumber, action }: { requestNumber: string; action: 'accept' | 'reject' }) =>
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

  const handleRespond = useCallback((requestNumber: string, action: 'accept' | 'reject') => {
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
    } else if (activeTab === 'request') {
      await refetchTripRequests();
    }
  }, [activeTab, refetchPublicRequests, refetchTripRequests]);

  const filteredLoads = useMemo(() => {
    if (activeTab === 'public_posting') {
      const apiItems = publicRequestsData?.pages?.flatMap(page => page.data || []) || [];
      return apiItems.map(mapPublicRequestToTransporterLoad);
    }
    if (activeTab === 'request') {
      const apiItems = tripRequestsData?.pages?.flatMap(page => page.data || []) || [];
      return apiItems.map(item => mapTripRequestToTransporterLoad(item, activeTab));
    }
    return [];
  }, [
    activeTab,
    publicRequestsData,
    tripRequestsData,
  ]);

  const currentQueryState = useMemo(() => {
    switch (activeTab) {
      case 'public_posting':
        return {
          isLoading: isPublicRequestsLoading && !isPublicRequestsRefetching,
          isError: !!publicRequestsError,
          errorLabel: 'Failed to load public postings.',
          refetch: refetchPublicRequests,
          isRefetching: isPublicRequestsRefetching,
          hasNextPage: hasNextPage,
          isFetchingNextPage: isFetchingNextPage,
          fetchNextPage: fetchNextPage,
        };
      case 'request':
        return {
          isLoading: isTripRequestsLoading && !isTripRequestsRefetching,
          isError: !!tripRequestsError,
          errorLabel: 'Failed to load requests.',
          refetch: refetchTripRequests,
          isRefetching: isTripRequestsRefetching,
          hasNextPage: hasNextPageTrip,
          isFetchingNextPage: isFetchingNextPageTrip,
          fetchNextPage: fetchNextPageTrip,
        };
      default:
        return {
          isLoading: false,
          isError: false,
          errorLabel: '',
          refetch: () => Promise.resolve(),
          isRefetching: false,
          hasNextPage: false,
          isFetchingNextPage: false,
          fetchNextPage: () => {},
        };
    }
  }, [
    activeTab,
    isPublicRequestsLoading, isPublicRequestsRefetching, publicRequestsError, refetchPublicRequests, hasNextPage, isFetchingNextPage, fetchNextPage,
    isTripRequestsLoading, isTripRequestsRefetching, tripRequestsError, refetchTripRequests, hasNextPageTrip, isFetchingNextPageTrip, fetchNextPageTrip,
  ]);

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
      {currentQueryState.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : currentQueryState.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{currentQueryState.errorLabel}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => currentQueryState.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!currentQueryState.isLoading && !currentQueryState.isError && (
        <FlatList
          data={filteredLoads}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={currentQueryState.isRefetching}
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
            currentQueryState.hasNextPage && !currentQueryState.isFetchingNextPage
              ? () => currentQueryState.fetchNextPage()
              : undefined
          }
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            currentQueryState.isFetchingNextPage ? (
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
    alignItems: 'flex-start',
    width: scale(64),
    marginRight: scale(16),
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
    marginTop: verticalScale(12),
    textAlign: 'left',
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  cardRouteHeader: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#000000',
    textDecorationLine: 'underline',
    flex: 1,
    marginRight: scale(10),
  },
  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
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
