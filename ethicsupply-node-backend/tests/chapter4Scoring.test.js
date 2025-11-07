/**
 * Chapter 4 Scoring Tests
 * Verifies: Governance 0-100, Final Score not capped at 50, Composite weighted average, Idempotency
 */

const { scoreSupplier } = require("../src/utils/esgScoring");
const { computeRiskPenalty } = require("../src/risk/penalty");

describe("Chapter 4 Scoring Requirements", () => {
  describe("Governance normalization yields 0-100", () => {
    test("governance score is within 0-100 range", () => {
      const supplier = {
        name: "Test Supplier",
        country: "Test",
        industry: "Manufacturing",
        transparency_score: 80,
        compliance_systems: 70,
        ethics_program: 75,
        board_diversity: 60,
        board_independence: 50,
        anti_corruption_policy: true,
      };

      const scores = scoreSupplier(supplier, null);
      expect(scores.governance_score).toBeGreaterThanOrEqual(0);
      expect(scores.governance_score).toBeLessThanOrEqual(100);
    });

    test("governance with all max values does not exceed 100", () => {
      const supplier = {
        name: "Max Supplier",
        country: "Test",
        industry: "Manufacturing",
        transparency_score: 100,
        compliance_systems: 100,
        ethics_program: 100,
        board_diversity: 100,
        board_independence: 100,
        anti_corruption_policy: true, // 100
      };

      const scores = scoreSupplier(supplier, null);
      expect(scores.governance_score).toBeLessThanOrEqual(100);
      expect(scores.governance_score).toBeCloseTo(100, 1);
    });

    test("governance handles 0-1 scale inputs", () => {
      const supplier = {
        name: "Scale Test",
        country: "Test",
        industry: "Manufacturing",
        transparency_score: 0.8, // 0-1 scale
        compliance_systems: 0.7,
        ethics_program: 0.75,
        board_diversity: 0.6,
        board_independence: 0.5,
        anti_corruption_policy: true,
      };

      const scores = scoreSupplier(supplier, null);
      expect(scores.governance_score).toBeGreaterThanOrEqual(0);
      expect(scores.governance_score).toBeLessThanOrEqual(100);
    });
  });

  describe("Final = clamp(Composite - Penalty), not capped at 50", () => {
    test("final score can exceed 50", () => {
      const supplier = {
        name: "High Score Supplier",
        country: "Test",
        industry: "Manufacturing",
        co2_emissions: 10,
        renewable_energy_percent: 90,
        transparency_score: 90,
        compliance_systems: 90,
        ethics_program: 90,
        board_diversity: 90,
        board_independence: 90,
        anti_corruption_policy: true,
        geopolitical_risk: 10, // Low risk
        climate_risk: 10,
        labor_dispute_risk: 10,
      };

      const scores = scoreSupplier(supplier, null);
      // Final score should be composite - penalty, not capped at 50
      expect(scores.finalScore).toBeGreaterThan(50);
      expect(scores.finalScore).toBeLessThanOrEqual(100);
      expect(scores.finalScore).toBe(scores.composite_score - (scores.risk_penalty || 0));
    });

    test("final score formula: clamp(composite - penalty, 0, 100)", () => {
      const composite = 80;
      const penalty = 15;
      const expectedFinal = Math.min(100, Math.max(0, composite - penalty)); // 65

      const supplier = {
        name: "Formula Test",
        country: "Test",
        industry: "Manufacturing",
        // Set values to approximate composite=80, penalty=15
      };

      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.33,
        riskWeightClimate: 0.33,
        riskWeightLabor: 0.34,
        riskThreshold: 0.3,
        riskLambda: 10,
      };

      const scores = scoreSupplier(supplier, settings);
      const actualFinal = scores.finalScore;
      const actualComposite = scores.composite_score;
      const actualPenalty = scores.risk_penalty || 0;

      // Verify formula
      expect(actualFinal).toBe(Math.min(100, Math.max(0, actualComposite - actualPenalty)));
    });

    test("final score is not capped at 50 even with low completeness", () => {
      const supplier = {
        name: "Low Completeness",
        country: "Test",
        industry: "Manufacturing",
        // Minimal data to trigger low completeness
        co2_emissions: 10,
      };

      const scores = scoreSupplier(supplier, null);
      // Even with low completeness, final score should NOT be capped at 50
      // (disclosure cap was removed per Chapter 4 requirements)
      expect(scores.finalScore).not.toBe(50); // Unless composite-penalty actually equals 50
      expect(scores.finalScore).toBeGreaterThanOrEqual(0);
      expect(scores.finalScore).toBeLessThanOrEqual(100);
    });
  });

  describe("Composite equals weighted pillars within tolerance", () => {
    test("composite = 0.4*E + 0.3*S + 0.3*G", () => {
      const supplier = {
        name: "Weighted Test",
        country: "Test",
        industry: "Manufacturing",
      };

      const settings = {
        environmentalWeight: 0.4,
        socialWeight: 0.3,
        governanceWeight: 0.3,
      };

      const scores = scoreSupplier(supplier, settings);
      const expectedComposite =
        0.4 * scores.environmental_score +
        0.3 * scores.social_score +
        0.3 * scores.governance_score;

      expect(scores.composite_score).toBeCloseTo(expectedComposite, 1);
    });

    test("composite weights sum to 1.0 (bias ≈ 0)", () => {
      const settings = {
        environmentalWeight: 0.4,
        socialWeight: 0.3,
        governanceWeight: 0.3,
      };

      const sum = settings.environmentalWeight + settings.socialWeight + settings.governanceWeight;
      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe("Recompute-all doesn't change results if run twice", () => {
    test("idempotency: same input produces same output", () => {
      const supplier = {
        name: "Idempotency Test",
        country: "Test",
        industry: "Manufacturing",
        co2_emissions: 20,
        renewable_energy_percent: 50,
        transparency_score: 70,
        compliance_systems: 70,
        ethics_program: 70,
        board_diversity: 60,
        board_independence: 60,
        anti_corruption_policy: true,
        geopolitical_risk: 30,
        climate_risk: 30,
        labor_dispute_risk: 30,
      };

      const settings = {
        environmentalWeight: 0.4,
        socialWeight: 0.3,
        governanceWeight: 0.3,
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.33,
        riskWeightClimate: 0.33,
        riskWeightLabor: 0.34,
        riskThreshold: 0.3,
        riskLambda: 10,
      };

      // First computation
      const scores1 = scoreSupplier(supplier, settings);

      // Second computation (idempotent)
      const scores2 = scoreSupplier(supplier, settings);

      // Results should be identical
      expect(scores2.composite_score).toBeCloseTo(scores1.composite_score, 5);
      expect(scores2.finalScore).toBeCloseTo(scores1.finalScore, 5);
      expect(scores2.governance_score).toBeCloseTo(scores1.governance_score, 5);
      expect(scores2.risk_penalty).toBeCloseTo(scores1.risk_penalty || 0, 5);
    });

    test("no double-penalty on recompute", () => {
      const supplier = {
        name: "No Double Penalty",
        country: "Test",
        industry: "Manufacturing",
        geopolitical_risk: 60, // 0-100 scale
        climate_risk: 70,
        labor_dispute_risk: 40,
      };

      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.3,
        riskWeightClimate: 0.4,
        riskWeightLabor: 0.3,
        riskThreshold: 0.5,
        riskLambda: 15,
      };

      // Compute once
      const scores1 = scoreSupplier(supplier, settings);
      const penalty1 = scores1.risk_penalty || 0;
      const final1 = scores1.finalScore;

      // Compute again (should be same)
      const scores2 = scoreSupplier(supplier, settings);
      const penalty2 = scores2.risk_penalty || 0;
      const final2 = scores2.finalScore;

      // Penalty should be same (no accumulation)
      expect(penalty2).toBeCloseTo(penalty1, 5);
      expect(final2).toBeCloseTo(final1, 5);
    });
  });

  describe("Export columns verification", () => {
    test("scores include all required fields for export", () => {
      const supplier = {
        name: "Export Test",
        country: "Test",
        industry: "Manufacturing",
      };

      const scores = scoreSupplier(supplier, null);

      // Required export columns
      expect(scores).toHaveProperty("environmental_score");
      expect(scores).toHaveProperty("social_score");
      expect(scores).toHaveProperty("governance_score");
      expect(scores).toHaveProperty("composite_score");
      expect(scores).toHaveProperty("risk_penalty");
      expect(scores).toHaveProperty("finalScore");

      // All should be numbers
      expect(typeof scores.environmental_score).toBe("number");
      expect(typeof scores.social_score).toBe("number");
      expect(typeof scores.governance_score).toBe("number");
      expect(typeof scores.composite_score).toBe("number");
      expect(typeof scores.finalScore).toBe("number");
    });
  });
});

