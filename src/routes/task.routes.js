// Ce fichier déclare les endpoints pour la gestion des tâches (planning).
// Il ne contient pas de logique métier — tout est dans task.controller.js.
// Toutes les routes sont protégées par verifyToken (middleware JWT d'Ibrahim).
//
// Routes disponibles :
//   POST  /tasks                → créer une tâche
//   GET   /tasks                → voir toutes les tâches
//   GET   /tasks?date=...       → filtrer par date
//   GET   /tasks?user_id=...    → filtrer par utilisateur
//   PATCH /tasks/:id/status     → mettre à jour le statut (pending/completed)

const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const verifyToken = require("../middleware/auth.middleware");

// verifyToken s'exécute avant le controller : si le token est invalide, la requête est bloquée
router.post("/", verifyToken, taskController.addTask);
router.get("/", verifyToken, taskController.getTasks);
router.patch("/:id/status", verifyToken, taskController.updateTaskStatus);
// POST /ponds/:id/feed — saisir la consommation journalière

router.patch("/:id", verifyToken, taskController.updateTask);
router.delete("/:id", verifyToken, taskController.deleteTask);

module.exports = router;
