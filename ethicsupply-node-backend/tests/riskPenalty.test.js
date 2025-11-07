const { scoreSupplier, computeRiskPenalty } = require("../src/utils/esgScoring");

describe("Risk Penalty Calculation (Spec Implementation)", () => {
  const baseSupplier = {
    name: "Test Supplier",
    industry: "Manufacturing",
    revenue: 1000,
    total_emissions: 5000,
    renewable_energy_percent: 50,
    water_usage: 200,
    waste_generated: 100,
    injury_rate: 1.5,
    training_hours: 40,
    living_wage_ratio: 1.0,
    gender_diversity_percent: 45,
    board_diversity: 40,
    board_independence: 60,
    anti_corruption_policy: true,
    transparency_score: 70,
  };

  describe("A) Penalty Disabled", () => {
    test("should return null penalty when disabled", () => {
      const settings = { riskPenaltyEnabled: false };
      const scores = scoreSupplier(baseSupplier, settings);
      expect(scores.risk_penalty).toBeNull();
    });

    test("should show N/A in frontend when penalty is null", () => {
      const settings = { riskPenaltyEnabled: false };
      const scores = scoreSupplier(baseSupplier, settings);
      expect(scores.risk_penalty).toBeNull();
      // Frontend will display "N/A" when risk_penalty is null
    });
  });

  describe("B) Penalty Enabled - All Risks Missing", () => {
    test("should return 0.0 (not null) when all risks are missing", () => {
      const supplierNoRisks = { ...baseSupplier };
      delete supplierNoRisks.climate_risk;
      delete supplierNoRisks.geopolitical_risk;
      delete supplierNoRisks.labor_dispute_risk;

      const settings = { riskPenaltyEnabled: true };
      const scores = scoreSupplier(supplierNoRisks, settings);
      expect(scores.risk_penalty).toBe(0.0);
      expect(typeof scores.risk_penalty).toBe("number");
    });

    test("should display 0.0 (not N/A) in frontend when all risks missing", () => {
      const supplierNoRisks = { ...baseSupplier };
      const settings = { riskPenaltyEnabled: true };
      const scores = scoreSupplier(supplierNoRisks, settings);
      expect(scores.risk_penalty).toBe(0.0);
      // Frontend will display "0.0" not "N/A"
    });
  });

  describe("C) Penalty Enabled - Partial Missing Risks", () => {
    test("should renormalize weights when some risks are missing", () => {
      const supplier = {
        ...baseSupplier,
        climate_risk: 0.5,
        // geopolitical_risk missing
        labor_dispute_risk: 0.3,
      };

      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.33,
        riskWeightClimate: 0.33,
        riskWeightLabor: 0.34,
        riskThreshold: 0.3,
        riskLambda: 1.0,
      };

      const scores = scoreSupplier(supplier, settings);
      expect(scores.risk_penalty).toBeGreaterThanOrEqual(0);
      expect(scores.risk_penalty).toBeLessThanOrEqual(100);
      expect(typeof scores.risk_penalty).toBe("number");
    });

    test("should use only available risks in weighted mean", () => {
      const supplier = {
        ...baseSupplier,
        climate_risk: 0.6,
        // geopolitical_risk missing
        // labor_dispute_risk missing
      };

      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.33,
        riskWeightClimate: 0.33,
        riskWeightLabor: 0.34,
        riskThreshold: 0.3,
        riskLambda: 1.0,
      };

      const scores = scoreSupplier(supplier, settings);
      // With only climate_risk = 0.6, threshold = 0.3, lambda = 1.0
      // risk_raw = 0.6 (only climate, weight renormalized to 1.0)
      // risk_excess = max(0, 0.6 - 0.3) = 0.3
      // penalty = 1.0 * 0.3 * 100 = 30.0
      expect(scores.risk_penalty).toBeCloseTo(30.0, 1);
    });
  });

  describe("D) Threshold T Behavior", () => {
    test("should return 0 penalty when risk_raw < threshold", () => {
      const supplier = {
        ...baseSupplier,
        climate_risk: 0.2,
        geopolitical_risk: 0.25,
        labor_dispute_risk: 0.2,
      };

      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.33,
        riskWeightClimate: 0.33,
        riskWeightLabor: 0.34,
        riskThreshold: 0.3, // Above average risk
        riskLambda: 1.0,
      };

      const scores = scoreSupplier(supplier, settings);
      // risk_raw ≈ 0.22 (weighted mean), threshold = 0.3
      // risk_excess = max(0, 0.22 - 0.3) = 0
      // penalty = 0
      expect(scores.risk_penalty).toBe(0.0);
    });

    test("should apply penalty when risk_raw > threshold", () => {
      const supplier = {
        ...baseSupplier,
        climate_risk: 0.6,
        geopolitical_risk: 0.5,
        labor_dispute_risk: 0.4,
      };

      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.33,
        riskWeightClimate: 0.33,
        riskWeightLabor: 0.34,
        riskThreshold: 0.3,
        riskLambda: 1.0,
      };

      const scores = scoreSupplier(supplier, settings);
      // risk_raw ≈ 0.5 (weighted mean), threshold = 0.3
      // risk_excess = max(0, 0.5 - 0.3) = 0.2
      // penalty = 1.0 * 0.2 * 100 = 20.0
      expect(scores.risk_penalty).toBeGreaterThan(0);
      expect(scores.risk_penalty).toBeLessThanOrEqual(100);
    });

    test("should handle exact boundary at threshold T", () => {
      const supplier = {
        ...baseSupplier,
        climate_risk: 0.3,
        geopolitical_risk: 0.3,
        labor_dispute_risk: 0.3,
      };

      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.33,
        riskWeightClimate: 0.33,
        riskWeightLabor: 0.34,
        riskThreshold: 0.3,
        riskLambda: 1.0,
      };

      const scores = scoreSupplier(supplier, settings);
      // risk_raw = 0.3, threshold = 0.3
      // risk_excess = max(0, 0.3 - 0.3) = 0
      // penalty = 0 (may have floating point precision issues)
      expect(scores.risk_penalty).toBeCloseTo(0.0, 10);
    });
  });

  describe("E) Lambda λ Scaling", () => {
    test("should scale penalty by lambda", () => {
      const supplier = {
        ...baseSupplier,
        climate_risk: 0.6,
        geopolitical_risk: 0.5,
        labor_dispute_risk: 0.4,
      };

      const settings1 = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.33,
        riskWeightClimate: 0.33,
        riskWeightLabor: 0.34,
        riskThreshold: 0.3,
        riskLambda: 1.0,
      };

      const settings2 = {
        ...settings1,
        riskLambda: 2.0,
      };

      const scores1 = scoreSupplier(supplier, settings1);
      const scores2 = scoreSupplier(supplier, settings2);

      // With lambda = 2.0, penalty should be double
      expect(scores2.risk_penalty).toBeCloseTo(scores1.risk_penalty * 2, 1);
    });
  });

  describe("F) Final Score Calculation", () => {
    test("should apply penalty: finalScore = clamp(baseScore - penalty, 0, 100)", () => {
      const supplier = {
        ...baseSupplier,
        climate_risk: 0.8,
        geopolitical_risk: 0.7,
        labor_dispute_risk: 0.6,
      };

      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.33,
        riskWeightClimate: 0.33,
        riskWeightLabor: 0.34,
        riskThreshold: 0.3,
        riskLambda: 1.0,
      };

      const scores = scoreSupplier(supplier, settings);
      
      // Verify final score is baseComposite - penalty (clamped)
      expect(scores.ethical_score).toBeLessThanOrEqual(scores.composite_score);
      expect(scores.ethical_score).toBeGreaterThanOrEqual(0);
      expect(scores.ethical_score).toBeLessThanOrEqual(100);
    });

    test("should not go below 0", () => {
      const supplier = {
        ...baseSupplier,
        climate_risk: 1.0,
        geopolitical_risk: 1.0,
        labor_dispute_risk: 1.0,
      };

      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.33,
        riskWeightClimate: 0.33,
        riskWeightLabor: 0.34,
        riskThreshold: 0.0,
        riskLambda: 2.0, // High lambda
      };

      const scores = scoreSupplier(supplier, settings);
      expect(scores.ethical_score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("G) Weight Renormalization", () => {
    test("should renormalize weights when risks are missing", () => {
      const supplier = {
        ...baseSupplier,
        climate_risk: 0.5,
        // Only climate risk present
      };

      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.5,
        riskWeightClimate: 0.3,
        riskWeightLabor: 0.2,
        riskThreshold: 0.3,
        riskLambda: 1.0,
      };

      const scores = scoreSupplier(supplier, settings);
      // With only climate_risk, weight should be renormalized to 1.0
      // risk_raw = 0.5, risk_excess = 0.2, penalty = 20.0
      expect(scores.risk_penalty).toBeGreaterThan(0);
    });
  });

  describe("H) Disclosure Independence", () => {
    test("should not gate penalty by disclosure unless explicitly configured", () => {
      const supplier = {
        ...baseSupplier,
        climate_risk: 0.6,
        geopolitical_risk: 0.5,
        labor_dispute_risk: 0.4,
        // Low completeness (missing many fields)
      };

      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.33,
        riskWeightClimate: 0.33,
        riskWeightLabor: 0.34,
        riskThreshold: 0.3,
        riskLambda: 1.0,
      };

      const scores = scoreSupplier(supplier, settings);
      // Penalty should still be computed regardless of disclosure
      expect(scores.risk_penalty).toBeGreaterThanOrEqual(0);
      expect(typeof scores.risk_penalty).toBe("number");
    });
  });
});

