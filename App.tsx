/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry once on failure to keep logs clean
      staleTime: 1000 * 60 * 5, // 5 minutes global cache time
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize i18n
import './src/i18n';
import AlertPopup from './src/components/common/AlertPopup';
import { notificationService } from './src/services/NotificationService';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setup = async () => {
      await notificationService.initialize();
      const unsubs = await notificationService.setupFCM();
      if (unsubs && typeof unsubs === 'function') {
        unsubscribe = unsubs as () => void;
      }
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <RootNavigator />
            <AlertPopup />
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
