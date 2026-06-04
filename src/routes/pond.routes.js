const express = require("express");
const router = express.Router();

const pondController = require("../controllers/pond.controller");

// Middleware JWT
const verifyToken = require("../middleware/auth.middleware");

// =========================
// GET /ponds
// =========================
router.get("/", verifyToken, pondController.getAllPonds);

// =========================
// GET /ponds/:id
// =========================
router.get("/:id", verifyToken, pondController.getPondById);

// =========================
// GET /ponds/:id/stats
// =========================
router.get("/:id/stats", verifyToken, pondController.getPondStats);

router.post("/:id/feed", verifyToken, pondController.updateDailyFeed);

router.post("/", verifyToken, pondController.createPond);
router.patch("/:id", verifyToken, pondController.updatePond);
router.delete("/:id", verifyToken, pondController.deletePond);

module.exports = router;
