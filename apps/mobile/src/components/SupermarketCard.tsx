import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { SupermarketSummary } from '@promo-boa/shared';
import { FlyerValidityBadge } from './FlyerValidityBadge';
import { Colors } from '../constants/colors';

interface Props {
  supermarket: SupermarketSummary;
  selected?: boolean;
  onPress: () => void;
}

export function SupermarketCard({ supermarket, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.logoContainer}>
        {supermarket.logoUrl ? (
          <Image source={{ uri: supermarket.logoUrl }} style={styles.logo} contentFit="contain" />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoEmoji}>🏪</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{supermarket.name}</Text>
        <Text style={styles.address} numberOfLines={1}>
          {supermarket.city} · {supermarket.distanceKm != null ? `${supermarket.distanceKm} km` : ''}
        </Text>
        {supermarket.activeFlyer && (
          <FlyerValidityBadge
            validFrom={supermarket.activeFlyer.validFrom}
            validTo={supermarket.activeFlyer.validTo}
            compact
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    gap: 12,
  },
  cardSelected: { backgroundColor: '#f0fdf4' },
  logoContainer: { width: 52, height: 52 },
  logo: { width: 52, height: 52, borderRadius: 8 },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.text },
  address: { fontSize: 12, color: Colors.muted, marginTop: 2 },
});
