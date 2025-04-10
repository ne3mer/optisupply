// Load environment variables from .env file
require("dotenv").config();

// Local development server entry point
const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./src/config/app");

// Port to listen on - use a different port to avoid conflicts
const PORT = process.env.PORT || 8080;

// Create a minimal development server that doesn't depend on MongoDB
function createDevelopmentServer() {
  console.log("Creating development server with mock API endpoints");
  const app = express();

  // CORS middleware
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/api/health-check", (req, res) => {
    res.status(200).json({ status: "ok", mode: "local-dev" });
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

  // Mock suppliers endpoint
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
    });
  });

  // 404 handler
  app.use((req, res) => {
    res
      .status(404)
      .json({ error: "Endpoint not found in the local development server" });
  });

  return app;
}

async function startLocalServer() {
  console.log("Starting local development server WITHOUT MongoDB connection");
  const app = createDevelopmentServer();

  // Start listening on the specified port
  app.listen(PORT, () => {
    console.log(`Server running in LOCAL DEV mode on port ${PORT}`);
    console.log(`API accessible at http://localhost:${PORT}/api`);
    console.log("NOTE: Using mock data instead of MongoDB database");
  });
}

// Start the server
startLocalServer();
