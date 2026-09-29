import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import TextField from '../components/TextField';
import Button from '../components/Button';
import ApiUrlSheet from '../components/ApiUrlSheet';
import { colors, radius, shadow } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Inicio de sesión con correo y contraseña. */
export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [server, setServer] = useState(false);

  const entrar = async () => {
    if (!EMAIL_RE.test(correo.trim())) return setError('Escribe un correo válido');
    if (!password) return setError('Escribe tu contraseña');
    setError(null);
    setLoading(true);
    try {
      await login(correo, password);
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
            <View style={styles.hero}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} accessibilityLabel="Logo SeñaLeng" />
              <Text style={styles.brand}>SeñaLeng</Text>
              <Text style={styles.tag}>Aprende Lengua de Señas Mexicana</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Iniciar sesión</Text>
              <TextField
                label="Correo"
                value={correo}
                onChangeText={setCorreo}
                placeholder="tu@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              <TextField
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secure
                autoCapitalize="none"
                autoComplete="password"
                onSubmitEditing={entrar}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title="Entrar" onPress={entrar} loading={loading} />
              <Pressable onPress={() => navigation.navigate('Registro')} style={styles.link} accessibilityRole="link">
                <Text style={styles.linkText}>
                  ¿No tienes cuenta? <Text style={{ color: colors.primary, fontWeight: '800' }}>Regístrate</Text>
                </Text>
              </Pressable>
            </View>

            <Pressable onPress={() => setServer(true)} style={styles.server} accessibilityRole="button">
              <Text style={styles.serverText}>⚙ Configurar servidor</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <ApiUrlSheet visible={server} onClose={() => setServer(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  hero: { alignItems: 'center', marginBottom: 22 },
  logo: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  brand: { fontSize: 32, fontWeight: '800', color: colors.white, marginTop: 10 },
  tag: { fontSize: 14, color: '#E4E0FF', marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg + 4, padding: 22, ...shadow },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 16 },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '600' },
  link: { alignItems: 'center', marginTop: 16 },
  linkText: { color: colors.muted, fontSize: 14 },
  server: { alignSelf: 'center', marginTop: 18, padding: 8 },
  serverText: { color: '#E4E0FF', fontSize: 13, fontWeight: '600' },
});
