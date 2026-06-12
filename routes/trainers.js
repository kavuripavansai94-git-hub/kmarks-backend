const express = require("express");
const router = express.Router();
const {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} = require("../controllers/trainersController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All trainer routes require authentication + admin role
router.use(authMiddleware);
router.use(roleCheck(["admin"]));

router.get("/", getAllTrainers);
router.get("/:id", getTrainerById);
router.post("/", createTrainer);
router.put("/:id", updateTrainer);
router.delete("/:id", deleteTrainer);

module.exports = router;
