import { Text, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/colors';

interface Props {
  validFrom: string;
  validTo: string;
  compact?: boolean;
}

export function FlyerValidityBadge({ validFrom, validTo, compact }: Props) {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const to = new Date(validTo);
  const daysLeft = Math.ceil((to.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = to < now;
  const isExpiringSoon = daysLeft <= 3 && !isExpired;

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  const color = isExpired
    ? Colors.muted
    : isExpiringSoon
      ? '#d97706'
      : Colors.primary;

  if (compact) {
    return (
      <Text style={[styles.compact, { color }]}>
        {isExpired
          ? t('flyer.expired')
          : isExpiringSoon
            ? t('flyer.expiresIn', { days: daysLeft })
            : t('flyer.validUntil', { date: fmt(validTo) })}
      </Text>
    );
  }

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>
        {fmt(validFrom)} – {fmt(validTo)}
        {isExpiringSoon && ` · ${t('flyer.expiresIn', { days: daysLeft })}`}
        {isExpired && ` · ${t('flyer.expired')}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { fontSize: 11, marginTop: 3 },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12 },
});
