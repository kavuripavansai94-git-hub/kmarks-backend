const express = require("express");
const router = express.Router();
const { addMeal } = require("../controllers/dietController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All routes require authentication + trainer/admin role
router.use(authMiddleware);
router.use(roleCheck(["admin", "trainer"]));

// POST /api/meals — add meal to a diet plan
router.post("/", addMeal);

module.exports = router;
