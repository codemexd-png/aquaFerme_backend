const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sale.controller');
const verifyToken = require('../middleware/auth.middleware');

// Ventes
router.get('/',       verifyToken, ctrl.getSales);
router.post('/',      verifyToken, ctrl.createSale);
router.delete('/:id', verifyToken, ctrl.deleteSale);

module.exports = router;
