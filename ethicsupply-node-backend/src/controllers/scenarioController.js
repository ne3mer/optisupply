const db = require("../models");
const { scoreSupplier, scoreSupplierWithBreakdown } = require("../utils/esgScoring");
const { 
  kendallTau, 
  meanAbsoluteError,
  calculateRankShifts,
  calculateDisparity,
  topKPreservation,
  knnImpute,
} = require("../utils/statistics");
const { exportRankingsCSV } = require("./exportController");

/**
 * Helper: Get baseline rankings
 */
async function getBaselineRankings() {
  const settings = await db.ScoringSettings.getDefault();
  const suppliers = await db.Supplier.find({});

  const rankings = suppliers.map((supplier) => {
    const scores = scoreSupplier(supplier.toObject(), settings);
    return {
      id: supplier._id.toString(),
      name: supplier.name,
      score: scores.ethical_score,
    };
  });

  // Sort by score (descending) and assign ranks
  rankings.sort((a, b) => b.score - a.score);
  rankings.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return { rankings, suppliers, settings };
}

/**
 * Helper: Generate CSV and return URL/data
 */
function generateRankingsCsv(rankings, scenario) {
  const headers = ["SupplierID", "Rank", "Name", "Score"];
  const rows = rankings.map((r) => [r.id, r.rank, r.name, r.score.toFixed(2)]);

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ];

  const csv = csvLines.join("\n");
  const filename = `rankings_${scenario}_${new Date().toISOString().split("T")[0]}.csv`;

  return {
    csv,
    filename,
    url: `/api/scenarios/${scenario}/csv`, // Placeholder URL
  };
}

/**
 * S1: Utility Analysis
 * POST /api/scenarios/s1
 * Tests scoring with constraints (e.g., minimum margin requirement)
 * 
 * Request body: { constraint: { marginMin?: number } }
 * Returns: { deltaObjectivePct, ranksCsvUrl, rankings, baseline }
 */
