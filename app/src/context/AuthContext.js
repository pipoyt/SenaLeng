import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, loadApiUrl, setSession, setUnauthorizedHandler } from '../api/client';
import { hasRole } from '../roles';

const SESSION_KEY = '@senaleng/session';
const AuthContext = createContext(null);

/**
 * Sesión del usuario: token JWT + datos del usuario.
 * Se guarda en el dispositivo para no pedir la contraseña cada vez.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const saveSession = useCallback(async (token, usuario) => {
    setSession(token, usuario?.id);
    setUser(usuario);
    try {
      if (token) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token, usuario }));
      else await AsyncStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  const logout = useCallback(() => saveSession(null, null), [saveSession]);

  // Al abrir la app: URL de la API + sesión guardada (se valida con /auth/me).
  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    (async () => {
      await loadApiUrl();
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const { token, usuario } = JSON.parse(raw);
          setSession(token, usuario.id);
          setUser(usuario);
          // Actualiza el rol por si un superusuario lo cambió (si no hay red, se usa el guardado).
          api
            .me()
            .then((r) => saveSession(token, r.data))
            .catch(() => {});
        }
      } catch {}
      setReady(true);
    })();
  }, [logout, saveSession]);

  const login = useCallback(
    async (correo, password) => {
      const { data } = await api.login(correo.trim(), password);
      await saveSession(data.token, data.usuario);
      return data.usuario;
    },
    [saveSession],
  );

  const registro = useCallback(
    async (nombre, correo, password) => {
      const { data } = await api.registro(nombre.trim(), correo.trim(), password);
      await saveSession(data.token, data.usuario);
      return data.usuario;
    },
    [saveSession],
  );

  const refreshMe = useCallback(async () => {
    const raw = await AsyncStorage.getItem(SESSION_KEY).catch(() => null);
    const token = raw ? JSON.parse(raw).token : null;
    const { data } = await api.me();
    await saveSession(token, data);
    return data;
  }, [saveSession]);

  const value = useMemo(
    () => ({ user, ready, login, registro, logout, refreshMe, can: (min) => hasRole(user, min) }),
    [user, ready, login, registro, logout, refreshMe],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
