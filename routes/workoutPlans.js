const express = require("express");
const router = express.Router();
const {
  getAllPlans,
  getPlanById,
  createPlan,
  deletePlan,
  createDay,
  deleteDay,
  addExercise,
} = require("../controllers/workoutController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All routes require authentication
router.use(authMiddleware);

// ─── Workout Plans ───────────────────────────────────────────
// GET  — admin/trainer/member (scoped in controller)
router.get("/", getAllPlans);
router.get("/:id", getPlanById);

// POST / DELETE — trainer + admin only
router.post("/", roleCheck(["admin", "trainer"]), createPlan);
router.delete("/:id", roleCheck(["admin", "trainer"]), deletePlan);

module.exports = router;
