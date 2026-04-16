import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { setTokens } from '../redux/slices/authSlice';
import { storage } from '../helpers/asyncHelper';

// Import screens
import OnboardingScreen from '../screen/preAuth/onboardingScreen';
import LanguageSelectionScreen from '../screen/preAuth/languageSelectionScreen';
import LoginScreen from '../screen/preAuth/loginScreen';
import OTPVerifyScreen from '../screen/preAuth/OTPVerifyScreen';
import LocationEnableScreen from '../screen/preAuth/LocationEnableScreen';
import SelectTruckScreen from '../screen/preAuth/SelectTruckScreen';
import SelectStateScreen from '../screen/preAuth/SelectStateScreen';
import VerifyDocumentsScreen from '../screen/preAuth/VerifyDocumentsScreen';
import ReadyToDriveScreen from '../screen/preAuth/ReadyToDriveScreen';
import CallVerificationScreen from '../screen/preAuth/CallVerificationScreen';
import HomeScreen from '../screen/postAuth/homeScreen';
import { View, ActivityIndicator } from 'react-native';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { userToken, purpose } = useSelector((state: RootState) => state.auth);
  const [isReady, setIsReady] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await storage.get('userToken');
        const refresh = await storage.get('refreshToken');
        const driverId = await storage.get('driverId');
        const storedPurpose = await storage.get('purpose');

        if (token && storedPurpose) {
          dispatch(setTokens({
            accessToken: JSON.parse(token),
            refreshToken: refresh ? JSON.parse(refresh) : '',
            driverId: driverId ? JSON.parse(driverId) : '',
            purpose: JSON.parse(storedPurpose),
          }));
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
      } finally {
        setIsReady(true);
      }
    };

    initAuth();
  }, [dispatch]);

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
        <Stack.Group>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
          {/* Note: We still keep these in the pre-auth group just in case navigation is triggered during the flow */}
          <Stack.Screen name="LocationEnable" component={LocationEnableScreen} />
          <Stack.Screen name="SelectTruck" component={SelectTruckScreen} />
          <Stack.Screen name="SelectState" component={SelectStateScreen} />
          <Stack.Screen name="VerifyDocuments" component={VerifyDocumentsScreen} />
          <Stack.Screen name="ReadyToDrive" component={ReadyToDriveScreen} />
          <Stack.Screen name="CallVerification" component={CallVerificationScreen} />
        </Stack.Group>
      ) : purpose === 'register' ? (
        <Stack.Group>
          <Stack.Screen name="LocationEnable" component={LocationEnableScreen} />
          <Stack.Screen name="SelectTruck" component={SelectTruckScreen} />
          <Stack.Screen name="SelectState" component={SelectStateScreen} />
          <Stack.Screen name="VerifyDocuments" component={VerifyDocumentsScreen} />
          <Stack.Screen name="ReadyToDrive" component={ReadyToDriveScreen} />
          <Stack.Screen name="CallVerification" component={CallVerificationScreen} />
        </Stack.Group>
      ) : (
        <Stack.Screen name="Home" component={HomeScreen} />
      )}
    </Stack.Navigator>
  );
};
