function validateFavorito(body = {}, partial = false) {
  const errors = [];
  const value = {};

  if (!partial) {
    const senaId = Number(body.senaId);
    if (!Number.isInteger(senaId) || senaId < 1) errors.push('"senaId" es obligatorio y debe ser un entero positivo');
    else value.senaId = senaId;

    if (body.usuarioId !== undefined) {
      const usuarioId = Number(body.usuarioId);
      if (!Number.isInteger(usuarioId) || usuarioId < 1) errors.push('"usuarioId" debe ser un entero positivo');
      else value.usuarioId = usuarioId;
    }
  } else if (body.comentario === undefined) {
    errors.push('Debes enviar el campo "comentario"');
  }

  if (body.comentario !== undefined && body.comentario !== null) {
    if (typeof body.comentario !== 'string') errors.push('"comentario" debe ser texto');
    else if (body.comentario.length > 280) errors.push('"comentario" no debe exceder 280 caracteres');
    else value.comentario = body.comentario.trim();
  } else if (body.comentario === null) {
    value.comentario = '';
  }

  return { value, errors };
}

module.exports = { validateFavorito };
