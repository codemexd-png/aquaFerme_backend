const express = require('express');
const router = express.Router();
const feedStockController = require('../controllers/feed_stock.controller');
const verifyToken = require('../middleware/auth.middleware');

router.get('/', verifyToken, feedStockController.getAllStock);
router.put('/:id', verifyToken, feedStockController.updateStock);

module.exports = router;