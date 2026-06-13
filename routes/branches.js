const express = require("express");
const { 
  getAllBranches, 
  createBranch, 
  updateBranch, 
  deleteBranch 
} = require("../controllers/branchesController");
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get("/", authMiddleware, getAllBranches);
router.post("/", authMiddleware, createBranch);
router.put("/:id", authMiddleware, updateBranch);
router.delete("/:id", authMiddleware, deleteBranch);

module.exports = router;
