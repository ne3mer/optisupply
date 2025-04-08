/**
 * Seed script to populate the database with sample data
 * Run with: node src/utils/seedDatabase.js
 */

const mongoose = require("mongoose");
const { connectToDatabase, closeConnection } = require("../config/database");
const Supplier = require("../models/Supplier");
const MediaSentiment = require("../models/MediaSentiment");
const SupplierESGReport = require("../models/SupplierESGReport");
const Controversy = require("../models/Controversy");
const ScoringWeight = require("../models/ScoringWeight");
const EthicalScoringModel = require("../ml/EthicalScoringModel");

// Sample data for suppliers
const supplierData = [
  {
    name: "Eco Friendly Manufacturing",
    description:
      "Sustainable manufacturing company with focus on renewable materials",
    industry: "Manufacturing",
    country: "Germany",
    address: "Berliner Str. 42, 10115 Berlin",
    contact_email: "info@ecofriendlymfg.com",
    website: "https://www.ecofriendlymfg.com",
    year_founded: 1998,
    employee_count: 350,
    annual_revenue: 15000000,

    // Raw score data (will be processed by ML model)
    co2_emissions_score: 0.82,
    water_usage_score: 0.75,
    energy_efficiency_score: 0.88,
    waste_management_score: 0.79,

    wage_fairness_score: 0.85,
    human_rights_score: 0.92,
    diversity_inclusion_score: 0.78,
    community_engagement_score: 0.7,

    transparency_score: 0.8,
    corruption_risk_score: 0.85,
  },
  {
    name: "Global Tech Solutions",
    description:
      "Technology solutions provider specializing in hardware components",
    industry: "Technology",
    country: "United States",
    address: "123 Tech Boulevard, San Jose, CA 95123",
    contact_email: "contact@globaltechsolutions.com",
    website: "https://www.globaltechsolutions.com",
    year_founded: 2005,
    employee_count: 780,
    annual_revenue: 45000000,

    // Raw score data
    co2_emissions_score: 0.55,
    water_usage_score: 0.6,
    energy_efficiency_score: 0.7,
    waste_management_score: 0.45,

    wage_fairness_score: 0.65,
    human_rights_score: 0.6,
    diversity_inclusion_score: 0.72,
    community_engagement_score: 0.35,

    transparency_score: 0.5,
    corruption_risk_score: 0.45,
  },
  {
    name: "Textile Innovations Ltd",
    description:
      "Innovative textiles manufacturer with focus on sustainable fabrics",
    industry: "Textiles",
    country: "India",
    address: "42 Industrial Area, Mumbai 400001",
    contact_email: "info@textileinnovations.in",
    website: "https://www.textileinnovations.in",
    year_founded: 2010,
    employee_count: 450,
    annual_revenue: 8500000,

    // Raw score data
    co2_emissions_score: 0.4,
    water_usage_score: 0.35,
    energy_efficiency_score: 0.42,
    waste_management_score: 0.38,

    wage_fairness_score: 0.3,
    human_rights_score: 0.35,
    diversity_inclusion_score: 0.5,
    community_engagement_score: 0.45,

    transparency_score: 0.25,
    corruption_risk_score: 0.3,
  },
  {
    name: "Nordic Renewables",
    description:
      "Renewable energy solutions provider focusing on wind and solar technologies",
    industry: "Energy",
    country: "Denmark",
    address: "Vindgade 123, 8000 Aarhus",
    contact_email: "hello@nordicrenewables.dk",
    website: "https://www.nordicrenewables.dk",
    year_founded: 2008,
    employee_count: 210,
    annual_revenue: 12000000,

    // Raw score data
    co2_emissions_score: 0.95,
    water_usage_score: 0.88,
    energy_efficiency_score: 0.92,
    waste_management_score: 0.9,

    wage_fairness_score: 0.93,
    human_rights_score: 0.9,
    diversity_inclusion_score: 0.85,
    community_engagement_score: 0.88,

    transparency_score: 0.92,
    corruption_risk_score: 0.95,
  },
  {
    name: "Fast Fashion Inc",
    description: "Fast fashion retailer with global supply chain",
    industry: "Retail",
    country: "United Kingdom",
    address: "10 Fashion Street, London E1 6PX",
    contact_email: "contact@fastfashioninc.com",
    website: "https://www.fastfashioninc.com",
    year_founded: 2003,
    employee_count: 2500,
    annual_revenue: 75000000,

    // Raw score data
    co2_emissions_score: 0.25,
    water_usage_score: 0.2,
    energy_efficiency_score: 0.3,
    waste_management_score: 0.15,

    wage_fairness_score: 0.2,
    human_rights_score: 0.15,
    diversity_inclusion_score: 0.4,
    community_engagement_score: 0.25,

    transparency_score: 0.3,
    corruption_risk_score: 0.25,
  },
];

