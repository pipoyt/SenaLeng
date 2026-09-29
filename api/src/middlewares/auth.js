const jwt = require('jsonwebtoken');
const db = require('../db/store');
const { jwtSecret } = require('../config');
const { ApiError } = require('../utils/response');
const { hasRole } = require('../utils/roles');

function readUser(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  try {
    const payload = jwt.verify(token, jwtSecret);
    return db.findById('usuarios', payload.sub) || null;
  } catch {
    throw new ApiError(401, 'Sesión inválida o expirada. Inicia sesión de nuevo.');
  }
}

/** Exige un token válido; deja el usuario en req.user. */
function requireAuth(req, _res, next) {
  try {
    const user = readUser(req);
    if (!user) return next(new ApiError(401, 'Debes iniciar sesión'));
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

/** Exige un rol mínimo (usar después de requireAuth). */
const requireRole = (min) => (req, _res, next) => {
  if (!hasRole(req.user, min)) {
    return next(new ApiError(403, 'No tienes permisos para realizar esta acción'));
  }
  next();
};

/** Token opcional: si viene y es válido, se usa; si no, se continúa como invitado. */
function optionalAuth(req, _res, next) {
  try {
    req.user = readUser(req);
  } catch {
    req.user = null;
  }
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
