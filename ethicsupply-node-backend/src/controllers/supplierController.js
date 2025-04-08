const Supplier = require("../models/Supplier");
const MediaSentiment = require("../models/MediaSentiment");
const SupplierESGReport = require("../models/SupplierESGReport");
const Controversy = require("../models/Controversy");
const EthicalScoringModel = require("../ml/EthicalScoringModel");

// Initialize the ML model
const scoringModel = new EthicalScoringModel();

/**
 * Get all suppliers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a single supplier by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new supplier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createSupplier = async (req, res) => {
  try {
    const supplier = new Supplier(req.body);

    // Calculate scores using the ML model
    await calculateAndSetScores(supplier);

    const savedSupplier = await supplier.save();
    res.status(201).json(savedSupplier);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Update a supplier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      supplier[key] = req.body[key];
    });

    // Recalculate scores
    await calculateAndSetScores(supplier);

    const updatedSupplier = await supplier.save();
    res.status(200).json(updatedSupplier);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete a supplier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    await supplier.deleteOne();

    // Also delete related data
    await MediaSentiment.deleteMany({ supplier: req.params.id });
    await SupplierESGReport.deleteMany({ supplier: req.params.id });
    await Controversy.deleteMany({ supplier: req.params.id });

    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get supply chain graph
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSupplyChainGraph = async (req, res) => {
  try {
    const suppliers = await Supplier.find();

    // Create nodes and links for the graph visualization
    const nodes = suppliers.map((supplier) => ({
      id: supplier._id,
      name: supplier.name,
      country: supplier.country,
      industry: supplier.industry,
      ethicalScore: supplier.ethical_score,
      riskLevel: supplier.risk_level,
    }));

    // In a real app, we would have relationship data for links
    // For now, create sample links between suppliers
    const links = [];
    if (suppliers.length > 1) {
      // Create a simple chain for demonstration
      for (let i = 0; i < suppliers.length - 1; i++) {
        links.push({
          source: suppliers[i]._id,
          target: suppliers[i + 1]._id,
          value: Math.random() * 10, // Random strength of connection
        });
      }
    }

    res.status(200).json({ nodes, links });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDashboard = async (req, res) => {
  try {
    // Get all suppliers
    const suppliers = await Supplier.find();

    if (suppliers.length === 0) {
      // Return empty stats if no suppliers
      return res.status(200).json({
        total_suppliers: 0,
        avg_ethical_score: 0,
        avg_environmental_score: 0,
        avg_social_score: 0,
        avg_governance_score: 0,
        risk_assessment: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
        suppliers_by_country: {},
        suppliers_by_industry: {},
        ethical_score_distribution: [],
        environmental_score_distribution: [],
        social_score_distribution: [],
        governance_score_distribution: [],
        co2_emissions_by_industry: [],
        water_usage_by_industry: [],
        ethical_score_trends: [],
        improvement_opportunities: [],
      });
    }

    // Calculate averages
    const avgEthicalScore =
      suppliers.reduce((acc, s) => acc + (s.ethical_score || 0), 0) /
      suppliers.length;
    const avgEnvironmentalScore =
      suppliers.reduce((acc, s) => acc + (s.environmental_score || 0), 0) /
      suppliers.length;
    const avgSocialScore =
      suppliers.reduce((acc, s) => acc + (s.social_score || 0), 0) /
      suppliers.length;
    const avgGovernanceScore =
      suppliers.reduce((acc, s) => acc + (s.governance_score || 0), 0) /
      suppliers.length;

    // Calculate risk assessment
    const riskAssessment = {
      low: suppliers.filter((s) => s.risk_level === "low").length,
      medium: suppliers.filter((s) => s.risk_level === "medium").length,
      high: suppliers.filter((s) => s.risk_level === "high").length,
      critical: suppliers.filter((s) => s.risk_level === "critical").length,
    };

    // Get suppliers by country
    const suppliersByCountry = {};
    suppliers.forEach((supplier) => {
      const country = supplier.country || "Unknown";
      suppliersByCountry[country] = (suppliersByCountry[country] || 0) + 1;
    });

    // Get suppliers by industry
    const suppliersByIndustry = {};
    suppliers.forEach((supplier) => {
      const industry = supplier.industry || "Other";
      suppliersByIndustry[industry] = (suppliersByIndustry[industry] || 0) + 1;
    });

    // Create score distributions
    const createScoreDistribution = (scoreField) => {
      const ranges = [
        { min: 0, max: 20, label: "0-20" },
        { min: 21, max: 40, label: "21-40" },
        { min: 41, max: 60, label: "41-60" },
        { min: 61, max: 80, label: "61-80" },
        { min: 81, max: 100, label: "81-100" },
      ];

      return ranges.map((range) => ({
        range: range.label,
        count: suppliers.filter((s) => {
          const score = s[scoreField] || 0;
          return score >= range.min && score <= range.max;
        }).length,
      }));
    };

    const ethicalScoreDistribution = createScoreDistribution("ethical_score");
    const environmentalScoreDistribution = createScoreDistribution(
      "environmental_score"
    );
    const socialScoreDistribution = createScoreDistribution("social_score");
    const governanceScoreDistribution =
      createScoreDistribution("governance_score");

    // Calculate CO2 emissions by industry
    const co2EmissionsByIndustry = [];
    const industryCO2 = {};
    suppliers.forEach((supplier) => {
      const industry = supplier.industry || "Other";
      if (supplier.co2_emissions) {
        industryCO2[industry] =
          (industryCO2[industry] || 0) + supplier.co2_emissions;
      }
    });
    for (const [industry, total] of Object.entries(industryCO2)) {
      co2EmissionsByIndustry.push({ name: industry, value: total });
    }

    // Calculate water usage by industry
    const waterUsageByIndustry = [];
    for (const [industry, count] of Object.entries(suppliersByIndustry)) {
      const industrySuppliers = suppliers.filter(
        (s) => (s.industry || "Other") === industry
      );
      const avgUsage =
        industrySuppliers.reduce((acc, s) => acc + (s.water_usage || 0), 0) /
        industrySuppliers.length;
      waterUsageByIndustry.push({ name: industry, value: avgUsage });
    }

    // Generate ethical score trends (mock data for now)
    const today = new Date();
    const trendData = [];
    for (let i = 6; i > 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const envScore = Math.max(
        0,
        Math.min(100, avgEnvironmentalScore + (i - 3) * 2)
      );
      const socialScore = Math.max(
        0,
        Math.min(100, avgSocialScore + (i - 3) * 1.5)
      );
      const govScore = Math.max(0, Math.min(100, avgGovernanceScore + (i - 3)));
      const ethicalScore = (envScore + socialScore + govScore) / 3;

      trendData.push({
        date: monthDate.toISOString().slice(0, 7),
        ethical_score: Math.round(ethicalScore * 10) / 10,
        environmental_score: Math.round(envScore * 10) / 10,
        social_score: Math.round(socialScore * 10) / 10,
        governance_score: Math.round(govScore * 10) / 10,
      });
    }

    // Generate improvement opportunities (mock data for now)
    const improvementOpportunities = suppliers
      .sort((a, b) => (b.ethical_score || 0) - (a.ethical_score || 0))
      .slice(0, 5)
      .map((supplier) => ({
        supplier_id: supplier._id,
        name: supplier.name,
        current_score: supplier.ethical_score || 0,
        potential_score: Math.min(100, (supplier.ethical_score || 0) + 20),
        improvement_areas: ["environmental", "social", "governance"].filter(
          (area) => {
            const score = supplier[`${area}_score`] || 0;
            return score < 80;
          }
        ),
      }));

    res.status(200).json({
      total_suppliers: suppliers.length,
      avg_ethical_score: Math.round(avgEthicalScore * 10) / 10,
      avg_environmental_score: Math.round(avgEnvironmentalScore * 10) / 10,
      avg_social_score: Math.round(avgSocialScore * 10) / 10,
      avg_governance_score: Math.round(avgGovernanceScore * 10) / 10,
      risk_assessment: riskAssessment,
      suppliers_by_country: suppliersByCountry,
      suppliers_by_industry: suppliersByIndustry,
      ethical_score_distribution: ethicalScoreDistribution,
      environmental_score_distribution: environmentalScoreDistribution,
      social_score_distribution: socialScoreDistribution,
      governance_score_distribution: governanceScoreDistribution,
      co2_emissions_by_industry: co2EmissionsByIndustry,
      water_usage_by_industry: waterUsageByIndustry,
      ethical_score_trends: trendData,
      improvement_opportunities: improvementOpportunities,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Evaluate a supplier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.evaluateSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    // Recalculate scores
    await calculateAndSetScores(supplier);
    await supplier.save();

    // Get related data for the evaluation report
    const mediaSentiments = await MediaSentiment.find({ supplier: supplierId })
      .sort({ publication_date: -1 })
      .limit(10);

    const esgReports = await SupplierESGReport.find({ supplier: supplierId })
      .sort({ report_year: -1 })
      .limit(5);

    const controversies = await Controversy.find({ supplier: supplierId }).sort(
      { occurrence_date: -1 }
    );

    // Calculate additional metrics
    const yearOverYearImprovement = await calculateYearOverYearImprovement(
      supplierId
    );
    const industryComparison = await calculateIndustryComparison(supplier);

    res.status(200).json({
      supplier,
      mediaSentiments,
      esgReports,
      controversies,
      yearOverYearImprovement,
      industryComparison,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Health check endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.healthCheck = async (req, res) => {
  res.status(200).json({ status: "ok", message: "API is running" });
};

/**
 * Calculate and set scores for a supplier using the ML model
 * @param {Object} supplier - Supplier document
 * @private
 */
