import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BackHeader from '../components/BackHeader';
import Button from '../components/Button';
import IconButton from '../components/IconButton';
import ConfirmDeleteSheet from '../components/ConfirmDeleteSheet';
import { ErrorView, Loading } from '../components/StateView';
import { colors, font, pastelFor, radius, shadow } from '../theme';

/** Detalle de seña (Figura 5) — READ por ID + acciones sobre favoritos y la seña. */
export default function SenaDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [sena, setSena] = useState(route.params.sena || null);
  const [relacionadas, setRelacionadas] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { favBySena, addFavorito, removeFavorito, progreso, toggleAprendida, refreshFavoritos } = useAppData();
  const toast = useToast();
  const { can } = useAuth();

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, r] = await Promise.all([api.getSena(id), api.getRelacionadas(id)]);
      setSena(s.data);
      setRelacionadas(r.data);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (error && !sena) return <ErrorView message={error} onRetry={load} />;
  if (!sena) return <Loading />;

  const fav = favBySena.get(sena.id);
  const aprendida = progreso?.senasAprendidas?.some((p) => p.senaId === sena.id);

  const toggleFav = async () => {
    try {
      setBusy(true);
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
      setBusy(false);
    }
  };

  const onAprendida = async () => {
    try {
      const now = await toggleAprendida(sena.id);
      toast(now ? '🎉 ¡Seña marcada como aprendida!' : 'Seña desmarcada');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const verVideo = () => {
    if (!sena.videoUrl) {
      toast(can('admin') ? 'Esta seña aún no tiene video: ¡grábalo tú!' : 'El video de esta seña aún no está disponible');
      return;
    }
    navigation.navigate('Video', { sena });
  };

  const eliminarSena = async () => {
    try {
      setBusy(true);
      await api.deleteSena(sena.id);
      await refreshFavoritos().catch(() => {});
      setConfirm(false);
      toast(`Seña "${sena.nombre}" eliminada`);
      navigation.goBack();
    } catch (e) {
      toast(e.message, 'error');
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pad}>
        <BackHeader
          title="Detalle"
          right={
            <>
              {can('admin') ? (
                <IconButton icon="✏️" tone="warn" label="Editar seña" onPress={() => navigation.navigate('SenaForm', { sena })} />
              ) : null}
              {can('superusuario') ? (
                <IconButton icon="🗑️" tone="danger" label="Eliminar seña" onPress={() => setConfirm(true)} />
              ) : null}
            </>
          }
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{sena.icono}</Text>
          <Pressable
            style={styles.heart}
            onPress={toggleFav}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Text style={{ fontSize: 18 }}>{fav ? '⭐' : '☆'}</Text>
          </Pressable>
        </View>

        <View style={styles.pills}>
          <Text style={styles.pill}>{sena.categoria}</Text>
          <Text style={[styles.pill, { backgroundColor: '#E8F7EE', color: colors.success }]}>{sena.nivel}</Text>
          {sena.videoUrl ? <Text style={[styles.pill, { backgroundColor: '#FFF1DC', color: '#B45309' }]}>🎬 Con video</Text> : null}
        </View>
        <Text style={[font.h1, { fontSize: 26 }]}>{sena.nombre}</Text>
        <Text style={styles.desc}>{sena.descripcion}</Text>

        {fav?.comentario ? (
          <View style={styles.note}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Tu nota</Text>
            <Text style={{ color: colors.text, marginTop: 2 }}>{fav.comentario}</Text>
          </View>
        ) : null}

        <Pressable style={[styles.learned, aprendida && styles.learnedOn]} onPress={onAprendida} accessibilityRole="checkbox" accessibilityState={{ checked: !!aprendida }}>
          <Text style={[styles.learnedText, aprendida && { color: colors.white }]}>
            {aprendida ? '✓ Aprendida' : 'Marcar como aprendida'}
          </Text>
        </Pressable>

        {relacionadas.length ? (
          <>
            <Text style={[font.title, { marginTop: 22, marginBottom: 10 }]}>Señas relacionadas</Text>
            <View style={styles.related}>
              {relacionadas.map((r) => (
                <Pressable
                  key={r.id}
                  style={styles.relCard}
                  onPress={() => navigation.push('Detalle', { id: r.id, sena: r })}
                  accessibilityRole="button"
                  accessibilityLabel={r.nombre}
                >
                  <View style={[styles.relIcon, { backgroundColor: pastelFor(r.categoria) }]}>
                    <Text style={{ fontSize: 22 }}>{r.icono}</Text>
                  </View>
                  <Text style={styles.relName} numberOfLines={1}>
                    {r.nombre}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button title={sena.videoUrl ? '▶  Ver video de la seña' : '▶  Video no disponible aún'} onPress={verVideo} variant={sena.videoUrl ? 'primary' : 'outline'} />
        {can('admin') ? (
          <Button
            title={sena.videoUrl ? '🎥  Grabar una nueva versión' : '🎥  Grabar video de esta seña'}
            variant="outline"
            onPress={() => navigation.navigate('GrabarVideo', { sena })}
            style={{ marginTop: 10 }}
          />
        ) : null}
      </View>

      <ConfirmDeleteSheet
        visible={confirm}
        sena={sena}
        title="¿Eliminar esta seña del catálogo?"
        message="Se eliminará de la API para todos los usuarios, junto con sus favoritos y progreso. Esta acción no se puede deshacer."
        loading={busy}
        onConfirm={eliminarSena}
        onCancel={() => setConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 20 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  hero: {
    height: 190,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroEmoji: { fontSize: 72 },
  heart: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pill: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  desc: { fontSize: 15, color: colors.muted, lineHeight: 22, marginTop: 8 },
  note: { backgroundColor: colors.primarySoft, borderRadius: 12, padding: 12, marginTop: 14 },
  learned: {
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  learnedOn: { backgroundColor: colors.success, borderColor: colors.success },
  learnedText: { color: colors.primary, fontWeight: '700' },
  related: { flexDirection: 'row', gap: 10 },
  relCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, alignItems: 'center', ...shadow },
  relIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  relName: { fontSize: 12, color: colors.muted },
  footer: { padding: 20, paddingTop: 8 },
});
