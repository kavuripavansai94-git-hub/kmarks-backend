const express = require("express");
const router = express.Router();
const {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
} = require("../controllers/membersController");
const { authMiddleware } = require("../middleware/auth");
const { roleCheck } = require("../middleware/role");

// All member routes require authentication
router.use(authMiddleware);

// GET — admin sees all, trainer sees only their assigned members
router.get("/", roleCheck(["admin", "trainer"]), getAllMembers);

// GET by ID — admin can view any, trainer only if assigned
router.get("/:id", roleCheck(["admin", "trainer"]), getMemberById);

// POST — admin only (creates user account + member row)
router.post("/", roleCheck(["admin"]), createMember);

// PUT — admin only
router.put("/:id", roleCheck(["admin"]), updateMember);

// DELETE — admin only (deletes member + user account)
router.delete("/:id", roleCheck(["admin"]), deleteMember);

module.exports = router;
