import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSenas, { useCategoriaOptions } from '../hooks/useSenas';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import BackHeader from '../components/BackHeader';
import SearchBar from '../components/SearchBar';
import Chips from '../components/Chips';
import SenaRow from '../components/SenaRow';
import Button from '../components/Button';
import { Empty, ErrorView, Loading } from '../components/StateView';
import { colors } from '../theme';

/** Agregar a favoritos (Figura 7) — operación CREATE (y quitar con un segundo toque). */
export default function AgregarFavoritosScreen({ navigation }) {
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState(null);
  const { senas, error, reload } = useSenas({ q, categoria });
  const [options] = useCategoriaOptions();
  const { favBySena, addFavorito, removeFavorito } = useAppData();
  const [pending, setPending] = useState(null);
  const toast = useToast();

  const toggle = async (sena) => {
    if (pending) return;
    setPending(sena.id);
    try {
      const fav = favBySena.get(sena.id);
      if (fav) {
        await removeFavorito(fav.id);
        toast(`"${sena.nombre}" eliminada de favoritos`);
      } else {
        await addFavorito(sena.id);
        toast(`✓ "${sena.nombre}" agregada a favoritos`);
      }
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setPending(null);
    }
  };

  const Check = ({ sena }) => {
    if (pending === sena.id) return <ActivityIndicator color={colors.primary} style={{ width: 30 }} />;
    const on = favBySena.has(sena.id);
    return (
      <View style={[styles.check, on && styles.checkOn]}>
        <Text style={[styles.checkText, on && { color: colors.white }]}>{on ? '✓' : '+'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pad}>
        <BackHeader title="Agregar a favoritos" />
        <SearchBar value={q} onChangeText={setQ} />
        <Chips options={options} value={categoria} onChange={setCategoria} />
      </View>

      {error && !senas ? (
        <ErrorView message={error} onRetry={reload} />
      ) : !senas ? (
        <Loading />
      ) : (
        <FlatList
          data={senas}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <SenaRow
              sena={item}
              onPress={() => toggle(item)}
              right={<Check sena={item} />}
            />
          )}
          ListEmptyComponent={<Empty emoji="🔎" title="Sin resultados" />}
        />
      )}

      <View style={styles.footer}>
        <Button title="Listo" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 16 },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.primary },
  checkText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  footer: { padding: 20, paddingTop: 8 },
});
