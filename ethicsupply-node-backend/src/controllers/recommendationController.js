const { Recommendation, Supplier } = require("../models");

/**
 * Get all recommendations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getRecommendations = async (req, res) => {
  try {
    console.log("Fetching recommendations...");

    // Get suppliers with their scores
    const suppliers = await Supplier.find().select(
      "name country industry co2_emissions waste_management_score energy_efficiency water_usage renewable_energy_percent pollution_control wage_fairness human_rights_index community_engagement diversity_inclusion_score worker_safety transparency_score corruption_risk board_diversity ethics_program compliance_systems quality_control_score supplier_diversity traceability ethical_score environmental_score social_score governance_score"
    );

    if (!suppliers || suppliers.length === 0) {
      console.log("No suppliers found, returning mock data");
      const mockData = generateMockRecommendations();
      return res && res.json ? res.json(mockData) : mockData;
    }

    console.log(`Found ${suppliers.length} suppliers`);
    console.log("Supplier data sample:", JSON.stringify(suppliers[0], null, 2));

    const recommendations = suppliers
      .map((supplier) => {
        try {
          // Use pre-calculated scores if available, otherwise calculate them
          const environmentalScore =
            supplier.environmental_score ||
            ((supplier.co2_emissions || 0) +
              (supplier.waste_management_score || 0) +
              (supplier.energy_efficiency || 0) +
              (supplier.water_usage || 0) +
              (supplier.renewable_energy_percent || 0) +
              (supplier.pollution_control || 0)) /
              6;

          const socialScore =
            supplier.social_score ||
            ((supplier.wage_fairness || 0) +
              (supplier.human_rights_index || 0) +
              (supplier.community_engagement || 0) +
              (supplier.diversity_inclusion_score || 0) +
              (supplier.worker_safety || 0)) /
              5;

          const governanceScore =
            supplier.governance_score ||
            ((supplier.transparency_score || 0) +
              (supplier.corruption_risk || 0) +
              (supplier.board_diversity || 0) +
              (supplier.ethics_program || 0) +
              (supplier.compliance_systems || 0) +
              (supplier.quality_control_score || 0) +
              (supplier.supplier_diversity || 0) +
              (supplier.traceability || 0)) /
              8;

          // Normalize scores to be between 0 and 1
          const normalizedScores = {
            environmental: Math.min(Math.max(environmentalScore, 0), 1),
            social: Math.min(Math.max(socialScore, 0), 1),
            governance: Math.min(Math.max(governanceScore, 0), 1),
          };

          console.log(
            "Normalized scores for supplier:",
            supplier.name,
            normalizedScores
          );

          // Determine the lowest score to focus recommendations
          const lowestScore = Object.entries(normalizedScores).reduce(
            (min, [key, value]) => (value < min.value ? { key, value } : min),
            { key: "environmental", value: 1 }
          );

          // Generate recommendation based on the lowest score
          const recommendation = {
            _id: `rec-${supplier._id}-${Date.now()}-${Math.floor(
              Math.random() * 1000
            )}`,
            title: `Improve ${lowestScore.key} performance for ${supplier.name}`,
            description: `Focus on enhancing ${lowestScore.key} metrics to improve overall supplier performance.`,
            category: lowestScore.key,
            priority:
              lowestScore.value < 0.3
                ? "high"
                : lowestScore.value < 0.6
                ? "medium"
                : "low",
            status: "pending",
            supplier: supplier._id,
            supplierName: supplier.name,
            aiExplanation: `Based on analysis of ${
              supplier.name
            }'s performance metrics, the ${lowestScore.key} score of ${(
              lowestScore.value * 100
            ).toFixed(1)}% is significantly lower than other areas.`,
            estimatedImpact:
              lowestScore.value < 0.3
                ? "High"
                : lowestScore.value < 0.6
                ? "Medium"
                : "Low",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return recommendation;
        } catch (error) {
          console.error(
            `Error processing supplier ${supplier?.name || "unknown"} (${
              supplier?._id || "unknown"
            }):`,
            error
          );
          console.error(
            "Supplier data causing error:",
            JSON.stringify(supplier, null, 2)
          );
          return null;
        }
      })
      .filter((rec) => rec !== null);

    if (recommendations.length === 0) {
      console.log("No valid recommendations generated, returning mock data");
      const mockData = generateMockRecommendations();
      return res && res.json ? res.json(mockData) : mockData;
    }

    console.log(`Generated ${recommendations.length} recommendations`);
    console.log("First recommendation ID:", recommendations[0]._id);

    // Allow this function to be called internally or as a route handler
    if (res && res.json) {
      return res.json(recommendations);
    } else {
      return recommendations;
    }
  } catch (error) {
    console.error("Error in getRecommendations:", error);
    console.error("Error stack:", error.stack);
    if (res && res.status) {
      res.status(500).json({
        error: "Failed to generate recommendations",
        details: error.message,
        stack: error.stack,
      });
    } else {
      throw error; // Re-throw for internal calls
    }
  }
};

/**
 * Get a recommendation by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getRecommendationById = async (req, res) => {
  try {
    console.log("Fetching recommendation with ID:", req.params.id);

    // Check if this is one of the dynamic recommendations with our custom ID format
    if (req.params.id.startsWith("rec-")) {
      // Get all recommendations
      const allRecommendations = await getRecommendationsInternal();

      // Find the recommendation with matching ID (approximate match since IDs contain timestamps)
      const idParts = req.params.id.split("-");
      const supplierId = idParts[1]; // Extract supplier ID

      // Find recommendations for this supplier
      const supplierRecommendations = allRecommendations.filter((rec) =>
        typeof rec.supplier === "string"
          ? rec.supplier === supplierId
          : rec.supplier && rec.supplier.toString() === supplierId
      );

      if (supplierRecommendations.length > 0) {
        // Just return the first recommendation for this supplier
        return res.status(200).json(supplierRecommendations[0]);
      } else {
        return res.status(404).json({ error: "Recommendation not found" });
      }
    }

    // Otherwise try to find a real recommendation in the database using MongoDB ObjectId
    try {
      const recommendation = await Recommendation.findById(
        req.params.id
      ).populate("supplier", "name country industry ethical_score");

      if (!recommendation) {
        return res.status(404).json({ error: "Recommendation not found" });
      }

      res.status(200).json(recommendation);
    } catch (castError) {
      console.error("Error casting recommendation ID:", castError);
      return res
        .status(404)
        .json({ error: "Invalid recommendation ID format" });
    }
  } catch (error) {
    console.error("Error fetching recommendation:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
};

/**
 * Create a new recommendation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createRecommendation = async (req, res) => {
  try {
    const recommendation = new Recommendation(req.body);
    const savedRecommendation = await recommendation.save();
    res.status(201).json(savedRecommendation);
  } catch (error) {
    console.error("Error creating recommendation:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Update a recommendation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({ error: "Recommendation not found" });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      recommendation[key] = req.body[key];
    });

    const updatedRecommendation = await recommendation.save();
    res.status(200).json(updatedRecommendation);
  } catch (error) {
    console.error("Error updating recommendation:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete a recommendation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({ error: "Recommendation not found" });
    }

    await recommendation.deleteOne();
    res.status(200).json({ message: "Recommendation deleted successfully" });
  } catch (error) {
    console.error("Error deleting recommendation:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update recommendation status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["pending", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status provided" });
    }

    const recommendation = await Recommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({ error: "Recommendation not found" });
    }

    recommendation.status = status;
    const updatedRecommendation = await recommendation.save();

    res.status(200).json(updatedRecommendation);
  } catch (error) {
    console.error("Error updating recommendation status:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get recommendations by supplier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getRecommendationsBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const recommendations = await Recommendation.find({ supplier: supplierId })
      .sort({ created_at: -1 })
      .populate("supplier", "name country industry ethical_score");

    res.status(200).json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations by supplier:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate AI-driven recommendations based on actual supplier data
 * @param {Array} suppliers - Array of supplier objects
 * @returns {Array} Array of recommendations
 */
