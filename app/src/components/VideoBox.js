import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { resolveMediaUrl } from '../api/client';
import { radius } from '../theme';

/**
 * Reproductor de video (expo-video). Usa key={url} en el padre si la URL puede cambiar.
 */
export default function VideoBox({ url, autoPlay = false, loop = true, height = 260, style }) {
  const player = useVideoPlayer(resolveMediaUrl(url), (p) => {
    p.loop = loop;
    if (autoPlay) p.play();
  });
  return (
    <View style={[styles.box, { height }, style]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#000', borderRadius: radius.lg, overflow: 'hidden' },
});
