const db = require('../db/store');
const { ApiError, ok } = require('../utils/response');
const { normalize } = require('../utils/text');
const { hasRole, canAssignRole, ROLES } = require('../utils/roles');
const { publicUser } = require('../utils/usuario');

const getUserOr404 = (id) => {
  const u = db.findById('usuarios', id);
  if (!u) throw new ApiError(404, 'Usuario no encontrado');
  return u;
};

/** Solo el propio usuario o un superusuario pueden ver datos de una cuenta. */
const assertSelfOrSuper = (req, id) => {
  if (req.user.id !== Number(id) && !hasRole(req.user, 'superusuario')) {
    throw new ApiError(403, 'No tienes permisos para ver este usuario');
  }
};

/** GET /api/usuarios?q=&rol= — lista de usuarios (superusuarios). */
exports.list = (req, res) => {
  const { q, rol } = req.query;
  if (rol && !ROLES.includes(rol)) throw new ApiError(400, `"rol" debe ser uno de: ${ROLES.join(', ')}`);
  const favs = db.all('favoritos');
  const prog = db.all('progreso');
  const vids = db.all('videos');

  let users = db.all('usuarios');
  if (rol) users = users.filter((u) => u.rol === rol);
  if (q) {
    const t = normalize(q);
    users = users.filter((u) => normalize(u.nombre).includes(t) || normalize(u.correo).includes(t));
  }
  users.sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? 1 : -1)); // más recientes primero

  const data = users.map((u) => ({
    ...publicUser(u),
    resumen: {
      favoritos: favs.filter((f) => f.usuarioId === u.id).length,
      aprendidas: prog.filter((p) => p.usuarioId === u.id).length,
      videosEnviados: vids.filter((v) => v.autorId === u.id).length,
    },
  }));
  return ok(res, data, 200, { total: data.length });
};

/** GET /api/usuarios/:id */
exports.getById = (req, res) => {
  assertSelfOrSuper(req, req.params.id);
  return ok(res, publicUser(getUserOr404(req.params.id)));
};

/** PATCH /api/usuarios/:id/rol — asignar rol (usuario | admin | superusuario). */
exports.cambiarRol = (req, res) => {
  const target = getUserOr404(req.params.id);
  const nuevoRol = req.body?.rol;
  const error = canAssignRole(req.user, target, nuevoRol);
  if (error) throw new ApiError(error.startsWith('El rol debe') ? 400 : 403, error);
  if (target.rol === nuevoRol) return ok(res, publicUser(target));
  const updated = db.update('usuarios', target.id, {
    rol: nuevoRol,
    rolAsignadoPor: req.user.id,
    fechaCambioRol: new Date().toISOString(),
  });
  return ok(res, publicUser(updated));
};

/** GET /api/usuarios/:id/progreso — resumen de avance. */
exports.getProgreso = (req, res) => {
  assertSelfOrSuper(req, req.params.id);
  const user = getUserOr404(req.params.id);
  const senas = db.all('senas');
  const aprendidas = db.all('progreso').filter((p) => p.usuarioId === user.id);
  const ids = new Set(aprendidas.map((p) => p.senaId));

  const porCategoria = {};
  const porNivel = {};
  for (const s of senas) {
    porCategoria[s.categoria] = porCategoria[s.categoria] || { total: 0, aprendidas: 0 };
    porCategoria[s.categoria].total += 1;
    porNivel[s.nivel] = porNivel[s.nivel] || { total: 0, aprendidas: 0 };
    porNivel[s.nivel].total += 1;
    if (ids.has(s.id)) {
      porCategoria[s.categoria].aprendidas += 1;
      porNivel[s.nivel].aprendidas += 1;
    }
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

const assertSelf = (req) => {
  if (req.user.id !== Number(req.params.id)) throw new ApiError(403, 'Solo puedes modificar tu propio progreso');
};

/** POST /api/usuarios/:id/progreso — marcar una seña como aprendida. */
exports.addProgreso = (req, res) => {
  assertSelf(req);
  const senaId = Number(req.body?.senaId);
  if (!Number.isInteger(senaId) || senaId < 1) throw new ApiError(400, '"senaId" es obligatorio y debe ser un entero positivo');
  if (!db.findById('senas', senaId)) throw new ApiError(404, 'Seña no encontrada');
  if (db.findOne('progreso', (p) => p.usuarioId === req.user.id && p.senaId === senaId)) {
    throw new ApiError(409, 'La seña ya estaba marcada como aprendida');
  }
  const row = db.insert('progreso', { usuarioId: req.user.id, senaId, fechaAprendida: new Date().toISOString() });
  return ok(res, row, 201);
};

/** DELETE /api/usuarios/:id/progreso/:senaId — desmarcar. */
exports.removeProgreso = (req, res) => {
  assertSelf(req);
  const senaId = Number(req.params.senaId);
  const n = db.removeWhere('progreso', (p) => p.usuarioId === req.user.id && p.senaId === senaId);
  if (!n) throw new ApiError(404, 'La seña no estaba marcada como aprendida');
  return ok(res, { message: 'Progreso actualizado' });
};
