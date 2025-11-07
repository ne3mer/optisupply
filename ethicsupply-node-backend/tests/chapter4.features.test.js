const { scoreSupplier, scoreSupplierWithBreakdown } = require("../src/utils/esgScoring");

describe("Chapter 4 Evaluation Features", () => {
  const mockSupplier = {
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
    climate_risk: 0.3,
    geopolitical_risk: 0.2,
    labor_dispute_risk: 0.25,
  };

  describe("1. Industry-Band Normalization Toggle", () => {
    test("should use industry bands when useIndustryBands is true", () => {
      const settings = { useIndustryBands: true };
      const scores = scoreSupplier(mockSupplier, settings);
      expect(scores).toHaveProperty("ethical_score");
      expect(typeof scores.ethical_score).toBe("number");
    });

    test("should use global bands when useIndustryBands is false", () => {
      const settings = { useIndustryBands: false };
      const scores = scoreSupplier(mockSupplier, settings);
      expect(scores).toHaveProperty("ethical_score");
      expect(typeof scores.ethical_score).toBe("number");
    });

    test("should persist normalization setting in breakdown", () => {
      const settings = { useIndustryBands: false };
      const breakdown = scoreSupplierWithBreakdown(mockSupplier, settings);
      expect(breakdown.useIndustryBands).toBe(false);
    });
  });

  describe("2. Configurable Composite ESG Weights", () => {
    test("should use custom E, S, G weights", () => {
      const settings = {
        environmentalWeight: 0.5,
        socialWeight: 0.3,
        governanceWeight: 0.2,
      };
      const scores = scoreSupplier(mockSupplier, settings);
      expect(scores).toHaveProperty("composite_score");
      expect(typeof scores.composite_score).toBe("number");
    });

    test("should use default weights when not provided", () => {
      const scores = scoreSupplier(mockSupplier, null);
      expect(scores).toHaveProperty("composite_score");
      expect(scores.composite_score).toBeGreaterThan(0);
    });

    test("should include weights in breakdown", () => {
      const settings = {
        environmentalWeight: 0.5,
        socialWeight: 0.3,
        governanceWeight: 0.2,
      };
      const breakdown = scoreSupplierWithBreakdown(mockSupplier, settings);
      expect(breakdown.weights.composite).toEqual({
        environmental: 0.5,
        social: 0.3,
        governance: 0.2,
      });
    });
  });

  describe("3. Risk Penalty", () => {
    test("should always return numeric risk_factor (never N/A)", () => {
      const scores = scoreSupplier(mockSupplier, null);
      expect(typeof scores.risk_factor).toBe("number");
      expect(scores.risk_factor).toBeGreaterThanOrEqual(0);
      expect(scores.risk_factor).toBeLessThanOrEqual(1);
    });

    test("should use default risk factor when risks are missing", () => {
      const supplierNoRisks = { ...mockSupplier };
      delete supplierNoRisks.climate_risk;
      delete supplierNoRisks.geopolitical_risk;
      delete supplierNoRisks.labor_dispute_risk;

      const settings = { defaultRiskFactor: 0.2 };
      const scores = scoreSupplier(supplierNoRisks, settings);
      expect(scores.risk_factor).toBe(0.2);
    });

    test("should disable risk penalty when riskPenaltyEnabled is false", () => {
      const settings = { riskPenaltyEnabled: false };
      const scores = scoreSupplier(mockSupplier, settings);
      expect(scores.risk_factor).toBe(0);
    });

    test("should apply risk penalty when enabled", () => {
      const settings = { riskPenaltyEnabled: true };
      const scores = scoreSupplier(mockSupplier, settings);
      expect(scores.risk_factor).toBeGreaterThan(0);
      expect(scores.ethical_score).toBeLessThan(scores.composite_score);
    });
  });

  describe("4. Transparency Calculation Trace", () => {
    test("should generate full breakdown with raw values", () => {
      const breakdown = scoreSupplierWithBreakdown(mockSupplier, null);
      expect(breakdown).toHaveProperty("normalizedMetrics");
      expect(breakdown.normalizedMetrics).toBeDefined();
      
      // Check that normalized metrics include raw values
      const firstMetric = Object.values(breakdown.normalizedMetrics)[0];
      expect(firstMetric).toHaveProperty("value");
      expect(firstMetric).toHaveProperty("normalized");
      expect(firstMetric).toHaveProperty("imputed");
    });

    test("should include band information in breakdown", () => {
      const breakdown = scoreSupplierWithBreakdown(mockSupplier, null);
      const firstMetric = Object.values(breakdown.normalizedMetrics)[0];
      expect(firstMetric).toHaveProperty("band");
      if (firstMetric.band) {
        expect(firstMetric.band).toHaveProperty("min");
        expect(firstMetric.band).toHaveProperty("max");
      }
    });

    test("should show calculation flow: raw → normalized → weighted → final", () => {
      const breakdown = scoreSupplierWithBreakdown(mockSupplier, null);
      
      // Raw values exist
      expect(breakdown.normalizedMetrics).toBeDefined();
      
      // Normalized values exist
      const firstMetric = Object.values(breakdown.normalizedMetrics)[0];
      expect(firstMetric.normalized).toBeDefined();
      
      // Pillar scores exist (weighted)
      expect(breakdown.pillarScores).toBeDefined();
      expect(breakdown.pillarScores.environmental).toBeDefined();
      
      // Composite exists
      expect(breakdown.composite).toBeDefined();
      
      // Final score exists
      expect(breakdown.ethical_score).toBeDefined();
    });
  });

  describe("5. Configurable Metric Weights", () => {
    test("should use custom environmental metric weights", () => {
      const settings = {
        emissionIntensityWeight: 0.5,
        renewableShareWeight: 0.3,
        waterIntensityWeight: 0.1,
        wasteIntensityWeight: 0.1,
      };
      const scores = scoreSupplier(mockSupplier, settings);
      expect(scores.environmental_score).toBeDefined();
      expect(typeof scores.environmental_score).toBe("number");
    });

    test("should use custom social metric weights", () => {
      const settings = {
        injuryRateWeight: 0.4,
        trainingHoursWeight: 0.3,
        wageRatioWeight: 0.2,
        diversityWeight: 0.1,
      };
      const scores = scoreSupplier(mockSupplier, settings);
      expect(scores.social_score).toBeDefined();
      expect(typeof scores.social_score).toBe("number");
    });

    test("should use custom governance metric weights", () => {
      const settings = {
        boardDiversityWeight: 0.3,
        boardIndependenceWeight: 0.3,
        antiCorruptionWeight: 0.2,
        transparencyWeight: 0.2,
      };
      const scores = scoreSupplier(mockSupplier, settings);
      expect(scores.governance_score).toBeDefined();
      expect(typeof scores.governance_score).toBe("number");
    });
  });

  describe("6. Edge Cases", () => {
    test("should handle missing supplier data gracefully", () => {
      const minimalSupplier = {
        name: "Minimal Supplier",
        industry: "Unknown",
      };
      const scores = scoreSupplier(minimalSupplier, null);
      expect(scores).toHaveProperty("ethical_score");
      expect(typeof scores.ethical_score).toBe("number");
      expect(scores.completeness_ratio).toBeDefined();
    });

    test("should handle null/undefined values", () => {
      const supplierWithNulls = {
        ...mockSupplier,
        total_emissions: null,
        renewable_energy_percent: null,
      };
      const scores = scoreSupplier(supplierWithNulls, null);
      expect(scores).toHaveProperty("ethical_score");
      expect(typeof scores.ethical_score).toBe("number");
    });

    test("should cap score at 50 when completeness < 70%", () => {
      const incompleteSupplier = {
        name: "Incomplete",
        industry: "Unknown",
        // Minimal data
      };
      const scores = scoreSupplier(incompleteSupplier, null);
      if (scores.completeness_ratio < 0.7) {
        expect(scores.ethical_score).toBeLessThanOrEqual(50);
      }
    });
  });
});

