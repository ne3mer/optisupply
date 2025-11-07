const db = require("../models");
const { scoreSupplier } = require("../utils/esgScoring");
const scenarioController = require("./scenarioController");

// Helper function to generate CSV from data
function generateCSV(headers, rows) {
  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ];
  return csvLines.join("\n");
}

// Helper function to rank suppliers by ethical score
function rankSuppliers(suppliersWithScores) {
  // Sort by ethical score (descending)
  suppliersWithScores.sort((a, b) => parseFloat(b.ethical_score) - parseFloat(a.ethical_score));
  
  // Add rank
  suppliersWithScores.forEach((supplier, index) => {
    supplier.rank = index + 1;
  });
  
  return suppliersWithScores;
}

// Export suppliers as CSV with rankings
exports.exportSuppliersCSV = async (req, res) => {
  try {
    const settings = await db.ScoringSettings.getDefault();
    const suppliers = await db.Supplier.find({});

    // Calculate scores for all suppliers
    const suppliersWithScores = suppliers.map((supplier) => {
      const scores = scoreSupplier(supplier.toObject(), settings);
      return {
        id: supplier._id.toString(),
        name: supplier.name || "",
        country: supplier.country || "",
        industry: supplier.industry || "",
        environmental_score: scores.environmental_score,
        social_score: scores.social_score,
        governance_score: scores.governance_score,
        composite_score: scores.composite_score,
        risk_penalty: scores.risk_penalty !== null ? scores.risk_penalty : 0,
        finalScore: scores.finalScore ?? scores.ethical_score,
        ethical_score: scores.ethical_score, // Backward compatibility
        risk_factor: scores.risk_factor,
        risk_level: scores.risk_level || "",
        completeness_ratio: scores.completeness_ratio,
      };
    });

    // Rank suppliers
    rankSuppliers(suppliersWithScores);

    // Generate CSV with required columns per Chapter 4
    const headers = [
      "SupplierID",
      "Rank",
      "Name",
      "Industry",
      "Environmental Score",
      "Social Score",
      "Governance Score",
      "Composite Score",
      "Risk Penalty",
      "Final Score",
    ];

    const rows = suppliersWithScores.map((s) => [
      s.id,
      s.rank,
      s.name,
      s.industry,
      Number(s.environmental_score).toFixed(2),
      Number(s.social_score).toFixed(2),
      Number(s.governance_score).toFixed(2),
      Number(s.composite_score).toFixed(2),
      Number(s.risk_penalty).toFixed(2),
      Number(s.finalScore).toFixed(2), // Final Score (post-penalty) - NOT capped at 50
    ]);

    const csv = generateCSV(headers, rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="supplier_rankings_${new Date().toISOString().split("T")[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ error: error.message });
  }
};

// Export rankings CSV with scenario support: GET /exports/rankings?scenario=baseline|s1|s2|s3|s4
exports.exportRankingsCSV = async (req, res) => {
  try {
    const { scenario = "baseline" } = req.query;
    const settings = await db.ScoringSettings.getDefault();
    const suppliers = await db.Supplier.find({});

    let suppliersWithScores;

    if (scenario === "baseline") {
      // Baseline: Use default settings
      suppliersWithScores = suppliers.map((supplier) => {
        const scores = scoreSupplier(supplier.toObject(), settings);
        return {
          id: supplier._id.toString(),
          name: supplier.name || "",
          ethical_score: scores.ethical_score.toFixed(2),
        };
      });
    } else {
      // For S1-S4 scenarios, we need to apply scenario-specific logic
      suppliersWithScores = await Promise.all(
        suppliers.map(async (supplier) => {
          let scores;
          
          if (scenario === "s1") {
            // S1: Utility - Use custom weights if provided in query
            const customWeights = req.query.weights ? JSON.parse(req.query.weights) : {};
            const testSettings = { ...settings.toObject(), ...customWeights };
            scores = scoreSupplier(supplier.toObject(), testSettings);
          } else if (scenario === "s2") {
            // S2: Sensitivity - Use base scores (variations would need specific params)
            scores = scoreSupplier(supplier.toObject(), settings);
          } else if (scenario === "s3") {
            // S3: Missingness - Test with common missing fields
            const modified = { ...supplier.toObject() };
            // Common missing fields test
            modified.transparency_score = null;
            scores = scoreSupplier(modified, settings);
          } else if (scenario === "s4") {
            // S4: Ablation - Test without risk penalty
            const modifiedSettings = { ...settings.toObject() };
            modifiedSettings.riskPenaltyEnabled = false;
            scores = scoreSupplier(supplier.toObject(), modifiedSettings);
          } else {
            // Default to baseline
            scores = scoreSupplier(supplier.toObject(), settings);
          }

          return {
            id: supplier._id.toString(),
            name: supplier.name || "",
            industry: supplier.industry || "Unknown",
            finalScore: scores.finalScore ?? scores.ethical_score,
            ethical_score: scores.ethical_score, // Backward compatibility
          };
        })
      );
    }

    // Sort by finalScore (descending) and add rank
    suppliersWithScores.sort((a, b) => {
      const scoreA = a.finalScore ?? a.ethical_score ?? 0;
      const scoreB = b.finalScore ?? b.ethical_score ?? 0;
      return scoreB - scoreA;
    });
    suppliersWithScores.forEach((supplier, index) => {
      supplier.rank = index + 1;
    });

    // Generate CSV with required columns per Chapter 4: SupplierID, Rank, Industry, Final Score
    const headers = ["SupplierID", "Rank", "Name", "Industry", "Final Score"];
    const rows = suppliersWithScores.map((s) => [
      s.id,
      s.rank,
      s.name,
      s.industry,
      Number(s.finalScore ?? s.ethical_score).toFixed(2), // Final Score (post-penalty) - NOT capped at 50
    ]);

    const csv = generateCSV(headers, rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="rankings_${scenario}_${new Date().toISOString().split("T")[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting rankings CSV:", error);
    res.status(500).json({ error: error.message });
  }
};

// Export industry map CSV: GET /exports/industry-map
exports.exportIndustryMapCSV = async (req, res) => {
  try {
    const suppliers = await db.Supplier.find({}).select("_id name industry");

    // Generate CSV with SupplierID, Industry
    const headers = ["SupplierID", "Name", "Industry"];
    const rows = suppliers.map((s) => [
      s._id.toString(),
      s.name || "",
      s.industry || "Unknown",
    ]);

    const csv = generateCSV(headers, rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="industry_map_${new Date().toISOString().split("T")[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting industry map CSV:", error);
    res.status(500).json({ error: error.message });
  }
};

