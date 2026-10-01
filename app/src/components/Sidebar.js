import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import RoleBadge from './RoleBadge';
import { ROL_INFO } from '../roles';
import { colors, radius } from '../theme';

const ICONS = { Inicio: '🏠', Señas: '📖', Favoritos: '⭐', Perfil: '👤' };

const TABS = ['Inicio', 'Señas', 'Favoritos', 'Perfil'];

/**
 * Menú lateral para computadora (reemplaza la barra de pestañas inferior).
 * Está fuera de los navegadores para que se vea en todas las pantallas.
 */
export default function Sidebar({ current, onNavigate }) {
  const { user, can, logout } = useAuth();
  const { pendientes } = useAppData();

  const herramientas = [
    can('admin') && { icon: '🎥', label: 'Grabar seña', to: 'GrabarVideo' },
    can('admin') && { icon: '🎬', label: 'Mis videos', to: 'MisVideos' },
    can('superusuario') && { icon: '✅', label: 'Revisar videos', to: 'RevisarVideos', badge: pendientes },
    can('superusuario') && { icon: '👥', label: 'Usuarios', to: 'Usuarios' },
    can('principal') && { icon: '📊', label: 'Estadísticas', to: 'Estadisticas' },
  ].filter(Boolean);

  const info = ROL_INFO[user.rol];

  return (
    <View style={styles.side}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.brand}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.brandName}>SeñaLeng</Text>
            <Text style={styles.brandSub}>Lengua de Señas Mexicana</Text>
          </View>
        </View>

        <Text style={styles.section}>Aprender</Text>
        {TABS.map((name) => (
          <Item key={name} icon={ICONS[name]} label={name} active={current === name} onPress={() => onNavigate(name, true)} />
        ))}

        {herramientas.length ? (
          <>
            <Text style={styles.section}>Panel</Text>
            {herramientas.map((h) => (
              <Item key={h.to} icon={h.icon} label={h.label} badge={h.badge} active={current === h.to} onPress={() => onNavigate(h.to, false)} />
            ))}
          </>
        ) : null}

        <View style={{ flex: 1 }} />

        <View style={styles.user}>
          <View style={[styles.avatar, { backgroundColor: info.bg }]}>
            <Text style={{ color: info.color, fontWeight: '800', fontSize: 16 }}>{user.nombre.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.nombre}
            </Text>
            <RoleBadge rol={user.rol} style={{ marginTop: 3 }} />
          </View>
        </View>
        <Pressable onPress={logout} style={({ hovered }) => [styles.logout, hovered && { backgroundColor: colors.dangerSoft }]} accessibilityRole="button">
          <Text style={{ color: colors.danger, fontWeight: '700' }}>🚪  Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Item({ icon, label, active, badge, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [styles.item, hovered && !active && styles.itemHover, active && styles.itemActive]}
      accessibilityRole="link"
      accessibilityState={{ selected: !!active }}
    >
      <Text style={styles.itemIcon}>{icon}</Text>
      <Text style={[styles.itemLabel, active && { color: colors.primary }]}>{label}</Text>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  side: { width: 264, backgroundColor: colors.card, borderRightWidth: 1, borderRightColor: colors.border, paddingHorizontal: 16, paddingVertical: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingHorizontal: 6 },
  logo: { width: 44, height: 44, borderRadius: 22 },
  brandName: { fontSize: 20, fontWeight: '800', color: colors.text },
  brandSub: { fontSize: 11, color: colors.muted },
  section: { fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 14, marginBottom: 6, marginLeft: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: radius.sm + 2, marginBottom: 2 },
  itemHover: { backgroundColor: colors.background },
  itemActive: { backgroundColor: colors.primarySoft },
  itemIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  badge: { backgroundColor: colors.danger, color: colors.white, fontSize: 11, fontWeight: '800', minWidth: 20, textAlign: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, overflow: 'hidden' },
  user: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.background, marginTop: 20 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 14, fontWeight: '700', color: colors.text },
  logout: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.sm },
});