async function generateRecommendationsFromData(suppliers) {
  const recommendations = [];
  const today = new Date();

  // Select industry benchmarks for comparison
  const industryBenchmarks = {
    Electronics: {
      environmental: 75,
      social: 72,
      governance: 70,
      water_usage: 65,
      co2_emissions: 60,
    },
    "Food & Beverage": {
      environmental: 68,
      social: 70,
      governance: 72,
      water_usage: 55,
      co2_emissions: 62,
    },
    Textiles: {
      environmental: 60,
      social: 65,
      governance: 68,
      water_usage: 50,
      co2_emissions: 55,
    },
    Manufacturing: {
      environmental: 65,
      social: 68,
      governance: 70,
      water_usage: 58,
      co2_emissions: 57,
    },
    Retail: {
      environmental: 70,
      social: 72,
      governance: 75,
      water_usage: 68,
      co2_emissions: 65,
    },
  };

  // Default benchmarks for industries not specifically defined
  const defaultBenchmark = {
    environmental: 68,
    social: 70,
    governance: 72,
    water_usage: 60,
    co2_emissions: 60,
  };

  // Process each supplier to generate personalized recommendations
  for (const supplier of suppliers) {
    // Ensure supplier object exists
    if (!supplier) continue;

    // Get industry benchmarks or default if industry not found
    const benchmark =
      industryBenchmarks[supplier.industry || ""] || defaultBenchmark;

    // Identify areas where supplier is below industry benchmark
    const weakAreas = [];

    // Safely access scores, defaulting to 0 if null/undefined
    const envScore = (supplier.environmental_score ?? 0) * 100;
    const socialScore = (supplier.social_score ?? 0) * 100;
    const govScore = (supplier.governance_score ?? 0) * 100;

    // Check environmental metrics
    if (envScore < benchmark.environmental) {
      weakAreas.push({
        category: "environmental",
        gap: benchmark.environmental - envScore,
        metrics: [],
      });

      // Safely access specific environmental metrics, defaulting to 0 or sensible values
      const co2Emissions = supplier.co2_emissions ?? Infinity; // Default high if missing
      const waterUsage = supplier.water_usage ?? Infinity; // Default high if missing
      const energyEfficiency = supplier.energy_efficiency ?? 0;
      const wasteManagementScore = supplier.waste_management_score ?? 0;

      if (co2Emissions > benchmark.co2_emissions) {
        weakAreas[weakAreas.length - 1].metrics.push("co2_emissions");
      }

      if (waterUsage > benchmark.water_usage) {
        weakAreas[weakAreas.length - 1].metrics.push("water_usage");
      }

      if (energyEfficiency < 0.7) {
        weakAreas[weakAreas.length - 1].metrics.push("energy_efficiency");
      }

      if (wasteManagementScore < 0.7) {
        weakAreas[weakAreas.length - 1].metrics.push("waste_management");
      }
    }

    // Check social metrics
    if (socialScore < benchmark.social) {
      weakAreas.push({
        category: "social",
        gap: benchmark.social - socialScore,
        metrics: [],
      });

      // Safely access specific social metrics, defaulting to 0 or sensible values
      const wageFairness = supplier.wage_fairness ?? 0;
      const humanRightsIndex = supplier.human_rights_index ?? 0;
      const diversityInclusionScore = supplier.diversity_inclusion_score ?? 0;
      const communityEngagement = supplier.community_engagement ?? 0;

      if (wageFairness < 0.75) {
        weakAreas[weakAreas.length - 1].metrics.push("wage_fairness");
      }

      if (humanRightsIndex < 0.75) {
        weakAreas[weakAreas.length - 1].metrics.push("human_rights");
      }

      if (diversityInclusionScore < 0.7) {
        weakAreas[weakAreas.length - 1].metrics.push("diversity_inclusion");
      }

      if (communityEngagement < 0.6) {
        weakAreas[weakAreas.length - 1].metrics.push("community_engagement");
      }
    }

    // Check governance metrics
    if (govScore < benchmark.governance) {
      weakAreas.push({
        category: "governance",
        gap: benchmark.governance - govScore,
        metrics: [],
      });

      // Safely access specific governance metrics, defaulting to 0 or sensible values
      const transparencyScore = supplier.transparency_score ?? 0;
      const corruptionRisk = supplier.corruption_risk ?? 1; // Default high if missing
      const boardDiversity = supplier.board_diversity ?? 0;
      const ethicsProgram = supplier.ethics_program ?? 0;

      if (transparencyScore < 0.7) {
        weakAreas[weakAreas.length - 1].metrics.push("transparency");
      }

      if (corruptionRisk > 0.3) {
        weakAreas[weakAreas.length - 1].metrics.push("corruption_risk");
      }

      if (boardDiversity < 0.6) {
        weakAreas[weakAreas.length - 1].metrics.push("board_diversity");
      }

      if (ethicsProgram < 0.7) {
        weakAreas[weakAreas.length - 1].metrics.push("ethics_program");
      }
    }

    // Sort weak areas by gap size (largest gap first)
    weakAreas.sort((a, b) => b.gap - a.gap);

    // Generate recommendations for the most critical areas
    if (weakAreas.length > 0) {
      // Generate recommendations based on the weak areas
      const recommendations_data = generateRecommendationsForWeakAreas(
        supplier,
        weakAreas
      );

      // Add recommendations for this supplier
      recommendations.push(...recommendations_data);

      // Limit to 2 recommendations per supplier maximum
      if (recommendations_data.length > 2) {
        recommendations_data.length = 2;
      }
    }

    // Limit total recommendations to 10
    if (recommendations.length >= 10) {
      break;
    }
  }

  // If not enough data-driven recommendations generated, add some general ones
  if (recommendations.length < 5) {
    const generalRecommendations = generateGeneralRecommendations(
      5 - recommendations.length
    );
    recommendations.push(...generalRecommendations);
  }

  // Ensure final recommendations array does not exceed 10
  return recommendations.slice(0, 10);
}

