import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { colors, radius } from '../theme';
import BottomSheet from './BottomSheet';
import Button from './Button';

const MAX = 280;

/** Editar el comentario personal de un favorito (Figura 8, operación UPDATE). */
export default function CommentSheet({ visible, sena, initial = '', loading, onSave, onCancel }) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (visible) setText(initial || '');
  }, [visible, initial]);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <Text style={styles.title}>Editar favorito</Text>
      <Text style={styles.sub}>
        {sena?.icono} {sena?.nombre} · {sena?.categoria}
      </Text>
      <Text style={styles.label}>Comentario personal (opcional)</Text>
      <TextInput
        value={text}
        onChangeText={(t) => setText(t.slice(0, MAX))}
        placeholder="Ej. Practicar con mi hermano"
        placeholderTextColor={colors.muted}
        style={styles.input}
        multiline
        autoFocus
        accessibilityLabel="Comentario personal"
      />
      <Text style={styles.counter}>
        {text.length}/{MAX}
      </Text>
      <Button title="Guardar cambios" onPress={() => onSave(text)} loading={loading} />
      <Button title="Cancelar" variant="outline" onPress={onCancel} style={{ marginTop: 12 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
    backgroundColor: colors.background,
  },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: colors.muted, marginTop: 6, marginBottom: 14 },
});
