import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme';

/** Campo de texto con etiqueta, error y opción de mostrar contraseña. */
export default function TextField({ label, error, secure, style, ...props }) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, error && { borderColor: colors.danger }]}>
        <TextInput
          placeholderTextColor={colors.muted}
          style={styles.input}
          secureTextEntry={secure && hidden}
          accessibilityLabel={label}
          {...props}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}>
            <Text style={{ fontSize: 16 }}>{hidden ? '👁️' : '🙈'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.text, outlineStyle: 'none' },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
});
