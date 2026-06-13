const express = require("express");
const { getAllBranches } = require("../controllers/branchesController");
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get("/", authMiddleware, getAllBranches);

module.exports = router;
