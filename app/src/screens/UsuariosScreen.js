import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BackHeader from '../components/BackHeader';
import SearchBar from '../components/SearchBar';
import Chips from '../components/Chips';
import RoleBadge from '../components/RoleBadge';
import BottomSheet from '../components/BottomSheet';
import Button from '../components/Button';
import { Empty, ErrorView, Loading } from '../components/StateView';
import { ROL_INFO, rolesAsignables } from '../roles';
import { colors, font, radius, shadow } from '../theme';

const FILTROS = [
  { label: 'Todos', value: null },
  { label: 'Usuarios', value: 'usuario' },
  { label: 'Admins', value: 'admin' },
  { label: 'Superusuarios', value: 'superusuario' },
];

const fecha = (iso) => (iso ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'nunca');

/** Lista de usuarios registrados y asignación de roles (superusuarios). */
export default function UsuariosScreen() {
  const { user: yo } = useAuth();
  const [q, setQ] = useState('');
  const [rol, setRol] = useState(null);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sel, setSel] = useState(null);
  const [nuevoRol, setNuevoRol] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await api.getUsuarios({ q: q.trim(), rol });
      setUsers(res.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [q, rol]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const abrir = (u) => {
    setSel(u);
    setNuevoRol(u.rol);
  };

  const guardar = async () => {
    setSaving(true);
    try {
      await api.cambiarRol(sel.id, nuevoRol);
      toast(`✓ ${sel.nombre} ahora es ${ROL_INFO[nuevoRol].label}`);
      setSel(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const opciones = sel ? rolesAsignables(yo, sel) : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pad}>
        <BackHeader title="Usuarios" />
        <SearchBar value={q} onChangeText={setQ} placeholder="Buscar por nombre o correo..." />
        <Chips options={FILTROS} value={rol} onChange={setRol} />
      </View>
      {error && !users ? (
        <ErrorView message={error} onRetry={load} />
      ) : !users ? (
        <Loading />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={[styles.pad, { paddingBottom: 24 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={<Text style={[font.small, { marginBottom: 10 }]}>{users.length} cuentas · toca una para ver detalles o cambiar su rol</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => abrir(item)} accessibilityRole="button" accessibilityLabel={`${item.nombre}, ${ROL_INFO[item.rol].label}`}>
              <View style={[styles.avatar, { backgroundColor: ROL_INFO[item.rol].bg }]}>
                <Text style={[styles.initial, { color: ROL_INFO[item.rol].color }]}>{item.nombre.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={font.title} numberOfLines={1}>
                  {item.nombre}
                  {item.id === yo.id ? ' (tú)' : ''}
                </Text>
                <Text style={font.small} numberOfLines={1}>
                  {item.correo}
                </Text>
              </View>
              <RoleBadge rol={item.rol} />
            </Pressable>
          )}
          ListEmptyComponent={<Empty emoji="🔎" title="Sin usuarios" />}
        />
      )}

      <BottomSheet visible={!!sel} onClose={() => setSel(null)}>
        {sel ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={[font.h2, { flex: 1 }]} numberOfLines={1}>
                {sel.nombre}
              </Text>
              <RoleBadge rol={sel.rol} />
            </View>
            <Text style={font.small}>{sel.correo}</Text>
            <View style={styles.stats}>
              <Stat n={sel.resumen.aprendidas} label="aprendidas" />
              <Stat n={sel.resumen.favoritos} label="favoritos" />
              <Stat n={sel.resumen.videosEnviados} label="videos" />
            </View>
            <Text style={font.small}>
              Registro: {fecha(sel.fechaCreacion)} · Último acceso: {fecha(sel.ultimoAcceso)}
            </Text>

            {opciones.length ? (
              <>
                <Text style={[font.title, { marginTop: 18, marginBottom: 8 }]}>Rol</Text>
                {opciones.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setNuevoRol(r)}
                    style={[styles.option, nuevoRol === r && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: nuevoRol === r }}
                  >
                    <Text style={styles.radio}>{nuevoRol === r ? '◉' : '○'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={font.title}>{ROL_INFO[r].label}</Text>
                      <Text style={font.small}>{ROL_INFO[r].desc}</Text>
                    </View>
                  </Pressable>
                ))}
                <Button title="Guardar rol" onPress={guardar} loading={saving} disabled={nuevoRol === sel.rol} style={{ marginTop: 8 }} />
              </>
            ) : (
              <Text style={styles.note}>
                {sel.id === yo.id
                  ? 'No puedes cambiar tu propio rol.'
                  : sel.rol === 'principal'
                    ? 'El superusuario principal no se puede modificar.'
                    : 'Solo el superusuario principal puede cambiar el rol de otro superusuario.'}
              </Text>
            )}
            <Button title="Cerrar" variant="outline" onPress={() => setSel(null)} style={{ marginTop: 10 }} />
          </>
        ) : null}
      </BottomSheet>
    </SafeAreaView>
  );
}

function Stat({ n, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statN}>{n}</Text>
      <Text style={font.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 12, marginBottom: 10, ...shadow },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 18, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  stat: { flex: 1, backgroundColor: colors.background, borderRadius: 12, padding: 10, alignItems: 'center' },
  statN: { fontSize: 20, fontWeight: '800', color: colors.text },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  radio: { fontSize: 18, color: colors.primary },
  note: { marginTop: 16, backgroundColor: colors.background, padding: 12, borderRadius: 12, color: colors.muted },
});