// Sample data for media sentiments
const createMediaSentiments = async (suppliers) => {
  const sentimentData = [];

  for (const supplier of suppliers) {
    // Create 3-5 random sentiments for each supplier
    const count = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < count; i++) {
      const sourceTypes = ["news", "social_media", "employee_reviews"];
      const sourceType =
        sourceTypes[Math.floor(Math.random() * sourceTypes.length)];

      // Create sentiment with appropriate score based on supplier's ethical score
      // Higher ethical score -> more positive sentiments on average
      let baseScore = 0;
      switch (supplier.risk_level) {
        case "low":
          baseScore = 0.5;
          break;
        case "medium":
          baseScore = 0;
          break;
        case "high":
          baseScore = -0.5;
          break;
      }

      // Add some randomness
      const sentiment = baseScore + (Math.random() * 0.5 - 0.25);

      sentimentData.push({
        supplier: supplier._id,
        source: sourceType,
        sentiment_score: Math.max(-1, Math.min(1, sentiment)),
        source_url: `https://example.com/${sourceType}/${i}`,
        keywords: ["ethical", "sustainability", "business"],
        publication_date: new Date(
          Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
        ), // Random date in last 90 days
        title: `Sample ${sourceType} article about ${supplier.name}`,
        summary: `This is a sample ${sourceType} entry about ${supplier.name} discussing their ethical practices.`,
        impact_score: Math.random() * 0.5 + 0.2,
      });
    }
  }

  return MediaSentiment.insertMany(sentimentData);
};

// Sample data for ESG reports
const createESGReports = async (suppliers) => {
  const esgData = [];

  for (const supplier of suppliers) {
    // Create 2 years of ESG reports for each supplier
    for (let year = 2022; year <= 2023; year++) {
      // Calculate improvement factor for second year
      const improvementFactor = year === 2023 ? 0.9 : 1;

      // Ensure annual_revenue exists and is a number
      const annualRevenue = supplier.annual_revenue || 1000000;

      esgData.push({
        supplier: supplier._id,
        report_year: year,
        report_url: `https://example.com/esg-reports/${supplier.name
          .toLowerCase()
          .replace(/\s+/g, "-")}/${year}`,
        report_title: `${supplier.name} Annual ESG Report ${year}`,

        // Generate appropriate ESG data based on supplier's ethical score
        co2_emissions:
          ((100 - supplier.environmental_score * 100) *
            improvementFactor *
            (Math.random() * 20 + 90)) /
          100,
        water_usage:
          ((100 - supplier.environmental_score * 100) *
            improvementFactor *
            (Math.random() * 20 + 90)) /
          100,
        energy_consumption:
          ((100 - supplier.environmental_score * 100) *
            improvementFactor *
            (Math.random() * 20 + 90)) /
          100,
        waste_produced:
          ((100 - supplier.environmental_score * 100) *
            improvementFactor *
            (Math.random() * 20 + 90)) /
          100,

        renewable_energy_percentage:
          supplier.environmental_score * 100 * (Math.random() * 0.3 + 0.85),

        diversity_stats: {
          women_percentage: 30 + Math.floor(Math.random() * 40),
          minority_percentage: 20 + Math.floor(Math.random() * 30),
        },

        employee_turnover:
          (100 - supplier.social_score * 100) * (Math.random() * 0.2 + 0.1),
        employee_training_hours:
          supplier.social_score * 100 * (Math.random() * 0.5 + 0.75),
        health_safety_incidents: Math.floor(
          (100 - supplier.social_score * 100) * (Math.random() * 0.2 + 0.05)
        ),
        community_investment:
          (supplier.social_score || 0.5) *
          annualRevenue *
          0.01 *
          (Math.random() * 0.5 + 0.75),

        data_quality_score: 5 + Math.floor(Math.random() * 6),
      });
    }
  }

  return SupplierESGReport.insertMany(esgData);
};

