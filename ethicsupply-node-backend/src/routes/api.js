const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");
const datasetController = require("../controllers/datasetController");
const controversyController = require("../controllers/controversyController");
const mlController = require("../controllers/mlController");
const geoRiskController = require("../controllers/geoRiskController");
const recommendationController = require("../controllers/recommendationController");
const bandsController = require("../controllers/bandsController");

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
router.get(
  "/suppliers/:supplierId/evaluate",
  supplierController.evaluateSupplier
);
router.post("/suppliers/evaluate", supplierController.evaluateSupplierPost);

// Supplier analytics route (uses supplierController)
router.get("/suppliers/:id/analytics", supplierController.getSupplierAnalytics);

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

module.exports = router;
