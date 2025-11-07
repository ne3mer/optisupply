const db = require("../models");
const { scoreSupplier } = require("../utils/esgScoring");

// Export suppliers as CSV with rankings
exports.exportSuppliersCSV = async (req, res) => {
  try {
    const settings = await db.ScoringSettings.getDefault();
    const suppliers = await db.Supplier.find({});

    // Calculate scores for all suppliers
    const suppliersWithScores = suppliers.map((supplier) => {
      const scores = scoreSupplier(supplier.toObject(), settings);
      return {
        id: supplier._id,
        name: supplier.name || "",
        country: supplier.country || "",
        industry: supplier.industry || "",
        environmental_score: scores.environmental_score.toFixed(2),
        social_score: scores.social_score.toFixed(2),
        governance_score: scores.governance_score.toFixed(2),
        composite_score: scores.composite_score.toFixed(2),
        ethical_score: scores.ethical_score.toFixed(2),
        risk_factor: scores.risk_factor.toFixed(3),
        risk_level: scores.risk_level || "",
        completeness_ratio: scores.completeness_ratio.toFixed(3),
      };
    });

    // Sort by ethical score (descending)
    suppliersWithScores.sort((a, b) => parseFloat(b.ethical_score) - parseFloat(a.ethical_score));

    // Add rank
    suppliersWithScores.forEach((supplier, index) => {
      supplier.rank = index + 1;
    });

    // Generate CSV
    const headers = [
      "Rank",
      "Name",
      "Country",
      "Industry",
      "Environmental Score",
      "Social Score",
      "Governance Score",
      "Composite Score",
      "Ethical Score",
      "Risk Factor",
      "Risk Level",
      "Completeness Ratio",
    ];

    const rows = suppliersWithScores.map((s) => [
      s.rank,
      s.name,
      s.country,
      s.industry,
      s.environmental_score,
      s.social_score,
      s.governance_score,
      s.composite_score,
      s.ethical_score,
      s.risk_factor,
      s.risk_level,
      s.completeness_ratio,
    ]);

    const csvLines = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ];

    const csv = csvLines.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="supplier_rankings_${new Date().toISOString().split("T")[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ error: error.message });
  }
};

