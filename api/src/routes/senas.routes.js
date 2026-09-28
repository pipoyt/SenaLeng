const router = require('express').Router();
const c = require('../controllers/senas.controller');
const validateId = require('../middlewares/validateId');

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', validateId('id'), c.getById);
router.get('/:id/relacionadas', validateId('id'), c.related);
router.put('/:id', validateId('id'), c.replace);
router.patch('/:id', validateId('id'), c.patch);
router.delete('/:id', validateId('id'), c.remove);

module.exports = router;
