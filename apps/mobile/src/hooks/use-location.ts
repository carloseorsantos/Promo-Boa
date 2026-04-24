import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        Alert.alert(
          'Localização necessária',
          'O PromoBoa precisa da sua localização para mostrar supermercados próximos. Ative nas configurações.',
        );
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) setLocation(lastKnown);

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(current);
    })();
  }, []);

  return { location, permissionDenied };
}