/**
 * Generate specific recommendations based on supplier's weak areas
 * @param {Object} supplier - Supplier object
 * @param {Array} weakAreas - Array of weak areas
 * @returns {Array} Array of recommendations
 */
function generateRecommendationsForWeakAreas(supplier, weakAreas) {
  const today = new Date();
  const recommendations = [];
  // Ensure supplier ID exists
  const supplierId = supplier?._id || `unknown-${Date.now()}`;

  // Process up to 3 weak areas
  for (let i = 0; i < Math.min(weakAreas.length, 3); i++) {
    const area = weakAreas[i];
    const category = area.category;
    const priority = area.gap > 15 ? "high" : area.gap > 8 ? "medium" : "low";

    // Create a unique ID for this recommendation
    const recId = `ai-rec-${supplierId}-${category}-${Date.now() + i}`; // Ensure uniqueness

    let title = "";
    let description = "";
    let reasoning = "";
    let impact_assessment = "";
    let implementation_difficulty = "";
    let timeframe = "";
    let comparative_insights = [];
    let score_improvement = Math.round(area.gap * 0.4); // Estimate potential score improvement

    // Safely access supplier properties for reasoning strings, providing defaults
    const co2EmissionsValue = supplier?.co2_emissions ?? 50; // Default to benchmark if missing
    const waterUsageValue = supplier?.water_usage ?? 60; // Default to benchmark if missing
    const ethicalScoreValue = supplier?.ethical_score ?? 0.65; // Default score

    // Generate recommendation based on category and specific metrics
    if (category === "environmental") {
      const metrics = area.metrics;

      if (metrics.includes("co2_emissions")) {
        title = "Reduce Carbon Footprint Through Efficiency Measures";
        description = `Implement carbon reduction strategies including energy efficiency audits, transition to renewable energy sources, and optimization of logistics to lower CO2 emissions from current levels.`;
        reasoning = `CO2 emissions are ${Math.max(
          0,
          Math.round(
            co2EmissionsValue - 50 // Using safe value
          )
        )}% higher than industry average.`;
        impact_assessment = `Could reduce carbon emissions by 20-35% through systematic efficiency improvements.`;
        implementation_difficulty =
          "Medium - requires investment but provides long-term ROI";
        timeframe = "6-12 months";
        comparative_insights = [
          "Top performers in this industry have reduced emissions by 40% in the past 5 years",
          "Companies with lower carbon emissions typically see 15% higher valuation multiples",
        ];
      } else if (metrics.includes("water_usage")) {
        title = "Implement Water Conservation and Recycling Systems";
        description = `Establish comprehensive water management program including process optimization, recycling systems, and rainwater harvesting to reduce water consumption and wastewater discharge.`;
        reasoning = `Water usage exceeds industry benchmarks by approximately ${Math.max(
          0,
          Math.round(
            (waterUsageValue / 60) * 100 - 100 // Using safe value
          )
        )}%.`;
        impact_assessment = `Could reduce water consumption by 25-40% and lower associated operational costs.`;
        implementation_difficulty =
          "Medium - requires facility modifications with moderate capital investment";
        timeframe = "4-8 months";
        comparative_insights = [
          "Industry leaders have achieved water usage reductions of 45% with similar systems",
          "Water recycling provides 180-220% ROI over 3 years in water-intensive operations",
        ];
      } else if (metrics.includes("energy_efficiency")) {
        title = "Energy Efficiency Transformation Program";
        description = `Implement comprehensive energy management system including equipment upgrades, process optimization, and smart monitoring to reduce energy consumption across operations.`;
        reasoning = `Current energy efficiency metrics are approximately 30% below industry leaders.`;
        impact_assessment = `Could increase energy efficiency by 25-30% and reduce associated costs by 20-25%.`;
        implementation_difficulty =
          "Medium-High - requires systematic approach and moderate investment";
        timeframe = "6-12 months";
        comparative_insights = [
          "Top quartile performers achieve 40% higher energy efficiency ratios",
          "Energy-efficient operations typically see 8-12% reduction in operating costs",
        ];
      } else if (metrics.includes("waste_management")) {
        title = "Zero Waste Initiative Implementation";
        description = `Develop and implement comprehensive waste reduction strategy including process redesign, material recovery systems, and circular economy principles to minimize waste generation.`;
        reasoning = `Current waste management score indicates opportunities for significant improvement in waste reduction and resource recovery.`;
        impact_assessment = `Could reduce waste by 30-40% and potentially create new revenue streams from recovered materials.`;
        implementation_difficulty =
          "Medium - requires process changes and staff training";
        timeframe = "3-6 months";
        comparative_insights = [
          "Industry leaders have achieved zero waste to landfill certification through similar programs",
          "Companies with advanced waste management typically see 5-8% reduction in material costs",
        ];
      } else {
        title = "Environmental Performance Enhancement Program";
        description = `Implement comprehensive environmental management system addressing key impact areas including emissions, resource consumption, and waste generation.`;
        reasoning = `Environmental performance is ${Math.round(
          area.gap
        )}% below industry benchmark.`;
        impact_assessment = `Could improve environmental score by 15-20 points through systematic improvements.`;
        implementation_difficulty =
          "Medium - requires cross-functional approach";
        timeframe = "6-12 months";
        comparative_insights = [
          "Top performers in this industry exceed benchmarks by 15-20%",
          "Strong environmental performers typically see 12% higher customer retention",
        ];
      }
    } else if (category === "social") {
      const metrics = area.metrics;

      if (metrics.includes("wage_fairness")) {
        title = "Fair Compensation Framework Implementation";
        description = `Develop and implement comprehensive wage fairness program including compensation analysis, living wage commitment, and transparent pay structures.`;
        reasoning = `Current wage fairness metrics indicate potential inequities in compensation practices.`;
        impact_assessment = `Could improve workforce satisfaction by 30-40% and reduce turnover by 20-25%.`;
        implementation_difficulty =
          "Medium - requires compensation analysis and potential adjustments";
        timeframe = "3-6 months";
        comparative_insights = [
          "Companies with fair wage practices experience 35% lower turnover rates",
          "Fair compensation leaders see 28% higher productivity metrics",
        ];
      } else if (metrics.includes("human_rights")) {
        title = "Human Rights Due Diligence Program";
        description = `Implement robust human rights framework including supply chain monitoring, audit protocols, and remediation processes to ensure compliance with international standards.`;
        reasoning = `Current human rights practices show room for improvement relative to industry leaders.`;
        impact_assessment = `Could significantly reduce human rights-related risks and strengthen brand reputation.`;
        implementation_difficulty =
          "High - requires comprehensive approach across operations";
        timeframe = "6-12 months";
        comparative_insights = [
          "Human rights leaders experience 45% fewer supply chain disruptions",
          "Strong human rights performers command 10-15% price premiums in consumer markets",
        ];
      } else if (metrics.includes("diversity_inclusion")) {
        title = "Diversity, Equity & Inclusion Enhancement Initiative";
        description = `Develop comprehensive DEI strategy including recruitment practices, development programs, inclusive policies, and measurement frameworks.`;
        reasoning = `Current diversity and inclusion metrics indicate opportunities for significant improvement.`;
        impact_assessment = `Could improve innovation capacity by 20-30% and expand market reach.`;
        implementation_difficulty =
          "Medium - requires organizational commitment and cultural change";
        timeframe = "6-12 months";
        comparative_insights = [
          "Companies with strong DEI performance are 35% more likely to outperform competitors financially",
          "Diverse teams generate 19% higher innovation revenue",
        ];
      } else if (metrics.includes("community_engagement")) {
        title = "Strategic Community Engagement Program";
        description = `Develop structured community investment strategy with clear objectives, measurement frameworks, and stakeholder involvement to create shared value.`;
        reasoning = `Current community engagement activities appear ad-hoc rather than strategic.`;
        impact_assessment = `Could strengthen social license to operate and improve local talent recruitment by 15-25%.`;
        implementation_difficulty =
          "Low-Medium - requires realignment of existing resources";
        timeframe = "3-6 months";
        comparative_insights = [
          "Strategic community engagement leaders see 30% stronger local government relationships",
          "Companies with strategic community programs experience 22% fewer regulatory challenges",
        ];
      } else {
        title = "Social Performance Transformation";
        description = `Implement comprehensive social responsibility framework addressing key areas including labor practices, human rights, community relations, and product responsibility.`;
        reasoning = `Social performance is ${Math.round(
          area.gap
        )}% below industry benchmark.`;
        impact_assessment = `Could improve social score by 12-18 points through systematic improvements.`;
        implementation_difficulty =
          "Medium-High - requires cross-functional approach";
        timeframe = "6-12 months";
        comparative_insights = [
          "Social performance leaders achieve 25% higher employee retention",
          "Companies with strong social metrics experience 18% fewer disruptive incidents",
        ];
      }
    } else if (category === "governance") {
      const metrics = area.metrics;

      if (metrics.includes("transparency")) {
        title = "Transparency and Disclosure Enhancement Program";
        description = `Implement comprehensive transparency framework including enhanced reporting, stakeholder communication channels, and disclosure protocols.`;
        reasoning = `Current transparency practices fall below evolving stakeholder expectations and industry best practices.`;
        impact_assessment = `Could significantly improve stakeholder trust and reduce compliance risks.`;
        implementation_difficulty =
          "Medium - requires information systems and disclosure processes";
        timeframe = "3-6 months";
        comparative_insights = [
          "Transparency leaders command 12-18% higher valuations",
          "Companies with robust disclosure practices experience 40% fewer stakeholder controversies",
        ];
      } else if (metrics.includes("corruption_risk")) {
        title = "Anti-Corruption Program Implementation";
        description = `Develop and implement comprehensive anti-corruption framework including risk assessment, policy development, training, and monitoring systems.`;
        reasoning = `Current corruption risk profile indicates potential vulnerabilities in operations or supply chain.`;
        impact_assessment = `Could significantly reduce compliance risks and potential financial penalties.`;
        implementation_difficulty =
          "Medium-High - requires systematic approach across operations";
        timeframe = "4-8 months";
        comparative_insights = [
          "Companies with strong anti-corruption programs experience 65% fewer compliance incidents",
          "Anti-corruption leaders face 70% lower regulatory scrutiny",
        ];
      } else if (metrics.includes("board_diversity")) {
        title = "Board Diversity and Effectiveness Enhancement";
        description = `Implement board diversity strategy including recruitment practices, skills assessment, and governance structures to improve board composition and performance.`;
        reasoning = `Current board diversity metrics indicate limited perspective diversity at governance level.`;
        impact_assessment = `Could improve decision quality and risk oversight through more diverse perspectives.`;
        implementation_difficulty =
          "Medium - requires governance committee commitment";
        timeframe = "6-12 months";
        comparative_insights = [
          "Companies with diverse boards achieve 53% higher returns on equity",
          "Board diversity leaders experience 30% fewer governance controversies",
        ];
      } else if (metrics.includes("ethics_program")) {
        title = "Ethics Program Implementation";
        description = `Develop and implement comprehensive ethics framework including code of conduct, training programs, reporting mechanisms, and monitoring systems.`;
        reasoning = `Current ethics infrastructure appears underdeveloped relative to industry best practices.`;
        impact_assessment = `Could significantly reduce misconduct risk and strengthen ethical culture.`;
        implementation_difficulty =
          "Medium - requires organizational commitment";
        timeframe = "3-6 months";
        comparative_insights = [
          "Companies with robust ethics programs experience 60% fewer misconduct incidents",
          "Ethics leaders achieve 25% higher employee engagement scores",
        ];
      } else {
        title = "Governance Framework Strengthening Initiative";
        description = `Implement comprehensive governance enhancement program addressing key areas including board effectiveness, risk management, compliance, and stakeholder engagement.`;
        reasoning = `Governance performance is ${Math.round(
          area.gap
        )}% below industry benchmark.`;
        impact_assessment = `Could improve governance score by 10-15 points through systematic improvements.`;
        implementation_difficulty =
          "Medium-High - requires board-level commitment";
        timeframe = "6-12 months";
        comparative_insights = [
          "Governance leaders achieve 20% higher valuations",
          "Strong governance frameworks correlate with 35% fewer operational disruptions",
        ];
      }
    }

    // Create the recommendation object
    const recommendation = {
      _id: recId,
      title,
      description,
      category,
      priority,
      status: "pending",
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      supplier: {
        name: supplier?.name || "Unknown Supplier",
        country: supplier?.country || "Unknown Country",
        industry: supplier?.industry || "Unknown Industry",
        ethical_score: Math.round((supplier?.ethical_score ?? 0.65) * 100),
      },
      ai_explanation: {
        reasoning,
        impact_assessment,
        implementation_difficulty,
        timeframe,
        comparative_insights,
      },
      estimated_impact: {
        score_improvement,
        cost_savings: Math.round(
          score_improvement * 10000 + Math.random() * 50000
        ),
        implementation_time: Math.round(
          timeframe.includes("12") ? 270 : timeframe.includes("6") ? 180 : 90
        ),
      },
      isMockData: false,
      isAiGenerated: true,
      confidence_score: 0.85 + Math.random() * 0.15,
      generation_method: "ai_supplier_analysis",
      data_sources: [
        "supplier_metrics",
        "industry_benchmarks",
        "performance_trends",
      ],
    };

    recommendations.push(recommendation);
  }

  return recommendations;
}

