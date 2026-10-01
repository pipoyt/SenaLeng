import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import ScreenHeader from '../components/ScreenHeader';
import SearchBar from '../components/SearchBar';
import SenaRow from '../components/SenaRow';
import IconButton from '../components/IconButton';
import Button from '../components/Button';
import ConfirmDeleteSheet from '../components/ConfirmDeleteSheet';
import CommentSheet from '../components/CommentSheet';
import { Empty, ErrorView, OfflineBanner } from '../components/StateView';
import { colors } from '../theme';
import useLayout from '../hooks/useLayout';

const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Mis favoritos (Figura 8) — READ, UPDATE (editar comentario) y DELETE.
 * El botón "Agregar nueva seña" abre la pantalla de CREATE (Figura 7).
 */
export default function FavoritosScreen({ navigation }) {
  const { favoritos, offline, refreshFavoritos, updateFavorito, removeFavorito } = useAppData();
  const toast = useToast();
  const { columns } = useLayout();
  const cell = columns > 1 ? { width: `${100 / columns}%`, paddingHorizontal: 6 } : null;
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toEdit, setToEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      await refreshFavoritos();
    } catch (e) {
      setError(e.message);
    }
  }, [refreshFavoritos]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const data = useMemo(() => {
    const list = favoritos.filter((f) => f.sena);
    if (!q.trim()) return list;
    const t = norm(q.trim());
    return list.filter((f) => norm(f.sena.nombre).includes(t) || norm(f.comentario).includes(t));
  }, [favoritos, q]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const confirmDelete = async () => {
    try {
      setBusy(true);
      await removeFavorito(toDelete.id);
      toast(`"${toDelete.sena.nombre}" eliminada de favoritos`);
      setToDelete(null);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveComment = async (comentario) => {
    try {
      setBusy(true);
      await updateFavorito(toEdit.id, comentario);
      toast('✓ Favorito actualizado');
      setToEdit(null);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error && !favoritos.length) return <ErrorView message={error} onRetry={load} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={data}
        key={`cols-${columns}`}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? { marginHorizontal: -6 } : undefined}
        keyExtractor={(f) => String(f.id)}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <ScreenHeader title="Mis favoritos" />
            <OfflineBanner visible={offline} />
            <SearchBar value={q} onChangeText={setQ} placeholder="Buscar en tus favoritos..." />
          </View>
        }
        renderItem={({ item }) => (
          <View style={cell}>
          <SenaRow
            sena={item.sena}
            subtitle={item.sena.categoria}
            onPress={() => navigation.navigate('Detalle', { id: item.senaId, sena: item.sena })}
            right={
              <View style={styles.actions}>
                <IconButton icon="✏️" tone="warn" label={`Editar ${item.sena.nombre}`} onPress={() => setToEdit(item)} />
                <IconButton icon="🗑️" tone="danger" label={`Eliminar ${item.sena.nombre}`} onPress={() => setToDelete(item)} />
              </View>
            }
          >
            {item.comentario ? (
              <Text style={styles.comment} numberOfLines={2}>
                “{item.comentario}”
              </Text>
            ) : null}
          </SenaRow>
          </View>
        )}
        ListEmptyComponent={
          q ? (
            <Empty emoji="🔎" title="Sin coincidencias" text={`Ningún favorito coincide con "${q}".`} />
          ) : (
            <Empty emoji="⭐" title="Aún no tienes favoritos" text="Guarda las señas que quieras repasar después." />
          )
        }
        ListFooterComponent={
          <Button title="＋  Agregar nueva seña" variant="ghost" onPress={() => navigation.navigate('AgregarFavoritos')} style={{ marginTop: 6 }} />
        }
      />

      <ConfirmDeleteSheet
        visible={!!toDelete}
        sena={toDelete?.sena}
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      <CommentSheet
        visible={!!toEdit}
        sena={toEdit?.sena}
        initial={toEdit?.comentario}
        loading={busy}
        onSave={saveComment}
        onCancel={() => setToEdit(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32 },
  actions: { flexDirection: 'row', gap: 8 },
  comment: { fontSize: 12, color: colors.primary, marginTop: 4, fontStyle: 'italic' },
});
