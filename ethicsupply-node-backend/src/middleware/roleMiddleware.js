/**
 * Role-based authorization middleware
 * This middleware checks if the authenticated user has the required role
 * It must be used after the authenticateToken middleware
 */

// Middleware for role-based authorization
const authorizeRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // If user is not set by authenticateToken middleware
      if (!req.user) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      // For development only - bypass role authorization
      if (
        process.env.NODE_ENV === "development" &&
        process.env.BYPASS_AUTH === "true"
      ) {
        console.warn("⚠️ Role authorization bypassed in development mode");
        return next();
      }

      // Check if the user's role is in the allowed roles array
      if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: "Forbidden",
          message: `Requires ${allowedRoles.join(" or ")} role`,
        });
      }

      // User has the required role
      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      return res.status(500).json({
        error: "Server Error",
        message: "Role authorization process failed",
      });
    }
  };
};

// Middleware for permission-based authorization
const authorizePermission = (resource, action) => {
  return (req, res, next) => {
    try {
      // If user is not set by authenticateToken middleware
      if (!req.user) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      // For development only - bypass permission authorization
      if (
        process.env.NODE_ENV === "development" &&
        process.env.BYPASS_AUTH === "true"
      ) {
        console.warn(
          "⚠️ Permission authorization bypassed in development mode"
        );
        return next();
      }

      // Admin role has all permissions
      if (req.user.role === "admin") {
        return next();
      }

      // Check if the user has the required permission
      const hasPermission =
        req.user.permissions &&
        req.user.permissions[resource] &&
        req.user.permissions[resource][action];

      if (!hasPermission) {
        return res.status(403).json({
          error: "Forbidden",
          message: `You don't have permission to ${action} ${resource}`,
        });
      }

      // User has the required permission
      next();
    } catch (error) {
      console.error("Permission authorization error:", error);
      return res.status(500).json({
        error: "Server Error",
        message: "Permission authorization process failed",
      });
    }
  };
};

module.exports = {
  authorizeRole,
  authorizePermission,
};
