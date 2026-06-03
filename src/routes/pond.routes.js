const express = require("express");
const router = express.Router();

const pondController = require("../controllers/pond.controller");

// Middleware JWT
const verifyToken = require("../middleware/auth.middleware");

router.get("/", verifyToken, pondController.getAllPonds);
router.get("/dashboard-stats", verifyToken, pondController.getDashboardStats);
router.get("/:id", verifyToken, pondController.getPondById);
router.get("/:id/stats", verifyToken, pondController.getPondStats);
router.post("/:id/feed", verifyToken, pondController.updateDailyFeed);

module.exports = router;
