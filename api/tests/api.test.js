/**
 * Pruebas de integración de la API (node:test + supertest).
 * Ejecutar con: npm test
 */
const os = require('os');
const path = require('path');
const fs = require('fs');

process.env.DB_FILE = ':memory:';
process.env.NODE_ENV = 'test';
process.env.UPLOADS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'senaleng-'));
process.env.MAX_VIDEO_MB = '1';

const { test, beforeEach, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/store');
const { _resetLimiter } = require('../src/controllers/auth.controller');

// Cuentas semilla
const CUENTAS = {
  principal: ['principal@senaleng.app', 'Principal123!'],
  super: ['super@senaleng.app', 'Super123!'],
  admin: ['admin@senaleng.app', 'Admin123!'],
  usuario: ['usuario@senaleng.app', 'Usuario123!'],
};
const IDS = { principal: 1, super: 2, admin: 3, usuario: 4 };

const tokens = {};
async function login(quien) {
  const [correo, password] = CUENTAS[quien];
  const res = await request(app).post('/api/auth/login').send({ correo, password }).expect(200);
  return res.body.data.token;
}
const auth = (quien) => ({ Authorization: `Bearer ${tokens[quien]}` });

beforeEach(async () => {
  db.reset();
  _resetLimiter();
  for (const q of Object.keys(CUENTAS)) tokens[q] = await login(q);
});

const nueva = { nombre: 'Abuela', categoria: 'Familia', descripcion: 'Seña de prueba para abuela.', nivel: 'basico', icono: '👵' };
const VIDEO = Buffer.from('00000020667479706d703432', 'hex'); // bytes de ejemplo

const enviarVideo = (quien = 'admin', senaId = 11) =>
  request(app)
    .post('/api/videos')
    .set(auth(quien))
    .field('senaId', String(senaId))
    .field('nota', 'Prueba')
    .attach('video', VIDEO, { filename: 'gracias.mp4', contentType: 'video/mp4' });

describe('Autenticación', () => {
  test('registro crea usuario con rol "usuario" y devuelve token', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Ana', correo: 'ANA@correo.com', password: 'Clave2026' })
      .expect(201);
    assert.equal(res.body.data.usuario.rol, 'usuario');
    assert.equal(res.body.data.usuario.correo, 'ana@correo.com');
    assert.equal(res.body.data.usuario.passwordHash, undefined);
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.data.token}`).expect(200);
    assert.equal(me.body.data.nombre, 'Ana');
  });

  test('registro valida datos y correo repetido', async () => {
    await request(app).post('/api/auth/registro').send({ nombre: 'A', correo: 'x', password: '123' }).expect(400);
    await request(app).post('/api/auth/registro').send({ nombre: 'Otra', correo: 'admin@senaleng.app', password: 'Clave2026' }).expect(409);
    await request(app).post('/api/auth/registro').send({ nombre: 'Otra', correo: 'o@o.com', password: 'solo-letras' }).expect(400);
  });

  test('login incorrecto → 401 y bloqueo tras 5 intentos → 429', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/api/auth/login').send({ correo: 'usuario@senaleng.app', password: 'mal' }).expect(401);
    }
    await request(app).post('/api/auth/login').send({ correo: 'usuario@senaleng.app', password: 'Usuario123!' }).expect(429);
  });

  test('token inválido o ausente', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer basura').expect(401);
  });

  test('cambiar contraseña', async () => {
    await request(app).patch('/api/auth/password').set(auth('usuario')).send({ actual: 'mal', nueva: 'Nueva2026' }).expect(400);
    await request(app).patch('/api/auth/password').set(auth('usuario')).send({ actual: 'Usuario123!', nueva: 'Nueva2026' }).expect(200);
    await request(app).post('/api/auth/login').send({ correo: 'usuario@senaleng.app', password: 'Nueva2026' }).expect(200);
  });
});

describe('Roles', () => {
  test('solo superusuarios listan usuarios', async () => {
    await request(app).get('/api/usuarios').set(auth('usuario')).expect(403);
    await request(app).get('/api/usuarios').set(auth('admin')).expect(403);
    const res = await request(app).get('/api/usuarios').set(auth('super')).expect(200);
    assert.equal(res.body.data.length, 4);
    assert.ok(res.body.data.every((u) => u.passwordHash === undefined && u.resumen));
  });

  test('superusuario asigna admin y superusuario', async () => {
    const a = await request(app).patch(`/api/usuarios/${IDS.usuario}/rol`).set(auth('super')).send({ rol: 'admin' }).expect(200);
    assert.equal(a.body.data.rol, 'admin');
    const s = await request(app).patch(`/api/usuarios/${IDS.admin}/rol`).set(auth('super')).send({ rol: 'superusuario' }).expect(200);
    assert.equal(s.body.data.rol, 'superusuario');
  });

  test('reglas de protección de roles', async () => {
    // rol inválido o "principal"
    await request(app).patch(`/api/usuarios/${IDS.usuario}/rol`).set(auth('super')).send({ rol: 'principal' }).expect(400);
    // no puede cambiarse a sí mismo
    await request(app).patch(`/api/usuarios/${IDS.super}/rol`).set(auth('super')).send({ rol: 'usuario' }).expect(403);
    // no puede tocar al principal
    await request(app).patch(`/api/usuarios/${IDS.principal}/rol`).set(auth('super')).send({ rol: 'usuario' }).expect(403);
    // un superusuario no puede degradar a otro superusuario...
    await request(app).patch(`/api/usuarios/${IDS.admin}/rol`).set(auth('super')).send({ rol: 'superusuario' }).expect(200);
    await request(app).patch(`/api/usuarios/${IDS.admin}/rol`).set(auth('super')).send({ rol: 'usuario' }).expect(403);
    // ...pero el principal sí
    await request(app).patch(`/api/usuarios/${IDS.admin}/rol`).set(auth('principal')).send({ rol: 'admin' }).expect(200);
    // un admin no asigna roles
    await request(app).patch(`/api/usuarios/${IDS.usuario}/rol`).set(auth('admin')).send({ rol: 'admin' }).expect(403);
  });

  test('el nuevo rol aplica de inmediato con el mismo token', async () => {
    await request(app).get('/api/videos').set(auth('usuario')).expect(403);
    await request(app).patch(`/api/usuarios/${IDS.usuario}/rol`).set(auth('super')).send({ rol: 'admin' }).expect(200);
    await request(app).get('/api/videos').set(auth('usuario')).expect(200);
  });
});

describe('Señas', () => {
  test('lectura pública con filtros, búsqueda y paginación', async () => {
    const all = await request(app).get('/api/senas').expect(200);
    assert.ok(all.body.data.length > 20);
    const fam = await request(app).get('/api/senas?categoria=familia').expect(200);
    assert.ok(fam.body.data.every((s) => s.categoria === 'Familia'));
    const q = await request(app).get('/api/senas?q=mama').expect(200);
    assert.equal(q.body.data[0].nombre, 'Mamá');
    const pg = await request(app).get('/api/senas?limit=5&page=2').expect(200);
    assert.equal(pg.body.data[0].id, 6);
    await request(app).get('/api/senas/9999').expect(404);
    await request(app).get('/api/senas/abc').expect(400);
  });

  test('crear/editar requiere admin; eliminar requiere superusuario', async () => {
    await request(app).post('/api/senas').send(nueva).expect(401);
    await request(app).post('/api/senas').set(auth('usuario')).send(nueva).expect(403);
    const c = await request(app).post('/api/senas').set(auth('admin')).send(nueva).expect(201);
    assert.equal(c.body.data.nivel, 'Básico');
    const id = c.body.data.id;
    await request(app).patch(`/api/senas/${id}`).set(auth('admin')).send({ nivel: 'avanzado' }).expect(200);
    await request(app).delete(`/api/senas/${id}`).set(auth('admin')).expect(403);
    await request(app).delete(`/api/senas/${id}`).set(auth('super')).expect(200);
    await request(app).get(`/api/senas/${id}`).expect(404);
  });

  test('un admin no puede fijar videoUrl directamente; un superusuario sí', async () => {
    const c = await request(app).post('/api/senas').set(auth('admin')).send({ ...nueva, videoUrl: 'https://x.com/v.mp4' }).expect(201);
    assert.equal(c.body.data.videoUrl, null);
    const p = await request(app).patch(`/api/senas/${c.body.data.id}`).set(auth('super')).send({ videoUrl: 'https://x.com/v.mp4' }).expect(200);
    assert.equal(p.body.data.videoUrl, 'https://x.com/v.mp4');
  });

  test('validaciones y duplicados', async () => {
    const r = await request(app).post('/api/senas').set(auth('admin')).send({ nombre: 'X', videoUrl: 'no-url' }).expect(400);
    assert.ok(r.body.error.details.length >= 3);
    await request(app).post('/api/senas').set(auth('admin')).send({ ...nueva, nombre: 'Mamá' }).expect(409);
  });
});

describe('Favoritos por usuario', () => {
  test('CRUD completo con la sesión', async () => {
    await request(app).get('/api/favoritos').expect(401);
    const c = await request(app).post('/api/favoritos').set(auth('usuario')).send({ senaId: 2, comentario: 'Repasar' }).expect(201);
    const id = c.body.data.id;
    assert.equal(c.body.data.usuarioId, IDS.usuario);
    const list = await request(app).get('/api/favoritos').set(auth('usuario')).expect(200);
    assert.equal(list.body.data.length, 4);
    await request(app).patch(`/api/favoritos/${id}`).set(auth('usuario')).send({ comentario: 'Ya la sé' }).expect(200);
    await request(app).delete(`/api/favoritos/${id}`).set(auth('usuario')).expect(200);
    await request(app).post('/api/favoritos').set(auth('usuario')).send({ senaId: 6 }).expect(409);
  });

  test('cada usuario solo ve y modifica sus favoritos', async () => {
    const otros = await request(app).get('/api/favoritos').set(auth('admin')).expect(200);
    assert.equal(otros.body.data.length, 0);
    await request(app).delete('/api/favoritos/1').set(auth('admin')).expect(404);
    await request(app).patch('/api/favoritos/1').set(auth('admin')).send({ comentario: 'hack' }).expect(404);
  });
});

describe('Progreso', () => {
  test('propio progreso: consultar, marcar y desmarcar', async () => {
    const before = await request(app).get(`/api/usuarios/${IDS.usuario}/progreso`).set(auth('usuario')).expect(200);
    await request(app).post(`/api/usuarios/${IDS.usuario}/progreso`).set(auth('usuario')).send({ senaId: 1 }).expect(201);
    await request(app).post(`/api/usuarios/${IDS.usuario}/progreso`).set(auth('usuario')).send({ senaId: 1 }).expect(409);
    const after = await request(app).get(`/api/usuarios/${IDS.usuario}/progreso`).set(auth('usuario')).expect(200);
    assert.equal(after.body.data.totalAprendidas, before.body.data.totalAprendidas + 1);
    await request(app).delete(`/api/usuarios/${IDS.usuario}/progreso/1`).set(auth('usuario')).expect(200);
  });

  test('no se puede ver ni modificar el progreso ajeno (salvo superusuario para ver)', async () => {
    await request(app).get(`/api/usuarios/${IDS.usuario}/progreso`).set(auth('admin')).expect(403);
    await request(app).get(`/api/usuarios/${IDS.usuario}/progreso`).set(auth('super')).expect(200);
    await request(app).post(`/api/usuarios/${IDS.usuario}/progreso`).set(auth('super')).send({ senaId: 1 }).expect(403);
  });
});

describe('Videos y aprobación', () => {
  test('un usuario normal no puede enviar videos', async () => {
    await enviarVideo('usuario').expect(403);
  });

  test('flujo completo: admin envía → super aprueba → la seña queda con video', async () => {
    const env = await enviarVideo('admin', 11).expect(201);
    const v = env.body.data;
    assert.equal(v.estado, 'pendiente');
    assert.match(v.url, /^\/uploads\/videos\/.+\.mp4$/);
    assert.equal(v.sena.nombre, 'Gracias');

    // el archivo se puede descargar
    await request(app).get(v.url).expect(200);

    const pend = await request(app).get('/api/videos/pendientes/total').set(auth('super')).expect(200);
    assert.equal(pend.body.data.total, 1);
    await request(app).get('/api/videos/pendientes/total').set(auth('admin')).expect(403);

    const ap = await request(app).patch(`/api/videos/${v.id}/revision`).set(auth('super')).send({ accion: 'aprobar', comentario: 'Bien' }).expect(200);
    assert.equal(ap.body.data.estado, 'aprobado');
    assert.equal(ap.body.data.revisor.id, IDS.super);
    const sena = await request(app).get('/api/senas/11').expect(200);
    assert.equal(sena.body.data.videoUrl, v.url);

    // no se puede revisar dos veces
    await request(app).patch(`/api/videos/${v.id}/revision`).set(auth('super')).send({ accion: 'rechazar', comentario: 'x' }).expect(409);
  });

  test('aprobar un segundo video reemplaza al anterior', async () => {
    const a = (await enviarVideo('admin', 11).expect(201)).body.data;
    const b = (await enviarVideo('admin', 11).expect(201)).body.data;
    await request(app).patch(`/api/videos/${a.id}/revision`).set(auth('super')).send({ accion: 'aprobar' }).expect(200);
    await request(app).patch(`/api/videos/${b.id}/revision`).set(auth('principal')).send({ accion: 'aprobar' }).expect(200);
    const va = await request(app).get(`/api/videos/${a.id}`).set(auth('super')).expect(200);
    assert.equal(va.body.data.estado, 'reemplazado');
    const sena = await request(app).get('/api/senas/11').expect(200);
    assert.equal(sena.body.data.videoUrl, b.url);
  });

  test('rechazar exige motivo; el admin lo ve en sus videos', async () => {
    const v = (await enviarVideo('admin', 3).expect(201)).body.data;
    await request(app).patch(`/api/videos/${v.id}/revision`).set(auth('super')).send({ accion: 'rechazar' }).expect(400);
    await request(app).patch(`/api/videos/${v.id}/revision`).set(auth('admin')).send({ accion: 'aprobar' }).expect(403);
    await request(app).patch(`/api/videos/${v.id}/revision`).set(auth('super')).send({ accion: 'rechazar', comentario: 'Poca luz' }).expect(200);
    const mios = await request(app).get('/api/videos').set(auth('admin')).expect(200);
    assert.equal(mios.body.data[0].estado, 'rechazado');
    assert.equal(mios.body.data[0].comentarioRevision, 'Poca luz');
  });

  test('un admin solo ve sus videos; el superusuario ve todos', async () => {
    await request(app).patch(`/api/usuarios/${IDS.usuario}/rol`).set(auth('super')).send({ rol: 'admin' }).expect(200);
    await enviarVideo('admin', 1).expect(201);
    await enviarVideo('usuario', 2).expect(201); // ahora es admin
    const a = await request(app).get('/api/videos').set(auth('admin')).expect(200);
    assert.equal(a.body.data.length, 1);
    const s = await request(app).get('/api/videos?estado=pendiente').set(auth('super')).expect(200);
    assert.equal(s.body.data.length, 2);
  });

  test('validaciones de archivo', async () => {
    await request(app).post('/api/videos').set(auth('admin')).field('senaId', '1').expect(400);
    await request(app)
      .post('/api/videos')
      .set(auth('admin'))
      .field('senaId', '1')
      .attach('video', Buffer.from('hola'), { filename: 'a.txt', contentType: 'text/plain' })
      .expect(400);
    await request(app)
      .post('/api/videos')
      .set(auth('admin'))
      .field('senaId', '1')
      .attach('video', Buffer.alloc(1.5 * 1024 * 1024), { filename: 'big.mp4', contentType: 'video/mp4' })
      .expect(413);
    await enviarVideo('admin', 9999).expect(404);
  });

  test('borrar: el autor solo pendientes/rechazados; super cualquiera y limpia la seña', async () => {
    const v = (await enviarVideo('admin', 11).expect(201)).body.data;
    await request(app).patch(`/api/videos/${v.id}/revision`).set(auth('super')).send({ accion: 'aprobar' }).expect(200);
    await request(app).delete(`/api/videos/${v.id}`).set(auth('admin')).expect(403);
    await request(app).delete(`/api/videos/${v.id}`).set(auth('super')).expect(200);
    const sena = await request(app).get('/api/senas/11').expect(200);
    assert.equal(sena.body.data.videoUrl, null);
    await request(app).get(v.url).expect(404);
  });
});

describe('Estadísticas', () => {
  test('solo el superusuario principal puede verlas', async () => {
    await request(app).get('/api/estadisticas').set(auth('super')).expect(403);
    await request(app).get('/api/estadisticas').set(auth('admin')).expect(403);
    const v = (await enviarVideo('admin', 11).expect(201)).body.data;
    await request(app).patch(`/api/videos/${v.id}/revision`).set(auth('super')).send({ accion: 'aprobar' }).expect(200);
    const res = await request(app).get('/api/estadisticas').set(auth('principal')).expect(200);
    const d = res.body.data;
    assert.equal(d.usuarios.total, 4);
    assert.deepEqual(d.usuarios.porRol, { usuario: 1, admin: 1, superusuario: 1, principal: 1 });
    assert.equal(d.usuarios.registrosPorDia.length, 14);
    assert.equal(d.senas.conVideo, 1);
    assert.equal(d.videos.porEstado.aprobado, 1);
    assert.equal(d.videos.topAdmins[0].nombre, 'Admin Demo');
    assert.equal(d.aprendizaje.favoritosTotal, 3);
    assert.ok(d.aprendizaje.topFavoritas.length > 0);
  });

  test('siempre existe un solo principal', async () => {
    const res = await request(app).get('/api/usuarios?rol=principal').set(auth('super')).expect(200);
    assert.equal(res.body.data.length, 1);
  });
});

describe('Generales', () => {
  test('categorías, 404, JSON mal formado y documentación', async () => {
    const c = await request(app).get('/api/categorias').expect(200);
    assert.ok(c.body.data.find((x) => x.nombre === 'Alfabeto').total >= 5);
    await request(app).get('/api/nada').expect(404);
    await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{mal').expect(400);
    const o = await request(app).get('/api/openapi.json').expect(200);
    assert.equal(o.body.openapi, '3.0.3');
    await request(app).get('/api/docs/').expect(200);
  });
});
