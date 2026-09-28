import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import Button from './Button';

/** Estados de carga, error y vacío reutilizables. */
export function Loading({ text = 'Cargando...' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>🔌</Text>
      <Text style={styles.title}>Algo salió mal</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? <Button title="Reintentar" onPress={onRetry} style={{ marginTop: 16, width: 180 }} /> : null}
    </View>
  );
}

export function Empty({ emoji = '🤟', title, text, children }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
      {children}
    </View>
  );
}

export function OfflineBanner({ visible }) {
  if (!visible) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>Sin conexión con la API · mostrando datos guardados</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6, textAlign: 'center' },
  text: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6 },
  banner: { backgroundColor: '#FFF4D6', padding: 8, borderRadius: 10, marginBottom: 8 },
  bannerText: { color: '#8A6100', fontSize: 12, textAlign: 'center', fontWeight: '600' },
});
