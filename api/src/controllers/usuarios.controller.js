const db = require('../db/store');
const { ApiError, ok } = require('../utils/response');
const { validateUsuario } = require('../validators/usuario.validator');

const getUserOr404 = (id) => {
  const u = db.findById('usuarios', id);
  if (!u) throw new ApiError(404, 'Usuario no encontrado');
  return u;
};

exports.list = (_req, res) => ok(res, db.all('usuarios'));

exports.getById = (req, res) => ok(res, getUserOr404(req.params.id));

/** POST /api/usuarios — registro de usuario. */
exports.create = (req, res) => {
  const { value, errors } = validateUsuario(req.body);
  if (errors.length) throw new ApiError(400, 'Datos inválidos', errors);
  if (db.findOne('usuarios', (u) => u.correo === value.correo)) {
    throw new ApiError(409, 'Ya existe un usuario con ese correo');
  }
  const user = db.insert('usuarios', { ...value, fechaCreacion: new Date().toISOString() });
  return ok(res.location(`/api/usuarios/${user.id}`), user, 201);
};

/** GET /api/usuarios/:id/progreso — resumen de avance del usuario. */
exports.getProgreso = (req, res) => {
  const user = getUserOr404(req.params.id);
  const senas = db.all('senas');
  const aprendidas = db.all('progreso').filter((p) => p.usuarioId === user.id);
  const ids = new Set(aprendidas.map((p) => p.senaId));

  const porCategoria = {};
  for (const s of senas) {
    porCategoria[s.categoria] = porCategoria[s.categoria] || { total: 0, aprendidas: 0 };
    porCategoria[s.categoria].total += 1;
    if (ids.has(s.id)) porCategoria[s.categoria].aprendidas += 1;
  }
  const porNivel = {};
  for (const s of senas) {
    porNivel[s.nivel] = porNivel[s.nivel] || { total: 0, aprendidas: 0 };
    porNivel[s.nivel].total += 1;
    if (ids.has(s.id)) porNivel[s.nivel].aprendidas += 1;
  }

  return ok(res, {
    usuarioId: user.id,
    totalSenas: senas.length,
    totalAprendidas: ids.size,
    porcentaje: senas.length ? Math.round((ids.size / senas.length) * 100) : 0,
    porCategoria,
    porNivel,
    senasAprendidas: aprendidas.map((p) => ({ senaId: p.senaId, fechaAprendida: p.fechaAprendida })),
  });
};

/** POST /api/usuarios/:id/progreso — marcar una seña como aprendida. */
exports.addProgreso = (req, res) => {
  const user = getUserOr404(req.params.id);
  const senaId = Number(req.body?.senaId);
  if (!Number.isInteger(senaId) || senaId < 1) throw new ApiError(400, '"senaId" es obligatorio y debe ser un entero positivo');
  if (!db.findById('senas', senaId)) throw new ApiError(404, 'Seña no encontrada');
  if (db.findOne('progreso', (p) => p.usuarioId === user.id && p.senaId === senaId)) {
    throw new ApiError(409, 'La seña ya estaba marcada como aprendida');
  }
  const row = db.insert('progreso', { usuarioId: user.id, senaId, fechaAprendida: new Date().toISOString() });
  return ok(res, row, 201);
};

/** DELETE /api/usuarios/:id/progreso/:senaId — desmarcar una seña aprendida. */
exports.removeProgreso = (req, res) => {
  const user = getUserOr404(req.params.id);
  const senaId = Number(req.params.senaId);
  const n = db.removeWhere('progreso', (p) => p.usuarioId === user.id && p.senaId === senaId);
  if (!n) throw new ApiError(404, 'La seña no estaba marcada como aprendida');
  return ok(res, { message: 'Progreso actualizado' });
};
