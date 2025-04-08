const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");
const controversyController = require("../controllers/controversyController");
const mlController = require("../controllers/mlController");
const geoRiskController = require("../controllers/geoRiskController");
const recommendationController = require("../controllers/recommendationController");

// Health check route
router.get(["/health-check", "/health-check/"], (req, res) => {
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
      supplyChainGraph: "/api/supply-chain-graph",
      evaluateSupplier: "/api/suppliers/:id/evaluate",
      analytics: "/api/suppliers/:id/analytics",
      mlStatus: "/api/ml/status",
      geoRiskAlerts: "/api/geo-risk-alerts",
      recommendations: "/api/recommendations",
    },
  });
});

// Supplier routes
router.get("/suppliers", supplierController.getSuppliers);
router.post("/suppliers", supplierController.createSupplier);
router.get("/suppliers/:id", supplierController.getSupplierById);
router.put("/suppliers/:id", supplierController.updateSupplier);
router.delete("/suppliers/:id", supplierController.deleteSupplier);

// Dashboard route
router.get("/dashboard", supplierController.getDashboard);
router.get("/dashboard/", supplierController.getDashboard);

// Supply chain graph route
router.get("/supply-chain-graph", supplierController.getSupplyChainGraph);

// Supplier evaluation routes
router.get(
  "/suppliers/:supplierId/evaluate",
  supplierController.evaluateSupplier
);
router.post("/suppliers/evaluate", supplierController.evaluateSupplierPost);

// Supplier analytics route
router.get("/suppliers/:id/analytics", supplierController.getSupplierAnalytics);
router.get(
  "/suppliers/:id/analytics/",
  supplierController.getSupplierAnalytics
);

// Controversy routes
router.get("/controversies", controversyController.getAllControversies);
router.get("/controversies/:id", controversyController.getControversyById);
router.post("/controversies", controversyController.createControversy);
router.put("/controversies/:id", controversyController.updateControversy);
router.delete("/controversies/:id", controversyController.deleteControversy);

// ML status route
router.get("/ml/status", mlController.getMLStatus);
router.get("/ml/status/", mlController.getMLStatus);

// Recommendation routes
router.get("/recommendations", recommendationController.getRecommendations);
router.get("/recommendations/", recommendationController.getRecommendations);
router.get(
  "/recommendations/:id",
  recommendationController.getRecommendationById
);
router.post("/recommendations", recommendationController.createRecommendation);
router.put(
  "/recommendations/:id",
  recommendationController.updateRecommendation
);
router.delete(
  "/recommendations/:id",
  recommendationController.deleteRecommendation
);
router.put(
  "/recommendations/:id/status",
  recommendationController.updateStatus
);
router.get(
  "/suppliers/:supplierId/recommendations",
  recommendationController.getRecommendationsBySupplier
);

// Geo Risk Alert routes
router.get("/geo-risk-alerts", geoRiskController.getGeoRiskAlerts);
router.get("/geo-risk-alerts/", geoRiskController.getGeoRiskAlerts);
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

module.exports = router;
