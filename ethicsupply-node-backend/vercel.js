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
    };

    res.json(evaluationResult);
  });

  // Mock dashboard data endpoint
  app.get("/api/dashboard", (req, res) => {
    res.json({
      totalSuppliers: 12,
      avgEthicalScore: "75.3",
      riskBreakdown: {
        high: 1,
        medium: 4,
        low: 7,
      },
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

  return app;
}

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
