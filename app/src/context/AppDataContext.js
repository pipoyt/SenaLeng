import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const AppDataContext = createContext(null);

/**
 * Estado global compartido entre pantallas:
 *  - favoritos del usuario (para marcar ♥ en cualquier lista)
 *  - progreso de aprendizaje
 * Todas las operaciones llaman a la API y después actualizan el estado local.
 */
export function AppDataProvider({ children }) {
  const { user, can } = useAuth();
  const USER_ID = user.id;
  const esSuper = can('superusuario');
  const [favoritos, setFavoritos] = useState([]);
  const [pendientes, setPendientes] = useState(0);
  const [progreso, setProgreso] = useState(null);
  const [offline, setOffline] = useState(false);

  const refreshFavoritos = useCallback(async () => {
    const res = await api.getFavoritos();
    setFavoritos(res.data);
    setOffline(res.fromCache);
    return res.data;
  }, []);

  const refreshProgreso = useCallback(async () => {
    const res = await api.getProgreso(USER_ID);
    setProgreso(res.data);
    return res.data;
  }, [USER_ID]);

  // Videos pendientes de aprobación (contador para superusuarios)
  const refreshPendientes = useCallback(async () => {
    if (!esSuper) return 0;
    const res = await api.getPendientesTotal();
    setPendientes(res.data.total);
    return res.data.total;
  }, [esSuper]);

  useEffect(() => {
    refreshFavoritos().catch(() => {});
    refreshProgreso().catch(() => {});
    refreshPendientes().catch(() => {});
  }, [refreshFavoritos, refreshProgreso, refreshPendientes]);

  const favBySena = useMemo(() => new Map(favoritos.map((f) => [f.senaId, f])), [favoritos]);

  // CREATE
  const addFavorito = useCallback(async (senaId, comentario = '') => {
    const { data } = await api.addFavorito(senaId, comentario);
    setFavoritos((prev) => [...prev, data]);
    return data;
  }, []);

  // UPDATE
  const updateFavorito = useCallback(async (id, comentario) => {
    const { data } = await api.updateFavorito(id, comentario);
    setFavoritos((prev) => prev.map((f) => (f.id === id ? data : f)));
    return data;
  }, []);

  // DELETE
  const removeFavorito = useCallback(async (id) => {
    await api.deleteFavorito(id);
    setFavoritos((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const toggleAprendida = useCallback(
    async (senaId) => {
      const aprendida = progreso?.senasAprendidas?.some((s) => s.senaId === senaId);
      if (aprendida) await api.desmarcarAprendida(USER_ID, senaId);
      else await api.marcarAprendida(USER_ID, senaId);
      await refreshProgreso();
      return !aprendida;
    },
    [progreso, refreshProgreso, USER_ID],
  );

  const value = {
    favoritos,
    favBySena,
    progreso,
    offline,
    pendientes,
    refreshPendientes,
    refreshFavoritos,
    refreshProgreso,
    addFavorito,
    updateFavorito,
    removeFavorito,
    toggleAprendida,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export const useAppData = () => useContext(AppDataContext);