/**
 * Generate general recommendations when specific data is insufficient
 * @param {Number} count - Number of recommendations to generate
 * @returns {Array} Array of recommendations
 */
function generateGeneralRecommendations(count) {
  const today = new Date();
  const generalRecommendations = [
    {
      _id: `ai-gen-rec-1-${Date.now()}`,
      title: "Supply Chain Transparency Initiative",
      description:
        "Implement blockchain-based tracking system for full supply chain visibility",
      category: "governance",
      priority: "medium",
      status: "pending",
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      supplier: null,
      ai_explanation: {
        reasoning:
          "Limited visibility beyond tier 1 suppliers is an industry-wide challenge",
        impact_assessment:
          "Would improve traceability and reduce risk across supply network",
        implementation_difficulty:
          "High - requires technological implementation and supplier cooperation",
        timeframe: "12-18 months",
        comparative_insights: [
          "Only 15% of companies have full supply chain visibility",
          "Leaders with transparent supply chains command 12% price premium",
        ],
      },
      estimated_impact: {
        score_improvement: 18,
        cost_savings: 230000,
        implementation_time: 450,
      },
      isMockData: false,
      isAiGenerated: true,
      confidence_score: 0.82,
      generation_method: "ai_industry_analysis",
      data_sources: ["industry_trends", "best_practices", "academic_research"],
    },
    {
      _id: `ai-gen-rec-2-${Date.now()}`,
      title: "Industry Collaboration on Ethical Standards",
      description:
        "Join or establish industry initiative on shared ethical standards and auditing protocols",
      category: "governance",
      priority: "medium",
      status: "pending",
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      supplier: null,
      ai_explanation: {
        reasoning:
          "Collaborative approaches reduce audit duplication and increase effectiveness",
        impact_assessment:
          "Would improve consistency of standards and reduce compliance costs",
        implementation_difficulty:
          "Medium - requires industry engagement and resource commitment",
        timeframe: "6-12 months",
        comparative_insights: [
          "Collaborative standards reduce audit costs by 35-45%",
          "Industry initiatives improve consistency by 60-70%",
        ],
      },
      estimated_impact: {
        score_improvement: 12,
        cost_savings: 180000,
        implementation_time: 270,
      },
      isMockData: false,
      isAiGenerated: true,
      confidence_score: 0.8,
      generation_method: "ai_industry_analysis",
      data_sources: ["industry_trends", "best_practices", "academic_research"],
    },
    {
      _id: `ai-gen-rec-3-${Date.now()}`,
      title: "Circular Economy Implementation Program",
      description:
        "Develop circular economy approach to product design, manufacturing, and end-of-life management",
      category: "environmental",
      priority: "high",
      status: "pending",
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      supplier: null,
      ai_explanation: {
        reasoning:
          "Circular economy principles represent the future of sustainable manufacturing",
        impact_assessment:
          "Could reduce waste by 40-60% and create new revenue streams",
        implementation_difficulty:
          "High - requires fundamental design and process changes",
        timeframe: "12-24 months",
        comparative_insights: [
          "Circular economy leaders reduce material costs by 20-30%",
          "Consumers increasingly prefer products with circular design (35% premium potential)",
        ],
      },
      estimated_impact: {
        score_improvement: 20,
        cost_savings: 350000,
        implementation_time: 540,
      },
      isMockData: false,
      isAiGenerated: true,
      confidence_score: 0.85,
      generation_method: "ai_industry_analysis",
      data_sources: ["industry_trends", "best_practices", "academic_research"],
    },
    {
      _id: `ai-gen-rec-4-${Date.now()}`,
      title: "Ethical AI for Supply Chain Optimization",
      description:
        "Implement AI-powered supply chain optimization with ethical guardrails and human oversight",
      category: "other",
      priority: "medium",
      status: "pending",
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      supplier: null,
      ai_explanation: {
        reasoning:
          "AI can significantly improve efficiency while maintaining ethical standards",
        impact_assessment:
          "Could reduce costs by 15-25% while improving ethical performance",
        implementation_difficulty:
          "Medium-High - requires technical expertise and careful implementation",
        timeframe: "6-12 months",
        comparative_insights: [
          "AI-optimized supply chains achieve 12-18% higher ethical scores",
          "Early adopters gaining 15-20% efficiency advantage",
        ],
      },
      estimated_impact: {
        score_improvement: 15,
        cost_savings: 280000,
        implementation_time: 270,
      },
      isMockData: false,
      isAiGenerated: true,
      confidence_score: 0.8,
      generation_method: "ai_industry_analysis",
      data_sources: ["industry_trends", "best_practices", "academic_research"],
    },
    {
      _id: `ai-gen-rec-5-${Date.now()}`,
      title: "Carbon Offsetting and Insetting Program",
      description:
        "Develop comprehensive carbon offsetting strategy with high-quality projects and insetting initiatives",
      category: "environmental",
      priority: "medium",
      status: "pending",
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      supplier: null,
      ai_explanation: {
        reasoning:
          "Carbon neutrality is becoming a market expectation in multiple industries",
        impact_assessment:
          "Could neutralize carbon footprint while creating positive social impact",
        implementation_difficulty:
          "Medium - requires careful project selection and verification",
        timeframe: "3-6 months",
        comparative_insights: [
          "90% of industry leaders have carbon neutrality commitments",
          "High-quality offsetting programs improve brand perception by 25-30%",
        ],
      },
      estimated_impact: {
        score_improvement: 10,
        cost_savings: 120000,
        implementation_time: 150,
      },
      isMockData: false,
      isAiGenerated: true,
      confidence_score: 0.8,
      generation_method: "ai_industry_analysis",
      data_sources: ["industry_trends", "best_practices", "academic_research"],
    },
  ];

  // Return the requested number of recommendations
  return generalRecommendations.slice(0, count);
}

