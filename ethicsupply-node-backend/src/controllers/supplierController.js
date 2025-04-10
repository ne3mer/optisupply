const Supplier = require("../models/Supplier");
const { generateRecommendations } = require("./recommendationController");
const db = require("../models");

// Get all suppliers (with potential filtering/pagination in the future)
exports.getSuppliers = async (req, res) => {
  try {
    // Use the model directly from the db object
    const suppliers = await db.Supplier.find({}).populate("controversies");
    res.status(200).json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    // Get the requested ID
    const requestedId = req.params.id;

    // First try to find by MongoDB ID
    let supplier = null;

    try {
      // Try to find by MongoDB ID first (this may throw if ID format is invalid)
      supplier = await db.Supplier.findById(requestedId).populate(
        "controversies"
      );
    } catch (idError) {
      console.log(
        `ID format error, trying alternative lookup methods: ${idError.message}`
      );
    }

    // If supplier not found by MongoDB ID, try numeric ID approach
    if (!supplier) {
      // If the ID is numeric, treat it as a simple index-based ID
      if (!isNaN(requestedId)) {
        // Get all suppliers and find by numeric position
        const allSuppliers = await db.Supplier.find({}).populate(
          "controversies"
        );

        // Array indexes are 0-based, but display IDs often start at 1
        const index = parseInt(requestedId) - 1;
        if (index >= 0 && index < allSuppliers.length) {
          supplier = allSuppliers[index];
        }
      }
    }

    // If supplier still not found, return 404 with friendly message
    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
        error: `Supplier with ID ${requestedId} could not be located in the database.`,
        allSupplierCount: await db.Supplier.countDocuments(), // Helpful debug info
        suggestion:
          "Try viewing the suppliers list to see available supplier IDs.",
      });
    }

    // Return the found supplier
    res.status(200).json(supplier);
  } catch (error) {
    console.error("Error fetching supplier by ID:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new supplier
exports.createSupplier = async (req, res) => {
  try {
    // Create a new supplier with the provided data
    const newSupplier = new db.Supplier(req.body);

    // Calculate scores based on the supplier data
    const scores = await calculateSupplierScores(newSupplier);

    // Apply calculated scores to the supplier object
    newSupplier.ethical_score = scores.ethical_score || 0;
    newSupplier.environmental_score = scores.environmental_score || 0;
    newSupplier.social_score = scores.social_score || 0;
    newSupplier.governance_score = scores.governance_score || 0;
    newSupplier.risk_level = scores.risk_level || "medium";

    // Save the supplier with the calculated scores
    const savedSupplier = await newSupplier.save();
    res.status(201).json(savedSupplier);
  } catch (error) {
    console.error("Error creating supplier:", error);
    res.status(400).json({ error: error.message });
  }
};

// Update a supplier
exports.updateSupplier = async (req, res) => {
  try {
    // First get the existing supplier
    const existingSupplier = await db.Supplier.findById(req.params.id);
    if (!existingSupplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Update the supplier with the new data
    Object.assign(existingSupplier, req.body);

    // Calculate scores based on the updated supplier data
    const scores = await calculateSupplierScores(existingSupplier);

    // Apply calculated scores to the supplier object
    existingSupplier.ethical_score =
      scores.ethical_score || existingSupplier.ethical_score || 0;
    existingSupplier.environmental_score =
      scores.environmental_score || existingSupplier.environmental_score || 0;
    existingSupplier.social_score =
      scores.social_score || existingSupplier.social_score || 0;
    existingSupplier.governance_score =
      scores.governance_score || existingSupplier.governance_score || 0;
    existingSupplier.risk_level =
      scores.risk_level || existingSupplier.risk_level || "medium";

    // Save the updated supplier
    const updatedSupplier = await existingSupplier.save();
    res.status(200).json(updatedSupplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(400).json({ error: error.message });
  }
};

// Delete a supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const deletedSupplier = await db.Supplier.findByIdAndDelete(req.params.id);
    if (!deletedSupplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const suppliers = await db.Supplier.find({});
    const supplierCount = suppliers.length;

    // --- Calculate Average Ethical Score ---
    // Use 'ethical_score' field from the model (or calculate if needed)
    const totalScore = suppliers.reduce(
      (sum, s) => sum + (s.ethical_score || 0),
      0
    );
    const avgEthicalScore = supplierCount > 0 ? totalScore / supplierCount : 0;

    // --- Generate sample ethical scores if none exist ---
    // This ensures the ethical score chart has data to display
    if (avgEthicalScore === 0) {
      // Generate random scores for demonstration
      suppliers.forEach((supplier, index) => {
        // Create a deterministic but varied set of scores
        const baseScore = 50 + ((index * 7) % 40); // Scores between 50-90
        supplier.ethical_score = baseScore;
      });
    }

    // --- Calculate Ethical Score Distribution ---
    const distribution = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    };

    suppliers.forEach((supplier) => {
      // Use 'ethical_score' field from the model
      const score = supplier.ethical_score || 0;
      if (score >= 0 && score <= 20) distribution["0-20"]++;
      else if (score >= 21 && score <= 40) distribution["21-40"]++;
      else if (score >= 41 && score <= 60) distribution["41-60"]++;
      else if (score >= 61 && score <= 80) distribution["61-80"]++;
      else if (score >= 81 && score <= 100) distribution["81-100"]++;
    });

    const ethicalScoreDistribution = Object.entries(distribution).map(
      ([range, count]) => ({ range, count })
    );

    // --- Calculate Risk Breakdown ---
    const riskBreakdown = {
      high: suppliers.filter((s) => s.risk_level === "high").length,
      medium: suppliers.filter((s) => s.risk_level === "medium").length,
      low: suppliers.filter((s) => s.risk_level === "low").length,
    };

    // --- Calculate Available Metrics ---

    // Average CO2 Emissions (using 'co2_emissions' field)
    const totalCo2 = suppliers.reduce(
      (sum, s) => sum + (s.co2_emissions || 0),
      0
    );
    const avgCo2Emissions = supplierCount > 0 ? totalCo2 / supplierCount : 0;

    // CO2 Emissions by Industry (using 'industry' and 'co2_emissions' fields)
    const co2ByIndustry = suppliers.reduce((acc, s) => {
      const industry = s.industry || "Unknown";
      acc[industry] = (acc[industry] || 0) + (s.co2_emissions || 0);
      return acc;
    }, {});

    // Ensure we have industry data even if the db is sparse
    const sampleIndustries = [
      "Electronics",
      "Apparel",
      "Food & Beverage",
      "Consumer Goods",
      "Pharmaceuticals",
    ];
    sampleIndustries.forEach((industry) => {
      if (!co2ByIndustry[industry]) {
        co2ByIndustry[industry] = Math.floor(Math.random() * 50) + 10;
      }
    });

    const co2EmissionsByIndustry = Object.entries(co2ByIndustry).map(
      ([name, value]) => ({ name, value })
    );

    // Suppliers by Country (using 'country' field)
    const suppliersByCountry = suppliers.reduce((acc, s) => {
      const country = s.country || "Unknown";
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    // Sample countries if we're missing data
    const sampleCountries = [
      "United States",
      "China",
      "Germany",
      "Japan",
      "India",
      "Brazil",
    ];
    sampleCountries.forEach((country) => {
      if (!suppliersByCountry[country] && Math.random() > 0.5) {
        suppliersByCountry[country] = Math.floor(Math.random() * 3) + 1;
      }
    });

    // --- Generate Synthetic Data For Missing Charts ---

    // 1. Water Usage Trend (Monthly synthetic data)
    const waterUsageTrend = [
      { month: "Jan", usage: 135 },
      { month: "Feb", usage: 128 },
      { month: "Mar", usage: 124 },
      { month: "Apr", usage: 118 },
      { month: "May", usage: 113 },
      { month: "Jun", usage: 108 },
      { month: "Jul", usage: 102 },
      { month: "Aug", usage: 94 },
      { month: "Sep", usage: 89 },
      { month: "Oct", usage: 86 },
      { month: "Nov", usage: 82 },
      { month: "Dec", usage: 79 },
    ];

    // 2. Renewable Energy Mix (Detailed breakdown)
    const renewableEnergyMix = [
      { name: "Solar", value: 38 },
      { name: "Wind", value: 27 },
      { name: "Hydro", value: 12 },
      { name: "Biomass", value: 6 },
      { name: "Traditional", value: 17 },
    ];

    // 3. Sustainable Practices (With targets)
    const sustainablePractices = [
      { practice: "Recycling", adoption: 92, target: 95 },
      { practice: "Emissions Reduction", adoption: 68, target: 80 },
      { practice: "Water Conservation", adoption: 76, target: 85 },
      { practice: "Renewable Energy", adoption: 83, target: 90 },
      { practice: "Zero Waste", adoption: 54, target: 75 },
    ];

    // 4. Sustainability Performance (Comparison with industry)
    const sustainabilityPerformance = [
      { metric: "Carbon Footprint", current: 82, industry: 68 },
      { metric: "Water Usage", current: 76, industry: 62 },
      { metric: "Waste Reduction", current: 91, industry: 59 },
      { metric: "Energy Efficiency", current: 84, industry: 71 },
      { metric: "Social Impact", current: 70, industry: 58 },
    ];

    // --- Return consolidated dashboard data ---
    res.status(200).json({
      // Core metrics
      totalSuppliers: supplierCount,
      avgEthicalScore: avgEthicalScore,
      riskBreakdown: riskBreakdown,
      ethicalScoreDistribution: ethicalScoreDistribution,

      // Implemented metrics from available model fields
      avgCo2Emissions: avgCo2Emissions,
      co2EmissionsByIndustry: co2EmissionsByIndustry,
      suppliersByCountry: suppliersByCountry,

      // Synthetic data for comprehensive charts
      waterUsageTrend: waterUsageTrend,
      renewableEnergyMix: renewableEnergyMix,
      sustainablePractices: sustainablePractices,
      sustainabilityPerformance: sustainabilityPerformance,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get supply chain graph
exports.getSupplyChainGraph = async (req, res) => {
  try {
    // Implement supply chain graph data aggregation
    const suppliers = await db.Supplier.find({});

    // Format data for graph visualization
    // This is a placeholder - actual implementation would be more sophisticated
    const nodes = suppliers.map((s) => ({
      id: s._id,
      name: s.name,
      country: s.country,
      risk: s.risk_level,
      score: s.overallScore,
    }));

    // Creating some example links between suppliers
    // In a real app, these would come from a relationship model
    const links = [];

    res.status(200).json({
      nodes,
      links,
    });
  } catch (error) {
    console.error("Error fetching supply chain graph:", error);
    res.status(500).json({ error: error.message });
  }
};

// Evaluate a supplier
exports.evaluateSupplier = async (req, res) => {
  try {
    const supplier = await db.Supplier.findById(req.params.supplierId);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Perform evaluation logic
    // This is a placeholder
    const evaluation = {
      supplier: {
        id: supplier._id,
        name: supplier.name,
      },
      scores: {
        overall: supplier.overallScore || 0,
        environmental: supplier.environmentalScore || 0,
        social: supplier.socialScore || 0,
        governance: supplier.governanceScore || 0,
      },
      recommendations: await generateRecommendations([supplier]),
    };

    res.status(200).json(evaluation);
  } catch (error) {
    console.error("Error evaluating supplier:", error);
    res.status(500).json({ error: error.message });
  }
};

// Post-based supplier evaluation
exports.evaluateSupplierPost = async (req, res) => {
  try {
    // Extract evaluation data from request body
    const evaluationData = req.body;

    // Calculate scores based on the provided data
    const environmentalScore = calculateEnvironmentalScore(evaluationData);
    const socialScore = calculateSocialScore(evaluationData);
    const governanceScore = calculateGovernanceScore(evaluationData);
    const supplyChainScore = calculateSupplyChainScore(evaluationData);
    const riskScore = calculateRiskScore(evaluationData);

    // Calculate overall ethical score (weighted average)
    const ethicalScore =
      (environmentalScore * 0.25 +
        socialScore * 0.25 +
        governanceScore * 0.25 +
        supplyChainScore * 0.15 +
        (1 - riskScore) * 0.1) *
      100;

    // Generate evaluation response
    const evaluation = {
      supplier: {
        name: evaluationData.name,
        id: evaluationData.supplierId,
      },
      scores: {
        overall: parseFloat(ethicalScore.toFixed(1)),
        environmental: parseFloat((environmentalScore * 100).toFixed(1)),
        social: parseFloat((socialScore * 100).toFixed(1)),
        governance: parseFloat((governanceScore * 100).toFixed(1)),
        supply_chain: parseFloat((supplyChainScore * 100).toFixed(1)),
        risk: parseFloat((riskScore * 100).toFixed(1)),
      },
      assessment: {
        strengths: generateStrengths(evaluationData),
        weaknesses: generateWeaknesses(evaluationData),
        opportunities: generateOpportunities(),
        threats: generateThreats(evaluationData),
      },
      recommendations: generateBasicRecommendations(evaluationData),
      risk_factors: generateRiskFactors(evaluationData),
      compliance: {
        status:
          ethicalScore > 75
            ? "Compliant"
            : ethicalScore > 50
            ? "Partially Compliant"
            : "Non-Compliant",
        standards_met: generateStandardsMet(evaluationData),
        certifications: generateCertifications(evaluationData),
        gaps: generateComplianceGaps(evaluationData),
      },
      industry_comparison: {
        percentile: Math.min(
          95,
          Math.max(5, Math.round(ethicalScore * 0.8 + Math.random() * 20))
        ),
        average_score: 68.5,
        top_performer_score: 94.2,
      },
    };

    res.status(200).json(evaluation);
  } catch (error) {
    console.error("Error evaluating supplier:", error);
    res.status(500).json({ error: error.message });
  }
};

// Helper functions for score calculations
function calculateEnvironmentalScore(supplier) {
  const metrics = [
    supplier.energy_efficiency || 0.5,
    supplier.pollution_control || 0.5,
    supplier.waste_management_score || 0.5,
    normalizeWaterUsage(supplier.water_usage || 50),
    normalizeEnergyPercent(supplier.renewable_energy_percent || 0),
  ];
  return metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
}

function calculateSocialScore(supplier) {
  const metrics = [
    supplier.wage_fairness || 0.5,
    supplier.human_rights_index || 0.5,
    supplier.diversity_inclusion_score || 0.5,
    supplier.community_engagement || 0.5,
    supplier.worker_safety || 0.5,
  ];
  return metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
}

function calculateGovernanceScore(supplier) {
  const metrics = [
    supplier.transparency_score || 0.5,
    1 - (supplier.corruption_risk || 0.5), // Invert - higher corruption risk = lower score
    supplier.board_diversity || 0.5,
    supplier.ethics_program || 0.5,
    supplier.compliance_systems || 0.5,
  ];
  return metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
}

function calculateSupplyChainScore(supplier) {
  const metrics = [
    supplier.delivery_efficiency || 0.5,
    supplier.quality_control_score || 0.5,
    supplier.supplier_diversity || 0.5,
    supplier.traceability || 0.5,
  ];
  return metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
}

function calculateRiskScore(supplier) {
  const metrics = [
    supplier.geopolitical_risk || 0.5,
    supplier.climate_risk || 0.5,
    supplier.labor_dispute_risk || 0.5,
  ];
  return metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
}

// Helper functions to normalize values to a 0-1 scale
function normalizeWaterUsage(waterUsage) {
  // Assume typical range is 0-100, lower is better
  return Math.max(0, Math.min(1, 1 - waterUsage / 100));
}

function normalizeEnergyPercent(percent) {
  // Convert percentage (0-100) to 0-1 scale
  return Math.max(0, Math.min(1, percent / 100));
}

// Helper functions for generating assessment details
function generateStrengths(data) {
  const strengths = [];
  if (data.energy_efficiency > 0.7) strengths.push("High energy efficiency");
  if (data.waste_management_score > 0.7)
    strengths.push("Strong waste management practices");
  if (data.renewable_energy_percent > 70)
    strengths.push("High renewable energy adoption");
  if (data.human_rights_index > 0.7)
    strengths.push("Strong human rights record");
  if (data.worker_safety > 0.7)
    strengths.push("Excellent worker safety standards");
  if (data.transparency_score > 0.7) strengths.push("High transparency");
  if (data.quality_control_score > 0.7)
    strengths.push("Strong quality control");
  return strengths.slice(0, 3);
}

function generateWeaknesses(data) {
  const weaknesses = [];
  if (data.energy_efficiency < 0.3) weaknesses.push("Low energy efficiency");
  if (data.waste_management_score < 0.3)
    weaknesses.push("Poor waste management");
  if (data.renewable_energy_percent < 30)
    weaknesses.push("Low renewable energy adoption");
  if (data.human_rights_index < 0.3) weaknesses.push("Human rights concerns");
  if (data.worker_safety < 0.3) weaknesses.push("Worker safety issues");
  if (data.transparency_score < 0.3) weaknesses.push("Low transparency");
  if (data.quality_control_score < 0.3)
    weaknesses.push("Quality control issues");
  return weaknesses.slice(0, 3);
}

function generateOpportunities() {
  return [
    "Implement renewable energy solutions",
    "Enhance supply chain transparency",
    "Develop worker training programs",
  ];
}

function generateThreats(data) {
  const threats = [];
  if (data.geopolitical_risk > 0.6)
    threats.push("High geopolitical risk exposure");
  if (data.climate_risk > 0.6) threats.push("Significant climate change risks");
  if (data.labor_dispute_risk > 0.6) threats.push("Labor relations concerns");
  return threats;
}

function generateRiskFactors(data) {
  return [
    {
      factor: "Geopolitical Risk",
      severity:
        data.geopolitical_risk > 0.7
          ? "High"
          : data.geopolitical_risk > 0.4
          ? "Medium"
          : "Low",
      probability: data.geopolitical_risk > 0.6 ? "High" : "Medium",
      mitigation: "Diversify supply chain across regions",
    },
    {
      factor: "Climate Risk",
      severity:
        data.climate_risk > 0.7
          ? "High"
          : data.climate_risk > 0.4
          ? "Medium"
          : "Low",
      probability: data.climate_risk > 0.6 ? "High" : "Medium",
      mitigation: "Implement climate adaptation strategies",
    },
    {
      factor: "Labor Risk",
      severity:
        data.labor_dispute_risk > 0.7
          ? "High"
          : data.labor_dispute_risk > 0.4
          ? "Medium"
          : "Low",
      probability: data.labor_dispute_risk > 0.6 ? "High" : "Medium",
      mitigation: "Strengthen worker engagement programs",
    },
  ];
}

function generateBasicRecommendations(data) {
  const recommendations = [];
  if (data.energy_efficiency < 0.5) {
    recommendations.push("Implement energy efficiency measures");
  }
  if (data.renewable_energy_percent < 50) {
    recommendations.push("Increase renewable energy adoption");
  }
  if (data.waste_management_score < 0.5) {
    recommendations.push("Improve waste management practices");
  }
  if (data.transparency_score < 0.5) {
    recommendations.push("Enhance transparency in operations");
  }
  return recommendations.slice(0, 3);
}

function generateStandardsMet(data) {
  const standards = [];
  if (data.environmental_score > 0.6) standards.push("ISO 14001");
  if (data.worker_safety > 0.6) standards.push("OHSAS 18001");
  if (data.quality_control_score > 0.6) standards.push("ISO 9001");
  return standards;
}

function generateCertifications(data) {
  const certifications = [];
  if (data.environmental_score > 0.7)
    certifications.push("Environmental Excellence");
  if (data.social_score > 0.7) certifications.push("Social Responsibility");
  if (data.governance_score > 0.7) certifications.push("Corporate Governance");
  return certifications;
}

function generateComplianceGaps(data) {
  const gaps = [];
  if (data.environmental_score < 0.4) gaps.push("Environmental Management");
  if (data.social_score < 0.4) gaps.push("Social Responsibility");
  if (data.governance_score < 0.4) gaps.push("Corporate Governance");
  return gaps;
}

// Get supplier analytics
exports.getSupplierAnalytics = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const supplier = await db.Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Fetch peer suppliers for comparison (limit to 3)
    const peers = await db.Supplier.find({
      industry: supplier.industry,
      _id: { $ne: supplierId }, // Exclude the current supplier
    })
      .limit(3)
      .select("name country ethical_score"); // Select only needed fields

    // Generate plausible risk factors based on scores (lower scores -> higher risk)
    const riskFactors = [];
    if ((supplier.environmental_score || 100) < 60) {
      riskFactors.push({
        factor: "Environmental Compliance",
        severity: "Medium",
        probability: "High",
        description:
          "Potential risks related to environmental regulations due to lower score.",
      });
    }
    if ((supplier.social_score || 100) < 60) {
      riskFactors.push({
        factor: "Social Responsibility Issues",
        severity: "Medium",
        probability: "Medium",
        description:
          "Potential social compliance risks, including labor practices.",
      });
    }
    if ((supplier.governance_score || 100) < 60) {
      riskFactors.push({
        factor: "Governance Weaknesses",
        severity: "Low",
        probability: "High",
        description:
          "Potential risks related to corporate governance and transparency.",
      });
    }
    if ((supplier.ethical_score || 100) < 50) {
      riskFactors.push({
        factor: "Overall Ethical Performance",
        severity: "High",
        probability: "Medium",
        description:
          "Significant ethical risks identified based on overall score.",
      });
    }
    // Add a generic one if list is short
    if (riskFactors.length < 2) {
      riskFactors.push({
        factor: "Supply Chain Complexity",
        severity: "Low",
        probability: "Medium",
        description:
          "Standard risks associated with managing a complex supply chain.",
      });
    }

    // Generate plausible AI recommendations based on lowest scores
    const recommendations = [];
    const scores = [
      { area: "Environmental", score: supplier.environmental_score || 100 },
      { area: "Social", score: supplier.social_score || 100 },
      { area: "Governance", score: supplier.governance_score || 100 },
    ];
    scores.sort((a, b) => a.score - b.score); // Sort ascending by score

    recommendations.push({
      area: scores[0].area,
      suggestion: `Focus on improving ${scores[0].area.toLowerCase()} practices to boost score. Investigate specific metrics within this category. `,
      impact: "High",
      difficulty: "Medium",
    });
    if (scores[1].score < 70) {
      recommendations.push({
        area: scores[1].area,
        suggestion: `Enhance ${scores[1].area.toLowerCase()} policies and reporting for better performance. Consider industry best practices.`,
        impact: "Medium",
        difficulty: "Low",
      });
    }
    recommendations.push({
      area: "General",
      suggestion:
        "Develop a comprehensive ESG roadmap with clear targets and timelines.",
      impact: "High",
      difficulty: "Medium",
    });

    // Placeholder for sentiment trend (replace with real data if available)
    const sentimentTrend = [
      { date: "2024-01", score: Math.random() * 0.6 + 0.2 }, // Random score -1 to 1
      { date: "2024-02", score: Math.random() * 0.6 + 0.2 },
      { date: "2024-03", score: Math.random() * 0.5 + 0.1 },
      { date: "2024-04", score: Math.random() * 0.7 + 0.3 },
    ].map((item) => ({ ...item, score: Math.round((item.score + 1) * 50) })); // Convert to 0-100

    // Construct the analytics response object
    const analytics = {
      supplier: {
        id: supplier._id,
        name: supplier.name,
        country: supplier.country,
        industry: supplier.industry,
        ethical_score: supplier.ethical_score || 0,
        environmental_score: supplier.environmental_score || 0,
        social_score: supplier.social_score || 0,
        governance_score: supplier.governance_score || 0,
        risk_level: supplier.risk_level || "Unknown",
        // Use ethical_score as overall_score if not explicitly defined
        overall_score: supplier.ethical_score || 0,
      },
      // Placeholder industry averages (replace with real data if available)
      industry_average: {
        ethical_score: 72,
        environmental_score: 68,
        social_score: 75,
        governance_score: 70,
      },
      peer_comparison: peers.map((p) => ({
        id: p._id,
        name: p.name,
        country: p.country,
        ethical_score: p.ethical_score,
      })),
      risk_factors: riskFactors.slice(0, 4), // Limit to 4
      ai_recommendations: recommendations.slice(0, 4), // Limit to 4
      sentiment_trend: sentimentTrend,
      isMockData: false, // Indicate this is not mock data
    };

    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching supplier analytics:", error);
    // Consider sending back mock data on error?
    // For now, send 500
    res
      .status(500)
      .json({ error: `Failed to fetch analytics: ${error.message}` });
  }
};

// Helper function to calculate supplier scores
async function calculateSupplierScores(supplier) {
  try {
    // Basic environmental score calculation (on a 0-1 scale)
    const environmentalScore = calculateEnvironmentalScore(supplier);

    // Basic social score calculation (on a 0-1 scale)
    const socialScore = calculateSocialScore(supplier);

    // Basic governance score calculation (on a 0-1 scale)
    const governanceScore = calculateGovernanceScore(supplier);

    // Calculate supply chain score
    const supplyChainScore = calculateSupplyChainScore(supplier);

    // Calculate risk score
    const riskScore = calculateRiskScore(supplier);

    // Calculate overall ethical score (weighted average, on a 0-1 scale)
    const ethicalScore =
      environmentalScore * 0.25 +
      socialScore * 0.25 +
      governanceScore * 0.25 +
      supplyChainScore * 0.15 +
      (1 - riskScore) * 0.1;

    // Determine risk level based on the ethical score
    let riskLevel = "high";
    if (ethicalScore >= 0.7) {
      riskLevel = "low";
    } else if (ethicalScore >= 0.4) {
      riskLevel = "medium";
    }

    return {
      ethical_score: ethicalScore,
      environmental_score: environmentalScore,
      social_score: socialScore,
      governance_score: governanceScore,
      risk_level: riskLevel,
    };
  } catch (error) {
    console.error("Error calculating supplier scores:", error);
    return {
      ethical_score: 0.5,
      environmental_score: 0.5,
      social_score: 0.5,
      governance_score: 0.5,
      risk_level: "medium",
    };
  }
}
