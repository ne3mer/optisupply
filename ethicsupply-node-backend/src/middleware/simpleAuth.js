/**
 * Simple authentication middleware
 * For production, use proper JWT or OAuth
 */

/**
 * Optional authentication middleware - allows requests but marks authenticated ones
 * Useful for rate limiting per user vs per IP
 */
exports.optionalAuth = (req, res, next) => {
  // Check for API key in header
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  
  if (apiKey) {
    // In production, validate API key against database
    // For now, we'll just mark it as authenticated
    req.user = {
      id: apiKey,
      apiKey: true,
    };
  }
  
  // Check for bearer token (for future JWT implementation)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    // In production, verify JWT token here
    req.user = {
      id: token,
      authenticated: true,
    };
  }
  
  next();
};

/**
 * Required authentication middleware - blocks unauthenticated requests
 */
exports.requireAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  const authHeader = req.headers.authorization;
  
  if (!apiKey && !authHeader) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please provide an API key in the X-API-Key header or as apiKey query parameter",
    });
  }
  
  // In production, validate credentials here
  // For now, we'll accept any key as valid
  req.user = {
    id: apiKey || authHeader,
    authenticated: true,
  };
  
  next();
};

/**
 * Admin authentication middleware - for sensitive operations
 */
exports.requireAdmin = (req, res, next) => {
  const apiKey = req.headers["x-admin-key"];
  const adminKey = process.env.ADMIN_API_KEY || "admin-dev-key";
  
  if (apiKey !== adminKey) {
    return res.status(403).json({
      error: "Admin access required",
      message: "This endpoint requires admin privileges",
    });
  }
  
  req.user = {
    id: "admin",
    role: "admin",
  };
  
  next();
};

