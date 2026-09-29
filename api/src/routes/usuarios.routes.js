const router = require('express').Router();
const c = require('../controllers/usuarios.controller');
const validateId = require('../middlewares/validateId');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', requireRole('superusuario'), c.list);
router.get('/:id', validateId('id'), c.getById);
router.patch('/:id/rol', validateId('id'), requireRole('superusuario'), c.cambiarRol);
router.get('/:id/progreso', validateId('id'), c.getProgreso);
router.post('/:id/progreso', validateId('id'), c.addProgreso);
router.delete('/:id/progreso/:senaId', validateId('id', 'senaId'), c.removeProgreso);

module.exports = router;
