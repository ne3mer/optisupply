// Vercel deployment entry point
const express = require("express");
const cors = require("cors");
const startServer = require("./src/server");
const config = require("./src/config/app"); // Ensure config is imported

// Create mock server for Vercel deployment when MongoDB connection fails
function createMockServer() {
  console.log(
    "Creating mock server for Vercel deployment due to MongoDB connection failure"
  );
  const app = express();

  // CORS middleware - allow all origins for Vercel
  app.use(
    cors({
      // Use the same origin validation logic as the main server
      origin: function (origin, callback) {
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
      credentials: true, // Keep credentials allowed
      preflightContinue: false,
      optionsSuccessStatus: 204,
    })
  );

  // Explicit handler for OPTIONS requests to ensure proper CORS headers
  app.options("*", function (req, res) {
    // Get origin from request
    const origin = req.headers.origin;

    // Only set allow-origin for origins in our allowed list
    if (
      origin &&
      config.cors.origins &&
      config.cors.origins.indexOf(origin) !== -1
    ) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override"
      );
      res.status(204).end();
    } else {
      // For origins not in our list, don't set CORS headers
      res.status(204).end();
    }
  });

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
      {
        _id: "67f7fc9e5eed05575d0586c4",
        id: 1,
        name: "Mock Supplier 1",
        country: "USA",
        industry: "Electronics",
        ethical_score: 0.85,
        co2_emissions: 12.5,
        delivery_efficiency: 0.92,
        wage_fairness: 0.88,
        human_rights_index: 0.9,
        waste_management_score: 0.78,
      },
      {
        _id: "67f7fddb5eed05575d0586df",
        id: 2,
        name: "Mock Supplier 2",
        country: "Canada",
        industry: "Consumer Goods",
        ethical_score: 0.72,
        co2_emissions: 8.3,
        delivery_efficiency: 0.89,
        wage_fairness: 0.95,
        human_rights_index: 0.93,
        waste_management_score: 0.91,
      },
      {
        _id: "67f7fddb5eed05575d0586e0",
        id: 3,
        name: "Mock Supplier 3",
        country: "Germany",
        industry: "Automotive",
        ethical_score: 0.93,
        co2_emissions: 17.2,
        delivery_efficiency: 0.94,
        wage_fairness: 0.94,
        human_rights_index: 0.91,
        waste_management_score: 0.89,
      },
    ]);
  });

  // Get individual supplier
  app.get("/api/suppliers/:id", (req, res) => {
    const supplierId = req.params.id;

    const supplier = {
      _id: supplierId,
      name: "Mock Supplier Details",
      country: "USA",
      industry: "Electronics",
      ethical_score: 0.85,
      co2_emissions: 12.5,
      delivery_efficiency: 0.92,
      wage_fairness: 0.88,
      human_rights_index: 0.9,
      waste_management_score: 0.78,
      community_engagement: 0.82,
      energy_efficiency: 0.88,
      water_usage: 32,
      renewable_energy_percent: 45,
      pollution_control: 0.81,
      diversity_inclusion_score: 0.84,
      worker_safety: 0.91,
      transparency_score: 0.79,
      corruption_risk: 0.21,
      board_diversity: 0.76,
      ethics_program: 0.82,
      compliance_systems: 0.85,
      quality_control_score: 0.89,
      supplier_diversity: 0.77,
      traceability: 0.83,
      geopolitical_risk: 0.35,
      climate_risk: 0.42,
      labor_dispute_risk: 0.28,
      created_at: new Date(),
      updated_at: new Date(),
    };

    res.json(supplier);
  });

  // Mock suppliers recommendation endpoint
  app.get("/api/suppliers/recommendations", (req, res) => {
    res.json([
      {
        _id: "rec1",
        id: 1,
        name: "Recommended Supplier 1",
        country: "USA",
        industry: "Technology",
        ethical_score: 0.92,
      },
      {
        _id: "rec2",
        id: 2,
        name: "Recommended Supplier 2",
        country: "Sweden",
        industry: "Sustainable Materials",
        ethical_score: 0.89,
      },
      {
        _id: "rec3",
        id: 3,
        name: "Recommended Supplier 3",
        country: "Denmark",
        industry: "Furniture",
        ethical_score: 0.87,
      },
    ]);
  });

  // Supplier evaluation endpoint - detailed mock with all required fields
  app.post("/api/suppliers/:id/evaluate", (req, res) => {
    const supplierId = req.params.id;

    // Comprehensive evaluation result with all numeric fields properly defined
    const evaluationResult = {
      id: supplierId,
      name: "Mock Supplier Evaluation",

      // Overall Scores - all numeric values
      ethical_score: 0.85,
      environmental_score: 0.82,
      social_score: 0.78,
      governance_score: 0.81,
      supply_chain_score: 0.79,
      risk_score: 0.35,

      // Detailed Assessment
      assessment: {
        strengths: [
          "Strong ethical policies and practices",
          "Good waste management protocols",
          "Excellent worker safety record",
          "Transparent reporting",
        ],
        weaknesses: [
          "CO2 emissions slightly above industry average",
          "Supply chain traceability needs improvement",
          "Renewable energy adoption below target",
        ],
        opportunities: [
          "Increase renewable energy investments",
          "Expand supplier diversity program",
          "Enhance sustainability reporting",
        ],
        threats: [
          "Increasing environmental regulations",
          "Climate change impacts on operations",
          "Labor market volatility",
        ],
      },

      // Recommendations
      recommendation:
        "Focus on reducing carbon emissions and improving supply chain transparency",
      suggestions: [
        "Implement additional renewable energy sources",
        "Establish more comprehensive supplier auditing",
        "Enhance sustainability disclosures with GRI standards",
        "Develop climate adaptation strategy",
      ],

      // Risk Assessment
      risk_factors: [
        {
          factor: "Climate Change",
          severity: "Medium",
          probability: "High",
          mitigation: "Develop climate adaptation strategy",
        },
        {
          factor: "Labor Disputes",
          severity: "Low",
          probability: "Medium",
          mitigation: "Strengthen worker engagement programs",
        },
        {
          factor: "Supply Chain Disruption",
          severity: "Medium",
          probability: "Medium",
          mitigation: "Diversify supplier base and enhance monitoring",
        },
      ],

      // Compliance Status
      compliance: {
        status: "Partial Compliance",
        standards_met: ["ISO 14001", "ISO 9001", "OHSAS 18001"],
        certifications: ["Fair Trade", "Carbon Trust", "B Corp"],
        gaps: ["GRI Reporting", "Science-Based Targets", "TCFD Disclosures"],
      },

      // Industry Comparison - commonly missing but needed for charts
      industry_comparison: {
        percentile: 75,
        average_score: 0.72,
        top_performer_score: 0.94,
      },

      // Additional metrics commonly used in visualizations
      metrics: {
        carbon_footprint: 15.3,
        water_usage: 32.5,
        energy_efficiency: 0.87,
        waste_reduction: 0.76,
        renewable_energy: 0.45,
        supplier_diversity: 0.68,
        community_impact: 0.72,
      },

      // Improvement scenarios
      improvement_scenarios: [
        {
          name: "Renewable Energy Investment",
          description: "Increase renewable energy usage to 75%",
          impact: {
            environmental_score: 0.15,
            overall_score: 0.08,
          },
        },
        {
          name: "Supply Chain Transparency",
          description: "Implement blockchain tracking for all suppliers",
          impact: {
            supply_chain_score: 0.18,
            overall_score: 0.06,
          },
        },
      ],

      // Time series data (needed for charts)
      historical_performance: {
        ethical_scores: [0.76, 0.79, 0.82, 0.85],
        carbon_emissions: [18.2, 16.5, 14.8, 12.5],
        time_periods: ["2020", "2021", "2022", "2023"],
      },
    };

    res.json(evaluationResult);
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
        "/api/suppliers/:id",
        "/api/suppliers/recommendations",
        "/api/suppliers/:id/evaluate",
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
  // Handle OPTIONS requests at the serverless function level first
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;

    // Get allowed origins from config
    const allowedOrigins =
      config.cors && config.cors.origins ? config.cors.origins : [];

    // If origin is allowed, set the proper CORS headers
    if (origin && allowedOrigins.indexOf(origin) !== -1) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override"
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
      res.status(204).end();
      return;
    }
  }

  try {
    // Try to initialize the Express app with MongoDB
    console.log("Attempting to initialize server with MongoDB connection");
    console.log(
      `MongoDB URI defined: ${process.env.MONGODB_URI ? "Yes" : "No"}`
    );
    console.log(
      `MongoDB URI starts with: ${
        process.env.MONGODB_URI
          ? process.env.MONGODB_URI.substring(0, 20) + "..."
          : "undefined"
      }`
    );
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(
      `CORS Origins: ${
        process.env.CORS_ALLOWED_ORIGINS || "Not set - using defaults"
      }`
    );

    const app = await startServer();
    return app(req, res);
  } catch (error) {
    // If MongoDB connection fails, fall back to mock server
    console.error("Failed to initialize main server:", error);
    console.error(
      "Error details:",
      JSON.stringify(
        {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        null,
        2
      )
    );
    console.log("Falling back to mock server");

    // Create a mock server without MongoDB dependency
    const mockApp = createMockServer();
    return mockApp(req, res);
  }
};
