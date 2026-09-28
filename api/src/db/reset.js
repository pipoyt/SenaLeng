// npm run seed — restablece data/db.json con los datos semilla
const db = require('./store');
db.reset();
console.log('✔ Base de datos restablecida con los datos semilla');