// Sample data for controversies
const createControversies = async (suppliers) => {
  const controversyData = [];

  for (const supplier of suppliers) {
    // Higher risk suppliers have more controversies
    let controversyCount = 0;
    switch (supplier.risk_level) {
      case "low":
        controversyCount = Math.floor(Math.random() * 2);
        break;
      case "medium":
        controversyCount = Math.floor(Math.random() * 2) + 1;
        break;
      case "high":
        controversyCount = Math.floor(Math.random() * 3) + 2;
        break;
    }

    const categories = ["environmental", "social", "governance", "other"];

    for (let i = 0; i < controversyCount; i++) {
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const severity =
        supplier.risk_level === "high"
          ? 6 + Math.floor(Math.random() * 5)
          : supplier.risk_level === "medium"
          ? 4 + Math.floor(Math.random() * 3)
          : 1 + Math.floor(Math.random() * 3);

      // Determine if controversy is resolved
      const resolved = Math.random() > 0.6;

      // Calculate dates
      const occurrenceDate = new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ); // Within the last year
      const resolutionDate = resolved
        ? new Date(
            occurrenceDate.getTime() +
              Math.random() * (Date.now() - occurrenceDate.getTime())
          )
        : null;

      controversyData.push({
        supplier: supplier._id,
        title: `${
          category.charAt(0).toUpperCase() + category.slice(1)
        } Issue at ${supplier.name}`,
        description: `This is a sample ${category} controversy related to ${supplier.name}.`,
        category,
        severity,
        occurrence_date: occurrenceDate,
        resolved,
        resolution_date: resolutionDate,
        resolution_description: resolved
          ? `The ${category} issue was addressed by implementing new policies.`
          : null,
        source_urls: [
          `https://example.com/news/${supplier.name
            .toLowerCase()
            .replace(/\s+/g, "-")}/controversy-${i}`,
        ],
        impact_score: severity / 10,
      });
    }
  }

  return Controversy.insertMany(controversyData);
};

// Main seed function
async function seedDatabase() {
  try {
    // Connect to database
    await connectToDatabase();
    console.log("Connected to database for seeding");

    // Clear existing data
    await Promise.all([
      Supplier.deleteMany({}),
      MediaSentiment.deleteMany({}),
      SupplierESGReport.deleteMany({}),
      Controversy.deleteMany({}),
      ScoringWeight.deleteMany({}),
    ]);
    console.log("Cleared existing data");

    // Create default scoring weights
    await ScoringWeight.createDefault();
    console.log("Created default scoring weights");

    // Initialize ML model
    const scoringModel = new EthicalScoringModel();
    await scoringModel.initialize();
    console.log("Initialized ML model");

    // Create suppliers
    const createdSuppliers = [];
    for (const data of supplierData) {
      const supplier = new Supplier(data);

      // Calculate scores using ML model
      const scores = await scoringModel.calculateScore(supplier);
      supplier.ethical_score = scores.ethical_score;
      supplier.environmental_score = scores.environmental_score;
      supplier.social_score = scores.social_score;
      supplier.governance_score = scores.governance_score;
      supplier.external_impact = scores.external_impact;
      supplier.risk_level = scores.risk_level;

      const savedSupplier = await supplier.save();
      createdSuppliers.push(savedSupplier);
    }
    console.log(`Created ${createdSuppliers.length} suppliers`);

    // Create related data
    const sentiments = await createMediaSentiments(createdSuppliers);
    console.log(`Created ${sentiments.length} media sentiments`);

    const esgReports = await createESGReports(createdSuppliers);
    console.log(`Created ${esgReports.length} ESG reports`);

    const controversies = await createControversies(createdSuppliers);
    console.log(`Created ${controversies.length} controversies`);

    // Update supplier scores with external data
    for (const supplier of createdSuppliers) {
      // Get external data for this supplier
      const socialMediaSentiment = await MediaSentiment.getAverageSentiment(
        supplier._id,
        "social_media"
      );
      const newsSentiment = await MediaSentiment.getAverageSentiment(
        supplier._id,
        "news"
      );
      const employeeReviewsSentiment = await MediaSentiment.getAverageSentiment(
        supplier._id,
        "employee_reviews"
      );
      const controversyImpact = await Controversy.calculateImpact(supplier._id);

      const externalData = {
        socialMediaSentiment: socialMediaSentiment.averageSentiment,
        newsSentiment: newsSentiment.averageSentiment,
        employeeReviewsSentiment: employeeReviewsSentiment.averageSentiment,
        controversyImpact: controversyImpact.score,
      };

      // Recalculate scores with external data
      const scores = await scoringModel.calculateScore(supplier, externalData);

      // Update supplier with new scores
      await Supplier.findByIdAndUpdate(supplier._id, {
        ethical_score: scores.ethical_score,
        environmental_score: scores.environmental_score,
        social_score: scores.social_score,
        governance_score: scores.governance_score,
        external_impact: scores.external_impact,
        risk_level: scores.risk_level,
      });
    }
    console.log("Updated supplier scores with external data");

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Close database connection
    await closeConnection();
    console.log("Database connection closed");
  }
}

// Run the seed function
seedDatabase();
