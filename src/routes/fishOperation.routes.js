// Ce fichier déclare les endpoints pour les opérations sur les poissons.
// Il ne contient pas de logique métier — tout est dans fishOperation.controller.js.
// Toutes les routes sont protégées par verifyToken (middleware JWT d'Ibrahim) :
// le frontend doit envoyer un header Authorization: Bearer <token> pour y accéder.
//
// Routes disponibles :
//   POST /fish-operations           → créer une opération (addition, mortalité, transfert, contrôle)
//   GET  /fish-operations?pond_id=1 → historique des opérations d'un étang

const express = require('express');
const router = express.Router();
const fishOperationController = require('../controllers/fishOperation.controller');
const verifyToken = require('../middleware/auth.middleware');

// verifyToken s'exécute avant le controller : si le token est invalide, la requête est bloquée
router.post('/', verifyToken, fishOperationController.addOperation);
router.get('/', verifyToken, fishOperationController.getOperations);

router.patch("/:id", verifyToken, fishOperationController.updateOperation);
router.delete("/:id", verifyToken, fishOperationController.deleteOperation);

module.exports = router;
