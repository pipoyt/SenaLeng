/**
 * Capa de persistencia simple basada en un archivo JSON.
 *
 * Se eligió para la Unidad I porque no requiere instalar un motor de base de
 * datos y funciona igual en Windows, macOS y Linux. Toda la API accede a los
 * datos a través de este módulo, por lo que en la Unidad II se puede sustituir
 * por Prisma/Sequelize (PostgreSQL o MySQL) sin tocar controladores ni rutas.
 */
const fs = require('fs');
const path = require('path');
const { dbFile } = require('../config');
const bcrypt = require('bcryptjs');
const buildSeed = require('./seed');
const { principal, bcryptRounds } = require('../config');

const TABLES = ['senas', 'usuarios', 'favoritos', 'progreso', 'videos'];
const SCHEMA_VERSION = 2;

let state = null;

const emptyState = () => ({
  version: SCHEMA_VERSION,
  counters: Object.fromEntries(TABLES.map((t) => [t, 0])),
  ...Object.fromEntries(TABLES.map((t) => [t, []])),
});

function persist() {
  if (dbFile === ':memory:') return;
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  // Escritura atómica: se escribe a un temporal y luego se renombra.
  const tmp = `${dbFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, dbFile);
}

function seed() {
  state = emptyState();
  const data = buildSeed();
  for (const table of TABLES) {
    for (const row of data[table] || []) insert(table, row, { save: false });
  }
  persist();
}

/** Garantiza que exista exactamente una cuenta principal (por si se borró el archivo o cambió .env). */
function ensurePrincipal() {
  if (state.usuarios.some((u) => u.rol === 'principal')) return;
  insert('usuarios', {
    nombre: principal.nombre,
    correo: principal.correo,
    passwordHash: bcrypt.hashSync(principal.password, bcryptRounds),
    rol: 'principal',
    fechaCreacion: new Date().toISOString(),
    ultimoAcceso: null,
  });
}

function load() {
  if (state) return state;
  if (dbFile !== ':memory:' && fs.existsSync(dbFile)) {
    state = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    if ((state.version || 1) < SCHEMA_VERSION) {
      // La versión 1 (Unidad I) no tenía contraseñas ni roles: se regenera con los datos semilla.
      console.warn('⚠ Base de datos de una versión anterior: se regenera con los datos semilla.');
      seed();
      return state;
    }
    for (const t of TABLES) {
      state[t] = state[t] || [];
      state.counters = state.counters || {};
      state.counters[t] = state.counters[t] || state[t].reduce((m, r) => Math.max(m, r.id), 0);
    }
    ensurePrincipal();
  } else {
    seed();
  }
  return state;
}

const clone = (obj) => (obj ? JSON.parse(JSON.stringify(obj)) : obj);

function all(table) {
  return clone(load()[table]);
}

function findById(table, id) {
  return clone(load()[table].find((r) => r.id === Number(id)));
}

function findOne(table, predicate) {
  return clone(load()[table].find(predicate));
}

function insert(table, data, { save = true } = {}) {
  const db = state || load();
  db.counters[table] += 1;
  const row = { id: db.counters[table], ...data };
  db[table].push(row);
  if (save) persist();
  return clone(row);
}

function update(table, id, changes) {
  const db = load();
  const idx = db[table].findIndex((r) => r.id === Number(id));
  if (idx === -1) return null;
  db[table][idx] = { ...db[table][idx], ...changes, id: db[table][idx].id };
  persist();
  return clone(db[table][idx]);
}

function remove(table, id) {
  const db = load();
  const idx = db[table].findIndex((r) => r.id === Number(id));
  if (idx === -1) return null;
  const [deleted] = db[table].splice(idx, 1);
  persist();
  return deleted;
}

function removeWhere(table, predicate) {
  const db = load();
  const before = db[table].length;
  db[table] = db[table].filter((r) => !predicate(r));
  if (db[table].length !== before) persist();
  return before - db[table].length;
}

/** Restablece la base de datos a los datos semilla. */
function reset() {
  seed();
}

module.exports = { all, findById, findOne, insert, update, remove, removeWhere, reset };
