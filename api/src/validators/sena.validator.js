const { NIVELES, canonicalNivel } = require('../utils/text');

const URL_RE = /^https?:\/\/\S+$/i;
const FIELDS = ['nombre', 'categoria', 'descripcion', 'videoUrl', 'imagenUrl', 'nivel', 'icono'];
const REQUIRED = ['nombre', 'categoria', 'descripcion', 'nivel'];

/**
 * Valida y limpia el cuerpo de una seña.
 * @param {object} body  cuerpo recibido
 * @param {boolean} partial  true para PATCH (ningún campo es obligatorio)
 * @returns {{ value: object, errors: string[] }}
 */
function validateSena(body = {}, partial = false) {
  const errors = [];
  const value = {};

  if (typeof body !== 'object' || Array.isArray(body)) {
    return { value, errors: ['El cuerpo debe ser un objeto JSON'] };
  }

  const unknown = Object.keys(body).filter((k) => !FIELDS.includes(k) && !['id', 'fechaCreacion'].includes(k));
  if (unknown.length) errors.push(`Campos no permitidos: ${unknown.join(', ')}`);

  if (!partial) {
    for (const f of REQUIRED) {
      if (body[f] === undefined || body[f] === null || String(body[f]).trim() === '') {
        errors.push(`El campo "${f}" es obligatorio`);
      }
    }
  } else if (!FIELDS.some((f) => body[f] !== undefined)) {
    errors.push('Debes enviar al menos un campo para actualizar');
  }

  for (const f of ['nombre', 'categoria', 'descripcion', 'icono']) {
    if (body[f] === undefined || body[f] === null) continue;
    if (typeof body[f] !== 'string') errors.push(`"${f}" debe ser texto`);
    else value[f] = body[f].trim();
  }
  if (value.nombre !== undefined && (value.nombre.length < 1 || value.nombre.length > 80)) {
    errors.push('"nombre" debe tener entre 1 y 80 caracteres');
  }
  if (value.categoria !== undefined && value.categoria.length > 40) {
    errors.push('"categoria" no debe exceder 40 caracteres');
  }
  if (value.descripcion !== undefined && value.descripcion.length > 1000) {
    errors.push('"descripcion" no debe exceder 1000 caracteres');
  }

  for (const f of ['videoUrl', 'imagenUrl']) {
    if (body[f] === undefined) continue;
    if (body[f] === null || body[f] === '') value[f] = null;
    else if (typeof body[f] !== 'string' || !URL_RE.test(body[f])) errors.push(`"${f}" debe ser una URL válida (http/https)`);
    else value[f] = body[f].trim();
  }

  if (body.nivel !== undefined && body.nivel !== null) {
    const nivel = canonicalNivel(body.nivel);
    if (!nivel) errors.push(`"nivel" debe ser uno de: ${NIVELES.join(', ')}`);
    else value.nivel = nivel;
  }

  return { value, errors };
}

module.exports = { validateSena };
