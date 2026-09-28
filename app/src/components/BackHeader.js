import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/** Encabezado con botón "‹" para pantallas secundarias (Detalle, Agregar...). */
export default function BackHeader({ title, right }) {
  const navigation = useNavigation();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main'))}
        hitSlop={12}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Regresar"
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 48, marginBottom: 8 },
  back: { width: 32, height: 40, justifyContent: 'center' },
  backText: { fontSize: 32, color: colors.text, marginTop: -4 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text },
  right: { flexDirection: 'row', gap: 8 },
});
