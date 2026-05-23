const express = require('express');
const router = express.Router();
const fishOperationController = require('../controllers/fishOperation.controller');
const verifyToken = require('../middleware/auth.middleware');

// Toutes les routes sont protégées par le middleware JWT d'Ibrahim
router.post('/', verifyToken, fishOperationController.addOperation);
router.get('/', verifyToken, fishOperationController.getOperations);

module.exports = router;
