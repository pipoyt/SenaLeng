import { StyleSheet, View } from 'react-native';
import { resolveMediaUrl } from '../api/client';
import { radius } from '../theme';

/**
 * Versión web del reproductor: usa la etiqueta <video> del navegador, que respeta
 * la orientación de los videos grabados con el celular y siempre muestra controles.
 * (En Android/iOS se usa VideoBox.js con expo-video.)
 */
export default function VideoBox({ url, autoPlay = false, loop = true, height = 260, style }) {
  return (
    <View style={[styles.box, { height }, style]}>
      <video
        src={resolveMediaUrl(url)}
        controls
        playsInline
        loop={loop}
        autoPlay={autoPlay}
        muted={autoPlay}
        preload="metadata"
        style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000', display: 'block' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#000', borderRadius: radius.lg, overflow: 'hidden' },
});
