// Vercel deployment entry point
const express = require("express");
const cors = require("cors");
const startServer = require("./src/server");

// Create mock server for Vercel deployment when MongoDB connection fails
function createMockServer() {
  console.log(
    "Creating mock server for Vercel deployment due to MongoDB connection failure"
  );
  const app = express();

  // CORS middleware - allow all origins for Vercel
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-HTTP-Method-Override",
      ],
      credentials: true,
    })
  );

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/api/health-check", (req, res) => {
    res.status(200).json({
      status: "ok",
      mode: "fallback",
      message: "Using fallback server due to MongoDB connection failure",
    });
  });

  // Mock API endpoints
  app.get("/api/suppliers", (req, res) => {
    res.json([
      { id: 1, name: "Mock Supplier 1", country: "USA", ethical_score: 0.85 },
      {
        id: 2,
        name: "Mock Supplier 2",
        country: "Canada",
        ethical_score: 0.72,
      },
      {
        id: 3,
        name: "Mock Supplier 3",
        country: "Germany",
        ethical_score: 0.93,
      },
    ]);
  });

  // Mock suppliers recommendation endpoint
  app.get("/api/suppliers/recommendations", (req, res) => {
    res.json([
      {
        id: 1,
        name: "Recommended Supplier 1",
        country: "USA",
        ethical_score: 0.92,
      },
      {
        id: 2,
        name: "Recommended Supplier 2",
        country: "Sweden",
        ethical_score: 0.89,
      },
      {
        id: 3,
        name: "Recommended Supplier 3",
        country: "Denmark",
        ethical_score: 0.87,
      },
    ]);
  });

  // Dashboard mock data
  app.get("/api/dashboard", (req, res) => {
    res.json({
      totalSuppliers: 12,
      avgEthicalScore: "75.3",
      riskBreakdown: { high: 1, medium: 4, low: 7 },
      avgCo2Emissions: 23.9,
      suppliers_by_country: {
        "United States": 4,
        "United Kingdom": 1,
        Taiwan: 1,
        "South Korea": 1,
        Switzerland: 1,
        "Hong Kong": 1,
        France: 1,
        China: 1,
      },
    });
  });

  // Info route for debugging
  app.get("/", (req, res) => {
    res.status(200).json({
      status: "running",
      mode: "fallback",
      message:
        "OptiSupply API running in fallback mode due to MongoDB connection issues",
      endpoints: [
        "/api/health-check",
        "/api/suppliers",
        "/api/suppliers/recommendations",
        "/api/dashboard",
      ],
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: "Endpoint not found",
      message: "The requested API endpoint does not exist in fallback mode",
    });
  });

  return app;
}

// Serverless function handler for Vercel
module.exports = async (req, res) => {
  try {
    // Try to initialize the Express app with MongoDB
    console.log("Attempting to initialize server with MongoDB connection");
    const app = await startServer();
    console.log("Successfully initialized server with MongoDB connection");
    return app(req, res);
  } catch (error) {
    console.error("Failed to start server with MongoDB:", error);
    console.log("Falling back to mock server");
    const fallbackApp = createMockServer();
    return fallbackApp(req, res);
  }
};
