import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGE_STORAGE_KEY } from '../i18n';

// Import screens
import OnboardingScreen from '../screen/preAuth/onboardingScreen';
import LanguageSelectionScreen from '../screen/preAuth/languageSelectionScreen';
import LoginScreen from '../screen/preAuth/loginScreen';
import OTPVerifyScreen from '../screen/preAuth/OTPVerifyScreen';
import LocationEnableScreen from '../screen/preAuth/LocationEnableScreen';
import HomeScreen from '../screen/postAuth/homeScreen';
import { View, ActivityIndicator } from 'react-native';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  // Replace this useState with your actual store or context for authentication
  const [userToken, setUserToken] = useState<string | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [initialPreAuthRoute, setInitialPreAuthRoute] = useState<keyof RootStackParamList>('Onboarding');

  useEffect(() => {
    const checkPersistedData = async () => {
      try {
        // Commented out to allow accessing language screen again
        /*
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLanguage) {
          setInitialPreAuthRoute('Login');
        } else {
          setInitialPreAuthRoute('Onboarding');
        }
        */
        setInitialPreAuthRoute('Onboarding');
      } catch (e) {
        console.error('Failure reading storage during init navigation', e);
      } finally {
        setIsReady(true);
      }
    };
    
    checkPersistedData();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#CC2B2B" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken == null ? (
        // No token found, user isn't signed in
        <Stack.Group>
          {/* Always render all screens to allow back navigation/manual jumping */}
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
          <Stack.Screen name="LocationEnable" component={LocationEnableScreen} />
        </Stack.Group>
      ) : (

        // User is signed in
        <Stack.Screen name="Home" component={HomeScreen} />
      )}
    </Stack.Navigator>
  );
};


