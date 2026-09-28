const router = require('express').Router();
const c = require('../controllers/categorias.controller');

router.get('/', c.list);

module.exports = router;
