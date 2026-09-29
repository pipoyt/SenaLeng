const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordErrors = (pw, campo = 'password') => {
  if (typeof pw !== 'string' || pw.length < 8) return [`"${campo}" debe tener al menos 8 caracteres`];
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return [`"${campo}" debe incluir letras y números`];
  if (pw.length > 72) return [`"${campo}" no debe exceder 72 caracteres`];
  return [];
};

function validateRegistro(body = {}) {
  const errors = [];
  const value = {};
  if (typeof body.nombre !== 'string' || body.nombre.trim().length < 2 || body.nombre.trim().length > 60) {
    errors.push('"nombre" es obligatorio (2 a 60 caracteres)');
  } else value.nombre = body.nombre.trim();

  if (typeof body.correo !== 'string' || !EMAIL_RE.test(body.correo.trim())) {
    errors.push('"correo" es obligatorio y debe ser un correo válido');
  } else value.correo = body.correo.trim().toLowerCase();

  errors.push(...passwordErrors(body.password));
  if (!errors.length) value.password = body.password;
  return { value, errors };
}

module.exports = { validateRegistro, passwordErrors, EMAIL_RE };
