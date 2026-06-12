const express = require("express");
const router = express.Router();
const { getDietPlans, createDietPlan, addMeal } = require("../controllers/dietController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All routes require authentication
router.use(authMiddleware);

// GET /api/diet-plans/:member_id — trainer, member (own), or admin
router.get("/:member_id", getDietPlans);

// POST /api/diet-plans — trainer or admin creates
router.post("/", roleCheck(["admin", "trainer"]), createDietPlan);

module.exports = router;
