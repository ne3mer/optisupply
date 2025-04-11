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

// Create mock data routes for when MongoDB is not available
function setupMockRoutes(app) {
  console.log("Setting up mock routes for Render deployment");

  // Mock API endpoints
  app.get("/api/suppliers", (req, res) => {
    res.json([
      {
        _id: "67f7fc9e5eed05575d0586c4",
        id: 1,
        name: "Mock Supplier 1",
        country: "USA",
        industry: "Electronics",
        ethical_score: 85,
        co2_emissions: 12.5,
        delivery_efficiency: 0.92,
        wage_fairness: 0.88,
        human_rights_index: 0.9,
        waste_management_score: 0.78,
        environmental_score: 82,
        social_score: 78,
        governance_score: 81,
      },
      {
        _id: "67f7fddb5eed05575d0586df",
        id: 2,
        name: "Mock Supplier 2",
        country: "Canada",
        industry: "Consumer Goods",
        ethical_score: 72,
        co2_emissions: 8.3,
        delivery_efficiency: 0.89,
        wage_fairness: 0.95,
        human_rights_index: 0.93,
        waste_management_score: 0.91,
        environmental_score: 75,
        social_score: 92,
        governance_score: 79,
      },
      {
        _id: "67f7fddb5eed05575d0586e0",
        id: 3,
        name: "Mock Supplier 3",
        country: "Germany",
        industry: "Automotive",
        ethical_score: 93,
        co2_emissions: 17.2,
        delivery_efficiency: 0.94,
        wage_fairness: 0.94,
        human_rights_index: 0.91,
        waste_management_score: 0.89,
        environmental_score: 87,
        social_score: 91,
        governance_score: 88,
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
      ethical_score: 85,
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
      environmental_score: 82,
      social_score: 87,
      governance_score: 81,
      risk_level: "low",
      created_at: new Date(),
      updated_at: new Date(),
    };

    res.json(supplier);
  });

  // Mock supplier analytics endpoint
  app.get("/api/suppliers/:id/analytics", (req, res) => {
    const supplierId = req.params.id;

    res.json({
      supplier: {
        id: supplierId,
        name: "Mock Supplier Analytics",
        country: "USA",
        industry: "Electronics",
        ethical_score: 85,
        environmental_score: 82,
        social_score: 87,
        governance_score: 81,
        risk_level: "low",
        overall_score: 85,
      },
      industry_average: {
        ethical_score: 72,
        environmental_score: 68,
        social_score: 75,
        governance_score: 70,
      },
      peer_comparison: [
        {
          id: "peer1",
          name: "Peer Supplier 1",
          country: "Germany",
          ethical_score: 79,
          environmental_score: 76,
          social_score: 81,
          governance_score: 75,
        },
        {
          id: "peer2",
          name: "Peer Supplier 2",
          country: "Japan",
          ethical_score: 88,
          environmental_score: 85,
          social_score: 86,
          governance_score: 83,
        },
      ],
      risk_factors: [
        {
          factor: "Geopolitical Risk",
          severity: "Low",
          probability: "Medium",
          description: "Regional political stability is generally favorable",
        },
        {
          factor: "Climate Change Risk",
          severity: "Medium",
          probability: "Medium",
          description:
            "Some exposure to climate-related supply chain disruptions",
        },
        {
          factor: "Labor Dispute Risk",
          severity: "Low",
          probability: "Low",
          description: "Strong labor practices and good worker relations",
        },
      ],
      ai_recommendations: [
        {
          area: "Environmental",
          suggestion: "Increase renewable energy adoption to 60%",
          impact: "High",
          difficulty: "Medium",
        },
        {
          area: "Social",
          suggestion: "Implement quarterly worker satisfaction surveys",
          impact: "Medium",
          difficulty: "Low",
        },
        {
          area: "Governance",
          suggestion: "Enhance board diversity",
          impact: "High",
          difficulty: "Medium",
        },
      ],
      sentiment_trend: Array.from({ length: 12 }, (_, i) => ({
        month: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][i],
        value: 50 + Math.round(i * 2 + (Math.random() * 10 - 5)),
        isCurrent: i === new Date().getMonth(),
      })),
      performance_projection: Array.from({ length: 5 }, (_, i) => ({
        period:
          i === 0
            ? "Current"
            : `+${[1, 3, 6, 12][i - 1]} ${i === 4 ? "Months" : "Month"}`,
        projected_score: Math.round(85 + i * 1.5),
      })),
      esg_impact: {
        carbon_reduction: "28%",
        resource_efficiency: "32%",
        community_impact: "Significant",
        value_creation: "27%",
      },
      ml_confidence: {
        overall_confidence: 88,
        data_completeness: 85,
        prediction_accuracy: 91,
      },
      isMockData: true,
    });
  });

  // Mock dashboard data
  app.get("/api/dashboard", (req, res) => {
    res.json({
      totalSuppliers: 12,
      avgEthicalScore: 75.3,
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
      message: "OptiSupply API running in fallback mode (mock data)",
      endpoints: [
        "/api/health-check",
        "/api/suppliers",
        "/api/suppliers/:id",
        "/api/suppliers/:id/analytics",
        "/api/dashboard",
      ],
    });
  });

  console.log("Mock routes setup complete");
}

// Try to connect to MongoDB and setup real routes, fallback to mock routes if failed
async function setupServer() {
  try {
    // Try to connect to MongoDB
    console.log("Attempting to connect to MongoDB...");
    await connectToDatabase();
    console.log("Successfully connected to MongoDB");

    // Initialize ML model
    console.log("Initializing ML model...");
    const scoringModel = new EthicalScoringModel();
    await scoringModel.initialize();
    console.log("ML model initialized successfully");

    // Apply real API routes
    console.log("Setting up real API routes...");
    app.use("/api", apiRoutes);
    console.log("Real API routes setup complete");
  } catch (error) {
    console.error(
      "Failed to connect to MongoDB or initialize ML model:",
      error
    );
    console.log("Falling back to mock data mode");

    // Setup mock routes instead
    setupMockRoutes(app);
  }

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
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (Render deployment)`);
    console.log(`API accessible at http://localhost:${PORT}/api`);
  });
}

// Start server when this file is run directly
if (require.main === module) {
  console.log("Starting Render server...");
  setupServer().catch((err) => {
    console.error("Fatal error starting server:", err);
    process.exit(1);
  });
}

// For serverless environment
module.exports = app;
