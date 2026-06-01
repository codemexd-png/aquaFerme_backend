const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const verifyToken = require("../middleware/auth.middleware");

// Route pour récupérer tous les utilisateurs 
router.get("/", verifyToken, usersController.getUsers);

module.exports = router;
