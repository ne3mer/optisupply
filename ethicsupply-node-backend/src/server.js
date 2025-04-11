const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectToDatabase } = require("./config/database");
const apiRoutes = require("./routes/api");
const requestLogger = require("./middleware/requestLogger");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const config = require("./config/app");
const EthicalScoringModel = require("./ml/EthicalScoringModel");
const mlController = require("./controllers/mlController");
const { runSeeders } = require("./utils/seeder");

// Initialize Express app
const app = express();

// Connect to MongoDB and start server
async function startServer() {
  try {
    await connectToDatabase();
    console.log("Connected to MongoDB");

    // Seed data if in development mode
    if (config.env === "development") {
      try {
        await runSeeders();
        console.log("Initial data seeded successfully");
      } catch (seedErr) {
        console.error("Error seeding data:", seedErr);
      }
    }

    // CORS configuration - more permissive for production
    let corsOptions;

    if (process.env.NODE_ENV === "production") {
      // In production, use a more permissive CORS policy
      corsOptions = {
        origin: true, // Allow all origins
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "X-HTTP-Method-Override",
        ],
        credentials: true,
        maxAge: 86400, // 24 hours
      };
      console.log("Using production CORS policy (all origins allowed)");
    } else {
      // In development, use the config-based CORS
      corsOptions = {
        origin: function (origin, callback) {
          // Allow requests with no origin (like mobile apps or curl requests) or from allowed origins
          if (
            !origin ||
            (config.cors.origins && config.cors.origins.indexOf(origin) !== -1)
          ) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        methods: config.cors.methods || [
          "GET",
          "POST",
          "PUT",
          "DELETE",
          "OPTIONS",
        ],
        allowedHeaders: config.cors.allowedHeaders || [
          "Content-Type",
          "Authorization",
        ],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204,
      };
      console.log("Using development CORS policy with restricted origins");
    }

    // Apply CORS middleware
    app.use(cors(corsOptions));

    // Handle OPTIONS requests (important for preflight)
    app.options("*", cors(corsOptions));

    // Other middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(requestLogger);

    // Serve static files
    app.use("/public", express.static(path.join(__dirname, "../public")));

    // Health check routes
    app.get("/api/health-check", (req, res) => {
      res.status(200).json({ status: "ok" });
    });
    app.get("/api/ml/status", mlController.getMLStatus);

    // API routes
    app.use("/api", apiRoutes);

    // Error handling middleware
    app.use(notFound);
    app.use(errorHandler);

    // Initialize ML Model
    const scoringModel = new EthicalScoringModel();
    await scoringModel.initialize();
    console.log("ML model initialized successfully");

    return app;
  } catch (error) {
    console.error("Server initialization failed:", error);
    throw error;
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Export the server initialization function
module.exports = startServer;

// If this file is run directly (not imported), start the server
if (require.main === module) {
  const PORT = process.env.PORT || 8000;

  startServer()
    .then((app) => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API accessible at http://localhost:${PORT}/api`);
      });
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
}
