import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import VideoBox from '../components/VideoBox';
import { colors, font } from '../theme';

/** Reproductor del video oficial (aprobado) de una seña. */
export default function VideoScreen({ route }) {
  const { sena } = route.params;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pad}>
        <BackHeader title={`${sena.icono} ${sena.nombre}`} />
        <VideoBox url={sena.videoUrl} autoPlay height={420} />
        <Text style={[font.small, { marginTop: 14 }]}>Cómo se realiza</Text>
        <Text style={[font.body, { marginTop: 4, lineHeight: 21 }]}>{sena.descripcion}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 20 },
});
