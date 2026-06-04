const express = require("express");
const router = express.Router();

const statisticsController = require("../controllers/statistics.controller");
const verifyToken = require("../middleware/auth.middleware");

router.get("/", verifyToken, statisticsController.getDashboardStats);

module.exports = router;