async function calculateAndSetScores(supplier) {
  try {
    // Get external data for the supplier
    const externalData = await getExternalData(supplier._id);

    // Calculate scores using the ML model
    const scores = await scoringModel.calculateScore(supplier, externalData);

    // Set the calculated scores
    supplier.ethical_score = scores.ethical_score;
    supplier.environmental_score = scores.environmental_score;
    supplier.social_score = scores.social_score;
    supplier.governance_score = scores.governance_score;
    supplier.external_impact = scores.external_impact;
    supplier.risk_level = scores.risk_level;

    return supplier;
  } catch (error) {
    console.error("Error calculating scores:", error);
    // Use default scores if calculation fails
    supplier.ethical_score = 0.5;
    supplier.environmental_score = 0.5;
    supplier.social_score = 0.5;
    supplier.governance_score = 0.5;
    supplier.external_impact = 0;
    supplier.risk_level = "medium";

    return supplier;
  }
}

/**
 * Get external data for a supplier
 * @param {string} supplierId - Supplier ID
 * @returns {Object} External data for ML model
 * @private
 */
async function getExternalData(supplierId) {
  // Get media sentiments
  const socialMediaSentiment = await MediaSentiment.getAverageSentiment(
    supplierId,
    "social_media"
  );
  const newsSentiment = await MediaSentiment.getAverageSentiment(
    supplierId,
    "news"
  );
  const employeeReviewsSentiment = await MediaSentiment.getAverageSentiment(
    supplierId,
    "employee_reviews"
  );

  // Get controversy impact
  const controversyImpact = await Controversy.calculateImpact(supplierId);

  return {
    socialMediaSentiment: socialMediaSentiment.averageSentiment,
    newsSentiment: newsSentiment.averageSentiment,
    employeeReviewsSentiment: employeeReviewsSentiment.averageSentiment,
    controversyImpact: controversyImpact.score,
  };
}

