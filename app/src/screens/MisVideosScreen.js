import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import BackHeader from '../components/BackHeader';
import Button from '../components/Button';
import VideoCard from '../components/VideoCard';
import ConfirmDeleteSheet from '../components/ConfirmDeleteSheet';
import { Empty, ErrorView, Loading } from '../components/StateView';
import { colors } from '../theme';

/** Videos que envié y su estado de revisión (admins). */
export default function MisVideosScreen({ navigation }) {
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await api.getVideos({ mios: true });
      setVideos(res.data);
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

  const borrar = async () => {
    setBusy(true);
    try {
      await api.deleteVideo(toDelete.id);
      toast('Video eliminado');
      setToDelete(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pad}>
        <BackHeader title="Mis videos" />
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
          ListHeaderComponent={<Button title="🎥  Grabar nueva seña" onPress={() => navigation.navigate('GrabarVideo')} style={{ marginBottom: 14 }} />}
          renderItem={({ item }) => (
            <VideoCard video={item}>
              {['pendiente', 'rechazado'].includes(item.estado) ? (
                <Button title="Eliminar" variant="outline" onPress={() => setToDelete(item)} style={{ marginTop: 8, height: 44 }} />
              ) : null}
            </VideoCard>
          )}
          ListEmptyComponent={<Empty emoji="🎬" title="Aún no has enviado videos" text="Graba una seña y un superusuario la revisará." />}
        />
      )}
      <ConfirmDeleteSheet
        visible={!!toDelete}
        sena={toDelete?.sena}
        title="¿Eliminar este video?"
        message="Se borrará el archivo y ya no aparecerá en la revisión."
        loading={busy}
        onConfirm={borrar}
        onCancel={() => setToDelete(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 20 },
});
