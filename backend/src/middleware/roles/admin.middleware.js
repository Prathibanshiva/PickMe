/**
 * Role-Based Access Control (RBAC) Middleware for Admin Operations
 * Enforces server-side authorization: requires authenticated user with 'admin' role.
 */

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      code: "GATE-AUTH-401",
    });
  }

  const userRole = req.user.defaultRole || req.user.role;
  const isAuthorizedEmail =
    req.user.email?.toLowerCase().trim() === "prathibanshiva@gmail.com";

  if ((userRole !== "admin" && !req.user.isAdmin) || !isAuthorizedEmail) {
    return res.status(403).json({
      success: false,
      message: "Access restricted. Administrator privileges required.",
      code: "GATE-AUTH-403",
    });
  }

  next();
};

module.exports = {
  requireAdmin,
};
