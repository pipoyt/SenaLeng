const router = require('express').Router();
const c = require('../controllers/videos.controller');
const validateId = require('../middlewares/validateId');
const wrap = require('../utils/asyncHandler');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { receiveVideo } = require('../services/storage');

// Todo el flujo de videos es para administradores o superiores.
router.use(requireAuth, requireRole('admin'));

router.get('/', c.list);
router.post('/', receiveVideo, wrap(c.create));
router.get('/pendientes/total', requireRole('superusuario'), c.pendientesTotal);
router.get('/:id', validateId('id'), c.getById);
router.patch('/:id/revision', validateId('id'), requireRole('superusuario'), c.revisar);
router.delete('/:id', validateId('id'), wrap(c.remove));

module.exports = router;
