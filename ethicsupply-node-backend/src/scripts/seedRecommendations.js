/**
 * Seed Recommendations for OptEthic Application
 *
 * This script adds recommendation data for existing suppliers.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Import models
const Supplier = require("../models/Supplier");
const Recommendation = require("../models/Recommendation");

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

// Generate recommendations for each supplier
const createRecommendations = (suppliers) => {
  const recommendations = [];

  suppliers.forEach((supplier) => {
    // Environmental recommendation
    if (supplier.environmental_score < 80) {
      recommendations.push({
        title: "Improve Environmental Performance",
        description:
          supplier.renewable_energy_percent < 50
            ? "Increase renewable energy usage by implementing solar panels and purchasing renewable energy credits"
            : "Reduce carbon emissions through improved logistics and manufacturing processes",
        category: "environmental",
        priority: supplier.environmental_score < 60 ? "high" : "medium",
        status: "pending",
        supplier: supplier._id,
        ai_explanation: {
          reasoning:
            "Environmental metrics are below industry standards, particularly in energy usage efficiency.",
          impact_assessment:
            "Medium to high positive impact on overall sustainability score.",
          implementation_difficulty: "Medium",
          timeframe: "6-12 months",
          comparative_insights: [
            "Industry leaders achieve 30% higher renewable energy adoption.",
          ],
        },
        estimated_impact: {
          score_improvement: 8.5,
          cost_savings: 120000,
          implementation_time: 9,
        },
      });
    }

    // Social recommendation
    if (supplier.social_score < 85) {
      recommendations.push({
        title: "Enhance Human Rights Compliance",
        description:
          "Strengthen worker rights protections through improved monitoring and third-party verification",
        category: "social",
        priority: supplier.human_rights_index < 0.7 ? "high" : "medium",
        status: "pending",
        supplier: supplier._id,
        ai_explanation: {
          reasoning:
            "Human rights metrics suggest potential areas of improvement in worker conditions.",
          impact_assessment:
            "High impact on social responsibility score and reputation.",
          implementation_difficulty: "Medium-High",
          timeframe: "3-9 months",
          comparative_insights: [
            "Top performers utilize third-party auditing for all facilities.",
          ],
        },
        estimated_impact: {
          score_improvement: 7.2,
          cost_savings: 0,
          implementation_time: 6,
        },
      });
    }

    // Governance recommendation
    if (supplier.governance_score < 80) {
      recommendations.push({
        title: "Improve Transparency and Reporting",
        description:
          "Implement comprehensive ESG reporting framework aligned with international standards",
        category: "governance",
        priority: supplier.transparency_score < 0.6 ? "high" : "medium",
        status: "pending",
        supplier: supplier._id,
        ai_explanation: {
          reasoning:
            "Transparency metrics indicate gaps in disclosure compared to industry leaders.",
          impact_assessment:
            "Medium impact on governance score and stakeholder trust.",
          implementation_difficulty: "Medium",
          timeframe: "6-12 months",
          comparative_insights: [
            "Industry leaders publish quarterly sustainability updates.",
          ],
        },
        estimated_impact: {
          score_improvement: 6.8,
          cost_savings: 50000,
          implementation_time: 8,
        },
      });
    }
  });

  return recommendations;
};

// Seed the database with recommendations
const seedRecommendations = async () => {
  try {
    console.log("Starting recommendations seeding process...");

    // Clear existing recommendations
    console.log("Clearing existing recommendations...");
    await Recommendation.deleteMany({});

    // Get all suppliers from the database
    console.log("Fetching suppliers...");
    const suppliers = await Supplier.find({});

    if (suppliers.length === 0) {
      console.error("No suppliers found. Please run seedSuppliers.js first.");
      return;
    }

    console.log(`Found ${suppliers.length} suppliers.`);

    // Create recommendations for each supplier
    console.log("Generating recommendations...");
    const recommendations = createRecommendations(suppliers);

    // Insert recommendations
    console.log("Adding recommendations...");
    await Recommendation.insertMany(recommendations);
    console.log(
      `Added ${recommendations.length} recommendations successfully!`
    );

    // Print some statistics
    const envRecommendations = recommendations.filter(
      (r) => r.category === "environmental"
    ).length;
    const socialRecommendations = recommendations.filter(
      (r) => r.category === "social"
    ).length;
    const govRecommendations = recommendations.filter(
      (r) => r.category === "governance"
    ).length;

    console.log(`\nRecommendations by category:`);
    console.log(`- Environmental: ${envRecommendations}`);
    console.log(`- Social: ${socialRecommendations}`);
    console.log(`- Governance: ${govRecommendations}`);

    console.log("\nRecommendations seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding recommendations:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the seeding process
connectToDatabase()
  .then(seedRecommendations)
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exit(1);
  });
