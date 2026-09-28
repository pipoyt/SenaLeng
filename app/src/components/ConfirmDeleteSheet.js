import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import BottomSheet from './BottomSheet';
import Button from './Button';
import SenaRow from './SenaRow';

/** Confirmación de eliminación (Figura 6 del documento). */
export default function ConfirmDeleteSheet({
  visible,
  sena,
  title = '¿Eliminar esta seña de tus favoritos?',
  message = 'Se quitará de tu lista de favoritos, pero podrás volver a agregarla cuando quieras.',
  loading,
  onConfirm,
  onCancel,
}) {
  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <View style={styles.iconBox}>
        <Text style={{ fontSize: 26 }}>🗑️</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.msg}>{message}</Text>
      {sena ? (
        <View style={styles.preview}>
          <SenaRow sena={sena} subtitle={sena.categoria} right={null} />
        </View>
      ) : null}
      <Button title="Eliminar" variant="danger" onPress={onConfirm} loading={loading} />
      <Button title="Cancelar" variant="outline" onPress={onCancel} style={{ marginTop: 12 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  msg: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 10, marginBottom: 18, lineHeight: 20 },
  preview: { backgroundColor: colors.background, borderRadius: 18, padding: 6, paddingBottom: 0, marginBottom: 18 },
});
