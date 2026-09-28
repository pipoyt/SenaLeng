import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { useAppData } from '../context/AppDataContext';
import { ErrorView, Loading, OfflineBanner } from '../components/StateView';
import { colors, font, pastelFor, radius, shadow } from '../theme';

/** Pantalla de inicio (Figura 3): lección del día + categorías. */
export default function HomeScreen({ navigation }) {
  const { progreso, refreshProgreso } = useAppData();
  const [categorias, setCategorias] = useState(null);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getCategorias();
      setCategorias(res.data);
      setOffline(res.fromCache);
      refreshProgreso().catch(() => {});
    } catch (e) {
      setError(e.message);
    }
  }, [refreshProgreso]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (error && !categorias) return <ErrorView message={error} onRetry={load} />;
  if (!categorias) return <Loading />;

  // Lección del día: primera categoría que aún no se completa.
  const stats = progreso?.porCategoria || {};
  const leccion =
    categorias.find((c) => (stats[c.nombre]?.aprendidas || 0) < c.total) || categorias[0] || { nombre: 'Saludos', total: 0 };
  const st = stats[leccion.nombre] || { aprendidas: 0, total: leccion.total };
  const pct = st.total ? Math.round((st.aprendidas / st.total) * 100) : 0;

  const goCategoria = (categoria) => navigation.navigate('Señas', { categoria });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <OfflineBanner visible={offline} />
        <View style={styles.header}>
          <View>
            <Text style={font.overline}>Bienvenido a</Text>
            <Text style={styles.brand}>SeñaLeng 👋</Text>
          </View>
          <Pressable style={styles.avatar} onPress={() => navigation.navigate('Perfil')} accessibilityLabel="Ir a perfil">
            <Text style={{ fontSize: 18 }}>🙂</Text>
          </Pressable>
        </View>

        <Pressable style={styles.hero} onPress={() => goCategoria(leccion.nombre)} accessibilityRole="button">
          <View style={styles.heroTop}>
            <Text style={styles.heroEmoji}>👋</Text>
          </View>
          <View style={styles.heroBody}>
            <Text style={[font.overline, { color: colors.primary, fontSize: 10 }]}>Nueva lección del día</Text>
            <Text style={styles.heroTitle}>{leccion.nombre}</Text>
            <View style={styles.progressRow}>
              <Text style={font.small}>Progreso</Text>
              <Text style={[font.small, { fontWeight: '700' }]}>{pct}%</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
          </View>
        </Pressable>

        <Text style={[font.h2, { marginTop: 24, marginBottom: 12 }]}>Categorías</Text>
        {categorias.map((c) => (
          <Pressable key={c.nombre} style={styles.cat} onPress={() => goCategoria(c.nombre)} accessibilityRole="button">
            <View style={[styles.catIcon, { backgroundColor: pastelFor(c.nombre) }]}>
              <Text style={{ fontSize: 18 }}>{c.icono}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={font.title}>{c.nombre}</Text>
              <Text style={font.small}>
                {c.total} señas{stats[c.nombre] ? ` · ${stats[c.nombre].aprendidas} aprendidas` : ''}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: colors.muted }}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  brand: { fontSize: 26, fontWeight: '800', color: colors.text },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card, ...shadow },
  heroTop: { backgroundColor: colors.primary, height: 130, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 60 },
  heroBody: { padding: 16 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4, marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  cat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    ...shadow,
  },
  catIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
