const db = require("../models");
const { scoreSupplier, scoreSupplierWithBreakdown } = require("../utils/esgScoring");

// S1: Utility - Test scoring with different weight configurations
exports.s1Utility = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { weights } = req.body; // Optional custom weights

    const supplier = await db.Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const defaultSettings = await db.ScoringSettings.getDefault();
    const testSettings = weights ? { ...defaultSettings.toObject(), ...weights } : defaultSettings;

    const scores = scoreSupplier(supplier.toObject(), testSettings);
    const breakdown = scoreSupplierWithBreakdown(supplier.toObject(), testSettings);

    res.status(200).json({
      scenario: "S1 - Utility",
      description: "Test scoring with different weight configurations",
      supplier: {
        id: supplier._id,
        name: supplier.name,
      },
      settings: testSettings,
      scores,
      breakdown,
    });
  } catch (error) {
    console.error("Error in S1 scenario:", error);
    res.status(500).json({ error: error.message });
  }
};

// S2: Sensitivity - Test how scores change with small input variations
exports.s2Sensitivity = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { variation = 0.05 } = req.body; // Default 5% variation

    const supplier = await db.Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const settings = await db.ScoringSettings.getDefault();
    const baseScores = scoreSupplier(supplier.toObject(), settings);

    // Test variations on key metrics
    const variations = [
      { field: "revenue", multiplier: 1 + variation },
      { field: "revenue", multiplier: 1 - variation },
      { field: "renewable_energy_percent", delta: variation * 100 },
      { field: "renewable_energy_percent", delta: -variation * 100 },
      { field: "transparency_score", delta: variation * 100 },
      { field: "transparency_score", delta: -variation * 100 },
    ];

    const results = variations.map(({ field, multiplier, delta }) => {
      const modified = { ...supplier.toObject() };
      if (multiplier) {
        modified[field] = (modified[field] || 0) * multiplier;
      } else if (delta !== undefined) {
        modified[field] = (modified[field] || 0) + delta;
      }
      const scores = scoreSupplier(modified, settings);
      return {
        variation: { field, multiplier, delta },
        scores,
        delta: {
          environmental: scores.environmental_score - baseScores.environmental_score,
          social: scores.social_score - baseScores.social_score,
          governance: scores.governance_score - baseScores.governance_score,
          composite: scores.composite_score - baseScores.composite_score,
          ethical: scores.ethical_score - baseScores.ethical_score,
        },
      };
    });

    res.status(200).json({
      scenario: "S2 - Sensitivity",
      description: "Test how scores change with small input variations",
      supplier: {
        id: supplier._id,
        name: supplier.name,
      },
      baseScores,
      variation,
      results,
    });
  } catch (error) {
    console.error("Error in S2 scenario:", error);
    res.status(500).json({ error: error.message });
  }
};

// S3: Missingness - Test scoring with missing data (imputation behavior)
exports.s3Missingness = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { missingFields = [] } = req.body; // Array of field names to remove

    const supplier = await db.Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const settings = await db.ScoringSettings.getDefault();
    const baseScores = scoreSupplier(supplier.toObject(), settings);
    const baseBreakdown = scoreSupplierWithBreakdown(supplier.toObject(), settings);

    // Create modified supplier with missing fields
    const modified = { ...supplier.toObject() };
    missingFields.forEach((field) => {
      modified[field] = null;
    });

    const modifiedScores = scoreSupplier(modified, settings);
    const modifiedBreakdown = scoreSupplierWithBreakdown(modified, settings);

    // Count imputed values
    const imputedCount = Object.values(modifiedBreakdown.normalizedMetrics).filter(
      (m) => m.imputed
    ).length;

    res.status(200).json({
      scenario: "S3 - Missingness",
      description: "Test scoring with missing data (imputation behavior)",
      supplier: {
        id: supplier._id,
        name: supplier.name,
      },
      missingFields,
      baseScores,
      modifiedScores,
      imputedCount,
      breakdown: {
        base: baseBreakdown,
        modified: modifiedBreakdown,
      },
    });
  } catch (error) {
    console.error("Error in S3 scenario:", error);
    res.status(500).json({ error: error.message });
  }
};

// S4: Ablation - Test scoring with individual metrics/pillars removed
exports.s4Ablation = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { removePillar, removeMetric } = req.body; // Optional: "environmental", "social", "governance" or metric name

    const supplier = await db.Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const settings = await db.ScoringSettings.getDefault();
    const baseScores = scoreSupplier(supplier.toObject(), settings);

    const results = [];

    if (removePillar) {
      // Test removing entire pillar
      const modifiedSettings = { ...settings.toObject() };
      if (removePillar === "environmental") {
        modifiedSettings.environmentalWeight = 0;
        modifiedSettings.socialWeight = 0.5;
        modifiedSettings.governanceWeight = 0.5;
      } else if (removePillar === "social") {
        modifiedSettings.environmentalWeight = 0.5;
        modifiedSettings.socialWeight = 0;
        modifiedSettings.governanceWeight = 0.5;
      } else if (removePillar === "governance") {
        modifiedSettings.environmentalWeight = 0.5;
        modifiedSettings.socialWeight = 0.5;
        modifiedSettings.governanceWeight = 0;
      }
      const scores = scoreSupplier(supplier.toObject(), modifiedSettings);
      results.push({
        type: "pillar",
        removed: removePillar,
        scores,
        impact: {
          environmental: scores.environmental_score - baseScores.environmental_score,
          social: scores.social_score - baseScores.social_score,
          governance: scores.governance_score - baseScores.governance_score,
          composite: scores.composite_score - baseScores.composite_score,
          ethical: scores.ethical_score - baseScores.ethical_score,
        },
      });
    }

    if (removeMetric) {
      // Test removing individual metric (set weight to 0)
      const modifiedSettings = { ...settings.toObject() };
      const metricWeightMap = {
        emission_intensity: "emissionIntensityWeight",
        renewable_pct: "renewableShareWeight",
        water_intensity: "waterIntensityWeight",
        waste_intensity: "wasteIntensityWeight",
        injury_rate: "injuryRateWeight",
        training_hours: "trainingHoursWeight",
        wage_ratio: "wageRatioWeight",
        diversity_pct: "diversityWeight",
        board_diversity: "boardDiversityWeight",
        board_independence: "boardIndependenceWeight",
        anti_corruption: "antiCorruptionWeight",
        transparency_score: "transparencyWeight",
      };
      if (metricWeightMap[removeMetric]) {
        modifiedSettings[metricWeightMap[removeMetric]] = 0;
      }
      const scores = scoreSupplier(supplier.toObject(), modifiedSettings);
      results.push({
        type: "metric",
        removed: removeMetric,
        scores,
        impact: {
          environmental: scores.environmental_score - baseScores.environmental_score,
          social: scores.social_score - baseScores.social_score,
          governance: scores.governance_score - baseScores.governance_score,
          composite: scores.composite_score - baseScores.composite_score,
          ethical: scores.ethical_score - baseScores.ethical_score,
        },
      });
    }

    res.status(200).json({
      scenario: "S4 - Ablation",
      description: "Test scoring with individual metrics/pillars removed",
      supplier: {
        id: supplier._id,
        name: supplier.name,
      },
      baseScores,
      results,
    });
  } catch (error) {
    console.error("Error in S4 scenario:", error);
    res.status(500).json({ error: error.message });
  }
};

