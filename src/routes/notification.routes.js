const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sale.controller');
const verifyToken = require('../middleware/auth.middleware');

router.get('/',          verifyToken, ctrl.getNotifications);
router.patch('/:id/read', verifyToken, ctrl.markRead);
router.patch('/read-all', verifyToken, ctrl.markAllRead);

module.exports = router;
