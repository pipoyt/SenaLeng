import { useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api/client';
import useSenas from '../hooks/useSenas';
import { useToast } from '../context/ToastContext';
import BackHeader from '../components/BackHeader';
import SearchBar from '../components/SearchBar';
import SenaRow from '../components/SenaRow';
import Button from '../components/Button';
import VideoBox from '../components/VideoBox';
import Thumb from '../components/Thumb';
import { Loading } from '../components/StateView';
import { colors, font, radius, shadow } from '../theme';

const MAX_SEG = 20;

/**
 * Grabar (o elegir) el video de una seña y enviarlo a revisión.
 * Solo administradores y superiores. El video queda "pendiente" hasta que un superusuario lo apruebe.
 */
export default function GrabarVideoScreen({ route, navigation }) {
  const [sena, setSena] = useState(route.params?.sena || null);
  const [q, setQ] = useState('');
  const { senas } = useSenas({ q, categoria: null });
  const [video, setVideo] = useState(null);
  const [nota, setNota] = useState('');
  const [sending, setSending] = useState(false);
  const toast = useToast();

  const elegir = async (camara) => {
    try {
      if (camara && Platform.OS !== 'web') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return toast('Necesitamos permiso de cámara para grabar', 'error');
      }
      const opts = { mediaTypes: ['videos'], videoMaxDuration: MAX_SEG, quality: 1 };
      const res = camara ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      if (asset.duration && asset.duration > (MAX_SEG + 5) * 1000) {
        return toast(`El video debe durar máximo ${MAX_SEG} segundos`, 'error');
      }
      setVideo(asset);
    } catch (e) {
      toast(`No se pudo abrir la ${camara ? 'cámara' : 'galería'}: ${e.message}`, 'error');
    }
  };

  const enviar = async () => {
    setSending(true);
    try {
      await api.uploadVideo(video, sena.id, nota.trim());
      toast('✓ Video enviado. Un superusuario lo revisará.');
      navigation.replace('MisVideos');
    } catch (e) {
      toast(e.message, 'error');
      setSending(false);
    }
  };

  // Paso 1: elegir la seña
  if (!sena) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <BackHeader title="Grabar seña" />
          <Text style={[font.small, { marginBottom: 10 }]}>Paso 1 de 2 · Elige la seña que vas a grabar</Text>
          <SearchBar value={q} onChangeText={setQ} />
        </View>
        {!senas ? (
          <Loading />
        ) : (
          <FlatList
            data={senas}
            keyExtractor={(s) => String(s.id)}
            contentContainerStyle={[styles.pad, { paddingTop: 12, paddingBottom: 24 }]}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <SenaRow
                sena={item}
                subtitle={`${item.categoria} · ${item.videoUrl ? '🎬 ya tiene video' : 'sin video'}`}
                onPress={() => setSena(item)}
              />
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // Paso 2: grabar, revisar y enviar
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pad}>
        <BackHeader title="Grabar seña" />
      </View>
      <ScrollView contentContainerStyle={[styles.pad, { paddingBottom: 32 }]} keyboardShouldPersistTaps="handled">
        <Text style={[font.small, { marginBottom: 10 }]}>Paso 2 de 2 · Graba y envía a revisión</Text>

        <View style={styles.senaCard}>
          <Thumb icono={sena.icono} categoria={sena.categoria} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={font.title}>{sena.nombre}</Text>
            <Text style={font.small} numberOfLines={2}>
              {sena.descripcion}
            </Text>
          </View>
          {!route.params?.sena ? (
            <Text style={styles.change} onPress={() => setSena(null)}>
              Cambiar
            </Text>
          ) : null}
        </View>

        {!video ? (
          <View style={styles.tips}>
            <Text style={[font.title, { marginBottom: 6 }]}>Consejos para grabar</Text>
            <Text style={styles.tip}>💡 Buena luz de frente, sin contraluz</Text>
            <Text style={styles.tip}>🧱 Fondo liso y de un solo color</Text>
            <Text style={styles.tip}>🧍 Encuadre de la cintura a la cabeza; se deben ver manos y rostro</Text>
            <Text style={styles.tip}>⏱️ Máximo {MAX_SEG} segundos; repite la seña 2 veces</Text>
          </View>
        ) : (
          <VideoBox key={video.uri} url={video.uri} height={300} style={{ marginBottom: 14 }} />
        )}

        <Button title={video ? '🎥  Grabar de nuevo' : '🎥  Grabar con la cámara'} onPress={() => elegir(true)} variant={video ? 'outline' : 'primary'} />
        <Button title="📁  Elegir de la galería" variant="outline" onPress={() => elegir(false)} style={{ marginTop: 10 }} />

        {video ? (
          <>
            <Text style={[styles.label, { marginTop: 18 }]}>Nota para el revisor (opcional)</Text>
            <TextInput
              value={nota}
              onChangeText={(t) => setNota(t.slice(0, 280))}
              placeholder="Ej. Grabado por una persona sorda de la asociación local"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              accessibilityLabel="Nota para el revisor"
            />
            <Button title="Enviar a revisión" onPress={enviar} loading={sending} style={{ marginTop: 14 }} />
            {sending ? <Text style={[font.small, { textAlign: 'center', marginTop: 8 }]}>Subiendo video… puede tardar un poco</Text> : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 20 },
  senaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 14, ...shadow },
  change: { color: colors.primary, fontWeight: '700', padding: 6 },
  tips: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 16, marginBottom: 16 },
  tip: { fontSize: 14, color: colors.text, marginTop: 4, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  input: {
    minHeight: 80,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
