const express = require("express");
const router = express.Router();
const { getProgressLogs, createProgressLog } = require("../controllers/progressController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All routes require authentication
router.use(authMiddleware);

// GET /api/progress/:member_id — trainer, member (own), or admin
router.get("/:member_id", getProgressLogs);

// POST /api/progress — trainer, member (own), or admin
router.post("/", roleCheck(["admin", "trainer", "member"]), createProgressLog);

module.exports = router;
