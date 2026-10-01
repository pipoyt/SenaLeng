import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
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

// En la computadora (web) la app se muestra en una columna centrada, como en el celular.
const isWeb = Platform.OS === 'web';
const outer = { flex: 1, backgroundColor: isWeb ? '#E9E5FB' : '#F5F3FF' };
const frame = isWeb
  ? { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: '#F5F3FF', boxShadow: '0 0 40px rgba(76,63,181,0.12)' }
  : { flex: 1 };

export default function App() {
  return (
    <View style={outer}>
      <View style={frame}>
        <SafeAreaProvider>
          <ToastProvider>
            <AuthProvider>
              <Root />
            </AuthProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </View>
    </View>
  );
}
