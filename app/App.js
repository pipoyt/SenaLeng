import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplash from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadApiUrl } from './src/api/client';
import { AppDataProvider } from './src/context/AppDataContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';

ExpoSplash.preventAutoHideAsync().catch(() => {});

const SPLASH_MS = 1600;

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ExpoSplash.hideAsync().catch(() => {});
    // Cargamos la URL de la API guardada mientras se muestra el splash.
    Promise.all([loadApiUrl(), new Promise((r) => setTimeout(r, SPLASH_MS))]).finally(() => setReady(true));
  }, []);

  return (
    <SafeAreaProvider>
      {ready ? (
        <ToastProvider>
          <AppDataProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </AppDataProvider>
        </ToastProvider>
      ) : (
        <SplashScreen />
      )}
    </SafeAreaProvider>
  );
}
