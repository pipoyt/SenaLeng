const router = require('express').Router();
const c = require('../controllers/senas.controller');
const wrap = require('../utils/asyncHandler');
const validateId = require('../middlewares/validateId');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Lectura pública; crear/editar: admin o superior; eliminar: superusuario o superior.
const admin = [requireAuth, requireRole('admin')];
const superu = [requireAuth, requireRole('superusuario')];

router.get('/', c.list);
router.post('/', admin, c.create);
router.get('/:id', validateId('id'), c.getById);
router.get('/:id/relacionadas', validateId('id'), c.related);
router.put('/:id', validateId('id'), admin, c.replace);
router.patch('/:id', validateId('id'), admin, c.patch);
router.delete('/:id', validateId('id'), superu, wrap(c.remove));

module.exports = router;
