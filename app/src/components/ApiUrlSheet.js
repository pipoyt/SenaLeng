import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { api, getApiUrl, setApiUrl } from '../api/client';
import { colors } from '../theme';
import BottomSheet from './BottomSheet';
import Button from './Button';
import TextField from './TextField';

/** Configurar la dirección de la API (útil cuando cambia la IP de la computadora). */
export default function ApiUrlSheet({ visible, onClose }) {
  const [url, setUrl] = useState(getApiUrl());
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (visible) {
      setUrl(getApiUrl());
      setStatus(null);
    }
  }, [visible]);

  const probar = async () => {
    setTesting(true);
    await setApiUrl(url);
    try {
      await api.health();
      setStatus('ok');
    } catch (e) {
      setStatus(e.message);
    } finally {
      setTesting(false);
    }
  };

  const restablecer = async () => {
    setUrl(await setApiUrl(null));
    setStatus(null);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Conexión con la API</Text>
      <Text style={styles.sub}>En Expo Go usa la IP de tu computadora, por ejemplo http://192.168.1.100:3000/api</Text>
      <TextField value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" label="URL de la API" />
      {status ? (
        <Text style={{ color: status === 'ok' ? colors.success : colors.danger, marginBottom: 10, fontWeight: '600' }}>
          {status === 'ok' ? '● Conectado' : `● ${status}`}
        </Text>
      ) : null}
      <Button title="Guardar y probar conexión" onPress={probar} loading={testing} />
      <Button title="Restablecer valor por defecto" variant="outline" onPress={restablecer} style={{ marginTop: 10 }} />
      <Button title="Cerrar" variant="outline" onPress={onClose} style={{ marginTop: 10 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 14 },
});
