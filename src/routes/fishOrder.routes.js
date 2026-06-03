const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/fishOrder.controller');
const verifyToken = require('../middleware/auth.middleware');

router.get('/',        verifyToken, ctrl.getOrders);
router.post('/',       verifyToken, ctrl.createOrder);
router.patch('/:id',   verifyToken, ctrl.updateOrder);
router.delete('/:id',  verifyToken, ctrl.deleteOrder);

module.exports = router;
