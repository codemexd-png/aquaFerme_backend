const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controllers");
const verifyToken = require("../middleware/auth.middleware");

router.get("/", verifyToken, userController.getUsers);
router.post("/", verifyToken, userController.createUser);
router.patch("/:id", verifyToken, userController.updateUser);
router.delete("/:id", verifyToken, userController.deleteUser);

module.exports = router;