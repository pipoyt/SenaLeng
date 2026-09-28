import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

export default function IconButton({ icon, onPress, label, tone = 'default', size = 36 }) {
  const bg = { default: colors.primarySoft, danger: colors.dangerSoft, warn: '#FFF1E6' }[tone];
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, { width: size, height: size, backgroundColor: bg }, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={{ fontSize: size * 0.42 }}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
