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
      origin: "https://optisupply.vercel.app",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };

    // Apply CORS middleware
    app.use(cors(corsOptions));

    // Handle OPTIONS requests
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
