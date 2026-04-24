import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Pdf from 'react-native-pdf';
import { useState } from 'react';
import { Image } from 'expo-image';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';
import { FlyerValidityBadge } from '../../src/components/FlyerValidityBadge';
import { Colors } from '../../src/constants/colors';

export default function SupermarketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);

  const { data: supermarket, isLoading } = useQuery({
    queryKey: ['supermarket', id],
    queryFn: () => api.getSupermarketById(id),
  });

  const { data: flyer } = useQuery({
    queryKey: ['flyer', supermarket?.activeFlyer?.id],
    queryFn: () => api.getFlyerById(supermarket!.activeFlyer!.id),
    enabled: !!supermarket?.activeFlyer,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: api.getFavorites,
    enabled: !!user,
  });

  const isFavorited = favorites.some((f) => f.supermarketId === id);

  const addFavMutation = useMutation({
    mutationFn: () => api.addFavorite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const removeFavMutation = useMutation({
    mutationFn: () => api.removeFavorite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  if (isLoading || !supermarket) {
    return <View style={styles.centered} />;
  }

  const toggleFavorite = () => {
    if (!user) return;
    if (isFavorited) removeFavMutation.mutate();
    else addFavMutation.mutate();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: supermarket.name,
          headerRight: () =>
            user ? (
              <TouchableOpacity onPress={toggleFavorite} style={{ marginRight: 8 }}>
                <Text style={{ fontSize: 22, color: isFavorited ? '#e53e3e' : Colors.muted }}>
                  {isFavorited ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          {supermarket.logoUrl && (
            <Image source={{ uri: supermarket.logoUrl }} style={styles.logo} contentFit="contain" />
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{supermarket.name}</Text>
            <Text style={styles.address}>{supermarket.address}</Text>
            <Text style={styles.address}>{supermarket.city}, {supermarket.state}</Text>
            {supermarket.phone && (
              <Text
                style={styles.link}
                onPress={() => Linking.openURL(`tel:${supermarket.phone}`)}
              >
                {supermarket.phone}
              </Text>
            )}
          </View>
        </View>

        {flyer ? (
          <View style={styles.flyerSection}>
            <View style={styles.flyerHeader}>
              <Text style={styles.sectionTitle}>{t('supermarket.currentFlyer')}</Text>
              <FlyerValidityBadge validFrom={flyer.validFrom} validTo={flyer.validTo} />
            </View>
            {pdfTotalPages > 0 && (
              <Text style={styles.pageCounter}>
                {t('supermarket.page', { current: pdfPage, total: pdfTotalPages })}
              </Text>
            )}
            <Pdf
              source={{ uri: flyer.pdfUrl, cache: true }}
              style={styles.pdf}
              onLoadComplete={(total) => setPdfTotalPages(total)}
              onPageChanged={(page) => setPdfPage(page)}
              enablePaging
            />
          </View>
        ) : (
          <View style={styles.noFlyer}>
            <Text style={styles.noFlyerText}>{t('supermarket.noActiveFlyer')}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1 },
  header: { flexDirection: 'row', padding: 16, gap: 12 },
  logo: { width: 72, height: 72, borderRadius: 8 },
  headerInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: Colors.text },
  address: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  link: { fontSize: 13, color: Colors.primary, marginTop: 4 },
  flyerSection: { paddingHorizontal: 16 },
  flyerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  pageCounter: { fontSize: 12, color: Colors.muted, textAlign: 'center', marginBottom: 4 },
  pdf: { width: '100%', height: 600 },
  noFlyer: { padding: 32, alignItems: 'center' },
  noFlyerText: { color: Colors.muted, fontSize: 14 },
});
