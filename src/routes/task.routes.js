const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const verifyToken = require('../middleware/auth.middleware');

// Toutes les routes sont protégées par le middleware JWT d'Ibrahim
router.post('/', verifyToken, taskController.addTask);
router.get('/', verifyToken, taskController.getTasks);
router.patch('/:id/status', verifyToken, taskController.updateTaskStatus);

module.exports = router;
