import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import BackHeader from '../components/BackHeader';
import Button from '../components/Button';
import Chips from '../components/Chips';
import VideoCard from '../components/VideoCard';
import BottomSheet from '../components/BottomSheet';
import { Empty, ErrorView, Loading } from '../components/StateView';
import { colors, radius } from '../theme';

const FILTROS = [
  { label: 'Pendientes', value: 'pendiente' },
  { label: 'Aprobados', value: 'aprobado' },
  { label: 'Rechazados', value: 'rechazado' },
  { label: 'Todos', value: null },
];

/** Cola de revisión de videos (superusuarios): aprobar o rechazar con comentario. */
export default function RevisarVideosScreen() {
  const [estado, setEstado] = useState('pendiente');
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(null);
  const [rechazo, setRechazo] = useState(null);
  const [motivo, setMotivo] = useState('');
  const { refreshPendientes } = useAppData();
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await api.getVideos({ estado });
      setVideos(res.data);
      setError(null);
      refreshPendientes().catch(() => {});
    } catch (e) {
      setError(e.message);
    }
  }, [estado, refreshPendientes]);

  useFocusEffect(
    useCallback(() => {
      setVideos(null);
      load();
    }, [load]),
  );

  const revisar = async (video, accion, comentario = '') => {
    setBusy(video.id);
    try {
      await api.revisarVideo(video.id, accion, comentario);
      toast(accion === 'aprobar' ? `✓ Video de "${video.sena?.nombre}" aprobado y publicado` : 'Video rechazado; el administrador verá el motivo');
      setRechazo(null);
      setMotivo('');
      await load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pad}>
        <BackHeader title="Revisar videos" />
        <Chips options={FILTROS} value={estado} onChange={setEstado} />
      </View>
      {error && !videos ? (
        <ErrorView message={error} onRetry={load} />
      ) : !videos ? (
        <Loading />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={[styles.pad, { paddingBottom: 24 }]}
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
          renderItem={({ item }) => (
            <VideoCard video={item} showAutor>
              {item.estado === 'pendiente' ? (
                <View style={styles.actions}>
                  <Button title="Rechazar" variant="outline" onPress={() => setRechazo(item)} style={styles.btn} disabled={!!busy} />
                  <Button title="Aprobar" onPress={() => revisar(item, 'aprobar')} loading={busy === item.id} style={styles.btn} />
                </View>
              ) : null}
            </VideoCard>
          )}
          ListEmptyComponent={
            <Empty
              emoji={estado === 'pendiente' ? '🎉' : '🎬'}
              title={estado === 'pendiente' ? 'No hay videos pendientes' : 'Sin videos'}
              text={estado === 'pendiente' ? 'Todo está revisado.' : undefined}
            />
          }
        />
      )}

      <BottomSheet visible={!!rechazo} onClose={() => setRechazo(null)}>
        <Text style={styles.title}>Rechazar video</Text>
        <Text style={styles.sub}>
          {rechazo?.sena?.icono} {rechazo?.sena?.nombre} · enviado por {rechazo?.autor?.nombre}
        </Text>
        <Text style={styles.label}>Motivo (lo verá el administrador)</Text>
        <TextInput
          value={motivo}
          onChangeText={(t) => setMotivo(t.slice(0, 280))}
          placeholder="Ej. Poca luz, no se ve la mano izquierda"
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
          autoFocus
          accessibilityLabel="Motivo del rechazo"
        />
        <Button
          title="Rechazar video"
          variant="danger"
          onPress={() => revisar(rechazo, 'rechazar', motivo)}
          disabled={motivo.trim().length < 3}
          loading={busy === rechazo?.id}
          style={{ marginTop: 14 }}
        />
        <Button title="Cancelar" variant="outline" onPress={() => setRechazo(null)} style={{ marginTop: 10 }} />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { flex: 1, height: 46 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
    textAlignVertical: 'top',
  },
});
