const path = require('path');

module.exports = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  // Ruta del archivo JSON que funciona como base de datos.
  // Usa ":memory:" para no escribir en disco (pruebas).
  dbFile: process.env.DB_FILE || path.join(__dirname, '..', '..', 'data', 'db.json'),
  // Usuario por defecto mientras no exista autenticación (Unidad I).
  defaultUserId: 1,
};
