const router = require('express').Router();
const c = require('../controllers/estadisticas.controller');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Exclusivo del superusuario principal.
router.get('/', requireAuth, requireRole('principal'), c.general);

module.exports = router;
