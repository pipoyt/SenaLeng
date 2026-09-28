const db = require('../db/store');
const { ok } = require('../utils/response');

/** GET /api/categorias — categorías existentes con su número de señas (pantalla Inicio). */
exports.list = (_req, res) => {
  const map = new Map();
  for (const s of db.all('senas')) {
    const c = map.get(s.categoria) || { nombre: s.categoria, total: 0, icono: s.icono };
    c.total += 1;
    map.set(s.categoria, c);
  }
  return ok(res, [...map.values()]);
};
