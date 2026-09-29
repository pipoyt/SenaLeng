import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
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
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ICONS = { Inicio: '🏠', Señas: '📖', Favoritos: '⭐', Perfil: '👤' };
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary } };
const screenOptions = { headerShown: false, contentStyle: { backgroundColor: colors.background } };

function Tabs() {
  const { pendientes } = useAppData();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { borderTopColor: colors.border, height: 64, paddingTop: 6 },
        tabBarIcon: ({ focused }) => <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Señas" component={SenasListScreen} />
      <Tab.Screen name="Favoritos" component={FavoritosScreen} />
      {/* El número rojo avisa a los superusuarios que hay videos por aprobar */}
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ tabBarBadge: pendientes || undefined }} />
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
export default function AppNavigator() {
  const { user, can } = useAuth();

  return (
    <NavigationContainer theme={theme}>
      {!user ? (
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegistroScreen} />
        </Stack.Navigator>
      ) : (
        // key: al cambiar de usuario se reinicia todo el estado (favoritos, progreso...)
        <AppDataProvider key={user.id}>
          <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="Main" component={Tabs} />
            <Stack.Screen name="Detalle" component={SenaDetailScreen} />
            <Stack.Screen name="Video" component={VideoScreen} />
            <Stack.Screen name="AgregarFavoritos" component={AgregarFavoritosScreen} options={{ presentation: 'modal' }} />
            {can('admin') ? (
              <>
                <Stack.Screen name="SenaForm" component={SenaFormScreen} />
                <Stack.Screen name="GrabarVideo" component={GrabarVideoScreen} />
                <Stack.Screen name="MisVideos" component={MisVideosScreen} />
              </>
            ) : null}
            {can('superusuario') ? (
              <>
                <Stack.Screen name="RevisarVideos" component={RevisarVideosScreen} />
                <Stack.Screen name="Usuarios" component={UsuariosScreen} />
              </>
            ) : null}
            {can('principal') ? <Stack.Screen name="Estadisticas" component={EstadisticasScreen} /> : null}
          </Stack.Navigator>
        </AppDataProvider>
      )}
    </NavigationContainer>
  );
}
