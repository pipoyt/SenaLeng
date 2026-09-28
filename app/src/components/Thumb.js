import { StyleSheet, Text, View } from 'react-native';
import { pastelFor, radius } from '../theme';

/** Miniatura cuadrada con el emoji de la seña sobre un fondo pastel. */
export default function Thumb({ icono = '🤟', categoria, size = 48 }) {
  return (
    <View style={[styles.box, { width: size, height: size, backgroundColor: pastelFor(categoria) }]}>
      <Text style={{ fontSize: size * 0.48 }}>{icono}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
});
