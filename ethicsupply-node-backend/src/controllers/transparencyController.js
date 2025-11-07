const db = require("../models");
const { scoreSupplierWithBreakdown } = require("../utils/esgScoring");

// Get full calculation trace for a supplier (raw → normalized → weighted → final)
exports.getCalculationTrace = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await db.Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const settings = await db.ScoringSettings.getDefault();
    const breakdown = scoreSupplierWithBreakdown(supplier.toObject(), settings);

    // Build detailed trace
    const trace = {
      supplier: {
        id: supplier._id,
        name: supplier.name,
        country: supplier.country,
        industry: supplier.industry,
      },
      settings: {
        useIndustryBands: breakdown.useIndustryBands,
        riskPenaltyEnabled: breakdown.risk.enabled,
        weights: breakdown.weights,
      },
      rawValues: {},
      normalizedValues: {},
      pillarScores: breakdown.pillarScores,
      compositeScore: breakdown.composite,
      riskAdjustment: {
        factor: breakdown.risk.factor,
        level: breakdown.risk.level,
        enabled: breakdown.risk.enabled,
      },
      finalScore: breakdown.ethical_score,
      completenessRatio: breakdown.completeness_ratio,
    };

    // Extract raw and normalized values
    Object.entries(breakdown.normalizedMetrics).forEach(([metric, data]) => {
      trace.rawValues[metric] = {
        value: data.value,
        imputed: data.imputed,
        band: data.band,
      };
      trace.normalizedValues[metric] = {
        normalized: data.normalized,
        weighted: (() => {
          // Calculate weighted contribution
          if (metric.includes("emission") || metric.includes("intensity")) {
            return data.normalized * breakdown.weights.environmental.emission_intensity;
          } else if (metric === "renewable_pct") {
            return data.normalized * breakdown.weights.environmental.renewable_pct;
          } else if (metric === "water_intensity") {
            return data.normalized * breakdown.weights.environmental.water_intensity;
          } else if (metric === "waste_intensity") {
            return data.normalized * breakdown.weights.environmental.waste_intensity;
          } else if (metric === "injury_rate") {
            return data.normalized * breakdown.weights.social.injury_rate;
          } else if (metric === "training_hours") {
            return data.normalized * breakdown.weights.social.training_hours;
          } else if (metric === "wage_ratio") {
            return data.normalized * breakdown.weights.social.wage_ratio;
          } else if (metric === "diversity_pct") {
            return data.normalized * breakdown.weights.social.diversity_pct;
          } else if (metric === "board_diversity") {
            return data.normalized * breakdown.weights.governance.board_diversity;
          } else if (metric === "board_independence") {
            return data.normalized * breakdown.weights.governance.board_independence;
          } else if (metric === "transparency_score") {
            return data.normalized * breakdown.weights.governance.transparency_score;
          }
          return null;
        })(),
      };
    });

    res.status(200).json({
      trace,
      summary: {
        formula: `Final Score = Composite × (1 - Risk Factor)`,
        compositeFormula: `Composite = E×${breakdown.weights.composite.environmental} + S×${breakdown.weights.composite.social} + G×${breakdown.weights.composite.governance}`,
        riskFormula: breakdown.risk.enabled
          ? `Risk Factor = avg(climate_risk, geopolitical_risk, labor_dispute_risk)`
          : `Risk Factor = 0 (disabled)`,
        finalCalculation: `${breakdown.composite.toFixed(2)} × (1 - ${breakdown.risk.factor.toFixed(3)}) = ${breakdown.ethical_score.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Error generating calculation trace:", error);
    res.status(500).json({ error: error.message });
  }
};

