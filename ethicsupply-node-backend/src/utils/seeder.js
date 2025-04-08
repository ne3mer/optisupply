const mongoose = require("mongoose");
const Supplier = require("../models/Supplier");
const MediaSentiment = require("../models/MediaSentiment");
const SupplierESGReport = require("../models/SupplierESGReport");
const Controversy = require("../models/Controversy");
const GeoRiskAlert = require("../models/GeoRiskAlert");

// Import seed data
const geoRiskAlerts = require("../data/geoRiskAlerts");

/**
 * Seed the geo risk alerts data
 */
const seedGeoRiskAlerts = async () => {
  try {
    // Clear existing data
    await GeoRiskAlert.deleteMany({});
    console.log("Deleted existing geo risk alerts");

    // Insert new data
    const alerts = await GeoRiskAlert.insertMany(geoRiskAlerts);
    console.log(`Inserted ${alerts.length} geo risk alerts`);

    return alerts;
  } catch (error) {
    console.error("Error seeding geo risk alerts:", error);
    throw error;
  }
};

/**
 * Run all seeders
 */
const runSeeders = async () => {
  try {
    await seedGeoRiskAlerts();
    console.log("All data seeded successfully!");
  } catch (error) {
    console.error("Error running seeders:", error);
  }
};

module.exports = {
  seedGeoRiskAlerts,
  runSeeders,
};
