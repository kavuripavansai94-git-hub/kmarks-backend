const express = require("express");
const { getAllBranches } = require("../controllers/branchesController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, getAllBranches);

module.exports = router;