/**
 * Calculate year-over-year improvement for a supplier
 * @param {string} supplierId - Supplier ID
 * @returns {Object} Year-over-year improvement metrics
 * @private
 */
async function calculateYearOverYearImprovement(supplierId) {
  // Get ESG reports from the last two years
  const reports = await SupplierESGReport.find({ supplier: supplierId })
    .sort({ report_year: -1 })
    .limit(2);

  if (reports.length < 2) {
    return { available: false };
  }

  // Calculate improvements for different metrics
  const improvements = {};
  const metrics = [
    "co2_emissions",
    "water_usage",
    "energy_consumption",
    "waste_produced",
    "renewable_energy_percentage",
    "employee_turnover",
    "employee_training_hours",
  ];

  for (const metric of metrics) {
    const improvement = await SupplierESGReport.calculateYoYImprovement(
      supplierId,
      metric
    );
    if (improvement !== null) {
      improvements[metric] = improvement;
    }
  }

  return {
    available: true,
    recentYears: [reports[0].report_year, reports[1].report_year],
    improvements,
  };
}

/**
 * Calculate industry comparison metrics
 * @param {Object} supplier - Supplier document
 * @returns {Object} Industry comparison metrics
 * @private
 */
async function calculateIndustryComparison(supplier) {
  if (!supplier.industry) {
    return { available: false };
  }

  // Get suppliers in the same industry
  const industrySuppliers = await Supplier.find({
    industry: supplier.industry,
    _id: { $ne: supplier._id },
  });

  if (industrySuppliers.length === 0) {
    return { available: false };
  }

  // Calculate industry averages
  const avgEthicalScore =
    industrySuppliers.reduce((acc, s) => acc + s.ethical_score, 0) /
    industrySuppliers.length;
  const avgEnvironmentalScore =
    industrySuppliers.reduce((acc, s) => acc + s.environmental_score, 0) /
    industrySuppliers.length;
  const avgSocialScore =
    industrySuppliers.reduce((acc, s) => acc + s.social_score, 0) /
    industrySuppliers.length;
  const avgGovernanceScore =
    industrySuppliers.reduce((acc, s) => acc + s.governance_score, 0) /
    industrySuppliers.length;

  // Calculate percentile rank
  const sortedScores = [...industrySuppliers, supplier]
    .sort((a, b) => a.ethical_score - b.ethical_score)
    .map((s) => s.ethical_score);

  const supplierIndex = sortedScores.indexOf(supplier.ethical_score);
  const percentileRank = (supplierIndex / sortedScores.length) * 100;

  return {
    available: true,
    industrySupplierCount: industrySuppliers.length,
    industryAverages: {
      ethical: avgEthicalScore,
      environmental: avgEnvironmentalScore,
      social: avgSocialScore,
      governance: avgGovernanceScore,
    },
    supplierPercentileRank: percentileRank,
    comparison: {
      ethical: supplier.ethical_score - avgEthicalScore,
      environmental: supplier.environmental_score - avgEnvironmentalScore,
      social: supplier.social_score - avgSocialScore,
      governance: supplier.governance_score - avgGovernanceScore,
    },
  };
}

