const jwt = require("jsonwebtoken");
const { User } = require("../models");

// Environment variables or configuration for JWT
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Use a proper env variable in production

/**
 * Middleware to authenticate JWT tokens
 * Extracts the token from the Authorization header
 * Verifies the token and attaches the user to the request object
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN format

    // If no token is provided, continue but mark as unauthenticated
    // This allows for public API routes that also support authentication
    if (!token) {
      // For development only - bypass auth for easier testing
      if (
        process.env.NODE_ENV === "development" &&
        process.env.BYPASS_AUTH === "true"
      ) {
        console.warn("⚠️ Auth bypassed in development mode");
        req.user = { id: "dev_mode", role: "admin" };
        return next();
      }

      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication token is required",
      });
    }

    // Verify the token
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Invalid or expired token",
        });
      }

      // Find the user by ID from decoded token
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(403).json({
          error: "Forbidden",
          message: "User not found",
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      error: "Server Error",
      message: "Authentication process failed",
    });
  }
};

// Generate a new JWT token for a user
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "24h" } // Token expires in 24 hours
  );
};

module.exports = {
  authenticateToken,
  generateToken,
};
