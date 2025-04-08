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

// Initialize ML model
const scoringModel = new EthicalScoringModel();
scoringModel
  .initialize()
  .then(() => console.log("ML model initialized successfully"))
  .catch((err) => console.error("Error initializing ML model:", err));

// Connect to MongoDB
connectToDatabase()
  .then(() => {
    console.log("Connected to MongoDB");

    // Seed data if in development mode
    if (config.env === "development") {
      runSeeders()
        .then(() => console.log("Initial data seeded successfully"))
        .catch((err) => console.error("Error seeding data:", err));
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://localhost:5178",
    ],
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

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.env} mode`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

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
