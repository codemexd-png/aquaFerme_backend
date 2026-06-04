// Ce fichier déclare les endpoints pour les relevés de qualité de l'eau.
// Il ne contient pas de logique métier — tout est dans waterQuality.controller.js.
// Toutes les routes sont protégées par verifyToken (middleware JWT d'Ibrahim).
//
// Routes disponibles :
//   POST /water-quality           → enregistrer un nouveau relevé
//   GET  /water-quality?pond_id=1 → historique des relevés d'un étang

const express = require('express');
const router = express.Router();
const waterQualityController = require('../controllers/waterQuality.controller');
const verifyToken = require('../middleware/auth.middleware');

// verifyToken s'exécute avant le controller : si le token est invalide, la requête est bloquée
router.post('/', verifyToken, waterQualityController.addMeasurement);
router.get('/', verifyToken, waterQualityController.getMeasurements);

router.patch("/:id", verifyToken, waterQualityController.updateMeasurement);
router.delete("/:id", verifyToken, waterQualityController.deleteMeasurement);

module.exports = router;
