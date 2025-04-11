/**
 * Seed Risks Data for OptEthic Application
 *
 * This script adds controversy and geo risk alert data.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Import models
const Supplier = require("../models/Supplier");
const Controversy = require("../models/Controversy");
const GeoRiskAlert = require("../models/GeoRiskAlert");

// MongoDB Connection
const connectToDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("MongoDB connection established successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

// Generate controversies for suppliers
const createControversies = (suppliers) => {
  const controversies = [];
  const highRiskSuppliers = suppliers.filter(
    (s) => s.risk_level === "high" || s.ethical_score < 65
  );

  highRiskSuppliers.forEach((supplier) => {
    controversies.push({
      supplier: supplier._id,
      title: `Labor Rights Violations at ${supplier.name}`,
      description:
        "Reports of excessive working hours and unsafe conditions at manufacturing facilities",
      category: "social",
      severity: "high",
      occurrence_date: new Date(
        Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)
      ), // Random date in last 180 days
      status: "investigating",
      impact_score: 75,
      source: "NGO Report",
      evidence:
        "Third-party audit documented 12-hour shifts and lack of proper safety equipment",
    });
  });

  // Add some controversies for medium risk suppliers too
  const mediumRiskSuppliers = suppliers.filter(
    (s) => s.risk_level === "medium" && s.ethical_score < 75
  );

  mediumRiskSuppliers.forEach((supplier) => {
    controversies.push({
      supplier: supplier._id,
      title: `Environmental Compliance Issue at ${supplier.name}`,
      description:
        "Allegations of improper waste disposal at production facility",
      category: "environmental",
      severity: "medium",
      occurrence_date: new Date(
        Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)
      ), // Random date in last 90 days
      status: "open",
      impact_score: 62,
      source: "Local Media",
      evidence:
        "Photos of waste disposal practices not aligned with regulations",
    });
  });

  // Add a few governance controversies as well
  const lowGovernanceSuppliers = suppliers.filter(
    (s) => s.governance_score < 70
  );

  if (lowGovernanceSuppliers.length > 0) {
    // Take the first 2 suppliers with low governance scores
    lowGovernanceSuppliers.slice(0, 2).forEach((supplier) => {
      controversies.push({
        supplier: supplier._id,
        title: `Reporting Irregularities at ${supplier.name}`,
        description:
          "Concerns raised about financial reporting accuracy and transparency",
        category: "governance",
        severity: "medium",
        occurrence_date: new Date(
          Date.now() - Math.floor(Math.random() * 120 * 24 * 60 * 60 * 1000)
        ), // Random date in last 120 days
        status: "open",
        impact_score: 58,
        source: "Financial Audit",
        evidence:
          "Independent audit identified inconsistencies in sustainability reporting metrics",
      });
    });
  }

  return controversies;
};

// Create geo risk alerts
const createGeoRiskAlerts = (suppliers) => {
  // Gather unique countries from suppliers
  const countries = [...new Set(suppliers.map((s) => s.country))];

  // Base alerts
  const alerts = [
    {
      title: "Political Instability in Southeast Asia",
      description:
        "Growing political tensions could disrupt supply chains and operations in the region",
      type: "political",
      country: "Thailand",
      severity: "medium",
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      read: false,
      source: "Foreign Policy Analysis",
    },
    {
      title: "Extreme Weather Events in South Asia",
      description:
        "Increased frequency of flooding affecting transportation infrastructure",
      type: "environmental",
      country: "Bangladesh",
      severity: "high",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      read: false,
      source: "Climate Risk Index",
    },
    {
      title: "New Labor Regulations in Europe",
      description:
        "EU introduces stricter labor rights requirements affecting all suppliers",
      type: "regulatory",
      country: "European Union",
      severity: "medium",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      read: true,
      source: "EU Commission",
    },
    {
      title: "Social Unrest in Manufacturing Regions",
      description:
        "Worker protests demanding better conditions could affect production schedules",
      type: "socialEthical",
      country: "Vietnam",
      severity: "medium",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: false,
      source: "Labor Rights Monitor",
    },
  ];

  // Add country-specific alerts based on suppliers
  countries.forEach((country) => {
    // Skip already covered countries
    if (
      ["Thailand", "Bangladesh", "Vietnam", "European Union"].includes(country)
    ) {
      return;
    }

    // Generate a country-specific alert
    const alertTypes = [
      "political",
      "environmental",
      "socialEthical",
      "regulatory",
      "conflict",
    ];
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];

    let title, description;

    switch (alertType) {
      case "environmental":
        title = `Climate Regulation Changes in ${country}`;
        description = `New emissions standards being proposed that could affect operations in ${country}`;
        break;
      case "political":
        title = `Political Leadership Change in ${country}`;
        description = `Upcoming elections may result in policy shifts affecting business environment`;
        break;
      case "socialEthical":
        title = `Labor Market Shifts in ${country}`;
        description = `Changing labor demographics and skilled worker availability impacting operations`;
        break;
      case "regulatory":
        title = `New Import/Export Regulations in ${country}`;
        description = `Recent trade policy changes affecting cross-border supply chain operations`;
        break;
      case "conflict":
        title = `Supply Chain Disruptions in ${country}`;
        description = `Logistics challenges due to regional tensions affecting delivery timelines`;
        break;
    }

    alerts.push({
      title,
      description,
      type: alertType,
      country,
      severity: Math.random() > 0.7 ? "high" : "medium",
      date: new Date(
        Date.now() - Math.floor(Math.random() * 45 * 24 * 60 * 60 * 1000)
      ), // Random date in last 45 days
      read: Math.random() > 0.7, // 30% chance of being read
      source: "Risk Intelligence Report",
    });
  });

  // Link alerts to affected suppliers
  return alerts.map((alert) => {
    // Find suppliers in the affected country
    const affectedSuppliers = suppliers
      .filter(
        (s) => s.country === alert.country || alert.country === "European Union"
      )
      .map((s) => s._id);

    if (affectedSuppliers.length > 0) {
      alert.impact_suppliers = affectedSuppliers;
    }

    return alert;
  });
};

// Seed the database with risk data
const seedRisks = async () => {
  try {
    console.log("Starting risk data seeding process...");

    // Clear existing data
    console.log("Clearing existing controversy and risk data...");
    await Controversy.deleteMany({});
    await GeoRiskAlert.deleteMany({});

    // Get all suppliers from the database
    console.log("Fetching suppliers...");
    const suppliers = await Supplier.find({});

    if (suppliers.length === 0) {
      console.error("No suppliers found. Please run seedSuppliers.js first.");
      return;
    }

    console.log(`Found ${suppliers.length} suppliers.`);

    // Create controversies for suppliers
    console.log("Generating controversies...");
    const controversies = createControversies(suppliers);

    // Insert controversies
    console.log("Adding controversies...");
    await Controversy.insertMany(controversies);
    console.log(`Added ${controversies.length} controversies successfully!`);

    // Create geo risk alerts
    console.log("Generating geo risk alerts...");
    const geoRiskAlerts = createGeoRiskAlerts(suppliers);

    // Insert geo risk alerts
    console.log("Adding geo risk alerts...");
    await GeoRiskAlert.insertMany(geoRiskAlerts);
    console.log(`Added ${geoRiskAlerts.length} geo risk alerts successfully!`);

    // Print some statistics
    const socialControversies = controversies.filter(
      (c) => c.category === "social"
    ).length;
    const envControversies = controversies.filter(
      (c) => c.category === "environmental"
    ).length;
    const govControversies = controversies.filter(
      (c) => c.category === "governance"
    ).length;

    console.log(`\nControversies by category:`);
    console.log(`- Social: ${socialControversies}`);
    console.log(`- Environmental: ${envControversies}`);
    console.log(`- Governance: ${govControversies}`);

    console.log("\nRisk data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding risk data:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the seeding process
connectToDatabase()
  .then(seedRisks)
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exit(1);
  });
