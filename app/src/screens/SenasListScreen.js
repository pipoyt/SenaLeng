import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import useSenas, { useCategoriaOptions } from '../hooks/useSenas';
import { useAppData } from '../context/AppDataContext';
import SearchBar from '../components/SearchBar';
import Chips from '../components/Chips';
import SenaRow from '../components/SenaRow';
import ScreenHeader from '../components/ScreenHeader';
import IconButton from '../components/IconButton';
import { Empty, ErrorView, Loading, OfflineBanner } from '../components/StateView';
import { colors } from '../theme';

/** Listado de señas (Figura 4) — operación READ con búsqueda y filtros. */
export default function SenasListScreen({ navigation, route }) {
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState(route.params?.categoria ?? null);
  const { senas, loading, error, offline, reload } = useSenas({ q, categoria });
  const [options, reloadOptions] = useCategoriaOptions();
  const { favBySena } = useAppData();
  const firstFocus = useRef(true);

  // Si llegamos desde Inicio con una categoría, aplicamos el filtro.
  useEffect(() => {
    if (route.params?.categoria !== undefined) setCategoria(route.params.categoria);
  }, [route.params?.categoria]);

  // Al volver a la pantalla (después de crear/editar/eliminar) recargamos.
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      reload();
      reloadOptions();
    }, [reload, reloadOptions]),
  );

  const header = (
    <View>
      <ScreenHeader
        title="Listado de señas"
        right={<IconButton icon="＋" label="Crear nueva seña" onPress={() => navigation.navigate('SenaForm')} />}
      />
      <OfflineBanner visible={offline} />
      <SearchBar value={q} onChangeText={setQ} />
      <Chips options={options} value={categoria} onChange={setCategoria} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {error && !senas ? (
        <ErrorView message={error} onRetry={reload} />
      ) : !senas ? (
        <Loading />
      ) : (
        <FlatList
          data={senas}
          keyExtractor={(s) => String(s.id)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={loading && !!senas} onRefresh={reload} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <SenaRow
              sena={item}
              subtitle={`${item.categoria} · ${item.nivel}${favBySena.has(item.id) ? '  ⭐' : ''}`}
              onPress={() => navigation.navigate('Detalle', { id: item.id, sena: item })}
            />
          )}
          ListEmptyComponent={
            <Empty emoji="🔎" title="Sin resultados" text={q ? `No encontramos señas para "${q}".` : 'No hay señas en esta categoría.'} />
          }
          ListFooterComponent={senas.length ? <Text style={styles.footer}>{senas.length} {senas.length === 1 ? "seña" : "señas"}</Text> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 4 },
});
