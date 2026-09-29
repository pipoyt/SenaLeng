const db = require('../db/store');
const { ok } = require('../utils/response');
const { ROLES } = require('../utils/roles');

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => Date.now() - n * DAY;
const inLast = (iso, n) => !!iso && new Date(iso).getTime() >= daysAgo(n);
const top = (items, n = 5) => items.sort((a, b) => b.total - a.total).slice(0, n);

/**
 * GET /api/estadisticas — panel general de la aplicación.
 * Exclusivo del superusuario principal.
 */
exports.general = (req, res) => {
  // Desfase de zona horaria del cliente en minutos (Date.getTimezoneOffset); México centro = 360.
  const tz = Math.max(-840, Math.min(840, Number(req.query.tz) || 0));
  const localDay = (iso) => new Date(new Date(iso).getTime() - tz * 60000).toISOString().slice(0, 10);
  const usuarios = db.all('usuarios');
  const senas = db.all('senas');
  const videos = db.all('videos');
  const favoritos = db.all('favoritos');
  const progreso = db.all('progreso');
  const senaById = new Map(senas.map((s) => [s.id, s]));

  // --- Usuarios ---
  const porRol = Object.fromEntries(ROLES.map((r) => [r, usuarios.filter((u) => u.rol === r).length]));
  const registrosPorDia = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = localDay(daysAgo(i));
    registrosPorDia.push({ fecha: d, total: usuarios.filter((u) => u.fechaCreacion && localDay(u.fechaCreacion) === d).length });
  }

  // --- Señas ---
  const categorias = new Map();
  for (const s of senas) {
    const c = categorias.get(s.categoria) || { categoria: s.categoria, total: 0, conVideo: 0 };
    c.total += 1;
    if (s.videoUrl) c.conVideo += 1;
    categorias.set(s.categoria, c);
  }
  const conVideo = senas.filter((s) => s.videoUrl).length;

  // --- Videos ---
  const porEstado = Object.fromEntries(
    ['pendiente', 'aprobado', 'rechazado', 'reemplazado'].map((e) => [e, videos.filter((v) => v.estado === e).length]),
  );
  const revisados = videos.filter((v) => v.fechaRevision);
  const horasRevision = revisados.length
    ? revisados.reduce((acc, v) => acc + (new Date(v.fechaRevision) - new Date(v.fechaEnvio)), 0) / revisados.length / 3600000
    : null;
  const porAutor = new Map();
  for (const v of videos) {
    const a = porAutor.get(v.autorId) || { usuarioId: v.autorId, enviados: 0, aprobados: 0, total: 0 };
    a.enviados += 1;
    a.total += 1;
    if (v.estado === 'aprobado' || v.estado === 'reemplazado') a.aprobados += 1;
    porAutor.set(v.autorId, a);
  }
  const topAdmins = top([...porAutor.values()]).map((a) => ({
    ...a,
    nombre: usuarios.find((u) => u.id === a.usuarioId)?.nombre || '(eliminado)',
  }));

  // --- Aprendizaje ---
  const contar = (rows) => {
    const m = new Map();
    for (const r of rows) m.set(r.senaId, (m.get(r.senaId) || 0) + 1);
    return top([...m.entries()].map(([senaId, total]) => ({ senaId, total })))
      .filter((x) => senaById.has(x.senaId))
      .map((x) => ({ ...x, nombre: senaById.get(x.senaId).nombre, icono: senaById.get(x.senaId).icono }));
  };
  const aprendices = new Set(progreso.map((p) => p.usuarioId));

  return ok(res, {
    generadoEn: new Date().toISOString(),
    usuarios: {
      total: usuarios.length,
      porRol,
      nuevos7d: usuarios.filter((u) => inLast(u.fechaCreacion, 7)).length,
      nuevos30d: usuarios.filter((u) => inLast(u.fechaCreacion, 30)).length,
      activos7d: usuarios.filter((u) => inLast(u.ultimoAcceso, 7)).length,
      registrosPorDia,
    },
    senas: {
      total: senas.length,
      conVideo,
      sinVideo: senas.length - conVideo,
      porcentajeConVideo: senas.length ? Math.round((conVideo / senas.length) * 100) : 0,
      porCategoria: [...categorias.values()],
    },
    videos: {
      total: videos.length,
      porEstado,
      horasPromedioRevision: horasRevision === null ? null : Math.round(horasRevision * 10) / 10,
      topAdmins,
    },
    aprendizaje: {
      favoritosTotal: favoritos.length,
      senasAprendidasTotal: progreso.length,
      usuariosAprendiendo: aprendices.size,
      promedioAprendidasPorUsuario: aprendices.size ? Math.round((progreso.length / aprendices.size) * 10) / 10 : 0,
      topFavoritas: contar(favoritos),
      topAprendidas: contar(progreso),
    },
  });
};