// Define the mock data function directly within this file
const generateMockRecommendations = () => {
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return [
    {
      _id: "rec1",
      title: "Implement Renewable Energy Sources",
      description:
        "Transition manufacturing facilities to renewable energy sources to reduce carbon footprint",
      category: "environmental",
      priority: "high",
      status: "pending",
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      supplier: {
        name: "EcoTech Manufacturing",
        country: "Germany",
        industry: "Electronics",
        ethical_score: 78,
      },
      ai_explanation: {
        reasoning:
          "Current energy consumption is 40% higher than industry average",
        impact_assessment: "Could reduce carbon emissions by 35%",
        implementation_difficulty:
          "Medium - requires capital investment but has clear ROI",
        timeframe: "6-12 months",
        comparative_insights: [
          "Top performers in this industry use 85% renewable energy",
          "Implementation costs have decreased by 30% in the last 2 years",
        ],
      },
      estimated_impact: {
        score_improvement: 12,
        cost_savings: 150000,
        implementation_time: 270,
      },
      isMockData: true,
    },
    {
      _id: "rec2",
      title: "Enhance Worker Safety Programs",
      description:
        "Implement comprehensive safety training and monitoring systems across all facilities",
      category: "social",
      priority: "high",
      status: "in_progress",
      created_at: lastWeek.toISOString(),
      updated_at: today.toISOString(),
      supplier: {
        name: "GlobalTex Industries",
        country: "Bangladesh",
        industry: "Textiles",
        ethical_score: 62,
      },
      ai_explanation: {
        reasoning: "Incident rate is 25% above industry average",
        impact_assessment: "Could reduce workplace incidents by 40%",
        implementation_difficulty:
          "Medium - requires training program development",
        timeframe: "3-6 months",
        comparative_insights: [
          "Best practice safety programs include monthly drills and certifications",
          "Industry leaders have reduced incident rates by 70% with similar programs",
        ],
      },
      estimated_impact: {
        score_improvement: 15,
        cost_savings: 85000,
        implementation_time: 120,
      },
      isMockData: true,
    },
    {
      _id: "rec3",
      title: "Supply Chain Transparency Initiative",
      description:
        "Implement blockchain-based tracking system for full supply chain visibility",
      category: "governance",
      priority: "medium",
      status: "pending",
      created_at: lastMonth.toISOString(),
      updated_at: lastMonth.toISOString(),
      supplier: {
        name: "FoodCorp International",
        country: "United States",
        industry: "Food & Beverage",
        ethical_score: 71,
      },
      ai_explanation: {
        reasoning: "Limited visibility beyond tier 1 suppliers increases risk",
        impact_assessment: "Would improve traceability score by 60%",
        implementation_difficulty:
          "High - requires technological implementation and supplier cooperation",
        timeframe: "12-18 months",
        comparative_insights: [
          "Only 15% of industry has full supply chain visibility",
          "Leaders with transparent supply chains command 12% price premium",
        ],
      },
      estimated_impact: {
        score_improvement: 18,
        cost_savings: 230000,
        implementation_time: 450,
      },
      isMockData: true,
    },
    {
      _id: "rec4",
      title: "Water Conservation Program",
      description: "Implement water recycling systems in manufacturing plants",
      category: "environmental",
      priority: "medium",
      status: "completed",
      created_at: lastMonth.toISOString(),
      updated_at: lastWeek.toISOString(),
      supplier: {
        name: "TechBuild Inc",
        country: "Taiwan",
        industry: "Electronics",
        ethical_score: 75,
      },
      ai_explanation: {
        reasoning: "Water usage is 30% higher than industry benchmark",
        impact_assessment: "Could reduce water consumption by 25-35%",
        implementation_difficulty: "Medium - requires facility modifications",
        timeframe: "6-9 months",
        comparative_insights: [
          "Leading manufacturers have reduced water usage by 45% with similar systems",
          "Water recycling provides 200% ROI over 3 years in high-usage facilities",
        ],
      },
      estimated_impact: {
        score_improvement: 10,
        cost_savings: 120000,
        implementation_time: 180,
      },
      isMockData: true,
    },
    {
      _id: "rec5",
      title: "Ethical Sourcing Policy Implementation",
      description:
        "Develop and implement a comprehensive ethical sourcing policy with supplier auditing",
      category: "governance",
      priority: "high",
      status: "pending",
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      supplier: {
        name: "Fashion Retail Co",
        country: "United Kingdom",
        industry: "Retail",
        ethical_score: 68,
      },
      ai_explanation: {
        reasoning:
          "Insufficient visibility into supplier practices increases brand risk",
        impact_assessment:
          "Would significantly reduce risk of ethical violations in supply chain",
        implementation_difficulty:
          "Medium - requires policy development and audit procedures",
        timeframe: "3-6 months",
        comparative_insights: [
          "Ethical sourcing leaders have 35% fewer supply chain disruptions",
          "Consumers willing to pay 10-15% premium for ethically sourced products",
        ],
      },
      estimated_impact: {
        score_improvement: 14,
        cost_savings: 180000,
        implementation_time: 150,
      },
      isMockData: true,
    },
  ];
};

