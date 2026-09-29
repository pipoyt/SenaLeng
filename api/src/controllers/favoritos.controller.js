const db = require('../db/store');
const { ApiError, ok } = require('../utils/response');
const { normalize } = require('../utils/text');
const { validateFavorito } = require('../validators/favorito.validator');

/** Agrega la seña completa al favorito para que la app no haga otra petición. */
const withSena = (fav) => ({ ...fav, sena: db.findById('senas', fav.senaId) || null });

/** Favorito del usuario de la sesión o 404 (no se revela si existe para otro usuario). */
const getOwnOr404 = (req) => {
  const fav = db.findById('favoritos', req.params.id);
  if (!fav || fav.usuarioId !== req.user.id) throw new ApiError(404, 'Favorito no encontrado');
  return fav;
};

/** GET /api/favoritos?q=hola — favoritos del usuario de la sesión. */
exports.list = (req, res) => {
  const usuarioId = req.user.id;
  let data = db
    .all('favoritos')
    .filter((f) => f.usuarioId === usuarioId)
    .map(withSena);
  if (req.query.q) {
    const term = normalize(req.query.q);
    data = data.filter(
      (f) => normalize(f.sena?.nombre).includes(term) || normalize(f.comentario).includes(term),
    );
  }
  return ok(res, data, 200, { total: data.length });
};

/** GET /api/favoritos/:id */
exports.getById = (req, res) => {
  return ok(res, withSena(getOwnOr404(req)));
};

/** POST /api/favoritos — CREATE: registrar una seña en favoritos con comentario opcional. */
exports.create = (req, res) => {
  const { value, errors } = validateFavorito(req.body);
  if (errors.length) throw new ApiError(400, 'Datos inválidos', errors);

  const usuarioId = req.user.id;
  if (!db.findById('senas', value.senaId)) throw new ApiError(404, 'Seña no encontrada');
  if (db.findOne('favoritos', (f) => f.usuarioId === usuarioId && f.senaId === value.senaId)) {
    throw new ApiError(409, 'La seña ya está en tus favoritos');
  }

  const now = new Date().toISOString();
  const fav = db.insert('favoritos', {
    usuarioId,
    senaId: value.senaId,
    comentario: value.comentario || '',
    fechaCreacion: now,
    fechaActualizacion: now,
  });
  return ok(res.location(`/api/favoritos/${fav.id}`), withSena(fav), 201);
};

/** PUT / PATCH /api/favoritos/:id — UPDATE: modificar el comentario del favorito. */
exports.update = (req, res) => {
  getOwnOr404(req);
  const { value, errors } = validateFavorito(req.body, true);
  if (errors.length) throw new ApiError(400, 'Datos inválidos', errors);
  const fav = db.update('favoritos', req.params.id, {
    comentario: value.comentario ?? '',
    fechaActualizacion: new Date().toISOString(),
  });
  return ok(res, withSena(fav));
};

/** DELETE /api/favoritos/:id — DELETE: quitar una seña de favoritos. */
exports.remove = (req, res) => {
  getOwnOr404(req);
  const deleted = db.remove('favoritos', req.params.id);
  return ok(res, { message: 'Seña eliminada de favoritos', favorito: deleted });
};
