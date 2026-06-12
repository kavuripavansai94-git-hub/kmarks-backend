const express = require("express");
const router = express.Router();
const {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan
} = require("../controllers/plansController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All membership plan routes require login authentication
router.use(authMiddleware);

router.get("/", getAllPlans);
router.post("/", roleCheck(["admin"]), createPlan);
router.put("/:id", roleCheck(["admin"]), updatePlan);
router.delete("/:id", roleCheck(["admin"]), deletePlan);

module.exports = router;
