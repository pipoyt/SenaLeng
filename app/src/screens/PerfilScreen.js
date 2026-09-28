import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api, getApiUrl, setApiUrl } from '../api/client';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import ScreenHeader from '../components/ScreenHeader';
import Button from '../components/Button';
import { colors, font, radius, shadow } from '../theme';

/** Perfil: progreso del usuario (GET /usuarios/:id/progreso) y configuración de la API. */
export default function PerfilScreen() {
  const { progreso, refreshProgreso, refreshFavoritos, favoritos } = useAppData();
  const [url, setUrl] = useState(getApiUrl());
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const toast = useToast();

  useFocusEffect(
    useCallback(() => {
      refreshProgreso().catch(() => {});
    }, [refreshProgreso]),
  );

  const probar = async () => {
    setTesting(true);
    await setApiUrl(url);
    try {
      await api.health();
      setStatus('ok');
      toast('✓ Conectado con la API');
      refreshFavoritos().catch(() => {});
      refreshProgreso().catch(() => {});
    } catch (e) {
      setStatus('error');
      toast(e.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  const restablecer = async () => {
    const def = await setApiUrl(null);
    setUrl(def);
    setStatus(null);
  };

  const pct = progreso?.porcentaje ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Perfil" />

        <View style={styles.card}>
          <View style={styles.userRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <View style={{ flex: 1 }}>
              <Text style={font.title}>Invitado</Text>
              <Text style={font.small}>{favoritos.length} favoritos · {progreso?.totalAprendidas ?? 0} señas aprendidas</Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <Text style={font.small}>Progreso general</Text>
            <Text style={[font.small, { fontWeight: '700' }]}>{pct}%</Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        </View>

        {progreso ? (
          <View style={styles.card}>
            <Text style={[font.title, { marginBottom: 10 }]}>Avance por categoría</Text>
            {Object.entries(progreso.porCategoria).map(([cat, v]) => {
              const p = v.total ? Math.round((v.aprendidas / v.total) * 100) : 0;
              return (
                <View key={cat} style={{ marginBottom: 10 }}>
                  <View style={styles.progressRow}>
                    <Text style={font.body}>{cat}</Text>
                    <Text style={font.small}>
                      {v.aprendidas}/{v.total}
                    </Text>
                  </View>
                  <View style={styles.bar}>
                    <View style={[styles.fill, { width: `${p}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={font.title}>Conexión con la API</Text>
          <Text style={[font.small, { marginVertical: 6 }]}>
            En Expo Go usa la IP de tu computadora, por ejemplo http://192.168.1.100:3000/api
          </Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
            accessibilityLabel="URL de la API"
          />
          {status ? (
            <Text style={{ color: status === 'ok' ? colors.success : colors.danger, marginBottom: 8, fontWeight: '600' }}>
              {status === 'ok' ? '● Conectado' : '● Sin conexión'}
            </Text>
          ) : null}
          <Button title="Guardar y probar conexión" onPress={probar} loading={testing} />
          <Button title="Restablecer valor por defecto" variant="outline" onPress={restablecer} style={{ marginTop: 10 }} />
        </View>

        <Text style={styles.about}>
          SeñaLeng v1.0.0 · Proyecto integrador Unidad I{'\n'}Aplicaciones Web Progresivas · IDGS-10A · UTA
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  logo: { width: 56, height: 56, borderRadius: 28 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    marginVertical: 8,
  },
  about: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 8, lineHeight: 18 },
});
