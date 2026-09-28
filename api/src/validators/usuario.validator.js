const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUsuario(body = {}) {
  const errors = [];
  const value = {};
  if (typeof body.nombre !== 'string' || body.nombre.trim().length < 2) {
    errors.push('"nombre" es obligatorio (mínimo 2 caracteres)');
  } else value.nombre = body.nombre.trim();

  if (typeof body.correo !== 'string' || !EMAIL_RE.test(body.correo.trim())) {
    errors.push('"correo" es obligatorio y debe ser un correo válido');
  } else value.correo = body.correo.trim().toLowerCase();

  return { value, errors };
}

module.exports = { validateUsuario };
