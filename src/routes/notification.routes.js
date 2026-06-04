const express = require("express");
const router = express.Router();
const notifController = require("../controllers/notification.controller");
const verifyToken = require("../middleware/auth.middleware");

router.get("/", verifyToken, notifController.getNotifications);
router.post("/", verifyToken, notifController.createNotification);
router.patch("/read-all", verifyToken, notifController.markAllAsRead);
router.patch("/:id/read", verifyToken, notifController.markAsRead);

module.exports = router;
