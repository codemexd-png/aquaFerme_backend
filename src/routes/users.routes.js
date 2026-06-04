const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const verifyToken = require("../middleware/auth.middleware");

// Route pour récupérer tous les utilisateurs 
router.post("/", verifyToken, usersController.createUser);
router.get("/", verifyToken, usersController.getUsers);
router.patch("/:id", verifyToken, usersController.updateUser);
router.delete("/:id", verifyToken, usersController.deleteUser);

module.exports = router;
