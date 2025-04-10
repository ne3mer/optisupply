/**
 * Application configuration settings
 */

// Environment variables with defaults
const config = {
  // Server settings
  port: process.env.PORT || 8000,
  env: process.env.NODE_ENV || "development",

  // CORS settings
  cors: {
    origins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(",")
      : [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:5174",
          "http://127.0.0.1:5174",
          "https://ethicsupply-frontend.vercel.app",
          "https://optisupply.vercel.app",
          "https://optisupply-frontend.vercel.app",
          "https://optisupply-backend.vercel.app",
        ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-HTTP-Method-Override",
    ],
  },

  // JWT settings for authentication (if implemented)
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      "your-default-secret-key-which-should-be-changed-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },

  // API rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.NODE_ENV === "production" ? "json" : "dev",
  },
};

// Throw error if no JWT secret is set in production
if (config.env === "production" && process.env.JWT_SECRET === undefined) {
  console.warn("WARNING: JWT_SECRET is not defined in production environment!");
}

module.exports = config;
