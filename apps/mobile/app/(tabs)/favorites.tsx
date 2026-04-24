import { View, Text, StyleSheet, Switch } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { SupermarketCard } from '../../src/components/SupermarketCard';
import { api } from '../../src/services/api';
import { FavoriteItem } from '@promo-boa/shared';
import { Colors } from '../../src/constants/colors';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: api.getFavorites,
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: (supermarketId: string) => api.removeFavorite(supermarketId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const toggleNotifMutation = useMutation({
    mutationFn: ({ supermarketId, enabled }: { supermarketId: string; enabled: boolean }) =>
      api.updateFavoriteNotification(supermarketId, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>{t('favorites.loginRequired')}</Text>
        <Text style={styles.emptySubtitle}>{t('favorites.loginSubtitle')}</Text>
        <Text style={styles.loginLink} onPress={() => router.push('/auth/login')}>
          {t('common.login')}
        </Text>
      </View>
    );
  }

  if (isLoading) return <View style={styles.centered} />;

  return (
    <View style={styles.container}>
      <FlashList
        data={favorites}
        keyExtractor={(item: FavoriteItem) => item.id}
        estimatedItemSize={100}
        renderItem={({ item }: { item: FavoriteItem }) => (
          <View>
            <SupermarketCard
              supermarket={item.supermarket}
              onPress={() => router.push(`/supermarket/${item.supermarketId}`)}
            />
            <View style={styles.notifRow}>
              <Text style={styles.notifLabel}>{t('favorites.notifyNewFlyer')}</Text>
              <Switch
                value={item.notifyEnabled}
                onValueChange={(v) =>
                  toggleNotifMutation.mutate({ supermarketId: item.supermarketId, enabled: v })
                }
                trackColor={{ true: Colors.primary }}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>{t('favorites.empty')}</Text>
            <Text style={styles.emptySubtitle}>{t('favorites.emptySubtitle')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.muted, textAlign: 'center' },
  loginLink: { marginTop: 16, color: Colors.primary, fontWeight: '600', fontSize: 16 },
  notifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  notifLabel: { fontSize: 13, color: Colors.muted },
});
