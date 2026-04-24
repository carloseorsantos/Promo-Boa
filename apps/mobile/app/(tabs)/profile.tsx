import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors } from '../../src/constants/colors';
import Constants from 'expo-constants';

const LOCALES = [
  { code: 'pt-BR', label: 'Português' },
  { code: 'en', label: 'English' },
] as const;

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>{t('profile.guest')}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/login')}>
          <Text style={styles.buttonText}>{t('common.login')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={() => router.push('/auth/register')}
        >
          <Text style={[styles.buttonText, styles.outlineText]}>{t('common.register')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.name && <Text style={styles.name}>{user.name}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
        <View style={styles.localeRow}>
          {LOCALES.map(({ code, label }) => (
            <TouchableOpacity
              key={code}
              style={[styles.localeChip, i18n.language === code && styles.localeChipActive]}
              onPress={() => i18n.changeLanguage(code)}
            >
              <Text
                style={[styles.localeText, i18n.language === code && styles.localeTextActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={logout}>
        <Text style={styles.buttonText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      <Text style={styles.version}>v{Constants.expoConfig?.version}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, color: Colors.muted, textTransform: 'uppercase', marginBottom: 8 },
  email: { fontSize: 16, color: Colors.text },
  name: { fontSize: 14, color: Colors.muted, marginTop: 4 },
  localeRow: { flexDirection: 'row', gap: 8 },
  localeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  localeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  localeText: { color: Colors.text, fontSize: 14 },
  localeTextActive: { color: 'white', fontWeight: '600' },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  outlineButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.primary },
  dangerButton: { backgroundColor: '#e53e3e' },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  outlineText: { color: Colors.primary },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 24 },
  version: { textAlign: 'center', color: Colors.muted, fontSize: 12, marginTop: 'auto' },
});
