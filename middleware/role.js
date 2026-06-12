/**
 * roleCheck(allowedRoles)
 * Returns middleware that checks req.user.role against an array of allowed roles.
 * Must be used AFTER authMiddleware so that req.user is populated.
 *
 * Usage:  router.get("/admin-only", authMiddleware, roleCheck(["admin"]), handler)
 *
 * @param {string[]} allowedRoles  e.g. ["admin", "trainer"]
 */
function roleCheck(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden. You do not have the required role.",
      });
    }
    next();
  };
}

module.exports = { roleCheck };
