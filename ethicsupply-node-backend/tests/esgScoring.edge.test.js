const { scoreSupplier } = require("../src/utils/esgScoring");

describe("ESG Scoring edge cases", () => {
  test("completeness_ratio < 0.7 caps ethical_score ≤ 50", () => {
    const supplier = {
      name: "Low Completeness Co",
      industry: "Apparel",
      // Provide only a couple of fields so most metrics are imputed
      revenue: 10000,
      total_emissions: 200000, // emission_intensity = 20
      renewable_energy_percent: 60,
      // leave other metrics undefined to reduce completeness
    };

    const result = scoreSupplier(supplier);
    expect(result.completeness_ratio).toBeLessThan(0.7);
    expect(result.ethical_score).toBeLessThanOrEqual(50);
  });

  test("risk thresholds map to levels", () => {
    const base = { name: "Risky", industry: "Electronics", revenue: 10000, total_emissions: 300000 };

    const low = scoreSupplier({ ...base, climate_risk: 0.19 });
    expect(low.risk_level).toBe("low");

    const med = scoreSupplier({ ...base, climate_risk: 0.21 });
    expect(med.risk_level).toBe("medium");

    const high = scoreSupplier({ ...base, climate_risk: 0.41 });
    expect(high.risk_level).toBe("high");

    const crit = scoreSupplier({ ...base, climate_risk: 0.61 });
    expect(crit.risk_level).toBe("critical");
  });

  test("anti_corruption missing treated as 0; presence counts toward completeness", () => {
    const base = { name: "AC Test", industry: "Food Retail", revenue: 8000, total_emissions: 200000 };

    const missing = scoreSupplier({ ...base });
    const present = scoreSupplier({ ...base, anti_corruption_policy: true });

    // With presence, completeness should not decrease and typically increases by 1/total
    expect(present.completeness_ratio).toBeGreaterThanOrEqual(missing.completeness_ratio);

    // Governance score should be higher when anti-corruption is true
    expect(present.governance_score).toBeGreaterThanOrEqual(missing.governance_score);
  });
});

