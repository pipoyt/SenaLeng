import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { colors, radius, shadow } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registro local con correo y contraseña (sin verificación por correo).
 * Toda cuenta nueva empieza con rol "usuario"; un superusuario puede subirla a admin.
 */
export default function RegistroScreen({ navigation }) {
  const { registro } = useAuth();
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', confirmar: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const validar = () => {
    const e = {};
    if (form.nombre.trim().length < 2) e.nombre = 'Escribe tu nombre';
    if (!EMAIL_RE.test(form.correo.trim())) e.correo = 'Correo no válido';
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) e.password = 'Debe incluir letras y números';
    if (form.confirmar !== form.password) e.confirmar = 'Las contraseñas no coinciden';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const crear = async () => {
    if (!validar()) return;
    setError(null);
    setLoading(true);
    try {
      await registro(form.nombre, form.correo, form.password);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <View style={styles.bg}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.brand}>Crea tu cuenta</Text>
            <Text style={styles.tag}>Guarda tus favoritos y tu progreso en cualquier dispositivo</Text>
            <View style={styles.card}>
              <TextField label="Nombre" value={form.nombre} onChangeText={set('nombre')} placeholder="Ej. Ana López" error={errors.nombre} autoComplete="name" />
              <TextField
                label="Correo"
                value={form.correo}
                onChangeText={set('correo')}
                placeholder="tu@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.correo}
              />
              <TextField
                label="Contraseña"
                value={form.password}
                onChangeText={set('password')}
                placeholder="Mínimo 8, con letras y números"
                secure
                autoCapitalize="none"
                error={errors.password}
              />
              <TextField
                label="Confirmar contraseña"
                value={form.confirmar}
                onChangeText={set('confirmar')}
                placeholder="Repite la contraseña"
                secure
                autoCapitalize="none"
                error={errors.confirmar}
                onSubmitEditing={crear}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title="Crear cuenta" onPress={crear} loading={loading} />
              <Pressable onPress={() => navigation.goBack()} style={styles.link} accessibilityRole="link">
                <Text style={styles.linkText}>
                  ¿Ya tienes cuenta? <Text style={{ color: colors.primary, fontWeight: '800' }}>Inicia sesión</Text>
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  brand: { fontSize: 28, fontWeight: '800', color: colors.white, textAlign: 'center' },
  tag: { fontSize: 14, color: '#E4E0FF', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg + 4, padding: 22, ...shadow },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '600' },
  link: { alignItems: 'center', marginTop: 16 },
  linkText: { color: colors.muted, fontSize: 14 },
});
