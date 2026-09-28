import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

/**
 * Carga señas desde la API con búsqueda (q) y filtro de categoría.
 * La búsqueda se retrasa 300 ms para no saturar la API mientras se escribe.
 */
export default function useSenas({ q, categoria }) {
  const [senas, setSenas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const res = await api.getSenas({ q: q?.trim(), categoria, sort: 'id' });
      if (id !== reqId.current) return; // respuesta vieja
      setSenas(res.data);
      setOffline(res.fromCache);
      setError(null);
    } catch (e) {
      if (id === reqId.current) setError(e.message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [q, categoria]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  return { senas, loading, error, offline, reload: load, setSenas };
}

/** Categorías para los chips: "Todas" + las que existan en la API. */
export function useCategoriaOptions() {
  const [options, setOptions] = useState([{ label: 'Todas', value: null }]);
  const load = useCallback(() => {
    api
      .getCategorias()
      .then((res) => setOptions([{ label: 'Todas', value: null }, ...res.data.map((c) => ({ label: c.nombre, value: c.nombre }))]))
      .catch(() => {});
  }, []);
  useEffect(load, [load]);
  return [options, load];
}
