const db = require('../db/store');
const { ApiError, ok } = require('../utils/response');
const { normalize, canonicalNivel } = require('../utils/text');
const { validateSena } = require('../validators/sena.validator');
const { hasRole } = require('../utils/roles');
const storage = require('../services/storage');

/**
 * El video de una seña solo cambia por el flujo de aprobación (o por un superusuario).
 * Así un admin no puede publicar un video sin revisión.
 */
const stripVideoIfNotSuper = (req, value) => {
  if (!hasRole(req.user, 'superusuario')) delete value.videoUrl;
  return value;
};

const SORTABLE = ['id', 'nombre', 'categoria', 'nivel', 'fechaCreacion'];

/** GET /api/senas — lista con filtros (categoria, nivel, q), orden y paginación. */
exports.list = (req, res) => {
  const { categoria, nivel, q, sort = 'id', order = 'asc' } = req.query;
  let senas = db.all('senas');

  if (categoria) senas = senas.filter((s) => normalize(s.categoria) === normalize(categoria));
  if (nivel) {
    const n = canonicalNivel(nivel);
    senas = senas.filter((s) => s.nivel === n);
  }
  if (q) {
    const term = normalize(q);
    senas = senas.filter((s) => normalize(s.nombre).includes(term) || normalize(s.categoria).includes(term));
  }

  if (!SORTABLE.includes(sort)) throw new ApiError(400, `"sort" debe ser uno de: ${SORTABLE.join(', ')}`);
  const dir = order === 'desc' ? -1 : 1;
  senas.sort((a, b) => (a[sort] > b[sort] ? dir : a[sort] < b[sort] ? -dir : 0));

  const total = senas.length;
  const limit = req.query.limit ? Math.min(Math.max(Number(req.query.limit) || 20, 1), 100) : total || 1;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const data = senas.slice((page - 1) * limit, page * limit);

  return ok(res, data, 200, { total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) });
};

/** GET /api/senas/:id */
exports.getById = (req, res) => {
  const sena = db.findById('senas', req.params.id);
  if (!sena) throw new ApiError(404, 'Seña no encontrada');
  return ok(res, sena);
};

/** GET /api/senas/:id/relacionadas — señas de la misma categoría (pantalla Detalle). */
exports.related = (req, res) => {
  const sena = db.findById('senas', req.params.id);
  if (!sena) throw new ApiError(404, 'Seña no encontrada');
  const limit = Math.min(Number(req.query.limit) || 3, 10);
  const data = db
    .all('senas')
    .filter((s) => s.id !== sena.id && s.categoria === sena.categoria)
    .slice(0, limit);
  return ok(res, data);
};

/** POST /api/senas */
exports.create = (req, res) => {
  const { value, errors } = validateSena(req.body);
  if (errors.length) throw new ApiError(400, 'Datos inválidos', errors);
  stripVideoIfNotSuper(req, value);

  const dup = db.findOne(
    'senas',
    (s) => normalize(s.nombre) === normalize(value.nombre) && normalize(s.categoria) === normalize(value.categoria),
  );
  if (dup) throw new ApiError(409, `Ya existe la seña "${dup.nombre}" en la categoría ${dup.categoria}`);

  const sena = db.insert('senas', {
    nombre: value.nombre,
    categoria: value.categoria,
    descripcion: value.descripcion,
    videoUrl: value.videoUrl ?? null,
    imagenUrl: value.imagenUrl ?? null,
    nivel: value.nivel,
    icono: value.icono || '🤟',
    fechaCreacion: new Date().toISOString(),
  });
  return ok(res.location(`/api/senas/${sena.id}`), sena, 201);
};

/** PUT /api/senas/:id — reemplazo completo. */
exports.replace = (req, res) => {
  const current = db.findById('senas', req.params.id);
  if (!current) throw new ApiError(404, 'Seña no encontrada');
  const { value, errors } = validateSena(req.body);
  if (errors.length) throw new ApiError(400, 'Datos inválidos', errors);
  if (!hasRole(req.user, 'superusuario')) value.videoUrl = current.videoUrl;
  const sena = db.update('senas', req.params.id, {
    nombre: value.nombre,
    categoria: value.categoria,
    descripcion: value.descripcion,
    videoUrl: value.videoUrl ?? null,
    imagenUrl: value.imagenUrl ?? null,
    nivel: value.nivel,
    icono: value.icono || '🤟',
  });
  return ok(res, sena);
};

/** PATCH /api/senas/:id — actualización parcial. */
exports.patch = (req, res) => {
  if (!db.findById('senas', req.params.id)) throw new ApiError(404, 'Seña no encontrada');
  const { value, errors } = validateSena(req.body, true);
  if (errors.length) throw new ApiError(400, 'Datos inválidos', errors);
  return ok(res, db.update('senas', req.params.id, stripVideoIfNotSuper(req, value)));
};

/** DELETE /api/senas/:id — elimina la seña y sus referencias (favoritos, progreso y videos). */
exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  const deleted = db.remove('senas', id);
  if (!deleted) throw new ApiError(404, 'Seña no encontrada');
  db.removeWhere('favoritos', (f) => f.senaId === id);
  db.removeWhere('progreso', (p) => p.senaId === id);
  const videos = db.all('videos').filter((v) => v.senaId === id);
  db.removeWhere('videos', (v) => v.senaId === id);
  await Promise.all(videos.map((v) => storage.remove(v).catch(() => {})));
  return ok(res, { message: 'Seña eliminada correctamente', sena: deleted });
};
