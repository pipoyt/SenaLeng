import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import useLayout from '../hooks/useLayout';

/** Hoja inferior con fondo oscurecido (estilo del wireframe "Eliminar de favoritos"). */
export default function BottomSheet({ visible, onClose, children }) {
  const { wide } = useLayout();
  // En computadora se muestra como ventana centrada; en celular, como hoja inferior.
  if (wide) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.center}>
          <Pressable style={[StyleSheet.absoluteFill, styles.backdropColor]} onPress={onClose} accessibilityLabel="Cerrar" />
          <View style={styles.dialog}>{children}</View>
        </View>
      </Modal>
    );
  }
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={styles.sheet}>{children}</View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30,27,58,0.45)' },
  backdropColor: { backgroundColor: 'rgba(30,27,58,0.45)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 480, maxHeight: '90%', backgroundColor: colors.card, borderRadius: 24, padding: 28, boxShadow: '0 20px 60px rgba(30,27,58,0.25)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
});
