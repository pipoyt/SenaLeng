/**
 * Pruebas de integración de la API (node:test + supertest).
 * Ejecutar con: npm test
 */
process.env.DB_FILE = ':memory:';
process.env.NODE_ENV = 'test';

const { test, beforeEach, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/store');

beforeEach(() => db.reset());

const nueva = {
  nombre: 'Abuela',
  categoria: 'Familia',
  descripcion: 'Seña de prueba para abuela.',
  nivel: 'basico',
  icono: '👵',
};

describe('Señas — CRUD', () => {
  test('GET /api/senas lista todas con meta', async () => {
    const res = await request(app).get('/api/senas').expect(200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length > 20);
    assert.equal(res.body.meta.total, res.body.data.length);
  });

  test('GET /api/senas?categoria=familia filtra sin acentos/mayúsculas', async () => {
    const res = await request(app).get('/api/senas?categoria=familia').expect(200);
    assert.ok(res.body.data.every((s) => s.categoria === 'Familia'));
  });

  test('GET /api/senas?nivel=basico filtra por nivel', async () => {
    const res = await request(app).get('/api/senas?nivel=basico').expect(200);
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data.every((s) => s.nivel === 'Básico'));
  });

  test('GET /api/senas?q=mama busca sin acentos', async () => {
    const res = await request(app).get('/api/senas?q=mama').expect(200);
    assert.equal(res.body.data[0].nombre, 'Mamá');
  });

  test('GET /api/senas paginado', async () => {
    const res = await request(app).get('/api/senas?limit=5&page=2').expect(200);
    assert.equal(res.body.data.length, 5);
    assert.equal(res.body.data[0].id, 6);
  });

  test('GET /api/senas/:id devuelve una seña y 404 si no existe', async () => {
    const ok = await request(app).get('/api/senas/1').expect(200);
    assert.equal(ok.body.data.id, 1);
    const nf = await request(app).get('/api/senas/9999').expect(404);
    assert.deepEqual(nf.body, { success: false, error: { code: 404, message: 'Seña no encontrada' } });
  });

  test('GET /api/senas/abc responde 400', async () => {
    await request(app).get('/api/senas/abc').expect(400);
  });

  test('POST crea, normaliza nivel y agrega fechaCreacion', async () => {
    const res = await request(app).post('/api/senas').send(nueva).expect(201);
    assert.equal(res.body.data.nivel, 'Básico');
    assert.ok(res.body.data.fechaCreacion);
    assert.match(res.headers.location, /\/api\/senas\/\d+/);
  });

  test('POST valida campos obligatorios y URL', async () => {
    const res = await request(app).post('/api/senas').send({ nombre: 'X', videoUrl: 'no-url' }).expect(400);
    assert.ok(res.body.error.details.length >= 3);
  });

  test('POST duplicado responde 409', async () => {
    await request(app).post('/api/senas').send({ ...nueva, nombre: 'Mamá' }).expect(409);
  });

  test('PUT reemplaza y PATCH actualiza parcialmente', async () => {
    const put = await request(app).put('/api/senas/1').send({ ...nueva, nombre: 'A editada' }).expect(200);
    assert.equal(put.body.data.nombre, 'A editada');
    const patch = await request(app).patch('/api/senas/1').send({ nivel: 'avanzado' }).expect(200);
    assert.equal(patch.body.data.nivel, 'Avanzado');
    assert.equal(patch.body.data.nombre, 'A editada');
  });

  test('PATCH sin campos responde 400', async () => {
    await request(app).patch('/api/senas/1').send({}).expect(400);
  });

  test('DELETE elimina la seña y sus favoritos', async () => {
    await request(app).delete('/api/senas/6').expect(200);
    await request(app).get('/api/senas/6').expect(404);
    const favs = await request(app).get('/api/favoritos').expect(200);
    assert.ok(!favs.body.data.some((f) => f.senaId === 6));
  });

  test('GET relacionadas devuelve la misma categoría', async () => {
    const res = await request(app).get('/api/senas/11/relacionadas').expect(200);
    assert.equal(res.body.data.length, 3);
    assert.ok(res.body.data.every((s) => s.categoria === 'Frases comunes' && s.id !== 11));
  });
});

describe('Favoritos — CRUD', () => {
  test('flujo completo: crear, leer, editar y eliminar', async () => {
    const created = await request(app).post('/api/favoritos').send({ senaId: 2, comentario: 'Repasar' }).expect(201);
    const id = created.body.data.id;
    assert.equal(created.body.data.sena.nombre, 'B');

    const list = await request(app).get('/api/favoritos?usuarioId=1').expect(200);
    assert.ok(list.body.data.some((f) => f.id === id));

    const upd = await request(app).patch(`/api/favoritos/${id}`).send({ comentario: 'Ya la sé' }).expect(200);
    assert.equal(upd.body.data.comentario, 'Ya la sé');

    await request(app).delete(`/api/favoritos/${id}`).expect(200);
    await request(app).get(`/api/favoritos/${id}`).expect(404);
  });

  test('no permite duplicados ni señas inexistentes', async () => {
    await request(app).post('/api/favoritos').send({ senaId: 6 }).expect(409);
    await request(app).post('/api/favoritos').send({ senaId: 9999 }).expect(404);
    await request(app).post('/api/favoritos').send({}).expect(400);
  });

  test('busca en favoritos', async () => {
    const res = await request(app).get('/api/favoritos?q=gracias').expect(200);
    assert.equal(res.body.data.length, 1);
  });
});

describe('Usuarios y progreso', () => {
  test('registra usuario y rechaza correo repetido', async () => {
    const res = await request(app).post('/api/usuarios').send({ nombre: 'Ana', correo: 'ANA@correo.com' }).expect(201);
    assert.equal(res.body.data.correo, 'ana@correo.com');
    await request(app).post('/api/usuarios').send({ nombre: 'Ana 2', correo: 'ana@correo.com' }).expect(409);
    await request(app).post('/api/usuarios').send({ nombre: 'A', correo: 'x' }).expect(400);
  });

  test('consulta y modifica el progreso', async () => {
    const before = await request(app).get('/api/usuarios/1/progreso').expect(200);
    await request(app).post('/api/usuarios/1/progreso').send({ senaId: 1 }).expect(201);
    await request(app).post('/api/usuarios/1/progreso').send({ senaId: 1 }).expect(409);
    const after = await request(app).get('/api/usuarios/1/progreso').expect(200);
    assert.equal(after.body.data.totalAprendidas, before.body.data.totalAprendidas + 1);
    await request(app).delete('/api/usuarios/1/progreso/1').expect(200);
    await request(app).get('/api/usuarios/999/progreso').expect(404);
  });
});

describe('Generales', () => {
  test('categorías con conteo', async () => {
    const res = await request(app).get('/api/categorias').expect(200);
    assert.ok(res.body.data.find((c) => c.nombre === 'Alfabeto').total >= 5);
  });

  test('ruta inexistente y JSON mal formado', async () => {
    await request(app).get('/api/nada').expect(404);
    await request(app).post('/api/senas').set('Content-Type', 'application/json').send('{mal').expect(400);
  });

  test('documentación OpenAPI disponible', async () => {
    const res = await request(app).get('/api/openapi.json').expect(200);
    assert.equal(res.body.openapi, '3.0.3');
    await request(app).get('/api/docs/').expect(200);
  });
});
