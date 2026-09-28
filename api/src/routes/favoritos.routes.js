const router = require('express').Router();
const c = require('../controllers/favoritos.controller');
const validateId = require('../middlewares/validateId');

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', validateId('id'), c.getById);
router.put('/:id', validateId('id'), c.update);
router.patch('/:id', validateId('id'), c.update);
router.delete('/:id', validateId('id'), c.remove);

module.exports = router;
