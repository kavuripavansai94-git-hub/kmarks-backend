const express = require("express");
const router = express.Router();
const {
  createDay,
  deleteDay,
  addExercise,
} = require("../controllers/workoutController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All routes require authentication + trainer/admin role
router.use(authMiddleware);
router.use(roleCheck(["admin", "trainer"]));

// POST /api/workout-days — add a day to a plan
router.post("/", createDay);

// POST /api/workout-days/:id/exercises — add exercise to a day
router.post("/:id/exercises", addExercise);

// DELETE /api/workout-days/:id — delete day + its exercises
router.delete("/:id", deleteDay);

module.exports = router;