exports.s1Utility = async (req, res) => {
  try {
    const { constraint = {} } = req.body;
    const { marginMin } = constraint;

    // Get baseline
    const { rankings: baselineRankings, suppliers, settings } = await getBaselineRankings();

    // Apply constraint: filter suppliers by minimum margin (if provided)
    // Margin can be calculated as (score - threshold)
    const threshold = marginMin || 0;
    
    const constrainedSuppliers = suppliers.filter((supplier) => {
      const scores = scoreSupplier(supplier.toObject(), settings);
      return scores.ethical_score >= threshold;
    });

    // Calculate new rankings with constraint
    const constrainedRankings = constrainedSuppliers.map((supplier) => {
      const scores = scoreSupplier(supplier.toObject(), settings);
      return {
        id: supplier._id.toString(),
        name: supplier.name,
        score: scores.ethical_score,
      };
    });

    constrainedRankings.sort((a, b) => b.score - a.score);
    constrainedRankings.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    // Calculate delta objective (change in total score)
    const baselineTotal = baselineRankings.reduce((sum, r) => sum + r.score, 0);
    const constrainedTotal = constrainedRankings.reduce((sum, r) => sum + r.score, 0);
    const deltaObjectivePct = baselineTotal > 0 
      ? ((constrainedTotal - baselineTotal) / baselineTotal) * 100 
      : 0;

    // Generate CSV
    const csvData = generateRankingsCsv(constrainedRankings, "s1");

    res.status(200).json({
      scenario: "S1 - Utility",
      description: "Test scoring with constraints",
      constraint: { marginMin: threshold },
      deltaObjectivePct: parseFloat(deltaObjectivePct.toFixed(2)),
      ranksCsvUrl: csvData.url,
      rankings: constrainedRankings,
      baseline: baselineRankings,
      summary: {
        baselineCount: baselineRankings.length,
        constrainedCount: constrainedRankings.length,
        filtered: baselineRankings.length - constrainedRankings.length,
      },
    });
  } catch (error) {
    console.error("Error in S1 scenario:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * S2: Sensitivity Analysis
 * POST /api/scenarios/s2
 * Tests how rankings change with perturbations
 * 
 * Request body: { perturbation: "+10" | "-10" | "+20" | "-20" }
 * Returns: { tau, meanRankShift, maxRankShift, ranksCsvUrl, rankings }
 */
exports.s2Sensitivity = async (req, res) => {
  try {
    const { perturbation = "+10" } = req.body;

    // Parse perturbation
    const perturbValue = parseFloat(perturbation) / 100; // Convert to decimal

    // Get baseline
    const { rankings: baselineRankings, suppliers, settings } = await getBaselineRankings();

    // Apply perturbation to all scores
    const perturbedRankings = suppliers.map((supplier) => {
      const scores = scoreSupplier(supplier.toObject(), settings);
      // Perturb the final score
      const perturbedScore = scores.ethical_score * (1 + perturbValue);
      return {
        id: supplier._id.toString(),
        name: supplier.name,
        score: Math.max(0, Math.min(100, perturbedScore)), // Clamp to [0, 100]
      };
    });

    perturbedRankings.sort((a, b) => b.score - a.score);
    perturbedRankings.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    // Calculate statistics
    const tau = kendallTau(
      baselineRankings.map(r => ({ id: r.id, rank: r.rank })),
      perturbedRankings.map(r => ({ id: r.id, rank: r.rank }))
    );

    const { meanShift, maxShift } = calculateRankShifts(
      baselineRankings.map(r => ({ id: r.id, rank: r.rank })),
      perturbedRankings.map(r => ({ id: r.id, rank: r.rank }))
    );

    // Generate CSV
    const csvData = generateRankingsCsv(perturbedRankings, "s2");

    res.status(200).json({
      scenario: "S2 - Sensitivity",
      description: "Test how rankings change with perturbations",
      perturbation,
      tau: parseFloat(tau.toFixed(4)),
      meanRankShift: parseFloat(meanShift.toFixed(2)),
      maxRankShift: maxShift,
      ranksCsvUrl: csvData.url,
      rankings: perturbedRankings,
      baseline: baselineRankings,
    });
  } catch (error) {
    console.error("Error in S2 scenario:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * S3: Missingness Analysis
 * POST /api/scenarios/s3
 * Tests scoring with missing data and imputation
 * 
 * Request body: { missingPct: 5|10, imputation: "industryMean"|"knn", k?: number }
 * Returns: { top3PreservationPct, mae, ranksCsvUrl, rankings }
 */
exports.s3Missingness = async (req, res) => {
  try {
    const { missingPct = 10, imputation = "industryMean", k = 5 } = req.body;

    // Get baseline
    const { rankings: baselineRankings, suppliers, settings } = await getBaselineRankings();

    // Metrics that can be made missing
    const metrics = [
      "transparency_score",
      "renewable_energy_percent",
      "injury_rate",
      "training_hours",
      "diversity_pct",
    ];

    // Create modified suppliers with missing data
    const modifiedSuppliers = suppliers.map((supplier) => {
      const supplierObj = supplier.toObject();
      
      // Randomly make metrics missing based on missingPct
      metrics.forEach((metric) => {
        if (Math.random() * 100 < missingPct) {
          supplierObj[metric] = null;
        }
      });

      return supplierObj;
    });

    // Perform imputation
    const imputedSuppliers = modifiedSuppliers.map((supplier, idx) => {
      const imputedSupplier = { ...supplier };

      metrics.forEach((metric) => {
        if (supplier[metric] === null) {
          if (imputation === "industryMean") {
            // Calculate industry mean
            const sameIndustry = suppliers.filter(
              (s) => s.industry === supplier.industry && s[metric] !== null
            );
            if (sameIndustry.length > 0) {
              const sum = sameIndustry.reduce((acc, s) => acc + (s[metric] || 0), 0);
              imputedSupplier[metric] = sum / sameIndustry.length;
            } else {
              // Fallback to global mean
              const allValues = suppliers
                .map((s) => s[metric])
                .filter((v) => v !== null);
              imputedSupplier[metric] =
                allValues.length > 0
                  ? allValues.reduce((a, b) => a + b, 0) / allValues.length
                  : 0;
            }
          } else if (imputation === "knn") {
            // Use KNN imputation
            const allSuppliers = suppliers.map((s) => s.toObject());
            imputedSupplier[metric] = knnImpute(
              allSuppliers,
              idx,
              metric,
              metrics.filter((m) => m !== metric),
              k
            );
          }
        }
      });

      return imputedSupplier;
    });

    // Calculate new rankings with imputed data
    const imputedRankings = imputedSuppliers.map((supplier) => {
      const scores = scoreSupplier(supplier, settings);
      return {
        id: supplier._id.toString(),
        name: supplier.name,
        score: scores.ethical_score,
      };
    });

    imputedRankings.sort((a, b) => b.score - a.score);
    imputedRankings.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    // Calculate top-3 preservation
    const top3Baseline = baselineRankings.slice(0, 3);
    const top3Imputed = imputedRankings.slice(0, 3);
    const top3PreservationPct = topKPreservation(top3Baseline, top3Imputed);

    // Calculate MAE of scores
    const baselineScores = baselineRankings.map((r) => r.score);
    const imputedScores = baselineRankings.map((br) => {
      const imputed = imputedRankings.find((ir) => ir.id === br.id);
      return imputed ? imputed.score : 0;
    });
    const mae = meanAbsoluteError(baselineScores, imputedScores);

    // Generate CSV
    const csvData = generateRankingsCsv(imputedRankings, "s3");

    res.status(200).json({
      scenario: "S3 - Missingness",
      description: "Test scoring with missing data and imputation",
      missingPct,
      imputation,
      k: imputation === "knn" ? k : undefined,
      top3PreservationPct: parseFloat(top3PreservationPct.toFixed(2)),
      mae: parseFloat(mae.toFixed(4)),
      ranksCsvUrl: csvData.url,
      rankings: imputedRankings,
      baseline: baselineRankings,
    });
  } catch (error) {
    console.error("Error in S3 scenario:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * S4: Fairness/Ablation Analysis
 * POST /api/scenarios/s4
 * Tests scoring with normalization on/off
 * 
 * Request body: { normalization: "off"|"on" }
 * Returns: { D, tau, ranksCsvUrl, rankings }
 */
exports.s4Ablation = async (req, res) => {
  try {
    const { normalization = "on" } = req.body;

    // Get baseline
    const { rankings: baselineRankings, suppliers, settings } = await getBaselineRankings();

    // Modify settings for normalization
    const modifiedSettings = {
      ...settings.toObject ? settings.toObject() : settings,
      useIndustryBands: normalization === "on",
    };

    // Calculate new rankings with modified normalization
    const modifiedRankings = suppliers.map((supplier) => {
      const scores = scoreSupplier(supplier.toObject(), modifiedSettings);
      return {
        id: supplier._id.toString(),
        name: supplier.name,
        industry: supplier.industry,
        score: scores.ethical_score,
      };
    });

    modifiedRankings.sort((a, b) => b.score - a.score);
    modifiedRankings.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    // Calculate Kendall's tau
    const tau = kendallTau(
      baselineRankings.map((r) => ({ id: r.id, rank: r.rank })),
      modifiedRankings.map((r) => ({ id: r.id, rank: r.rank }))
    );

    // Calculate disparity by industry (using exact implementation)
    const ranksWithIndustry = modifiedRankings.map((r) => ({
      rank: r.rank,
      industry: r.industry || "Unknown",
    }));
    const D = calculateDisparity(ranksWithIndustry);

    // Generate CSV
    const csvData = generateRankingsCsv(modifiedRankings, "s4");

    res.status(200).json({
      scenario: "S4 - Fairness/Ablation",
      description: "Test scoring with normalization on/off",
      normalization,
      D: parseFloat(D.toFixed(4)),
      tau: parseFloat(tau.toFixed(4)),
      ranksCsvUrl: csvData.url,
      rankings: modifiedRankings,
      baseline: baselineRankings,
    });
  } catch (error) {
    console.error("Error in S4 scenario:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Unified scenario runner endpoint
 * POST /api/scenarios/run
 * Body: { type: "s1"|"s2"|"s3"|"s4", params: {...} }
 * Returns: CSV or ZIP of CSVs
 */
exports.runScenario = async (req, res) => {
  try {
    const { type, params = {} } = req.body;

    if (!type || !["s1", "s2", "s3", "s4"].includes(type)) {
      return res.status(400).json({ ok: false, error: "Unknown scenario type. Must be s1, s2, s3, or s4." });
    }

    // Load current config
    const settings = await db.ScoringSettings.getDefault();
    const baseCfg = {
      environmentalWeight: settings.environmentalWeight || 0.4,
      socialWeight: settings.socialWeight || 0.3,
      governanceWeight: settings.governanceWeight || 0.3,
      riskPenaltyEnabled: settings.riskPenaltyEnabled !== false,
      riskWeightGeopolitical: settings.riskWeightGeopolitical || 0.33,
      riskWeightClimate: settings.riskWeightClimate || 0.33,
      riskWeightLabor: settings.riskWeightLabor || 0.34,
      riskThreshold: settings.riskThreshold || 0.3,
      riskLambda: settings.riskLambda || 1.0,
      useIndustryBands: settings.useIndustryBands !== false,
    };

    const { ScenarioRunner, createZip } = require("../scenarios/ScenarioRunner");
    const runner = new ScenarioRunner(baseCfg);

    if (type === "s1") {
      // IMPORTANT: use ?? not || so 0 is not discarded, and Number() to ensure numeric
      const minMarginPct = Number(params?.minMarginPct ?? 15);
      const { rows, baselineObjective, s1Objective } = await runner.runS1(minMarginPct);

      // Convert rows to CSV
      const headers = Object.keys(rows[0] || {});
      const csvLines = [
        headers.join(","),
        ...rows.map((row) =>
          headers
            .map((h) => {
              const value = row[h] ?? "";
              return `"${String(value).replace(/"/g, '""')}"`;
            })
            .join(",")
        ),
      ];
      const csv = csvLines.join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="s1_ranking_margin${minMarginPct}.csv"`);
      
      // Set objective headers with 6 decimal precision
      if (baselineObjective != null && Number.isFinite(baselineObjective)) {
        res.setHeader("X-Baseline-Objective", baselineObjective.toFixed(6));
      }
      if (s1Objective != null && Number.isFinite(s1Objective)) {
        res.setHeader("X-S1-Objective", s1Objective.toFixed(6));
      }
      res.setHeader("X-Margin-Threshold", String(minMarginPct));
      
      return res.send(csv);
    }

    if (type === "s2") {
      const files = await runner.runS2();
      const zipBuffer = await createZip(files);

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="s2_bundle_${new Date().toISOString().split("T")[0]}.zip"`);
      return res.send(zipBuffer);
    }

    if (type === "s3") {
      const files = await runner.runS3();
      const zipBuffer = await createZip(files);

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="s3_bundle_${new Date().toISOString().split("T")[0]}.zip"`);
      return res.send(zipBuffer);
    }

    if (type === "s4") {
      const { on, off } = await runner.runS4();
      const zipBuffer = await createZip({
        "s4_on.csv": on,
        "s4_off.csv": off,
      });

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="s4_bundle_${new Date().toISOString().split("T")[0]}.zip"`);
      return res.send(zipBuffer);
    }

    return res.status(400).json({ ok: false, error: "Unknown scenario type" });
  } catch (error) {
    console.error("Error in runScenario:", error);
    res.status(500).json({ ok: false, error: String(error.message || error) });
  }
};

/**
 * Get data coverage statistics for S1 diagnostics
 */
exports.getDataCoverage = async (req, res) => {
  try {
    const suppliers = await db.Supplier.find({});
    const totalSuppliers = suppliers.length;

    // Count suppliers with emissions data
    const emissionsCount = suppliers.filter(s => {
      const emissions = s.total_emissions ?? s.co2_emissions;
      return emissions != null && Number.isFinite(emissions) && emissions > 0;
    }).length;

    // Count suppliers with revenue data
    const revenueCount = suppliers.filter(s => {
      const revenue = s.revenue_musd ?? s.revenue;
      return revenue != null && Number.isFinite(revenue) && revenue > 0;
    }).length;

    // Count suppliers with margin data (actual or derivable)
    const marginCount = suppliers.filter(s => {
      // Check for actual margin_pct
      if (s.margin_pct != null && Number.isFinite(s.margin_pct)) return true;
      // Check if derivable from revenue/cost
      const revenue = s.revenue_musd ?? s.revenue;
      const cost = s.cost_musd ?? s.cost;
      return revenue != null && cost != null && revenue > 0 && cost >= 0 && cost <= revenue;
    }).length;

    // Industry distribution
    const industryCounts = {};
    suppliers.forEach(s => {
      const industry = s.industry || "Unknown";
      industryCounts[industry] = (industryCounts[industry] || 0) + 1;
    });
    const industryCount = Object.keys(industryCounts).length;
    const minIndustrySize = Math.min(...Object.values(industryCounts));

    res.json({
      totalSuppliers,
      emissionsCount,
      emissionsCoverage: totalSuppliers > 0 ? (emissionsCount / totalSuppliers) * 100 : 0,
      revenueCount,
      revenueCoverage: totalSuppliers > 0 ? (revenueCount / totalSuppliers) * 100 : 0,
      marginCount,
      marginCoverage: totalSuppliers > 0 ? (marginCount / totalSuppliers) * 100 : 0,
      industryCount,
      minIndustrySize,
      industryDistribution: industryCounts,
    });
  } catch (error) {
    console.error("Error getting data coverage:", error);
    res.status(500).json({ ok: false, error: String(error) });
  }
};

module.exports = {
  s1Utility: exports.s1Utility,
  s2Sensitivity: exports.s2Sensitivity,
  s3Missingness: exports.s3Missingness,
  s4Ablation: exports.s4Ablation,
  runScenario: exports.runScenario,
  getDataCoverage: exports.getDataCoverage,
};
