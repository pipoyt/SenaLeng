import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style }) {
  const v = variants[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.base, v.box, (pressed || disabled) && { opacity: 0.7 }, style]}
      accessibilityRole="button"
    >
      {loading ? <ActivityIndicator color={v.text.color} /> : <Text style={[styles.text, v.text]}>{title}</Text>}
    </Pressable>
  );
}

const variants = {
  primary: { box: { backgroundColor: colors.primary }, text: { color: colors.white } },
  danger: { box: { backgroundColor: colors.danger }, text: { color: colors.white } },
  outline: { box: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }, text: { color: colors.text } },
  ghost: { box: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed' }, text: { color: colors.text } },
};

const styles = StyleSheet.create({
  base: { height: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  text: { fontSize: 16, fontWeight: '700' },
});
