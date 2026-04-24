import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import '../src/i18n';
import { queryClient } from '../src/services/query-client';
import { useAuthStore } from '../src/store/auth.store';
import { registerForPushNotifications } from '../src/services/notifications';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const { initialize, initialized } = useAuthStore();

  useEffect(() => {
    initialize().then(() => SplashScreen.hideAsync());
    registerForPushNotifications();
  }, []);

  if (!initialized) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="supermarket/[id]" options={{ title: '' }} />
            <Stack.Screen
              name="auth/login"
              options={{ presentation: 'modal', title: 'Entrar' }}
            />
            <Stack.Screen
              name="auth/register"
              options={{ presentation: 'modal', title: 'Criar conta' }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
