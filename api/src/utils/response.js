/**
 * Formato de respuesta estandarizado (documento, sección 11.5).
 *   Éxito: { success: true, data, meta? }
 *   Error: { success: false, error: { code, message, details? } }
 */
class ApiError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

const ok = (res, data, status = 200, meta) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};

const fail = (res, code, message, details) => {
  const error = { code, message };
  if (details) error.details = details;
  return res.status(code).json({ success: false, error });
};

module.exports = { ApiError, ok, fail };
