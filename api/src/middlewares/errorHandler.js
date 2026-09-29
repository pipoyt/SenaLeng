const { ApiError, fail } = require('../utils/response');

function notFound(req, res) {
  return fail(res, 404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) return fail(res, err.code, err.message, err.details);
  if (err.type === 'entity.parse.failed') return fail(res, 400, 'JSON mal formado en el cuerpo de la petición');
  const status = err.status || err.statusCode;
  if (status >= 400 && status < 500) return fail(res, status, status === 404 ? 'Archivo no encontrado' : err.message);
  console.error(err);
  return fail(res, 500, 'Error interno del servidor');
}

module.exports = { notFound, errorHandler };
