import React, { useState } from 'react';
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

import TripCard from '../../../components/TripCard';
import { COLORS } from '../../../helpers/values/colors';
import { BackArrowIcon } from '../../../assets/svgIcons';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { Trip } from '../../../types/trip';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'all' | 'ongoing' | 'assigned' | 'completed';

const AllLoadsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeTab, setActiveTab] = useState<TabType>('assigned');

  const CATEGORIES: { label: string; value: TabType }[] = [
    { label: 'All Trip', value: 'all' },
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Assigned', value: 'assigned' },
    { label: 'Completed', value: 'completed' },
  ];

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
  } = useTrips(activeTab === 'all' ? 'all' : activeTab);

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
        <Text style={styles.emptyText}>No {activeTab} loads found.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Refresh</Text>
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
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Trip</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabScrollContainer}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.tabContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveTab(item.value)}
              style={[
                styles.tabItem,
                activeTab === item.value && styles.activeTabItem
              ]}
            >
              <Text style={[
                styles.tabText,
                activeTab === item.value && styles.activeTabText
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List */}
      <View style={{ flex: 1 }}>
        {isLoading && trips.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching data...</Text>
          </View>
        ) : isError && trips.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>
              {(error as any)?.message || 'Failed to load data'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
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
                  loadNumber: trip.load_id || trip.trip_number 
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
    color: '#000',
  },
  tabScrollContainer: {
    backgroundColor: 'white',
    paddingBottom: verticalScale(10),
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
    paddingBottom: verticalScale(20),
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textColor.color2.one,
    fontSize: moderateScale(14),
  },
  loadingMore: {
    paddingVertical: verticalScale(20),
    alignItems: 'center',
  },
  footerSpacer: {
    height: verticalScale(20),
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: verticalScale(100),
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: '#858080',
    marginBottom: verticalScale(20),
    textAlign: 'center',
  },
  errorText: {
    fontSize: moderateScale(16),
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  retryButton: {
    paddingHorizontal: scale(30),
    paddingVertical: verticalScale(10),
    backgroundColor: COLORS.primary,
    borderRadius: scale(8),
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
});

export default AllLoadsScreen;
