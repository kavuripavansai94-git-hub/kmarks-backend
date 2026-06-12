const express = require("express");
const router = express.Router();
const { getAttendance, markAttendance, getAllAttendance } = require("../controllers/attendanceController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All routes require authentication
router.use(authMiddleware);

// GET /api/attendance — admin or trainer gets all attendance
router.get("/", roleCheck(["admin", "trainer"]), getAllAttendance);

// GET /api/attendance/:member_id — admin, trainer, or that member
router.get("/:member_id", getAttendance);

// POST /api/attendance — trainer or admin marks present
router.post("/", roleCheck(["admin", "trainer"]), markAttendance);

module.exports = router;
