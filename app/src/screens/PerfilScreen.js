import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ScreenHeader from '../components/ScreenHeader';
import RoleBadge from '../components/RoleBadge';
import BottomSheet from '../components/BottomSheet';
import ApiUrlSheet from '../components/ApiUrlSheet';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { ROL_INFO } from '../roles';
import { colors, font, radius, shadow } from '../theme';

/** Perfil: cuenta, progreso y el panel de herramientas según el rol. */
export default function PerfilScreen({ navigation }) {
  const { user, can, logout, refreshMe } = useAuth();
  const { progreso, refreshProgreso, favoritos, pendientes, refreshPendientes } = useAppData();
  const [pwOpen, setPwOpen] = useState(false);
  const [apiOpen, setApiOpen] = useState(false);
  const [salir, setSalir] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProgreso().catch(() => {});
      refreshPendientes().catch(() => {});
      refreshMe().catch(() => {}); // por si un superusuario cambió mi rol
    }, [refreshProgreso, refreshPendientes, refreshMe]),
  );

  const pct = progreso?.porcentaje ?? 0;
  const info = ROL_INFO[user.rol];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Perfil" />

        <View style={styles.card}>
          <View style={styles.userRow}>
            <View style={[styles.avatar, { backgroundColor: info.bg }]}>
              <Text style={[styles.initial, { color: info.color }]}>{user.nombre.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={font.title} numberOfLines={1}>
                {user.nombre}
              </Text>
              <Text style={font.small} numberOfLines={1}>
                {user.correo}
              </Text>
              <RoleBadge rol={user.rol} style={{ marginTop: 6 }} />
            </View>
          </View>
          <Text style={[font.small, { marginBottom: 12 }]}>{info.desc}</Text>
          <View style={styles.progressRow}>
            <Text style={font.small}>
              Progreso · {progreso?.totalAprendidas ?? 0} aprendidas · {favoritos.length} favoritos
            </Text>
            <Text style={[font.small, { fontWeight: '700' }]}>{pct}%</Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        </View>

        {can('admin') ? (
          <>
            <Text style={styles.section}>Panel de {can('superusuario') ? 'gestión' : 'administrador'}</Text>
            <View style={styles.menu}>
              <Item icon="🎥" title="Grabar seña" sub="Graba un video y envíalo a revisión" onPress={() => navigation.navigate('GrabarVideo')} />
              <Item icon="🎬" title="Mis videos" sub="Estado de los videos que enviaste" onPress={() => navigation.navigate('MisVideos')} />
              {can('superusuario') ? (
                <>
                  <Item
                    icon="✅"
                    title="Revisar videos"
                    sub="Aprobar o rechazar videos enviados"
                    badge={pendientes}
                    onPress={() => navigation.navigate('RevisarVideos')}
                  />
                  <Item icon="👥" title="Usuarios" sub="Ver cuentas y asignar roles" onPress={() => navigation.navigate('Usuarios')} />
                </>
              ) : null}
              {can('principal') ? (
                <Item icon="📊" title="Estadísticas" sub="Cómo va la aplicación" onPress={() => navigation.navigate('Estadisticas')} last />
              ) : null}
            </View>
          </>
        ) : null}

        {progreso ? (
          <View style={styles.card}>
            <Text style={[font.title, { marginBottom: 10 }]}>Avance por categoría</Text>
            {Object.entries(progreso.porCategoria).map(([cat, v]) => {
              const p = v.total ? Math.round((v.aprendidas / v.total) * 100) : 0;
              return (
                <View key={cat} style={{ marginBottom: 10 }}>
                  <View style={styles.progressRow}>
                    <Text style={font.body}>{cat}</Text>
                    <Text style={font.small}>
                      {v.aprendidas}/{v.total}
                    </Text>
                  </View>
                  <View style={styles.bar}>
                    <View style={[styles.fill, { width: `${p}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.section}>Cuenta</Text>
        <View style={styles.menu}>
          <Item icon="🔑" title="Cambiar contraseña" onPress={() => setPwOpen(true)} />
          <Item icon="⚙️" title="Conexión con la API" onPress={() => setApiOpen(true)} />
          <Item icon="🚪" title="Cerrar sesión" danger onPress={() => setSalir(true)} last />
        </View>

        <Text style={styles.about}>
          SeñaLeng v2.0.0 · Aplicaciones Web Progresivas{'\n'}IDGS-10A · UTA · Equipo 6
        </Text>
      </ScrollView>

      <PasswordSheet visible={pwOpen} onClose={() => setPwOpen(false)} />
      <ApiUrlSheet visible={apiOpen} onClose={() => setApiOpen(false)} />
      <BottomSheet visible={salir} onClose={() => setSalir(false)}>
        <Text style={[font.h2, { textAlign: 'center' }]}>¿Cerrar sesión?</Text>
        <Text style={[font.small, { textAlign: 'center', marginTop: 6, marginBottom: 18 }]}>Tus favoritos y progreso se quedan guardados en tu cuenta.</Text>
        <Button title="Cerrar sesión" variant="danger" onPress={logout} />
        <Button title="Cancelar" variant="outline" onPress={() => setSalir(false)} style={{ marginTop: 10 }} />
      </BottomSheet>
    </SafeAreaView>
  );
}

function Item({ icon, title, sub, onPress, badge, danger, last }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, !last && styles.itemBorder, pressed && { opacity: 0.6 }]} accessibilityRole="button" accessibilityLabel={badge ? `${title}, ${badge} pendientes` : title}>
      <Text style={styles.itemIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[font.title, { fontSize: 15 }, danger && { color: colors.danger }]}>{title}</Text>
        {sub ? <Text style={font.small}>{sub}</Text> : null}
      </View>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      <Text style={{ fontSize: 20, color: colors.muted }}>›</Text>
    </Pressable>
  );
}

function PasswordSheet({ visible, onClose }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const guardar = async () => {
    setSaving(true);
    try {
      await api.cambiarPassword(actual, nueva);
      toast('✓ Contraseña actualizada');
      setActual('');
      setNueva('');
      onClose();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[font.h2, { marginBottom: 14 }]}>Cambiar contraseña</Text>
      <TextField label="Contraseña actual" value={actual} onChangeText={setActual} secure autoCapitalize="none" />
      <TextField label="Nueva contraseña" value={nueva} onChangeText={setNueva} secure autoCapitalize="none" placeholder="Mínimo 8, con letras y números" />
      <Button title="Guardar" onPress={guardar} loading={saving} disabled={!actual || nueva.length < 8} />
      <Button title="Cancelar" variant="outline" onPress={onClose} style={{ marginTop: 10 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 26, fontWeight: '800' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary },
  section: { ...font.overline, marginTop: 4, marginBottom: 8, marginLeft: 4 },
  menu: { backgroundColor: colors.card, borderRadius: radius.lg, marginBottom: 16, ...shadow },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  badge: {
    backgroundColor: colors.danger,
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    minWidth: 22,
    textAlign: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 11,
    overflow: 'hidden',
  },
  about: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
});
