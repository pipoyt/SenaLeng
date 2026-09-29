const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/store');
const { jwtSecret, jwtExpiresIn, bcryptRounds } = require('../config');
const { ApiError, ok } = require('../utils/response');
const { publicUser } = require('../utils/usuario');
const { validateRegistro, passwordErrors } = require('../validators/usuario.validator');

const signToken = (user) => jwt.sign({ sub: user.id, rol: user.rol }, jwtSecret, { expiresIn: jwtExpiresIn });

// Límite simple de intentos fallidos de login (en memoria): 5 fallos → bloqueo de 10 minutos.
const MAX_FALLOS = 5;
const BLOQUEO_MS = 10 * 60 * 1000;
const intentos = new Map();
exports._resetLimiter = () => intentos.clear();

/** POST /api/auth/registro — crea una cuenta con rol "usuario". */
exports.registro = (req, res) => {
  const { value, errors } = validateRegistro(req.body);
  if (errors.length) throw new ApiError(400, 'Datos inválidos', errors);
  if (db.findOne('usuarios', (u) => u.correo === value.correo)) {
    throw new ApiError(409, 'Ya existe una cuenta con ese correo');
  }
  const now = new Date().toISOString();
  const user = db.insert('usuarios', {
    nombre: value.nombre,
    correo: value.correo,
    passwordHash: bcrypt.hashSync(value.password, bcryptRounds),
    rol: 'usuario', // los roles superiores solo los asigna un superusuario
    fechaCreacion: now,
    ultimoAcceso: now,
  });
  return ok(res, { token: signToken(user), usuario: publicUser(user) }, 201);
};

/** POST /api/auth/login */
exports.login = (req, res) => {
  const correo = String(req.body?.correo || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!correo || !password) throw new ApiError(400, 'Escribe tu correo y contraseña');

  const reg = intentos.get(correo);
  if (reg && reg.hasta > Date.now()) {
    const min = Math.ceil((reg.hasta - Date.now()) / 60000);
    throw new ApiError(429, `Demasiados intentos fallidos. Intenta de nuevo en ${min} min.`);
  }

  const user = db.findOne('usuarios', (u) => u.correo === correo);
  if (!user || !bcrypt.compareSync(password, user.passwordHash || '')) {
    const fallos = (reg?.fallos || 0) + 1;
    intentos.set(correo, { fallos, hasta: fallos >= MAX_FALLOS ? Date.now() + BLOQUEO_MS : 0 });
    throw new ApiError(401, 'Correo o contraseña incorrectos');
  }
  intentos.delete(correo);

  const updated = db.update('usuarios', user.id, { ultimoAcceso: new Date().toISOString() });
  return ok(res, { token: signToken(updated), usuario: publicUser(updated) });
};

/** GET /api/auth/me — datos del usuario de la sesión (la app lo usa al abrir). */
exports.me = (req, res) => ok(res, publicUser(req.user));

/** PATCH /api/auth/password — cambiar la propia contraseña. */
exports.cambiarPassword = (req, res) => {
  const { actual, nueva } = req.body || {};
  if (!bcrypt.compareSync(String(actual || ''), req.user.passwordHash)) {
    throw new ApiError(400, 'La contraseña actual no es correcta');
  }
  const errs = passwordErrors(nueva, 'nueva');
  if (errs.length) throw new ApiError(400, 'Datos inválidos', errs);
  db.update('usuarios', req.user.id, { passwordHash: bcrypt.hashSync(nueva, bcryptRounds) });
  return ok(res, { message: 'Contraseña actualizada' });
};
