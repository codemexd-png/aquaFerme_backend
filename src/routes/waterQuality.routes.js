const express = require('express');
const router = express.Router();
const waterQualityController = require('../controllers/waterQuality.controller');
const verifyToken = require('../middleware/auth.middleware');

// Toutes les routes sont protégées par le middleware JWT d'Ibrahim
router.post('/', verifyToken, waterQualityController.addMeasurement);
router.get('/', verifyToken, waterQualityController.getMeasurements);

module.exports = router;
