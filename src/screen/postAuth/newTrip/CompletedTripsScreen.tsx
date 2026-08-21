import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useTrips } from '../../../hooks/useTrips';
import { useTranslation } from 'react-i18next';

import TripCard from '../../../components/TripCard';
import { COLORS } from '../../../helpers/values/colors';
import { BackArrowIcon } from '../../../assets/svgIcons';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { SafeAreaView } from 'react-native-safe-area-context';

const CompletedTripsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useTrips('completed', 20);

  const trips = data?.pages.flatMap((page) => page.data) || [];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return <View style={styles.footerSpacer} />;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator color={COLORS.primary} size="small" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('no_completed_trips_found', 'No completed trips found.')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>{t('refresh', 'Refresh')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>{t('completed_trips', 'Completed Trips')}</Text>
      </View>

      {/* List */}
      <View style={{ flex: 1 }}>
        {isLoading && trips.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('fetching_data', 'Fetching data...')}</Text>
          </View>
        ) : isError && trips.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>
              {(error as any)?.message || t('preferences_update_failed', 'Failed to load data')}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryText}>{t('retry', 'Retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={trips}
            renderItem={({ item }) => (
              <TripCard 
                trip={item} 
                onPress={(trip) => navigation.navigate('TripDetails', { 
                  tripId: trip.trip_id, 
                  loadNumber: trip.load_id || trip.trip_number,
                  tripData: trip
                })} 
              />
            )}
            keyExtractor={(item) => item.trip_id}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default CompletedTripsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: scale(8),
    marginRight: scale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#111827',
  },
  listContent: {
    paddingBottom: verticalScale(20),
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  errorText: {
    fontSize: moderateScale(14),
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: verticalScale(10),
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
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: verticalScale(100),
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    marginBottom: verticalScale(15),
    textAlign: 'center',
  },
  loadingMore: {
    paddingVertical: verticalScale(15),
    alignItems: 'center',
  },
  footerSpacer: {
    height: verticalScale(20),
  },
});
