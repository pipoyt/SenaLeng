import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultApiUrl } from '../config';

const URL_KEY = '@senaleng/apiUrl';
const CACHE_PREFIX = '@senaleng/cache:';
const TIMEOUT_MS = 10000;
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

let baseUrl = getDefaultApiUrl();
let token = null;
let cacheScope = 'anon';
let onUnauthorized = null;

export const getApiUrl = () => baseUrl;

/**
 * Convierte "/uploads/videos/x.mp4" (video guardado en la API) en una URL completa.
 * Las URLs completas (https://...) y los archivos locales del teléfono
 * (file://, content://, blob:, ph://...) se devuelven tal cual.
 */
export const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  return `${baseUrl.replace(/\/api\/?$/, '')}${url}`;
};

/** Sesión: el token JWT se envía en cada petición. */
export function setSession(newToken, userId) {
  token = newToken || null;
  cacheScope = userId ? `u${userId}` : 'anon';
}
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

/** Carga la URL guardada por el usuario (pestaña Perfil / pantalla de inicio de sesión). */
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

const networkError = (e) =>
  new ApiError(
    e?.name === 'AbortError'
      ? 'La API tardó demasiado en responder'
      : `No se pudo conectar con la API (${baseUrl}). Verifica que esté encendida y en la misma red.`,
  );

async function parse(res, path) {
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = json?.error;
    const msg = err?.details?.length ? `${err.message}: ${err.details.join('. ')}` : err?.message || `Error ${res.status}`;
    if (res.status === 401 && token && !path.startsWith('/auth/login')) onUnauthorized?.();
    throw new ApiError(msg, res.status, err?.details);
  }
  return json;
}

/**
 * Petición HTTP a la API con:
 *  - token de sesión (Authorization: Bearer ...)
 *  - formato estándar { success, data } / { success, error }
 *  - tiempo límite
 *  - caché local por usuario de las respuestas GET (funcionamiento parcial sin conexión)
 */
export async function request(path, { method = 'GET', body, cache = method === 'GET' } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const cacheKey = `${CACHE_PREFIX}${cacheScope}:${path}`;
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const json = await parse(res, path);
    if (cache) AsyncStorage.setItem(cacheKey, JSON.stringify(json)).catch(() => {});
    return { data: json.data, meta: json.meta, fromCache: false };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (cache) {
      const cached = await AsyncStorage.getItem(cacheKey).catch(() => null);
      if (cached) {
        const json = JSON.parse(cached);
        return { data: json.data, meta: json.meta, fromCache: true };
      }
    }
    throw networkError(e);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sube un video (multipart/form-data) con XMLHttpRequest.
 *
 * Importante: en Expo SDK 57 el `fetch` global es "expo/fetch", que NO acepta
 * archivos locales del teléfono en FormData ({ uri, name, type }). XMLHttpRequest
 * usa la red nativa de React Native, que sí los acepta, y además permite mostrar
 * el porcentaje de avance.
 *
 * @param asset resultado de expo-image-picker ({ uri, mimeType, fileName })
 * @param onProgress función opcional (0 a 1)
 */
const VIDEO_TYPES = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', '3gp': 'video/3gpp', webm: 'video/webm', mkv: 'video/x-matroska' };

async function uploadVideo(asset, senaId, nota = '', onProgress) {
  const ext = (asset.fileName || asset.uri || '').split('?')[0].split('.').pop().toLowerCase();
  const type = asset.mimeType && asset.mimeType.startsWith('video/') ? asset.mimeType : VIDEO_TYPES[ext] || 'video/mp4';
  const name = asset.fileName || `sena-${senaId}-${Date.now()}.${VIDEO_TYPES[ext] ? ext : 'mp4'}`;

  const form = new FormData();
  form.append('senaId', String(senaId));
  form.append('nota', nota);
  if (Platform.OS === 'web') {
    // En web el picker devuelve un blob: URL; hay que convertirlo en Blob real.
    const blob = asset.file || (await (await fetch(asset.uri)).blob());
    form.append('video', blob, name);
  } else {
    form.append('video', { uri: asset.uri, name, type });
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseUrl}/videos`);
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total) onProgress(e.loaded / e.total);
      };
    }
    xhr.onload = () => {
      let json = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && json?.success) return resolve({ data: json.data });
      const err = json?.error;
      if (xhr.status === 401) onUnauthorized?.();
      reject(new ApiError(err?.message || `Error ${xhr.status} al subir el video`, xhr.status, err?.details));
    };
    xhr.onerror = () => reject(networkError());
    xhr.ontimeout = () => reject(new ApiError('La subida tardó demasiado. Intenta con un video más corto o una mejor conexión.'));
    xhr.send(form);
  });
}

const qs = (params = {}) => {
  const p = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return p.length ? `?${p.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}` : '';
};

export const api = {
  // Autenticación
  login: (correo, password) => request('/auth/login', { method: 'POST', body: { correo, password } }),
  registro: (nombre, correo, password) => request('/auth/registro', { method: 'POST', body: { nombre, correo, password } }),
  me: () => request('/auth/me', { cache: false }),
  cambiarPassword: (actual, nueva) => request('/auth/password', { method: 'PATCH', body: { actual, nueva } }),

  // Señas (entidad principal)
  getSenas: (params) => request(`/senas${qs(params)}`),
  getSena: (id) => request(`/senas/${id}`),
  getRelacionadas: (id) => request(`/senas/${id}/relacionadas`),
  createSena: (body) => request('/senas', { method: 'POST', body }),
  updateSena: (id, body) => request(`/senas/${id}`, { method: 'PUT', body }),
  patchSena: (id, body) => request(`/senas/${id}`, { method: 'PATCH', body }),
  deleteSena: (id) => request(`/senas/${id}`, { method: 'DELETE' }),

  getCategorias: () => request('/categorias'),

  // Favoritos del usuario de la sesión
  getFavoritos: () => request('/favoritos'),
  addFavorito: (senaId, comentario = '') => request('/favoritos', { method: 'POST', body: { senaId, comentario } }),
  updateFavorito: (id, comentario) => request(`/favoritos/${id}`, { method: 'PATCH', body: { comentario } }),
  deleteFavorito: (id) => request(`/favoritos/${id}`, { method: 'DELETE' }),

  // Progreso
  getProgreso: (usuarioId) => request(`/usuarios/${usuarioId}/progreso`),
  marcarAprendida: (usuarioId, senaId) => request(`/usuarios/${usuarioId}/progreso`, { method: 'POST', body: { senaId } }),
  desmarcarAprendida: (usuarioId, senaId) => request(`/usuarios/${usuarioId}/progreso/${senaId}`, { method: 'DELETE' }),

  // Usuarios y roles (superusuarios)
  getUsuarios: (params) => request(`/usuarios${qs(params)}`, { cache: false }),
  cambiarRol: (id, rol) => request(`/usuarios/${id}/rol`, { method: 'PATCH', body: { rol } }),

  // Videos
  uploadVideo,
  getVideos: (params) => request(`/videos${qs(params)}`, { cache: false }),
  getPendientesTotal: () => request('/videos/pendientes/total', { cache: false }),
  revisarVideo: (id, accion, comentario = '') => request(`/videos/${id}/revision`, { method: 'PATCH', body: { accion, comentario } }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: 'DELETE' }),

  // Estadísticas (solo principal)
  getEstadisticas: () => request(`/estadisticas?tz=${new Date().getTimezoneOffset()}`, { cache: false }),

  health: () => request('/health', { cache: false }),
};
