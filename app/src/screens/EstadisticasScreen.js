import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import BackHeader from '../components/BackHeader';
import { ErrorView, Loading } from '../components/StateView';
import { ROL_INFO } from '../roles';
import { colors, font, radius, shadow } from '../theme';
import useLayout from '../hooks/useLayout';

/** Panel de estadísticas — exclusivo del superusuario principal. */
export default function EstadisticasScreen() {
  const { wide } = useLayout();
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.getEstadisticas();
      setD(res.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (error && !d) return <ErrorView message={error} onRetry={load} />;
  if (!d) return <Loading text="Calculando estadísticas..." />;

  const maxDia = Math.max(1, ...d.usuarios.registrosPorDia.map((x) => x.total));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pad}>
        <BackHeader title="Estadísticas" />
      </View>
      <ScrollView
        contentContainerStyle={[styles.pad, { paddingBottom: 32 }]}
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
      >
        <Text style={[font.small, { marginBottom: 12 }]}>
          Actualizado {new Date(d.generadoEn).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })} · desliza hacia abajo para refrescar
        </Text>

        {/* Indicadores principales (4 en fila en computadora) */}
        <View style={[styles.grid, wide && styles.grid4]}>
          <Kpi n={d.usuarios.total} label="Usuarios" sub={`+${d.usuarios.nuevos7d} esta semana`} />
          <Kpi n={d.usuarios.activos7d} label="Activos (7 días)" sub={`${pct(d.usuarios.activos7d, d.usuarios.total)}% del total`} />
          <Kpi n={`${d.senas.porcentajeConVideo}%`} label="Señas con video" sub={`${d.senas.conVideo} de ${d.senas.total}`} />
          <Kpi n={d.videos.porEstado.pendiente} label="Videos por revisar" sub={d.videos.horasPromedioRevision != null ? `revisión prom. ${d.videos.horasPromedioRevision} h` : 'sin revisiones aún'} />
        </View>

        {/* Registros por día */}
        <Card title="Registros por día (últimos 14 días)">
          <View style={styles.chart} accessibilityLabel={`Registros por día: ${d.usuarios.registrosPorDia.map((x) => `${x.fecha} ${x.total}`).join(', ')}`}>
            {d.usuarios.registrosPorDia.map((x) => (
              <View key={x.fecha} style={styles.col}>
                <Text style={styles.colVal}>{x.total || ''}</Text>
                <View style={[styles.bar, { height: `${Math.max((x.total / maxDia) * 100, x.total ? 6 : 2)}%`, opacity: x.total ? 1 : 0.25 }]} />
                <Text style={styles.colLbl}>{Number(x.fecha.slice(8))}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card title="Usuarios por rol">
          {Object.entries(d.usuarios.porRol).map(([rol, n]) => (
            <HBar key={rol} label={ROL_INFO[rol].label} value={n} max={d.usuarios.total} />
          ))}
        </Card>

        <Card title="Videos por estado">
          <HBar label="⏳ Pendientes" value={d.videos.porEstado.pendiente} max={d.videos.total} />
          <HBar label="✓ Aprobados" value={d.videos.porEstado.aprobado} max={d.videos.total} />
          <HBar label="✕ Rechazados" value={d.videos.porEstado.rechazado} max={d.videos.total} />
          <HBar label="↺ Reemplazados" value={d.videos.porEstado.reemplazado} max={d.videos.total} />
          {d.videos.topAdmins.length ? (
            <>
              <Text style={[font.title, { marginTop: 12, marginBottom: 6 }]}>Administradores que más aportan</Text>
              {d.videos.topAdmins.map((a) => (
                <Row key={a.usuarioId} left={a.nombre} right={`${a.aprobados}/${a.enviados} aprobados`} />
              ))}
            </>
          ) : null}
        </Card>

        <Card title="Cobertura de video por categoría">
          {d.senas.porCategoria.map((c) => (
            <HBar key={c.categoria} label={c.categoria} value={c.conVideo} max={c.total} suffix={` / ${c.total}`} />
          ))}
        </Card>

        <Card title="Aprendizaje">
          <View style={styles.grid}>
            <Kpi n={d.aprendizaje.senasAprendidasTotal} label="Señas aprendidas" small />
            <Kpi n={d.aprendizaje.promedioAprendidasPorUsuario} label="Promedio por usuario" small />
            <Kpi n={d.aprendizaje.usuariosAprendiendo} label="Usuarios aprendiendo" small />
            <Kpi n={d.aprendizaje.favoritosTotal} label="Favoritos guardados" small />
          </View>
          <Text style={[font.title, { marginTop: 8, marginBottom: 6 }]}>Más guardadas en favoritos</Text>
          {d.aprendizaje.topFavoritas.map((s, i) => (
            <Row key={s.senaId} left={`${i + 1}. ${s.icono} ${s.nombre}`} right={`${s.total}`} />
          ))}
          <Text style={[font.title, { marginTop: 12, marginBottom: 6 }]}>Más aprendidas</Text>
          {d.aprendizaje.topAprendidas.map((s, i) => (
            <Row key={s.senaId} left={`${i + 1}. ${s.icono} ${s.nombre}`} right={`${s.total}`} />
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function Kpi({ n, label, sub, small }) {
  return (
    <View style={[styles.kpi, small && { ...styles.kpiSmall }]}>
      <Text style={[styles.kpiN, small && { fontSize: 22 }]}>{n}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={[font.title, { marginBottom: 12 }]}>{title}</Text>
      {children}
    </View>
  );
}

function HBar({ label, value, max, suffix = '' }) {
  const w = max ? (value / max) * 100 : 0;
  return (
    <View style={{ marginBottom: 10 }} accessibilityLabel={`${label}: ${value}${suffix}`}>
      <View style={styles.hRow}>
        <Text style={font.body}>{label}</Text>
        <Text style={[font.body, { fontWeight: '700' }]}>
          {value}
          <Text style={font.small}>{suffix}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${w}%` }]} />
      </View>
    </View>
  );
}

function Row({ left, right }) {
  return (
    <View style={styles.listRow}>
      <Text style={[font.body, { flex: 1 }]} numberOfLines={1}>
        {left}
      </Text>
      <Text style={[font.body, { fontWeight: '700' }]}>{right}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 },
  grid4: { flexWrap: 'nowrap', columnGap: 12 },
  kpi: { flexGrow: 1, flexBasis: '45%', backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 10, ...shadow },
  kpiSmall: { backgroundColor: colors.background, shadowOpacity: 0, elevation: 0 },
  kpiN: { fontSize: 28, fontWeight: '800', color: colors.text },
  kpiLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 2 },
  kpiSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 3 },
  col: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  colVal: { fontSize: 10, color: colors.text, fontWeight: '700', marginBottom: 2 },
  bar: { width: '100%', maxWidth: 16, backgroundColor: colors.primary, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  colLbl: { fontSize: 9, color: colors.muted, marginTop: 4 },
  hRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  listRow: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
});
