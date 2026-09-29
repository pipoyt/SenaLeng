/** Express 4 no captura errores de funciones async: este envoltorio los pasa a next(). */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
