/**
 * Database Seeding Script for OptEthic Application
 *
 * This script will clear and populate your database with test data
 * to help with testing the application.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Import models
const Supplier = require("../models/Supplier");
const AnalysisResult = require("../models/AnalysisResult");
const Recommendation = require("../models/Recommendation");
const GeoRiskAlert = require("../models/GeoRiskAlert");
const Controversy = require("../models/Controversy");
const ScoringWeight = require("../models/ScoringWeight");

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

// Sample Data
const supplierData = [
  {
    name: "EcoFriendly Manufacturing",
    country: "United States",
    industry: "Manufacturing",
    co2_emissions: 18.2,
    delivery_efficiency: 0.89,
    wage_fairness: 0.92,
    human_rights_index: 0.94,
    waste_management_score: 0.88,
    community_engagement: 0.83,
    energy_efficiency: 0.87,
    water_usage: 25000,
    renewable_energy_percent: 72,
    pollution_control: 0.85,
    diversity_inclusion_score: 0.9,
    worker_safety: 0.95,
    transparency_score: 0.89,
    corruption_risk: 0.15,
    board_diversity: 0.82,
    ethics_program: 0.91,
    compliance_systems: 0.88,
    quality_control_score: 0.93,
    supplier_diversity: 0.79,
    traceability: 0.86,
    geopolitical_risk: 0.25,
    climate_risk: 0.3,
    labor_dispute_risk: 0.18,
    ethical_score: 87.5,
    environmental_score: 85.3,
    social_score: 92.1,
    governance_score: 89.6,
    risk_level: "low",
  },
  {
    name: "Global Tech Industries",
    country: "China",
    industry: "Technology",
    co2_emissions: 45.7,
    delivery_efficiency: 0.79,
    wage_fairness: 0.65,
    human_rights_index: 0.58,
    waste_management_score: 0.62,
    community_engagement: 0.45,
    energy_efficiency: 0.67,
    water_usage: 82000,
    renewable_energy_percent: 28,
    pollution_control: 0.61,
    diversity_inclusion_score: 0.52,
    worker_safety: 0.68,
    transparency_score: 0.54,
    corruption_risk: 0.48,
    board_diversity: 0.41,
    ethics_program: 0.57,
    compliance_systems: 0.6,
    quality_control_score: 0.82,
    supplier_diversity: 0.5,
    traceability: 0.56,
    geopolitical_risk: 0.7,
    climate_risk: 0.52,
    labor_dispute_risk: 0.65,
    ethical_score: 62.8,
    environmental_score: 59.4,
    social_score: 60.7,
    governance_score: 55.2,
    risk_level: "medium",
  },
  {
    name: "Sustainable Apparel Co.",
    country: "India",
    industry: "Textiles & Apparel",
    co2_emissions: 28.3,
    delivery_efficiency: 0.75,
    wage_fairness: 0.6,
    human_rights_index: 0.68,
    waste_management_score: 0.82,
    community_engagement: 0.76,
    energy_efficiency: 0.71,
    water_usage: 98000,
    renewable_energy_percent: 45,
    pollution_control: 0.73,
    diversity_inclusion_score: 0.77,
    worker_safety: 0.72,
    transparency_score: 0.69,
    corruption_risk: 0.38,
    board_diversity: 0.74,
    ethics_program: 0.65,
    compliance_systems: 0.71,
    quality_control_score: 0.76,
    supplier_diversity: 0.81,
    traceability: 0.68,
    geopolitical_risk: 0.55,
    climate_risk: 0.48,
    labor_dispute_risk: 0.51,
    ethical_score: 71.5,
    environmental_score: 74.2,
    social_score: 69.5,
    governance_score: 72.8,
    risk_level: "medium",
  },
  {
    name: "Precision Electronics",
    country: "Japan",
    industry: "Electronics",
    co2_emissions: 35.2,
    delivery_efficiency: 0.92,
    wage_fairness: 0.86,
    human_rights_index: 0.88,
    waste_management_score: 0.8,
    community_engagement: 0.7,
    energy_efficiency: 0.85,
    water_usage: 42000,
    renewable_energy_percent: 52,
    pollution_control: 0.82,
    diversity_inclusion_score: 0.65,
    worker_safety: 0.9,
    transparency_score: 0.83,
    corruption_risk: 0.18,
    board_diversity: 0.55,
    ethics_program: 0.87,
    compliance_systems: 0.92,
    quality_control_score: 0.95,
    supplier_diversity: 0.62,
    traceability: 0.89,
    geopolitical_risk: 0.32,
    climate_risk: 0.45,
    labor_dispute_risk: 0.25,
    ethical_score: 80.2,
    environmental_score: 79.3,
    social_score: 78.2,
    governance_score: 84.6,
    risk_level: "low",
  },
  {
    name: "CleanEnergy Solutions",
    country: "Germany",
    industry: "Renewable Energy",
    co2_emissions: 8.7,
    delivery_efficiency: 0.87,
    wage_fairness: 0.9,
    human_rights_index: 0.92,
    waste_management_score: 0.91,
    community_engagement: 0.88,
    energy_efficiency: 0.94,
    water_usage: 18000,
    renewable_energy_percent: 95,
    pollution_control: 0.92,
    diversity_inclusion_score: 0.86,
    worker_safety: 0.89,
    transparency_score: 0.94,
    corruption_risk: 0.12,
    board_diversity: 0.78,
    ethics_program: 0.92,
    compliance_systems: 0.91,
    quality_control_score: 0.9,
    supplier_diversity: 0.83,
    traceability: 0.9,
    geopolitical_risk: 0.2,
    climate_risk: 0.25,
    labor_dispute_risk: 0.18,
    ethical_score: 91.5,
    environmental_score: 93.8,
    social_score: 89.5,
    governance_score: 92.3,
    risk_level: "low",
  },
  {
    name: "Budget Suppliers Inc.",
    country: "Vietnam",
    industry: "Manufacturing",
    co2_emissions: 62.4,
    delivery_efficiency: 0.65,
    wage_fairness: 0.48,
    human_rights_index: 0.42,
    waste_management_score: 0.4,
    community_engagement: 0.35,
    energy_efficiency: 0.51,
    water_usage: 125000,
    renewable_energy_percent: 12,
    pollution_control: 0.38,
    diversity_inclusion_score: 0.42,
    worker_safety: 0.55,
    transparency_score: 0.32,
    corruption_risk: 0.72,
    board_diversity: 0.28,
    ethics_program: 0.39,
    compliance_systems: 0.45,
    quality_control_score: 0.6,
    supplier_diversity: 0.3,
    traceability: 0.41,
    geopolitical_risk: 0.78,
    climate_risk: 0.65,
    labor_dispute_risk: 0.8,
    ethical_score: 42.5,
    environmental_score: 38.7,
    social_score: 44.8,
    governance_score: 36.5,
    risk_level: "high",
  },
  {
    name: "Pharma Global Ltd.",
    country: "Switzerland",
    industry: "Pharmaceuticals",
    co2_emissions: 25.8,
    delivery_efficiency: 0.88,
    wage_fairness: 0.91,
    human_rights_index: 0.88,
    waste_management_score: 0.76,
    community_engagement: 0.82,
    energy_efficiency: 0.78,
    water_usage: 56000,
    renewable_energy_percent: 58,
    pollution_control: 0.75,
    diversity_inclusion_score: 0.83,
    worker_safety: 0.92,
    transparency_score: 0.85,
    corruption_risk: 0.22,
    board_diversity: 0.76,
    ethics_program: 0.89,
    compliance_systems: 0.93,
    quality_control_score: 0.94,
    supplier_diversity: 0.72,
    traceability: 0.81,
    geopolitical_risk: 0.28,
    climate_risk: 0.35,
    labor_dispute_risk: 0.22,
    ethical_score: 83.7,
    environmental_score: 78.4,
    social_score: 86.5,
    governance_score: 88.2,
    risk_level: "low",
  },
  {
    name: "Fast Fashion Corp.",
    country: "Bangladesh",
    industry: "Textiles & Apparel",
    co2_emissions: 55.3,
    delivery_efficiency: 0.71,
    wage_fairness: 0.41,
    human_rights_index: 0.38,
    waste_management_score: 0.45,
    community_engagement: 0.3,
    energy_efficiency: 0.48,
    water_usage: 142000,
    renewable_energy_percent: 10,
    pollution_control: 0.42,
    diversity_inclusion_score: 0.55,
    worker_safety: 0.45,
    transparency_score: 0.35,
    corruption_risk: 0.65,
    board_diversity: 0.4,
    ethics_program: 0.32,
    compliance_systems: 0.41,
    quality_control_score: 0.62,
    supplier_diversity: 0.48,
    traceability: 0.35,
    geopolitical_risk: 0.72,
    climate_risk: 0.68,
    labor_dispute_risk: 0.82,
    ethical_score: 41.2,
    environmental_score: 35.6,
    social_score: 42.8,
    governance_score: 38.4,
    risk_level: "high",
  },
  {
    name: "CarbonFreight Logistics",
    country: "Netherlands",
    industry: "Logistics & Supply Chain",
    co2_emissions: 32.1,
    delivery_efficiency: 0.85,
    wage_fairness: 0.82,
    human_rights_index: 0.85,
    waste_management_score: 0.78,
    community_engagement: 0.65,
    energy_efficiency: 0.72,
    water_usage: 28000,
    renewable_energy_percent: 62,
    pollution_control: 0.75,
    diversity_inclusion_score: 0.72,
    worker_safety: 0.8,
    transparency_score: 0.78,
    corruption_risk: 0.25,
    board_diversity: 0.68,
    ethics_program: 0.76,
    compliance_systems: 0.8,
    quality_control_score: 0.82,
    supplier_diversity: 0.7,
    traceability: 0.85,
    geopolitical_risk: 0.3,
    climate_risk: 0.48,
    labor_dispute_risk: 0.28,
    ethical_score: 77.5,
    environmental_score: 74.2,
    social_score: 80.1,
    governance_score: 76.4,
    risk_level: "medium",
  },
  {
    name: "FoodProcess International",
    country: "Brazil",
    industry: "Food & Beverage",
    co2_emissions: 40.3,
    delivery_efficiency: 0.72,
    wage_fairness: 0.65,
    human_rights_index: 0.7,
    waste_management_score: 0.68,
    community_engagement: 0.75,
    energy_efficiency: 0.65,
    water_usage: 95000,
    renewable_energy_percent: 48,
    pollution_control: 0.62,
    diversity_inclusion_score: 0.78,
    worker_safety: 0.72,
    transparency_score: 0.61,
    corruption_risk: 0.45,
    board_diversity: 0.72,
    ethics_program: 0.6,
    compliance_systems: 0.65,
    quality_control_score: 0.75,
    supplier_diversity: 0.68,
    traceability: 0.58,
    geopolitical_risk: 0.52,
    climate_risk: 0.58,
    labor_dispute_risk: 0.45,
    ethical_score: 65.8,
    environmental_score: 62.3,
    social_score: 71.2,
    governance_score: 60.5,
    risk_level: "medium",
  },
];

// Generate analysis results for each supplier
const createAnalysisResults = (suppliers) => {
  const analysisResults = [];

  suppliers.forEach((supplier) => {
    analysisResults.push({
      supplier: supplier._id,
      analysis_type: "comprehensive",
      status: "completed",
      scores: {
        overall: supplier.ethical_score,
        environmental: supplier.environmental_score,
        social: supplier.social_score,
        governance: supplier.governance_score,
      },
      factors: [
        {
          name: "Carbon Emissions",
          value: supplier.co2_emissions,
          weight: 0.25,
          description: "Total carbon emissions in metric tons",
        },
        {
          name: "Renewable Energy Usage",
          value: supplier.renewable_energy_percent,
          weight: 0.2,
          description: "Percentage of energy from renewable sources",
        },
        {
          name: "Worker Rights Compliance",
          value: supplier.human_rights_index * 100,
          weight: 0.3,
          description: "Score based on human rights and labor policy adherence",
        },
        {
          name: "Governance Transparency",
          value: supplier.transparency_score * 100,
          weight: 0.25,
          description:
            "Score based on reporting transparency and governance structure",
        },
      ],
      benchmarks: {
        industry_average:
          supplier.ethical_score > 70
            ? supplier.ethical_score - 15
            : supplier.ethical_score + 10,
        industry_best: 92,
        industry_worst: 38,
        global_average: 68,
      },
      insights: [
        {
          type: supplier.ethical_score > 70 ? "positive" : "negative",
          text:
            supplier.ethical_score > 70
              ? `${supplier.name} demonstrates strong performance in ${
                  supplier.environmental_score > supplier.social_score
                    ? "environmental sustainability"
                    : "social responsibility"
                }.`
              : `${supplier.name} needs improvement in ${
                  supplier.environmental_score < supplier.social_score
                    ? "environmental practices"
                    : "social impact areas"
                }.`,
          severity: supplier.ethical_score > 70 ? "positive" : "negative",
          impact_score: 0.8,
        },
        {
          type: supplier.renewable_energy_percent > 50 ? "positive" : "neutral",
          text:
            supplier.renewable_energy_percent > 50
              ? `Strong renewable energy adoption at ${supplier.renewable_energy_percent}% exceeds industry standards.`
              : `Renewable energy usage at ${supplier.renewable_energy_percent}% is below recommended targets.`,
          severity:
            supplier.renewable_energy_percent > 50 ? "positive" : "neutral",
          impact_score: 0.65,
        },
      ],
      methodology: {
        version: "1.2.0",
        description:
          "Comprehensive ESG evaluation using weighted multi-factor analysis",
        data_sources: [
          "supplier self-reporting",
          "industry benchmarks",
          "third-party verification",
        ],
      },
      processed_by: "ai",
      confidence_score: 0.85,
      created_at: new Date(),
      updated_at: new Date(),
    });
  });

  return analysisResults;
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

// Generate controversies for some suppliers
const createControversies = (suppliers) => {
  const controversies = [];
  const highRiskSuppliers = suppliers.filter(
    (s) => s.risk_level === "high" || s.ethical_score < 60
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

  return controversies;
};

// Create geo risk alerts
const createGeoRiskAlerts = () => {
  return [
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
};

// Create a default scoring weight
const createScoringWeight = () => {
  return {
    name: "Standard ESG Weighting",
    description: "Default balanced weighting system for ESG evaluation",
    is_default: true,
    created_by: "system",
    environmental_weight: 0.33,
    social_weight: 0.33,
    governance_weight: 0.34,
    external_data_weight: 0.25,
    co2_weight: 0.3,
    water_usage_weight: 0.25,
    energy_efficiency_weight: 0.25,
    waste_management_weight: 0.2,
    wage_fairness_weight: 0.25,
    human_rights_weight: 0.3,
    diversity_inclusion_weight: 0.25,
    community_engagement_weight: 0.2,
    transparency_weight: 0.6,
    corruption_risk_weight: 0.4,
    social_media_weight: 0.2,
    news_coverage_weight: 0.3,
    worker_reviews_weight: 0.25,
    controversy_weight: 0.25,
  };
};

// Seed the database
const seedDatabase = async () => {
  try {
    console.log("Starting database seeding process...");

    // Clear existing data
    console.log("Clearing existing data...");
    await Supplier.deleteMany({});
    await AnalysisResult.deleteMany({});
    await Recommendation.deleteMany({});
    await Controversy.deleteMany({});
    await GeoRiskAlert.deleteMany({});
    await ScoringWeight.deleteMany({});

    // Insert suppliers
    console.log("Adding suppliers...");
    const createdSuppliers = await Supplier.insertMany(supplierData);
    console.log(`Added ${createdSuppliers.length} suppliers`);

    // Create and insert analysis results
    console.log("Adding analysis results...");
    const analysisResults = createAnalysisResults(createdSuppliers);
    await AnalysisResult.insertMany(analysisResults);
    console.log(`Added ${analysisResults.length} analysis results`);

    // Create and insert recommendations
    console.log("Adding recommendations...");
    const recommendations = createRecommendations(createdSuppliers);
    await Recommendation.insertMany(recommendations);
    console.log(`Added ${recommendations.length} recommendations`);

    // Create and insert controversies
    console.log("Adding controversies...");
    const controversies = createControversies(createdSuppliers);
    await Controversy.insertMany(controversies);
    console.log(`Added ${controversies.length} controversies`);

    // Create and insert geo risk alerts
    console.log("Adding geo risk alerts...");
    const geoRiskAlerts = createGeoRiskAlerts();
    await GeoRiskAlert.insertMany(geoRiskAlerts);
    console.log(`Added ${geoRiskAlerts.length} geo risk alerts`);

    // Create and insert scoring weight
    console.log("Adding scoring weight...");
    const scoringWeight = createScoringWeight();
    await ScoringWeight.create(scoringWeight);
    console.log("Added default scoring weight");

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the seeding process
connectToDatabase()
  .then(seedDatabase)
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exit(1);
  });
