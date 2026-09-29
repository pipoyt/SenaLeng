const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth');

router.post('/registro', c.registro);
router.post('/login', c.login);
router.get('/me', requireAuth, c.me);
router.patch('/password', requireAuth, c.cambiarPassword);

module.exports = router;
