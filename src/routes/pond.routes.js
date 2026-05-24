const express = require("express");
const router = express.Router();

const pondController = require("../controllers/pond.controller");

// Middleware JWT
const verifyToken = require("../middleware/auth.middleware");


// =========================
// GET /ponds
// =========================
router.get(
  "/",
  verifyToken,
  pondController.getAllPonds
);


// =========================
// GET /ponds/:id
// =========================
router.get(
  "/:id",
  verifyToken,
  pondController.getPondById
);


// =========================
// GET /ponds/:id/stats
// =========================
router.get(
  "/:id/stats",
  verifyToken,
  pondController.getPondStats
);


module.exports = router;