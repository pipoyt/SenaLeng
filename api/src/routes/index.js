const router = require('express').Router();
const { ok } = require('../utils/response');
const pkg = require('../../package.json');

router.get('/', (_req, res) =>
  ok(res, {
    nombre: 'SeñaLeng API',
    version: pkg.version,
    documentacion: '/api/docs',
    recursos: ['/api/auth', '/api/senas', '/api/categorias', '/api/favoritos', '/api/usuarios', '/api/videos', '/api/estadisticas'],
  }),
);
router.get('/health', (_req, res) => ok(res, { status: 'ok', uptime: process.uptime() }));

router.use('/auth', require('./auth.routes'));
router.use('/senas', require('./senas.routes'));
router.use('/categorias', require('./categorias.routes'));
router.use('/favoritos', require('./favoritos.routes'));
router.use('/usuarios', require('./usuarios.routes'));
router.use('/videos', require('./videos.routes'));
router.use('/estadisticas', require('./estadisticas.routes'));

module.exports = router;
