import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { useCategoriaOptions } from '../hooks/useSenas';
import { useToast } from '../context/ToastContext';
import BackHeader from '../components/BackHeader';
import Button from '../components/Button';
import Chips from '../components/Chips';
import { colors, radius } from '../theme';

const NIVELES = ['Básico', 'Intermedio', 'Avanzado'];
const URL_RE = /^https?:\/\/\S+$/i;

/**
 * Formulario de la entidad Seña: CREATE (POST /senas) y UPDATE (PUT /senas/:id).
 * Replica las validaciones del servidor para dar retroalimentación inmediata.
 */
export default function SenaFormScreen({ route, navigation }) {
  const editing = route.params?.sena;
  const [form, setForm] = useState({
    nombre: editing?.nombre || '',
    categoria: editing?.categoria || '',
    descripcion: editing?.descripcion || '',
    nivel: editing?.nivel || 'Básico',
    icono: editing?.icono || '🤟',
    videoUrl: editing?.videoUrl || '',
    imagenUrl: editing?.imagenUrl || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [options] = useCategoriaOptions();
  const toast = useToast();

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (form.nombre.length > 80) e.nombre = 'Máximo 80 caracteres';
    if (!form.categoria.trim()) e.categoria = 'La categoría es obligatoria';
    if (!form.descripcion.trim()) e.descripcion = 'Describe cómo se realiza la seña';
    if (form.videoUrl && !URL_RE.test(form.videoUrl)) e.videoUrl = 'Debe iniciar con http:// o https://';
    if (form.imagenUrl && !URL_RE.test(form.imagenUrl)) e.imagenUrl = 'Debe iniciar con http:// o https://';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async () => {
    if (!validate()) return;
    const body = {
      ...form,
      nombre: form.nombre.trim(),
      categoria: form.categoria.trim(),
      descripcion: form.descripcion.trim(),
      videoUrl: form.videoUrl.trim() || null,
      imagenUrl: form.imagenUrl.trim() || null,
    };
    try {
      setSaving(true);
      if (editing) {
        await api.updateSena(editing.id, body);
        toast('✓ Seña actualizada');
      } else {
        const { data } = await api.createSena(body);
        toast(`✓ Seña "${data.nombre}" creada`);
      }
      navigation.goBack();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, k, multiline, placeholder, keyboardType, autoCapitalize }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={form[k]}
        onChangeText={set(k)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && { minHeight: 100, textAlignVertical: 'top' }, errors[k] && { borderColor: colors.danger }]}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={label}
      />
      {errors[k] ? <Text style={styles.error}>{errors[k]}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: 20 }}>
          <BackHeader title={editing ? 'Editar seña' : 'Nueva seña'} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Se llaman como funciones para no perder el foco del teclado entre renders */}
          {Field({ label: 'Nombre *', k: 'nombre', placeholder: 'Ej. Abuela' })}

          <Text style={styles.label}>Categoría *</Text>
          <Chips options={options.filter((o) => o.value)} value={form.categoria} onChange={set('categoria')} />
          {Field({ label: 'O escribe una nueva categoría', k: 'categoria', placeholder: 'Ej. Colores' })}

          <Text style={styles.label}>Nivel *</Text>
          <View style={styles.segment}>
            {NIVELES.map((n) => (
              <Pressable
                key={n}
                onPress={() => set('nivel')(n)}
                style={[styles.segItem, form.nivel === n && styles.segOn]}
                accessibilityRole="radio"
                accessibilityState={{ checked: form.nivel === n }}
              >
                <Text style={[styles.segText, form.nivel === n && { color: colors.white }]}>{n}</Text>
              </Pressable>
            ))}
          </View>

          {Field({ label: 'Descripción (cómo se realiza) *', k: 'descripcion', multiline: true, placeholder: 'Posición de la mano, movimiento y expresión facial...' })}
          {Field({ label: 'Ícono (emoji)', k: 'icono', placeholder: '🤟' })}
          {Field({ label: 'URL del video', k: 'videoUrl', placeholder: 'https://...', keyboardType: 'url', autoCapitalize: 'none' })}
          {Field({ label: 'URL de la imagen', k: 'imagenUrl', placeholder: 'https://...', keyboardType: 'url', autoCapitalize: 'none' })}

          <Button title={editing ? 'Guardar cambios' : 'Crear seña'} onPress={save} loading={saving} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 4, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, padding: 4, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  segItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  segOn: { backgroundColor: colors.primary },
  segText: { fontWeight: '700', color: colors.primary },
});
