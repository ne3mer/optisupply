// Entry point for Vercel deployment
const startServer = require("./src/server");

// Express application setup
let app = null;

// Initialize the server if it hasn't been initialized already
async function getAppInstance() {
  if (!app) {
    try {
      app = await startServer();
      console.log("Server initialized successfully");
    } catch (error) {
      console.error("Failed to initialize server:", error);
      // Create a minimal app that returns errors
      const express = require("express");
      app = express();
      app.use((req, res) => {
        res.status(500).json({
          error: "Server initialization failed",
          message: error.message || "Unknown error",
        });
      });
    }
  }
  return app;
}

// Handler for serverless functions
module.exports = async (req, res) => {
  const app = await getAppInstance();
  return app(req, res);
};
