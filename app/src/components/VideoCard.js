import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow } from '../theme';
import Thumb from './Thumb';
import VideoBox from './VideoBox';

export const ESTADO_INFO = {
  pendiente: { label: '⏳ Pendiente', color: '#8A6100', bg: '#FFF4D6' },
  aprobado: { label: '✓ Aprobado', color: '#12704A', bg: '#E3F6EC' },
  rechazado: { label: '✕ Rechazado', color: '#B42318', bg: '#FDECEC' },
  reemplazado: { label: '↺ Reemplazado', color: '#57534E', bg: '#EFEDEA' },
};

const fecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

/** Tarjeta de un video enviado: seña, estado, autor, notas y reproductor desplegable. */
export default function VideoCard({ video, showAutor, children }) {
  const [open, setOpen] = useState(false);
  const est = ESTADO_INFO[video.estado];
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Thumb icono={video.sena?.icono} categoria={video.sena?.categoria} size={44} />
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={font.title}>{video.sena?.nombre || 'Seña eliminada'}</Text>
          <Text style={font.small}>
            {showAutor ? `Por ${video.autor?.nombre || '—'} · ` : ''}
            {fecha(video.fechaEnvio)}
          </Text>
        </View>
        <Text style={[styles.badge, { color: est.color, backgroundColor: est.bg }]}>{est.label}</Text>
      </View>

      {video.nota ? <Text style={styles.nota}>📝 {video.nota}</Text> : null}
      {video.comentarioRevision ? (
        <Text style={[styles.nota, { backgroundColor: est.bg, color: est.color }]}>
          💬 {video.revisor?.nombre ? `${video.revisor.nombre}: ` : ''}
          {video.comentarioRevision}
        </Text>
      ) : null}

      {open ? <VideoBox url={video.url} height={240} autoPlay style={{ marginTop: 12 }} /> : null}
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.toggle} accessibilityRole="button">
        <Text style={styles.toggleText}>{open ? 'Ocultar video' : '▶  Ver video'}</Text>
      </Pressable>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 12, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: { fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  nota: { marginTop: 10, fontSize: 13, color: colors.text, backgroundColor: colors.background, padding: 10, borderRadius: 10 },
  toggle: { marginTop: 10, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: colors.primarySoft },
  toggleText: { color: colors.primary, fontWeight: '700' },
});
