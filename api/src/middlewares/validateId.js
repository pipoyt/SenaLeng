const { ApiError } = require('../utils/response');

/** Verifica que los parámetros indicados sean enteros positivos. */
module.exports = (...params) => (req, _res, next) => {
  for (const p of params) {
    const n = Number(req.params[p]);
    if (!Number.isInteger(n) || n < 1) {
      return next(new ApiError(400, `El parámetro "${p}" debe ser un entero positivo`));
    }
  }
  next();
};
