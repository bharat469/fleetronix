import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform, Text } from 'react-native';
import HomeScreen from '../screen/postAuth/homeScreen';
import ProfileScreen from '../screen/postAuth/ProfileScreen';
import NotificationsScreen from '../screen/postAuth/NotificationsScreen';
import {
  HomeTabIcon,
  NotificationTabIcon,
  ProfileTabIcon
} from '../assets/svgIcons';

import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useNotifications } from '../hooks/useNotifications';

const Tab = createBottomTabNavigator();

// Placeholder screens for other tabs
const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{route.params?.name} Screen</Text>
  </View>
);

const TabNavigator = () => {
  const { t } = useTranslation();
  const { userToken } = useSelector((state: RootState) => state.auth);

  // Fetch unread count (share query params with NotificationsScreen for cache deduplication)
  const { data: notificationsData } = useNotifications(
    { page: 1, per_page: 50 },
    !!userToken
  );

  const unreadCount = notificationsData?.data?.unread_count || 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#CC2B2B',
        tabBarInactiveTintColor: '#858080',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: ({ focused, color }) => focused ? (
            <Text style={[styles.tabBarLabel, { color }]}>{t('home_tab')}</Text>
          ) : null,
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <HomeTabIcon focused={focused} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Notification"
        component={NotificationsScreen}
        options={{
          tabBarLabel: ({ focused, color }) => focused ? (
            <Text style={[styles.tabBarLabel, { color }]}>{t('notification_tab')}</Text>
          ) : null,
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <View style={{ position: 'relative' }}>
                <NotificationTabIcon focused={focused} />
                {unreadCount > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ),
        }}
      />


      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ focused, color }) => focused ? (
            <Text style={[styles.tabBarLabel, { color }]}>{t('profile_tab')}</Text>
          ) : null,
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <ProfileTabIcon focused={focused} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 90 : 70,
    backgroundColor: 'white',
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -5,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: -15,
    width: 30,
    height: 3,
    backgroundColor: '#CC2B2B',
    borderRadius: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#CC2B2B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default TabNavigator;
