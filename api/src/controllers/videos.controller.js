const db = require('../db/store');
const storage = require('../services/storage');
const { ApiError, ok } = require('../utils/response');
const { hasRole } = require('../utils/roles');

const ESTADOS = ['pendiente', 'aprobado', 'rechazado', 'reemplazado'];

/** Agrega datos de la seña, autor y revisor para que la app no haga más peticiones. */
function expand(v) {
  const sena = db.findById('senas', v.senaId);
  const autor = db.findById('usuarios', v.autorId);
  const revisor = v.revisorId ? db.findById('usuarios', v.revisorId) : null;
  return {
    ...v,
    sena: sena ? { id: sena.id, nombre: sena.nombre, categoria: sena.categoria, icono: sena.icono, videoUrl: sena.videoUrl } : null,
    autor: autor ? { id: autor.id, nombre: autor.nombre } : null,
    revisor: revisor ? { id: revisor.id, nombre: revisor.nombre } : null,
  };
}

const getOr404 = (id) => {
  const v = db.findById('videos', id);
  if (!v) throw new ApiError(404, 'Video no encontrado');
  return v;
};

/**
 * POST /api/videos (multipart/form-data) — un admin envía un video para una seña.
 * Campos: video (archivo), senaId, nota (opcional). Queda "pendiente" de aprobación.
 */
exports.create = async (req, res) => {
  const file = req.file;
  try {
    if (!file) throw new ApiError(400, 'Adjunta el video en el campo "video"');
    const senaId = Number(req.body?.senaId);
    if (!Number.isInteger(senaId) || senaId < 1) throw new ApiError(400, '"senaId" es obligatorio');
    if (!db.findById('senas', senaId)) throw new ApiError(404, 'Seña no encontrada');
    const nota = String(req.body?.nota || '').trim().slice(0, 280);

    const saved = await storage.save(file);
    const video = db.insert('videos', {
      senaId,
      autorId: req.user.id,
      ...saved,
      mimeType: file.mimetype,
      tamano: file.size,
      nota,
      estado: 'pendiente',
      fechaEnvio: new Date().toISOString(),
      revisorId: null,
      fechaRevision: null,
      comentarioRevision: '',
    });
    return ok(res.location(`/api/videos/${video.id}`), expand(video), 201);
  } catch (e) {
    storage.discard(file);
    throw e;
  }
};

/**
 * GET /api/videos?estado=pendiente&senaId=3
 * Superusuarios ven todos; un admin solo ve los suyos.
 */
exports.list = (req, res) => {
  const { estado } = req.query;
  if (estado && !ESTADOS.includes(estado)) throw new ApiError(400, `"estado" debe ser uno de: ${ESTADOS.join(', ')}`);
  let videos = db.all('videos');
  if (!hasRole(req.user, 'superusuario') || req.query.mios === 'true') {
    videos = videos.filter((v) => v.autorId === req.user.id);
  }
  if (estado) videos = videos.filter((v) => v.estado === estado);
  if (req.query.senaId) videos = videos.filter((v) => v.senaId === Number(req.query.senaId));
  // Pendientes: el más antiguo primero (cola). Demás: más recientes primero.
  videos.sort((a, b) => (estado === 'pendiente' ? a.id - b.id : b.id - a.id));
  return ok(res, videos.map(expand), 200, { total: videos.length });
};

/** GET /api/videos/pendientes/total — para el contador (badge) de los superusuarios. */
exports.pendientesTotal = (_req, res) =>
  ok(res, { total: db.all('videos').filter((v) => v.estado === 'pendiente').length });

/** GET /api/videos/:id */
exports.getById = (req, res) => {
  const v = getOr404(req.params.id);
  if (v.autorId !== req.user.id && !hasRole(req.user, 'superusuario')) throw new ApiError(404, 'Video no encontrado');
  return ok(res, expand(v));
};

/**
 * PATCH /api/videos/:id/revision — un superusuario aprueba o rechaza.
 * Body: { accion: "aprobar" | "rechazar", comentario }
 * Al aprobar, el video se vuelve el oficial de la seña (el anterior pasa a "reemplazado").
 */
exports.revisar = (req, res) => {
  const v = getOr404(req.params.id);
  const { accion } = req.body || {};
  const comentario = String(req.body?.comentario || '').trim().slice(0, 280);
  if (!['aprobar', 'rechazar'].includes(accion)) throw new ApiError(400, '"accion" debe ser "aprobar" o "rechazar"');
  if (v.estado !== 'pendiente') throw new ApiError(409, `Este video ya fue revisado (${v.estado})`);
  if (accion === 'rechazar' && comentario.length < 3) {
    throw new ApiError(400, 'Escribe el motivo del rechazo para que el administrador pueda corregirlo');
  }
  const now = new Date().toISOString();

  if (accion === 'aprobar') {
    const sena = db.findById('senas', v.senaId);
    if (!sena) throw new ApiError(404, 'La seña de este video ya no existe');
    for (const prev of db.all('videos')) {
      if (prev.senaId === v.senaId && prev.estado === 'aprobado') db.update('videos', prev.id, { estado: 'reemplazado' });
    }
    db.update('senas', sena.id, { videoUrl: v.url });
  }

  const updated = db.update('videos', v.id, {
    estado: accion === 'aprobar' ? 'aprobado' : 'rechazado',
    revisorId: req.user.id,
    fechaRevision: now,
    comentarioRevision: comentario,
  });
  return ok(res, expand(updated));
};

/**
 * DELETE /api/videos/:id — el autor puede borrar sus videos pendientes o rechazados;
 * un superusuario puede borrar cualquiera (si era el oficial, la seña queda sin video).
 */
exports.remove = async (req, res) => {
  const v = getOr404(req.params.id);
  const esSuper = hasRole(req.user, 'superusuario');
  if (!esSuper) {
    if (v.autorId !== req.user.id) throw new ApiError(404, 'Video no encontrado');
    if (!['pendiente', 'rechazado'].includes(v.estado)) {
      throw new ApiError(403, 'Solo puedes borrar videos pendientes o rechazados');
    }
  }
  db.remove('videos', v.id);
  const sena = db.findById('senas', v.senaId);
  if (sena && sena.videoUrl === v.url) db.update('senas', sena.id, { videoUrl: null });
  await storage.remove(v).catch(() => {});
  return ok(res, { message: 'Video eliminado' });
};
