// Entry point specifically for Render deployment
const express = require("express");
const cors = require("cors");
const startServer = require("./src/server");

// Start the server with Render-specific configurations
async function startRenderServer() {
  try {
    console.log("Starting server optimized for Render deployment");

    // Get the app from the server.js module but configure CORS ourselves
    const app = express();

    // Explicit CORS configuration for Render deployment
    app.use(
      cors({
        origin: "*", // Allow all origins in production
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
        maxAge: 86400, // Cache preflight for 24 hours
      })
    );

    // Handle OPTIONS requests explicitly (important for preflight)
    app.options("*", cors());

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Add the routes from server.js
    const mainApp = await startServer();
    app.use(mainApp);

    // Define direct health check route with CORS headers
    app.get("/api/health-check", (req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(200).json({ status: "ok", deployment: "render" });
    });

    // Start listening
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (Render deployment)`);
      console.log(`API accessible at http://localhost:${PORT}/api`);
    });

    return app;
  } catch (error) {
    console.error("Failed to start Render server:", error);
    process.exit(1);
  }
}

// Start server when this file is run directly
if (require.main === module) {
  console.log("Starting Render optimized server...");
  startRenderServer();
}

module.exports = startRenderServer;
