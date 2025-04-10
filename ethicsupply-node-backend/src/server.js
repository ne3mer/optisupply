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

    // CORS configuration
    const corsOptions = {
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

// Start the server
(async () => {
  try {
    const appInstance = await startServer();
    const port = config.port || 8000; // Use port from config or default

    const server = appInstance.listen(port, () => {
      console.log(`\n🚀 Server listening on port ${port}`);
      console.log(`   API accessible at http://localhost:${port}/api`);
      console.log(`   Environment: ${config.env}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM signal received: closing HTTP server");
      server.close(() => {
        console.log("HTTP server closed");
        // Close DB connection if necessary
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
