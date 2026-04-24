import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api, getStoredAccessToken } from './api';

const PUSH_TOKEN_KEY = 'expo_push_token';

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  const storedToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);

  const hasSession = !!(await getStoredAccessToken());
  if (hasSession && token !== storedToken) {
    try {
      await api.updateMe({ expoPushToken: token });
      await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    } catch {
      // Non-critical; will retry on next launch
    }
  }

  return token;
}
