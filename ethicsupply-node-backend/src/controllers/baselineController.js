const db = require("../models");

/**
 * Compute Emission Intensity = emissions / revenue_musd
 * Matches ScenarioRunner logic: prefers emissions_tco2e, falls back to co2_tons or co2_emissions or total_emissions
 * Returns null if either value is missing, zero, or invalid
 */
function computeEI(supplier) {
  const toNum = (v) =>
    v === null || v === undefined || v === "" ? null : Number(v);

  // Prefer emissions_tco2e; fallback to co2_tons or co2_emissions or total_emissions
  const em =
    toNum(supplier.emissions_tco2e) ??
    toNum(supplier.co2_tons) ??
    toNum(supplier.co2_emissions) ??
    toNum(supplier.total_emissions);
  const rev = toNum(supplier.revenue_musd) ?? toNum(supplier.revenue);

  if (!em || !rev || rev <= 0) return null;
  return em / rev; // tCO2e per MUSD
}

/**
 * GET /api/scenarios/baseline
 * Returns baseline mean Emission Intensity and supplier count
 * Query param ?format=csv returns CSV export
 */
async function getBaseline(req, res) {
  try {
    const suppliers = await db.Supplier.find(
      {},
      {
        _id: 1,
        SupplierID: 1,
        name: 1,
        industry: 1,
        revenue_musd: 1,
        revenue: 1,
        emissions_tco2e: 1,
        co2_tons: 1,
        co2_emissions: 1,
        total_emissions: 1,
      }
    ).lean();

    const rows = [];

    for (const s of suppliers) {
      const ei = computeEI(s);

      if (ei != null) {
        // Get the actual emissions value used for display
        const toNum = (v) =>
          v === null || v === undefined || v === "" ? null : Number(v);
        const em =
          toNum(s.emissions_tco2e) ??
          toNum(s.co2_tons) ??
          toNum(s.co2_emissions) ??
          toNum(s.total_emissions);
        const rev = toNum(s.revenue_musd) ?? toNum(s.revenue);

        rows.push({
          SupplierID: s.SupplierID ?? s._id?.toString() ?? "",
          Name: s.name ?? "",
          Industry: s.industry ?? "",
          "Revenue(MUSD)": rev.toFixed(2),
          "Emissions(tCO2e)": em.toFixed(2),
          "Emission Intensity": ei.toFixed(6),
        });
      }
    }

    const n = rows.length;
    const meanEI =
      n > 0
        ? rows.reduce((a, r) => a + Number(r["Emission Intensity"]), 0) / n
        : null;

      // CSV format requested
      if ((req.query.format || "").toLowerCase() === "csv") {
        if (rows.length === 0) {
          return res
            .status(200)
            .send(
              "SupplierID,Name,Industry,Revenue(MUSD),Emissions(tCO2e),Emission Intensity\n"
            );
        }

        // Generate CSV manually (no external dependency needed)
        const headers = Object.keys(rows[0]);
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
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="baseline.csv"'
        );

        if (meanEI != null) {
          res.setHeader("X-Baseline-Objective", meanEI.toFixed(6));
        }

        return res.status(200).send(csv);
      }

    // JSON format (default)
    return res.json({
      meanEI: meanEI != null ? Number(meanEI.toFixed(6)) : null,
      nSuppliers: n,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getBaseline:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getBaseline };
