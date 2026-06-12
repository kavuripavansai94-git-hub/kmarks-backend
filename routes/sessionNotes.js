const express = require("express");
const router = express.Router();
const { addSessionNote } = require("../controllers/sessionsController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All routes require authentication + trainer/admin role
router.use(authMiddleware);
router.use(roleCheck(["admin", "trainer"]));

// POST /api/session-notes — trainer adds note to session
router.post("/", addSessionNote);

module.exports = router;
