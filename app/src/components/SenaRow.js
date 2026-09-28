import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../theme';
import Thumb from './Thumb';

/** Tarjeta de seña usada en Listado, Agregar favoritos y Mis favoritos. */
export default function SenaRow({ sena, subtitle, onPress, right, children }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${sena.nombre}, ${sena.categoria}`}
    >
      <Thumb icono={sena.icono} categoria={sena.categoria} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {sena.nombre}
        </Text>
        <Text style={styles.sub} numberOfLines={2}>
          {subtitle ?? `${sena.categoria} · ${sena.nivel}`}
        </Text>
        {children}
      </View>
      {right === undefined ? <Text style={styles.chev}>›</Text> : right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    ...shadow,
  },
  info: { flex: 1, marginHorizontal: 14 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chev: { fontSize: 22, color: colors.muted },
});
