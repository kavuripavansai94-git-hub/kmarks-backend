const express = require("express");
const router = express.Router();
const { getAnnouncements, createAnnouncement } = require("../controllers/announcementsController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All routes require authentication
router.use(authMiddleware);

// GET /api/announcements — all authenticated users
router.get("/", getAnnouncements);

// POST /api/announcements — admin only
router.post("/", roleCheck(["admin"]), createAnnouncement);

module.exports = router;
