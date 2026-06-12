const express = require("express");
const router = express.Router();
const {
  getSessions,
  createSession,
  updateSession,
} = require("../controllers/sessionsController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All routes require authentication
router.use(authMiddleware);

// GET /api/sessions — scoped by role in controller
router.get("/", getSessions);

// POST /api/sessions — trainer or admin creates
router.post("/", roleCheck(["admin", "trainer"]), createSession);

// PUT /api/sessions/:id — trainer or admin updates status
router.put("/:id", roleCheck(["admin", "trainer"]), updateSession);

module.exports = router;
