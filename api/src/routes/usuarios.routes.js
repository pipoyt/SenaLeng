const router = require('express').Router();
const c = require('../controllers/usuarios.controller');
const validateId = require('../middlewares/validateId');

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', validateId('id'), c.getById);
router.get('/:id/progreso', validateId('id'), c.getProgreso);
router.post('/:id/progreso', validateId('id'), c.addProgreso);
router.delete('/:id/progreso/:senaId', validateId('id', 'senaId'), c.removeProgreso);

module.exports = router;
