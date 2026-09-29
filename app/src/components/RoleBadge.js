import { StyleSheet, Text } from 'react-native';
import { ROL_INFO } from '../roles';

export default function RoleBadge({ rol, style }) {
  const info = ROL_INFO[rol] || ROL_INFO.usuario;
  return <Text style={[styles.badge, { color: info.color, backgroundColor: info.bg }, style]}>{info.label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