exports.getSupplierAnalytics = async (req, res) => {
  try {
    const supplierId = req.params.id;

    // Try to find the supplier by MongoDB ID first
    let supplier = null;
    try {
      if (supplierId.match(/^[0-9a-fA-F]{24}$/)) {
        supplier = await Supplier.findById(supplierId);
      }
    } catch (error) {
      console.log("Not a valid MongoDB ID, trying numeric ID instead");
    }

    // If not found by MongoDB ID, try looking up by numeric ID (used in the frontend demo data)
    if (!supplier) {
      // Find all suppliers and search by numeric ID
      const allSuppliers = await Supplier.find();
      supplier = allSuppliers.find((s) => Number(supplierId) === 67);

      // If we still don't have a supplier, return first one as a fallback
      if (!supplier && allSuppliers.length > 0) {
        supplier = allSuppliers[0];
      }
    }

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Generate mock trends data
    const generateTrend = () => {
      const trends = ["improving", "stable", "declining"];
      const randomIndex = Math.floor(Math.random() * trends.length);
      return trends[randomIndex];
    };

    // Generate mock historical data
    const generateHistoricalData = (baseValue) => {
      const months = 12;
      const result = [];
      let value = baseValue;

      for (let i = 0; i < months; i++) {
        // Random fluctuation between -5% and +5%
        const fluctuation = (Math.random() * 0.1 - 0.05) * value;
        value = Math.max(0, Math.min(100, value + fluctuation));

        // Create a date for each month counting back from now
        const date = new Date();
        date.setMonth(date.getMonth() - (months - i - 1));

        result.push({
          date: date.toISOString().split("T")[0], // YYYY-MM-DD format
          value: Math.round(value * 10) / 10, // Round to 1 decimal place
        });
      }

      return result;
    };

    // Calculate analytics based on actual supplier data
    const analytics = {
      // Use ethical_score if available, otherwise calculate from other scores
      riskScore: supplier.risk_level
        ? supplier.risk_level === "low"
          ? 25
          : supplier.risk_level === "medium"
          ? 50
          : 75
        : Math.round(Math.random() * 50 + 25),

      ethicalScore: supplier.ethical_score
        ? Math.round(supplier.ethical_score * 100)
        : 65,
      environmentalScore: supplier.environmental_score
        ? Math.round(supplier.environmental_score * 100)
        : 70,
      socialScore: supplier.social_score
        ? Math.round(supplier.social_score * 100)
        : 68,
      governanceScore: supplier.governance_score
        ? Math.round(supplier.governance_score * 100)
        : 72,

      lastUpdated: supplier.updated_at || new Date(),

      trends: {
        ethical: generateTrend(),
        environmental: generateTrend(),
        social: generateTrend(),
        governance: generateTrend(),
      },

      // Generate historical data for each score type
      historical: {
        ethical: generateHistoricalData(
          supplier.ethical_score ? supplier.ethical_score * 100 : 65
        ),
        environmental: generateHistoricalData(
          supplier.environmental_score ? supplier.environmental_score * 100 : 70
        ),
        social: generateHistoricalData(
          supplier.social_score ? supplier.social_score * 100 : 68
        ),
        governance: generateHistoricalData(
          supplier.governance_score ? supplier.governance_score * 100 : 72
        ),
      },

      recommendations: [
        "Improve supplier diversity programs",
        "Enhance carbon emission monitoring",
        "Implement more robust ethical standards",
        "Increase transparency in supply chain",
      ],

      // Mock benchmarks
      industryBenchmarks: {
        ethical: Math.round(Math.random() * 15 + 60),
        environmental: Math.round(Math.random() * 15 + 55),
        social: Math.round(Math.random() * 15 + 65),
        governance: Math.round(Math.random() * 15 + 58),
      },
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching supplier analytics:", error);
    res.status(500).json({ message: "Error fetching supplier analytics" });
  }
};

exports.getMLStatus = async (req, res) => {
  try {
    // This is a placeholder for actual ML service status
    // In a real implementation, this would check the status of your ML service
    const mlStatus = {
      status: "operational",
      lastUpdated: new Date(),
      modelVersion: "1.0.0",
      features: {
        riskAssessment: true,
        complianceCheck: true,
        sustainabilityAnalysis: true,
      },
    };

    res.json(mlStatus);
  } catch (error) {
    console.error("Error fetching ML status:", error);
    res.status(500).json({ message: "Error fetching ML status" });
  }
};

/**
 * Evaluate a supplier (POST version)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.evaluateSupplierPost = async (req, res) => {
  try {
    // Create a temporary supplier object from the request body
    const supplierData = req.body;

    // Validate required fields
    if (!supplierData.name || !supplierData.country || !supplierData.industry) {
      return res.status(400).json({
        error:
          "Missing required fields. Name, country, and industry are required.",
      });
    }

    // Create a temporary supplier object (not saved to database)
    const tempSupplier = {
      _id: "temp_" + Date.now(), // Temporary ID for processing
      name: supplierData.name,
      country: supplierData.country,
      industry: supplierData.industry,

      // Environmental metrics
      co2_emissions: supplierData.co2_emissions || 0,
      water_usage: supplierData.water_usage || 0,
      energy_efficiency: supplierData.energy_efficiency || 0,
      waste_management_score: supplierData.waste_management_score || 0,
      renewable_energy_percent: supplierData.renewable_energy_percent || 0,
      pollution_control: supplierData.pollution_control || 0,

      // Normalize scores for ML model
      co2_emissions_score:
        1 - Math.min(1, Math.max(0, supplierData.co2_emissions / 100)),
      water_usage_score:
        1 - Math.min(1, Math.max(0, supplierData.water_usage / 100)),
      energy_efficiency_score: supplierData.energy_efficiency || 0,

      // Social metrics
      wage_fairness: supplierData.wage_fairness || 0,
      wage_fairness_score: supplierData.wage_fairness || 0,
      human_rights_index: supplierData.human_rights_index || 0,
      human_rights_score: supplierData.human_rights_index || 0,
      diversity_inclusion_score: supplierData.diversity_inclusion_score || 0,
      community_engagement: supplierData.community_engagement || 0,
      community_engagement_score: supplierData.community_engagement || 0,

      // Governance metrics
      transparency_score: supplierData.transparency_score || 0,
      corruption_risk: supplierData.corruption_risk || 0,
      corruption_risk_score: 1 - (supplierData.corruption_risk || 0), // Invert risk score
      board_diversity: supplierData.board_diversity || 0,
      ethics_program: supplierData.ethics_program || 0,
      compliance_systems: supplierData.compliance_systems || 0,

      // Supply Chain metrics
      delivery_efficiency: supplierData.delivery_efficiency || 0,
      quality_control_score: supplierData.quality_control_score || 0,
      supplier_diversity: supplierData.supplier_diversity || 0,
      traceability: supplierData.traceability || 0,

      // Risk factors
      geopolitical_risk: supplierData.geopolitical_risk || 0,
      climate_risk: supplierData.climate_risk || 0,
      labor_dispute_risk: supplierData.labor_dispute_risk || 0,
    };

    // Calculate scores using the ML model
    const scores = await scoringModel.calculateScore(tempSupplier, null);

    // Generate recommendations based on scores
    const recommendations = generateRecommendations(tempSupplier, scores);

    // Build detailed response
    const evaluationResult = {
      name: tempSupplier.name,
      country: tempSupplier.country,
      industry: tempSupplier.industry,
      ethical_score: Math.round(scores.ethical_score * 100),
      environmental_score: Math.round(scores.environmental_score * 100),
      social_score: Math.round(scores.social_score * 100),
      governance_score: Math.round(scores.governance_score * 100),
      risk_level: scores.risk_level,
      recommendations,
      isAiGenerated: true,
      assessment_date: new Date().toISOString(),
      suggestions: generateSuggestions(tempSupplier, scores),
    };

    res.status(200).json(evaluationResult);
  } catch (error) {
    console.error("Error evaluating supplier:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate recommendations based on supplier data and scores
 * @param {Object} supplier - Supplier data
 * @param {Object} scores - Calculated scores
 * @returns {Array} List of recommendations
 * @private
 */
function generateRecommendations(supplier, scores) {
  const recommendations = [];

  // Environmental recommendations
  if (scores.environmental_score < 0.7) {
    if (supplier.co2_emissions > 50) {
      recommendations.push(
        "Implement carbon reduction strategies to lower emissions"
      );
    }
    if (supplier.water_usage > 50) {
      recommendations.push(
        "Adopt water conservation measures across operations"
      );
    }
    if (supplier.energy_efficiency < 0.6) {
      recommendations.push(
        "Improve energy efficiency through equipment upgrades and monitoring"
      );
    }
    if (supplier.waste_management_score < 0.6) {
      recommendations.push(
        "Develop a comprehensive waste reduction and recycling program"
      );
    }
  }

  // Social recommendations
  if (scores.social_score < 0.7) {
    if (supplier.wage_fairness < 0.7) {
      recommendations.push(
        "Review compensation practices to ensure fair wages"
      );
    }
    if (supplier.human_rights_index < 0.7) {
      recommendations.push("Strengthen human rights due diligence processes");
    }
    if (supplier.diversity_inclusion_score < 0.6) {
      recommendations.push("Enhance diversity and inclusion initiatives");
    }
  }

  // Governance recommendations
  if (scores.governance_score < 0.7) {
    if (supplier.transparency_score < 0.6) {
      recommendations.push(
        "Increase transparency through enhanced reporting and disclosure"
      );
    }
    if (supplier.corruption_risk > 0.4) {
      recommendations.push("Strengthen anti-corruption controls and training");
    }
    if (supplier.ethics_program < 0.6) {
      recommendations.push(
        "Develop a more robust ethics program with clear policies"
      );
    }
  }

  // Add general recommendations if specific ones aren't enough
  if (recommendations.length < 3) {
    recommendations.push(
      "Implement sustainability reporting aligned with industry standards"
    );
    recommendations.push(
      "Engage with stakeholders to better understand expectations"
    );
    recommendations.push("Benchmark performance against industry leaders");
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

/**
 * Generate specific suggestions for improvement
 * @param {Object} supplier - Supplier data
 * @param {Object} scores - Calculated scores
 * @returns {Array} List of specific suggestions
 * @private
 */
function generateSuggestions(supplier, scores) {
  const suggestions = [];

  // Add specific actionable suggestions based on scores
  if (scores.environmental_score < 0.6) {
    suggestions.push(
      "Conduct an energy audit to identify efficiency opportunities"
    );
    suggestions.push(
      "Implement water recycling systems in manufacturing processes"
    );
  }

  if (scores.social_score < 0.6) {
    suggestions.push("Develop a living wage policy for all workers");
    suggestions.push(
      "Establish a diversity and inclusion committee with executive sponsorship"
    );
  }

  if (scores.governance_score < 0.6) {
    suggestions.push(
      "Create a dedicated ethics office with reporting lines to the board"
    );
    suggestions.push(
      "Implement a supplier code of conduct with regular audits"
    );
  }

  // Add specific suggestions based on risk level
  if (scores.risk_level === "high") {
    suggestions.push(
      "Develop a comprehensive risk mitigation plan with quarterly reviews"
    );
    suggestions.push(
      "Engage third-party auditors to verify compliance with standards"
    );
  } else if (scores.risk_level === "medium") {
    suggestions.push("Establish monthly monitoring of key risk indicators");
    suggestions.push(
      "Benchmark against industry peers to identify improvement areas"
    );
  }

  return suggestions;
}
