import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { RootState } from '../../redux/store';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { getFontFamily } from '../../helpers/fonts';
import { BackArrowIcon, ShieldCheckIcon, RedBellIcon, TruckIcon } from '../../assets/svgIcons';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../../hooks/useNotifications';
import { useDriverInfo } from '../../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
};

const NotificationsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);

  // Fetch notifications
  const {
    data,
    isLoading: isNotifLoading,
    isRefetching,
    refetch,
  } = useNotifications({ page: 1, per_page: 50 }, !!userToken);

  const notifications = data?.data?.notifications || [];

  // Fetch driver info to get live KYC document status
  const { data: driverData, isLoading: isDriverLoading } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

  // Mutations
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const handleNotificationPress = (item: any) => {
    const id = item._id || item.id;
    if (!item.is_read && id) {
      markRead(id);
    }
  };

  const getTimelineIcon = (type: string) => {
    const norm = (type || '').toLowerCase().trim();
    if (norm.includes('trip') || norm.includes('assign') || norm.includes('request')) {
      return (
        <View style={[styles.iconWrapper, { backgroundColor: '#FADBD8' }]}>
          <TruckIcon width={scale(18)} height={scale(18)} color="#B71C1C" />
        </View>
      );
    }
    if (norm.includes('accept') || norm.includes('verif') || norm.includes('success')) {
      return (
        <View style={[styles.iconWrapper, { backgroundColor: '#D4EFDF' }]}>
          <ShieldCheckIcon width={scale(18)} height={scale(18)} color="#1B5E20" />
        </View>
      );
    }
    return (
      <View style={styles.iconWrapper}>
        <RedBellIcon width={scale(18)} height={scale(18)} color="#CC2B2B" />
      </View>
    );
  };

  const renderActivityItem = (item: any, index: number) => {
    const showLine = index < notifications.length - 1;
    const isUnread = !item.is_read;
    return (
      <TouchableOpacity 
        key={item.id || item._id} 
        style={styles.activityRow}
        activeOpacity={0.8}
        onPress={() => handleNotificationPress(item)}
      >
        {/* Left Column (Icon + Timeline Line) */}
        <View style={styles.leftCol}>
          <View style={styles.timelineIconContainer}>
            {getTimelineIcon(item.notification_type)}
          </View>
          {showLine && <View style={styles.timelineLine} />}
        </View>

        {/* Right Column (Text details) */}
        <View style={styles.rightCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.activityTitle, isUnread && styles.unreadTitle]} numberOfLines={2}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          {item.body ? (
            <Text style={styles.activityBody} numberOfLines={3}>
              {item.body}
            </Text>
          ) : null}
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const isLoading = isNotifLoading || isDriverLoading;
  const unreadCount = data?.data?.unread_count || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackArrowIcon color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications_title', 'Notifications')}</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllRead()} style={styles.markAllBtn} activeOpacity={0.7}>
            <Text style={styles.markAllText}>{t('mark_all_read', 'Mark all read')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CC2B2B" />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#CC2B2B']}
              tintColor="#CC2B2B"
            />
          }
        >
          {/* Activities Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{t('activities', 'Activities')}</Text>
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <ShieldCheckIcon width={48} height={48} color="#CC2B2B" />
                </View>
                <Text style={styles.emptyTitle}>{t('all_caught_up', 'All caught up!')}</Text>
                <Text style={styles.emptySubtitle}>{t('no_new_notifications', 'You have no new notifications.')}</Text>
              </View>
            ) : (
              <View style={styles.activitiesContainer}>
                {notifications.map((item, index) => renderActivityItem(item, index))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: scale(15),
    padding: scale(4),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#000000',
  },
  markAllBtn: {
    paddingVertical: scale(4),
    paddingHorizontal: scale(8),
  },
  markAllText: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#CC2B2B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: verticalScale(50),
  },
  section: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(20),
  },
  sectionHeading: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#4B5563',
    marginBottom: verticalScale(15),
  },
  activitiesContainer: {
    marginTop: verticalScale(5),
  },
  activityRow: {
    flexDirection: 'row',
    position: 'relative',
    minHeight: verticalScale(68),
  },
  leftCol: {
    width: scale(50),
    alignItems: 'center',
    position: 'relative',
  },
  timelineIconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
  },
  iconWrapper: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initialsText: {
    fontSize: moderateScale(13),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#B71C1C',
  },
  timelineLine: {
    position: 'absolute',
    top: scale(40),
    left: scale(24.25),
    bottom: scale(-12),
    width: 1.5,
    backgroundColor: '#E5E7EB',
    zIndex: 1,
  },
  rightCol: {
    flex: 1,
    paddingLeft: scale(10),
    justifyContent: 'flex-start',
    paddingTop: scale(4),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: scale(10),
  },
  activityTitle: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#1F2937',
    flex: 1,
    marginRight: scale(8),
  },
  unreadTitle: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#000000',
  },
  unreadDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#CC2B2B',
  },
  activityBody: {
    fontSize: moderateScale(13),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#4B5563',
    marginTop: scale(2),
    marginBottom: scale(2),
    lineHeight: scale(18),
  },
  activityTime: {
    fontSize: moderateScale(13),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#9CA3AF',
    marginTop: scale(2),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyIconContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: 'rgba(202, 32, 39, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#1E1A57',
    marginBottom: verticalScale(6),
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    color: '#9CA3AF',
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
  },
});

export default NotificationsScreen;
