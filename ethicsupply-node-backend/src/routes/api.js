const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");
const datasetController = require("../controllers/datasetController");
const controversyController = require("../controllers/controversyController");
const mlController = require("../controllers/mlController");
const geoRiskController = require("../controllers/geoRiskController");
const recommendationController = require("../controllers/recommendationController");
const bandsController = require("../controllers/bandsController");
const settingsController = require("../controllers/settingsController");
const scenarioController = require("../controllers/scenarioController");
const baselineController = require("../controllers/baselineController");
const exportController = require("../controllers/exportController");
const transparencyController = require("../controllers/transparencyController");
const adminController = require("../controllers/adminController");
const { exportRateLimiter } = require("../middleware/rateLimiter");
const { optionalAuth } = require("../middleware/simpleAuth");

// Health check route
router.get("/health-check", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// API root
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to the EthicSupply API",
    version: "1.0.0",
    endpoints: {
      suppliers: "/api/suppliers",
      dashboard: "/api/dashboard",
      bands: "/api/bands",
      datasetMeta: "/api/dataset/meta",
      supplyChainGraph: "/api/supply-chain-graph",
      evaluateSupplier: "/api/suppliers/:id/evaluate",
      analytics: "/api/suppliers/:id/analytics",
      mlStatus: "/api/ml/status",
      geoRiskAlerts: "/api/geo-risk-alerts",
      recommendations: "/api/suppliers/recommendations",
      settings: "/api/settings",
      exportCSV: "/api/suppliers/export/csv",
      transparency: "/api/suppliers/:id/transparency",
      trace: "/api/suppliers/:id/trace",
      traceabilityMetrics: "/api/traceability/metrics",
      scenarios: "/api/scenarios/s1|s2|s3|s4",
      admin: "/api/admin/recompute-all",
    },
  });
});

// ======= RE-ENABLE SUPPLIER ROUTES =======

// Recommendation routes (Keep Active)
router.get(
  "/suppliers/recommendations",
  recommendationController.getRecommendations
);
router.get(
  "/suppliers/recommendations/:id",
  recommendationController.getRecommendationById
);
router.post(
  "/suppliers/recommendations",
  recommendationController.createRecommendation
);
router.put(
  "/suppliers/recommendations/:id",
  recommendationController.updateRecommendation
);
router.delete(
  "/suppliers/recommendations/:id",
  recommendationController.deleteRecommendation
);
router.put(
  "/suppliers/recommendations/:id/status",
  recommendationController.updateStatus
);
router.get(
  "/suppliers/:supplierId/recommendations/specific",
  recommendationController.getRecommendationsBySupplier
);

// Supplier routes
router.get("/suppliers", supplierController.getSuppliers);
router.post("/suppliers", supplierController.createSupplier);
router.post("/suppliers/bulk", supplierController.bulkImportSuppliers);
router.post("/suppliers/bulk-margins", supplierController.bulkSetMargins);
// IMPORTANT: More specific routes must come BEFORE generic /suppliers/:id route
// Transparency routes (trace endpoints)
router.get("/suppliers/:supplierId/transparency", transparencyController.getCalculationTrace);
router.get("/suppliers/:supplierId/trace", transparencyController.getCalculationTrace);
router.post("/suppliers/:supplierId/trace/generate", transparencyController.generateTrace);
// Other specific supplier routes
router.post("/suppliers/:id/recompute", supplierController.recomputeSupplierScores);
router.get("/suppliers/:id/analytics", supplierController.getSupplierAnalytics);
router.get("/suppliers/:supplierId/evaluate", supplierController.evaluateSupplier);
// Generic supplier routes (must be last)
router.get("/suppliers/:id", supplierController.getSupplierById);
router.put("/suppliers/:id", supplierController.updateSupplier);
router.delete("/suppliers/:id", supplierController.deleteSupplier);

// Dashboard route (uses supplierController)
router.get("/dashboard", supplierController.getDashboard);

// Bands route
router.get("/bands", bandsController.getBands);

// Dataset metadata route
router.get("/dataset/meta", datasetController.getDatasetMeta);

// Supply chain graph route (uses supplierController)
router.get("/supply-chain-graph", supplierController.getSupplyChainGraph);

// Supplier evaluation routes (uses supplierController)
router.post("/suppliers/evaluate", supplierController.evaluateSupplierPost);

// ======= END RE-ENABLED SUPPLIER ROUTES =======

// Controversy routes (Keep Active for now)
router.get("/controversies", controversyController.getAllControversies);
router.get("/controversies/:id", controversyController.getControversyById);
router.post("/controversies", controversyController.createControversy);
router.put("/controversies/:id", controversyController.updateControversy);
router.delete("/controversies/:id", controversyController.deleteControversy);

// ML status route (Keep Active for now)
router.get("/ml/status", mlController.getMLStatus);

// ======= RE-ENABLE GEO RISK ROUTES =======
// Geo Risk Alert routes
router.get("/geo-risk-alerts", geoRiskController.getGeoRiskAlerts);
router.get("/geo-risk-alerts/:id", geoRiskController.getGeoRiskAlertById);
router.post("/geo-risk-alerts", geoRiskController.createGeoRiskAlert);
router.put("/geo-risk-alerts/:id", geoRiskController.updateGeoRiskAlert);
router.delete("/geo-risk-alerts/:id", geoRiskController.deleteGeoRiskAlert);
router.put("/geo-risk-alerts/:id/read", geoRiskController.markAsRead);
router.get(
  "/geo-risk-alerts/country/:country",
  geoRiskController.getAlertsByCountry
);
router.get("/geo-risk-alerts/type/:type", geoRiskController.getAlertsByType);
// ======= END RE-ENABLED GEO RISK ROUTES =======

// Settings routes
router.get("/settings", settingsController.getSettings);
router.put("/settings", settingsController.updateSettings);
router.post("/settings/reset", settingsController.resetSettings);

// Export routes - with rate limiting and optional auth
router.get("/suppliers/export/csv", optionalAuth, exportRateLimiter, exportController.exportSuppliersCSV);
router.get("/exports/rankings", optionalAuth, exportRateLimiter, exportController.exportRankingsCSV);
router.get("/exports/industry-map", optionalAuth, exportRateLimiter, exportController.exportIndustryMapCSV);

// Transparency routes (non-supplier-specific)
router.get("/traceability/metrics", transparencyController.getTraceabilityMetrics);
router.post("/trace/generate-all", transparencyController.generateAllTraces);

// Scenario routes (S1-S4) - Updated API
router.post("/scenarios/s1", scenarioController.s1Utility);
router.post("/scenarios/s2", scenarioController.s2Sensitivity);
router.post("/scenarios/s3", scenarioController.s3Missingness);
router.post("/scenarios/s4", scenarioController.s4Ablation);

// Unified scenario runner endpoint (Chapter 4)
router.post("/scenarios/run", scenarioController.runScenario);
router.get("/scenarios/coverage", scenarioController.getDataCoverage);
router.get("/scenarios/baseline", baselineController.getBaseline);

// Admin routes
router.post("/admin/recompute-all", adminController.recomputeAllSuppliers);
router.post("/admin/delete-all-suppliers", adminController.deleteAllSuppliers);

module.exports = router;
