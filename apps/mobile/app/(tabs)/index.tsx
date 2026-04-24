import { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '../../src/hooks/use-location';
import { SupermarketCard } from '../../src/components/SupermarketCard';
import { api } from '../../src/services/api';
import { SupermarketSummary } from '@promo-boa/shared';
import { Colors } from '../../src/constants/colors';

const RADIUS_OPTIONS = [5, 10, 25] as const;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { location } = useLocation();
  const [radius, setRadius] = useState<5 | 10 | 25>(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlashList<SupermarketSummary>>(null);

  const { data: supermarkets = [], isLoading } = useQuery({
    queryKey: ['supermarkets', location?.coords.latitude, location?.coords.longitude, radius],
    queryFn: () =>
      api.getSupermarketsNearby({
        lat: location!.coords.latitude,
        lng: location!.coords.longitude,
        radius,
      }),
    enabled: !!location,
    staleTime: 5 * 60 * 1000,
  });

  const handleMarkerPress = useCallback((supermarket: SupermarketSummary) => {
    setSelectedId(supermarket.id);
    const idx = supermarkets.findIndex((s) => s.id === supermarket.id);
    if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true });
  }, [supermarkets]);

  const handleCardPress = useCallback((id: string) => {
    router.push(`/supermarket/${id}`);
  }, []);

  if (!location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('home.locating')}</Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion} showsUserLocation>
          {supermarkets.map((s) => (
            <Marker
              key={s.id}
              coordinate={{ latitude: s.latitude, longitude: s.longitude }}
              title={s.name}
              pinColor={selectedId === s.id ? Colors.primary : Colors.muted}
              onPress={() => handleMarkerPress(s)}
            />
          ))}
        </MapView>

        <View style={styles.radiusBar}>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
              onPress={() => setRadius(r)}
            >
              <Text style={[styles.radiusText, radius === r && styles.radiusTextActive]}>
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />
        ) : (
          <FlashList
            ref={listRef}
            data={supermarkets}
            keyExtractor={(item) => item.id}
            estimatedItemSize={100}
            renderItem={({ item }) => (
              <SupermarketCard
                supermarket={item}
                selected={item.id === selectedId}
                onPress={() => handleCardPress(item.id)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>{t('home.noSupermarkets')}</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  listContainer: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: Colors.muted, fontSize: 14 },
  emptyText: { color: Colors.muted, fontSize: 14, textAlign: 'center' },
  radiusBar: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  radiusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  radiusChipActive: { backgroundColor: Colors.primary },
  radiusText: { fontSize: 12, color: Colors.text },
  radiusTextActive: { color: 'white', fontWeight: '600' },
});
