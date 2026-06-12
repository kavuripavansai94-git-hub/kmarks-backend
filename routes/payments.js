const express = require("express");
const router = express.Router();
const {
  getAllPayments,
  createPayment,
  updatePayment,
} = require("../controllers/paymentsController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All payment routes require authentication + admin role
router.use(authMiddleware);
router.use(roleCheck(["admin"]));

router.get("/", getAllPayments);
router.post("/", createPayment);
router.put("/:id", updatePayment);

module.exports = router;
