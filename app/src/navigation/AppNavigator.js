import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SenasListScreen from '../screens/SenasListScreen';
import SenaDetailScreen from '../screens/SenaDetailScreen';
import FavoritosScreen from '../screens/FavoritosScreen';
import AgregarFavoritosScreen from '../screens/AgregarFavoritosScreen';
import SenaFormScreen from '../screens/SenaFormScreen';
import PerfilScreen from '../screens/PerfilScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ICONS = { Inicio: '🏠', Señas: '📖', Favoritos: '⭐', Perfil: '👤' };

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary } };

function Tabs() {
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
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

/**
 * Navegación:
 *  Stack raíz
 *   ├─ Main (pestañas: Inicio · Señas · Favoritos · Perfil)
 *   ├─ Detalle            (Figura 5)
 *   ├─ AgregarFavoritos   (Figura 7)
 *   └─ SenaForm           (crear / editar seña)
 */
export default function AppNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="Main" component={Tabs} />
        <Stack.Screen name="Detalle" component={SenaDetailScreen} />
        <Stack.Screen name="AgregarFavoritos" component={AgregarFavoritosScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="SenaForm" component={SenaFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
