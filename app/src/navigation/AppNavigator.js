import { Text, View } from 'react-native';
import { useState } from 'react';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { AppDataProvider, useAppData } from '../context/AppDataContext';
import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import HomeScreen from '../screens/HomeScreen';
import SenasListScreen from '../screens/SenasListScreen';
import SenaDetailScreen from '../screens/SenaDetailScreen';
import VideoScreen from '../screens/VideoScreen';
import FavoritosScreen from '../screens/FavoritosScreen';
import AgregarFavoritosScreen from '../screens/AgregarFavoritosScreen';
import SenaFormScreen from '../screens/SenaFormScreen';
import PerfilScreen from '../screens/PerfilScreen';
import GrabarVideoScreen from '../screens/GrabarVideoScreen';
import MisVideosScreen from '../screens/MisVideosScreen';
import RevisarVideosScreen from '../screens/RevisarVideosScreen';
import UsuariosScreen from '../screens/UsuariosScreen';
import EstadisticasScreen from '../screens/EstadisticasScreen';
import Sidebar from '../components/Sidebar';
import useLayout from '../hooks/useLayout';
import { colors } from '../theme';

/**
 * En pantallas anchas centra el contenido de cada pantalla con un ancho máximo,
 * para que en la computadora no se estire de orilla a orilla.
 */
function page(Screen, maxWidth = 1120) {
  function Page(props) {
    const { wide } = useLayout();
    if (!wide) return <Screen {...props} />;
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, width: '100%', maxWidth, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 12 }}>
          <Screen {...props} />
        </View>
      </View>
    );
  }
  Page.displayName = `Page(${Screen.name})`;
  return Page;
}

const S = {
  Home: page(HomeScreen),
  Senas: page(SenasListScreen),
  Favoritos: page(FavoritosScreen),
  Perfil: page(PerfilScreen, 860),
  Detalle: page(SenaDetailScreen, 860),
  Video: page(VideoScreen, 900),
  AgregarFavoritos: page(AgregarFavoritosScreen, 860),
  SenaForm: page(SenaFormScreen, 760),
  GrabarVideo: page(GrabarVideoScreen, 760),
  MisVideos: page(MisVideosScreen, 900),
  RevisarVideos: page(RevisarVideosScreen, 960),
  Usuarios: page(UsuariosScreen, 900),
  Estadisticas: page(EstadisticasScreen),
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ICONS = { Inicio: '🏠', Señas: '📖', Favoritos: '⭐', Perfil: '👤' };
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary } };
const screenOptions = { headerShown: false, contentStyle: { backgroundColor: colors.background } };

function Tabs() {
  const { pendientes } = useAppData();
  const { wide } = useLayout();
  return (
    <Tab.Navigator
      // En computadora las pestañas se ocultan: se usa el menú lateral (Sidebar).
      tabBar={wide ? () => null : undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { borderTopColor: colors.border, height: 64, paddingTop: 6 },
        tabBarIcon: ({ focused }) => <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Inicio" component={S.Home} />
      <Tab.Screen name="Señas" component={S.Senas} />
      <Tab.Screen name="Favoritos" component={S.Favoritos} />
      {/* El número rojo avisa a los superusuarios que hay videos por aprobar */}
      <Tab.Screen name="Perfil" component={S.Perfil} options={{ tabBarBadge: pendientes || undefined }} />
    </Tab.Navigator>
  );
}

/**
 * Navegación:
 *  Sin sesión → Login · Registro
 *  Con sesión → Stack raíz
 *   ├─ Main (pestañas: Inicio · Señas · Favoritos · Perfil)
 *   ├─ Detalle · Video · AgregarFavoritos · SenaForm
 *   ├─ GrabarVideo · MisVideos                 (admin+)
 *   ├─ RevisarVideos · Usuarios                (superusuario+)
 *   └─ Estadisticas                            (solo principal)
 */
const navRef = createNavigationContainerRef();

/** En computadora: menú lateral fijo a la izquierda + la pantalla actual a la derecha. */
function Shell({ current, children }) {
  const { wide } = useLayout();
  if (!wide) return children;
  const onNavigate = (name, isTab) => {
    if (!navRef.isReady()) return;
    if (isTab) navRef.navigate('Main', { screen: name });
    else navRef.navigate(name);
  };
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      <Sidebar current={current} onNavigate={onNavigate} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export default function AppNavigator() {
  const { user, can } = useAuth();
  const [current, setCurrent] = useState('Inicio');
  const track = () => setCurrent(navRef.getCurrentRoute()?.name);

  return (
    <NavigationContainer theme={theme} ref={navRef} onReady={track} onStateChange={track}>
      {!user ? (
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegistroScreen} />
        </Stack.Navigator>
      ) : (
        // key: al cambiar de usuario se reinicia todo el estado (favoritos, progreso...)
        <AppDataProvider key={user.id}>
          <Shell current={current}>
          <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="Main" component={Tabs} />
            <Stack.Screen name="Detalle" component={S.Detalle} />
            <Stack.Screen name="Video" component={S.Video} />
            <Stack.Screen name="AgregarFavoritos" component={S.AgregarFavoritos} options={{ presentation: 'modal' }} />
            {can('admin') ? (
              <>
                <Stack.Screen name="SenaForm" component={S.SenaForm} />
                <Stack.Screen name="GrabarVideo" component={S.GrabarVideo} />
                <Stack.Screen name="MisVideos" component={S.MisVideos} />
              </>
            ) : null}
            {can('superusuario') ? (
              <>
                <Stack.Screen name="RevisarVideos" component={S.RevisarVideos} />
                <Stack.Screen name="Usuarios" component={S.Usuarios} />
              </>
            ) : null}
            {can('principal') ? <Stack.Screen name="Estadisticas" component={S.Estadisticas} /> : null}
          </Stack.Navigator>
          </Shell>
        </AppDataProvider>
      )}
    </NavigationContainer>
  );
}
