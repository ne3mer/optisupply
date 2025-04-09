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
        // Decide if you want to proceed without seeding or exit
      }
    }

    // Middleware
    app.use(
      cors({
        origin: "*", // Allow all origins in development
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(requestLogger);

    // Serve static files
    app.use("/public", express.static(path.join(__dirname, "../public")));

    // Direct health check route
    app.get("/api/health-check", (req, res) => {
      res.status(200).json({ status: "ok" });
    });
    app.get("/api/health-check/", (req, res) => {
      res.status(200).json({ status: "ok" });
    });
    app.get("/api/ml/status", mlController.getMLStatus);
    app.get("/api/ml/status/", mlController.getMLStatus);

    // API routes
    app.use("/api", apiRoutes);

    // Error handling middleware
    app.use(notFound);
    app.use(errorHandler);

    // Start server only after DB connection is successful
    const PORT = 8000; // Hardcode port 8000 for frontend compatibility
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT} in ${config.env} mode`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (dbErr) {
    console.error("MongoDB connection failed. Server not started.", dbErr);
    process.exit(1); // Exit if DB connection fails
  }
}

// Initialize ML Model (can happen concurrently or before DB connection)
const scoringModel = new EthicalScoringModel();
scoringModel
  .initialize()
  .then(() => console.log("ML model initialized successfully"))
  .catch((err) => console.error("Error initializing ML model:", err));

// Call the async function to connect to DB and start the server
startServer();

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

// Export app for testing
module.exports = app;