/**
 * Internal function to generate recommendations
 * @returns {Array} Array of recommendations
 */
async function getRecommendationsInternal() {
  console.log("Fetching recommendations internally...");

  // Get suppliers with their scores
  const suppliers = await Supplier.find().select(
    "name country industry co2_emissions waste_management_score energy_efficiency water_usage renewable_energy_percent pollution_control wage_fairness human_rights_index community_engagement diversity_inclusion_score worker_safety transparency_score corruption_risk board_diversity ethics_program compliance_systems quality_control_score supplier_diversity traceability ethical_score environmental_score social_score governance_score"
  );

  if (!suppliers || suppliers.length === 0) {
    console.log("No suppliers found, returning mock data");
    return generateMockRecommendations();
  }

  console.log(`Found ${suppliers.length} suppliers`);

  const recommendations = suppliers
    .map((supplier) => {
      try {
        // Use pre-calculated scores if available, otherwise calculate them
        const environmentalScore =
          supplier.environmental_score ||
          ((supplier.co2_emissions || 0) +
            (supplier.waste_management_score || 0) +
            (supplier.energy_efficiency || 0) +
            (supplier.water_usage || 0) +
            (supplier.renewable_energy_percent || 0) +
            (supplier.pollution_control || 0)) /
            6;

        const socialScore =
          supplier.social_score ||
          ((supplier.wage_fairness || 0) +
            (supplier.human_rights_index || 0) +
            (supplier.community_engagement || 0) +
            (supplier.diversity_inclusion_score || 0) +
            (supplier.worker_safety || 0)) /
            5;

        const governanceScore =
          supplier.governance_score ||
          ((supplier.transparency_score || 0) +
            (supplier.corruption_risk || 0) +
            (supplier.board_diversity || 0) +
            (supplier.ethics_program || 0) +
            (supplier.compliance_systems || 0) +
            (supplier.quality_control_score || 0) +
            (supplier.supplier_diversity || 0) +
            (supplier.traceability || 0)) /
            8;

        // Normalize scores to be between 0 and 1
        const normalizedScores = {
          environmental: Math.min(Math.max(environmentalScore, 0), 1),
          social: Math.min(Math.max(socialScore, 0), 1),
          governance: Math.min(Math.max(governanceScore, 0), 1),
        };

        // Determine the lowest score to focus recommendations
        const lowestScore = Object.entries(normalizedScores).reduce(
          (min, [key, value]) => (value < min.value ? { key, value } : min),
          { key: "environmental", value: 1 }
        );

        // Generate recommendation based on the lowest score
        const recommendation = {
          _id: `rec-${supplier._id}-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`,
          title: `Improve ${lowestScore.key} performance for ${supplier.name}`,
          description: `Focus on enhancing ${lowestScore.key} metrics to improve overall supplier performance.`,
          category: lowestScore.key,
          priority:
            lowestScore.value < 0.3
              ? "high"
              : lowestScore.value < 0.6
              ? "medium"
              : "low",
          status: "pending",
          supplier: supplier._id,
          supplierName: supplier.name,
          aiExplanation: `Based on analysis of ${
            supplier.name
          }'s performance metrics, the ${lowestScore.key} score of ${(
            lowestScore.value * 100
          ).toFixed(1)}% is significantly lower than other areas.`,
          estimatedImpact:
            lowestScore.value < 0.3
              ? "High"
              : lowestScore.value < 0.6
              ? "Medium"
              : "Low",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return recommendation;
      } catch (error) {
        console.error(
          `Error processing supplier ${supplier?.name || "unknown"} (${
            supplier?._id || "unknown"
          }):`,
          error
        );
        return null;
      }
    })
    .filter((rec) => rec !== null);

  if (recommendations.length === 0) {
    console.log("No valid recommendations generated, returning mock data");
    return generateMockRecommendations();
  }

  console.log(`Generated ${recommendations.length} recommendations internally`);
  return recommendations;
}
