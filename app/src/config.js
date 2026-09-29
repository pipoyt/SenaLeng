import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PORT = 3000;

/**
 * Determina la URL base de la API:
 * 1. Variable de entorno EXPO_PUBLIC_API_URL (archivo .env), si existe.
 * 2. En web: http://localhost:3000/api
 * 3. En Expo Go: usa la misma IP de la computadora que sirve el proyecto
 *    (Constants.expoConfig.hostUri = "192.168.x.x:8081").
 * 4. Emulador Android sin hostUri: 10.0.2.2 apunta al localhost del PC.
 * El usuario puede cambiarla desde la pestaña Perfil (se guarda en el dispositivo).
 */
export function getDefaultApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  if (Platform.OS === 'web') return `http://localhost:${PORT}/api`;

  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${PORT}/api`;

  return Platform.OS === 'android' ? `http://10.0.2.2:${PORT}/api` : `http://localhost:${PORT}/api`;
}

