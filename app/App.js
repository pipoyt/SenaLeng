import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplash from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';

ExpoSplash.preventAutoHideAsync().catch(() => {});

const SPLASH_MS = 1600;

function Root() {
  const { ready } = useAuth();
  const [minTime, setMinTime] = useState(false);

  useEffect(() => {
    ExpoSplash.hideAsync().catch(() => {});
    const t = setTimeout(() => setMinTime(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // El splash se muestra mientras se carga la sesión guardada (mínimo 1.6 s).
  if (!ready || !minTime) return <SplashScreen />;
  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
