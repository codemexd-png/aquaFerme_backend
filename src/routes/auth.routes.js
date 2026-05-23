// Ce fichier définit les routes d'authentification pour notre application backend.

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const verifyToken = require("../middleware/auth.middleware");

router.post("/login", authController.login);
router.get("/me", verifyToken, authController.userInfo);

module.exports = router;
