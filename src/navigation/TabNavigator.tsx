import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform, Text } from 'react-native';
import HomeScreen from '../screen/postAuth/homeScreen';
import ProfileScreen from '../screen/postAuth/ProfileScreen';
import {
  HomeTabIcon,
  WalletTabIcon,
  ChatTabIcon,
  ProfileTabIcon
} from '../assets/svgIcons';

import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

// Placeholder screens for other tabs
const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{route.params?.name} Screen</Text>
  </View>
);

const TabNavigator = () => {
  const { t } = useTranslation();

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
          tabBarLabel: t('home_tab'),
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <HomeTabIcon focused={focused} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={PlaceholderScreen}
        initialParams={{ name: t('wallet_tab') }}
        options={{
          tabBarLabel: t('wallet_tab'),
          tabBarIcon: ({ focused }) => <WalletTabIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={PlaceholderScreen}
        initialParams={{ name: t('chat_tab') }}
        options={{
          tabBarLabel: t('chat_tab'),
          tabBarIcon: ({ focused }) => <ChatTabIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('profile_tab'),
          tabBarIcon: ({ focused }) => <ProfileTabIcon focused={focused} />,
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
});

export default TabNavigator;
