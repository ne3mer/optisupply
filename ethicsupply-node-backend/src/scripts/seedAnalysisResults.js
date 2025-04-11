/**
 * Seed Analysis Results for OptEthic Application
 *
 * This script adds analysis result data for existing suppliers.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Import models
const Supplier = require("../models/Supplier");
const AnalysisResult = require("../models/AnalysisResult");

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

// Generate analysis results for a supplier
const createAnalysisResult = (supplier) => {
  // Generate random scores
  const environmentalScore = Math.floor(Math.random() * 40) + 60; // 60-100
  const socialScore = Math.floor(Math.random() * 40) + 60; // 60-100
  const governanceScore = Math.floor(Math.random() * 40) + 60; // 60-100
  const overallScore = Math.floor(
    (environmentalScore + socialScore + governanceScore) / 3
  );

  // Generate random insights based on scores
  const insights = [];

  // Environmental insights
  if (environmentalScore > 80) {
    insights.push({
      type: "environmental",
      text: `Renewable energy adoption at ${Math.floor(
        environmentalScore - 8
      )}% is above recommended targets.`,
      severity: "positive",
      impact_score: Math.random(),
    });
  } else if (environmentalScore > 70) {
    insights.push({
      type: "environmental",
      text: "Carbon footprint reduction efforts are on track with industry standards.",
      severity: "neutral",
      impact_score: Math.random(),
    });
  } else {
    insights.push({
      type: "environmental",
      text: "Waste management practices need significant improvement.",
      severity: "negative",
      impact_score: Math.random(),
    });
  }

  // Social insights
  if (socialScore > 80) {
    insights.push({
      type: "social",
      text: "Worker safety practices are exemplary.",
      severity: "positive",
      impact_score: Math.random(),
    });
  } else if (socialScore > 70) {
    insights.push({
      type: "social",
      text: "Community engagement initiatives meet basic requirements.",
      severity: "neutral",
      impact_score: Math.random(),
    });
  } else {
    insights.push({
      type: "social",
      text: "Labor rights compliance issues detected in supply chain.",
      severity: "negative",
      impact_score: Math.random(),
    });
  }

  // Governance insights
  if (governanceScore > 80) {
    insights.push({
      type: "governance",
      text: "Board diversity metrics reflect best practices.",
      severity: "positive",
      impact_score: Math.random(),
    });
  } else if (governanceScore > 70) {
    insights.push({
      type: "governance",
      text: "Executive compensation structure follows standard guidelines.",
      severity: "neutral",
      impact_score: Math.random(),
    });
  } else {
    insights.push({
      type: "governance",
      text: "Transparency in financial reporting requires attention.",
      severity: "negative",
      impact_score: Math.random(),
    });
  }

  // Generate factors that influenced the score
  const factors = [
    {
      name: "Carbon Emissions",
      value: Math.floor(Math.random() * 100),
      weight: 0.3,
      description: "Measures the total greenhouse gas emissions.",
    },
    {
      name: "Water Usage",
      value: Math.floor(Math.random() * 100),
      weight: 0.2,
      description: "Evaluates efficiency in water consumption.",
    },
    {
      name: "Employee Welfare",
      value: Math.floor(Math.random() * 100),
      weight: 0.25,
      description: "Assesses working conditions and employee benefits.",
    },
    {
      name: "Corporate Governance",
      value: Math.floor(Math.random() * 100),
      weight: 0.25,
      description: "Evaluates board structure and executive oversight.",
    },
  ];

  // Create the analysis result object
  const result = {
    supplier: supplier._id,
    analysis_type: "comprehensive",
    status: "completed",
    scores: {
      overall: overallScore,
      environmental: environmentalScore,
      social: socialScore,
      governance: governanceScore,
    },
    factors: factors,
    benchmarks: {
      industry_average: Math.floor(Math.random() * 20) + 60,
      industry_best: Math.floor(Math.random() * 10) + 90,
      industry_worst: Math.floor(Math.random() * 20) + 30,
      global_average: Math.floor(Math.random() * 20) + 50,
    },
    insights: insights,
    methodology: {
      version: "1.0.0",
      description: "Comprehensive ESG analysis using AI-driven data processing",
      data_sources: [
        "Public disclosures",
        "Industry reports",
        "Supplier questionnaires",
      ],
    },
    processed_by: "ai",
    confidence_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
    raw_data: {
      data_points: Math.floor(Math.random() * 500) + 1000,
      collection_date: new Date().toISOString(),
    },
  };

  return result;
};

// Seed the database with analysis results
const seedAnalysisResults = async () => {
  try {
    console.log("Starting analysis results seeding process...");

    // Clear existing analysis results
    console.log("Clearing existing analysis results...");
    await AnalysisResult.deleteMany({});

    // Get all suppliers from the database
    console.log("Fetching suppliers...");
    const suppliers = await Supplier.find({});

    if (suppliers.length === 0) {
      console.error("No suppliers found. Please run seedSuppliers.js first.");
      return;
    }

    console.log(`Found ${suppliers.length} suppliers.`);

    // Create analysis results for each supplier
    console.log("Generating analysis results...");
    const analysisResults = suppliers.map((supplier) =>
      createAnalysisResult(supplier)
    );

    // Insert analysis results
    console.log("Adding analysis results...");
    await AnalysisResult.insertMany(analysisResults);
    console.log(
      `Added ${analysisResults.length} analysis results successfully!`
    );

    console.log("\nAnalysis results seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding analysis results:", error);
    console.error(error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the seeding process
connectToDatabase()
  .then(seedAnalysisResults)
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exit(1);
  });
