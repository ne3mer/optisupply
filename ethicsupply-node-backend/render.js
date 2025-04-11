// Entry point specifically for Render deployment
const express = require("express");
const cors = require("cors");
const path = require("path");
const apiRoutes = require("./src/routes/api");
const { connectToDatabase } = require("./src/config/database");
const EthicalScoringModel = require("./src/ml/EthicalScoringModel");

// Create Express app
const app = express();

// Enable CORS for all requests with direct headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Also apply standard CORS middleware as a backup
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-HTTP-Method-Override",
      "Accept",
      "Origin",
    ],
    credentials: true,
    maxAge: 86400,
  })
);

// Handle OPTIONS requests explicitly
app.options("*", (req, res) => {
  res.status(200).end();
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Direct health check route with CORS headers
app.get("/api/health-check", (req, res) => {
  console.log("Health check route accessed");
  res.status(200).json({ status: "ok", deployment: "render" });
});

// Apply API routes
app.use("/api", apiRoutes);

// Handle static files
app.use("/public", express.static(path.join(__dirname, "public")));

// Error handler
app.use((err, req, res, next) => {
  console.error("Error in request:", err);
  res.status(500).json({ error: err.message });
});

// Not found handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.url} not found` });
});

// Start the server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log("Connected to MongoDB");

    // Initialize ML model
    const scoringModel = new EthicalScoringModel();
    await scoringModel.initialize();
    console.log("ML model initialized successfully");

    // Start server
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (Render deployment)`);
      console.log(`API accessible at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("Failed to start Render server:", error);
    process.exit(1);
  }
}

// Start server when this file is run directly
if (require.main === module) {
  console.log("Starting direct Render server implementation...");
  startServer();
}

module.exports = app;
