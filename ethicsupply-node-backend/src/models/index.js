const mongoose = require("mongoose");

// Import all model files
// const Alert = require("./Alert"); // Removed unused model
// const AnalysisResult = require("./AnalysisResult"); // Removed unused model
const Controversy = require("./Controversy");
const GeoRiskAlert = require("./GeoRiskAlert");
// const Kpi = require("./Kpi"); // Removed unused model
const Recommendation = require("./Recommendation");
const Report = require("./Report");
const Risk = require("./Risk");
const Supplier = require("./Supplier");
const User = require("./User");

// Export all models
module.exports = {
  // Alert, // Removed unused model
  // AnalysisResult, // Removed unused model
  Controversy,
  GeoRiskAlert,
  // Kpi, // Removed unused model
  Recommendation,
  Report,
  Risk,
  Supplier,
  User,
};
