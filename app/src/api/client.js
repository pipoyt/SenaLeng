import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultApiUrl } from '../config';

const URL_KEY = '@senaleng/apiUrl';
const CACHE_PREFIX = '@senaleng/cache:';
const TIMEOUT_MS = 8000;

let baseUrl = getDefaultApiUrl();

export const getApiUrl = () => baseUrl;

/** Carga la URL guardada por el usuario (pestaña Perfil). */
export async function loadApiUrl() {
  try {
    const saved = await AsyncStorage.getItem(URL_KEY);
    if (saved) baseUrl = saved;
  } catch {}
  return baseUrl;
}

export async function setApiUrl(url) {
  baseUrl = (url || getDefaultApiUrl()).trim().replace(/\/$/, '');
  try {
    if (url) await AsyncStorage.setItem(URL_KEY, baseUrl);
    else await AsyncStorage.removeItem(URL_KEY);
  } catch {}
  return baseUrl;
}

export class ApiError extends Error {
  constructor(message, status = 0, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Petición HTTP a la API con:
 *  - formato estándar { success, data } / { success, error }
 *  - tiempo límite
 *  - caché local de las respuestas GET (funcionamiento parcial sin conexión)
 */
export async function request(path, { method = 'GET', body, cache = method === 'GET' } = {}) {
  const url = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      const err = json?.error;
      const msg = err?.details?.length ? `${err.message}: ${err.details.join('. ')}` : err?.message || `Error ${res.status}`;
      throw new ApiError(msg, res.status, err?.details);
    }

    if (cache) AsyncStorage.setItem(CACHE_PREFIX + path, JSON.stringify(json)).catch(() => {});
    return { data: json.data, meta: json.meta, fromCache: false };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    // Error de red: intentamos con la copia en caché.
    if (cache) {
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + path).catch(() => null);
      if (cached) {
        const json = JSON.parse(cached);
        return { data: json.data, meta: json.meta, fromCache: true };
      }
    }
    throw new ApiError(
      e.name === 'AbortError'
        ? 'La API tardó demasiado en responder'
        : `No se pudo conectar con la API (${baseUrl}). Verifica que esté encendida y en la misma red.`,
    );
  } finally {
    clearTimeout(timer);
  }
}

const qs = (params = {}) => {
  const p = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return p.length ? `?${p.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}` : '';
};

export const api = {
  // Señas (entidad principal)
  getSenas: (params) => request(`/senas${qs(params)}`),
  getSena: (id) => request(`/senas/${id}`),
  getRelacionadas: (id) => request(`/senas/${id}/relacionadas`),
  createSena: (body) => request('/senas', { method: 'POST', body }),
  updateSena: (id, body) => request(`/senas/${id}`, { method: 'PUT', body }),
  patchSena: (id, body) => request(`/senas/${id}`, { method: 'PATCH', body }),
  deleteSena: (id) => request(`/senas/${id}`, { method: 'DELETE' }),

  getCategorias: () => request('/categorias'),

  // Favoritos (CRUD de la Tabla 3)
  getFavoritos: (usuarioId) => request(`/favoritos${qs({ usuarioId })}`),
  addFavorito: (senaId, usuarioId, comentario = '') =>
    request('/favoritos', { method: 'POST', body: { senaId, usuarioId, comentario } }),
  updateFavorito: (id, comentario) => request(`/favoritos/${id}`, { method: 'PATCH', body: { comentario } }),
  deleteFavorito: (id) => request(`/favoritos/${id}`, { method: 'DELETE' }),

  // Usuarios / progreso
  getProgreso: (usuarioId) => request(`/usuarios/${usuarioId}/progreso`),
  marcarAprendida: (usuarioId, senaId) => request(`/usuarios/${usuarioId}/progreso`, { method: 'POST', body: { senaId } }),
  desmarcarAprendida: (usuarioId, senaId) => request(`/usuarios/${usuarioId}/progreso/${senaId}`, { method: 'DELETE' }),

  health: () => request('/health', { cache: false }),
};
