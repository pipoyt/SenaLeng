// npm run principal — aplica PRINCIPAL_NOMBRE / PRINCIPAL_CORREO / PRINCIPAL_PASSWORD de api/.env
// a la cuenta principal existente (útil si olvidaste la contraseña). Detén la API antes.
const bcrypt = require('bcryptjs');
const db = require('./store');
const { principal, bcryptRounds } = require('../config');

const actual = db.findOne('usuarios', (u) => u.rol === 'principal');
const otro = db.findOne('usuarios', (u) => u.correo === principal.correo && u.rol !== 'principal');
if (otro) {
  console.error(`✖ El correo ${principal.correo} ya lo usa otra cuenta (${otro.nombre}). Elige otro en PRINCIPAL_CORREO.`);
  process.exit(1);
}
db.update('usuarios', actual.id, {
  nombre: principal.nombre,
  correo: principal.correo,
  passwordHash: bcrypt.hashSync(principal.password, bcryptRounds),
});
console.log(`✔ Cuenta principal actualizada: ${principal.correo}`);
