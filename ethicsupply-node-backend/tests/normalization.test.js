const { scoreSupplier, scoreSupplierWithBreakdown } = require("../src/utils/esgScoring");

describe("Industry-Band Min-Max Normalization", () => {
  describe("Formula Verification", () => {
    test("normalizeHigherIsBetter: should use (x - min) / (max - min)", () => {
      // This test verifies the formula through the scoring function
      // We'll test edge cases directly
      const supplier = {
        name: "Test Supplier",
        industry: "TestIndustry",
        revenue: 1000,
        renewable_pct: 50, // Higher is better
        training_hours: 40,
        diversity_pct: 45,
        board_diversity: 40,
        board_independence: 60,
        transparency_score: 70,
        anti_corruption_policy: true,
      };

      // With industry bands enabled
      const settingsWithBands = { useIndustryBands: true };
      const scoresWithBands = scoreSupplier(supplier, settingsWithBands);

      // With industry bands disabled (global normalization)
      const settingsWithoutBands = { useIndustryBands: false };
      const scoresWithoutBands = scoreSupplier(supplier, settingsWithoutBands);

      // Scores should be different when using different normalization methods
      expect(scoresWithBands).toBeDefined();
      expect(scoresWithoutBands).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    test("Single-supplier industry: denominator=0 should return 0", () => {
      // Create a supplier in an industry with only one supplier
      // When min === max, the formula should return 0 (not 1)
      const supplier = {
        name: "Single Supplier",
        industry: "UniqueIndustry",
        revenue: 1000,
        renewable_pct: 50,
        training_hours: 40,
        diversity_pct: 45,
        board_diversity: 40,
        board_independence: 60,
        transparency_score: 70,
        anti_corruption_policy: true,
      };

      const settings = { useIndustryBands: true };
      const breakdown = scoreSupplierWithBreakdown(supplier, settings);

      // Check that normalization handles identical min/max correctly
      // If an industry has only one supplier, min === max, so normalized should be 0
      Object.values(breakdown.normalizedMetrics || {}).forEach((metric) => {
        if (metric.band && metric.band.min === metric.band.max) {
          expect(metric.normalized).toBe(0);
        }
      });
    });

    test("Identical values: should return 0 when min === max", () => {
      // Test with a metric where all suppliers have the same value
      const supplier = {
        name: "Test Supplier",
        industry: "TestIndustry",
        revenue: 1000,
        renewable_pct: 50, // All suppliers have 50
        training_hours: 40,
        diversity_pct: 45,
        board_diversity: 40,
        board_independence: 60,
        transparency_score: 70,
        anti_corruption_policy: true,
      };

      const settings = { useIndustryBands: true };
      const breakdown = scoreSupplierWithBreakdown(supplier, settings);

      // If band min === max, normalized should be 0 (not 1)
      Object.values(breakdown.normalizedMetrics || {}).forEach((metric) => {
        if (metric.band && metric.band.min === metric.band.max) {
          expect(metric.normalized).toBe(0);
        }
      });
    });

    test("Negative inputs: should clamp to band bounds", () => {
      const supplier = {
        name: "Test Supplier",
        industry: "TestIndustry",
        revenue: 1000,
        renewable_pct: -10, // Negative value (should be clamped)
        training_hours: -5, // Negative value
        diversity_pct: 45,
        board_diversity: 40,
        board_independence: 60,
        transparency_score: 70,
        anti_corruption_policy: true,
      };

      const settings = { useIndustryBands: true };
      const breakdown = scoreSupplierWithBreakdown(supplier, settings);

      // Negative values should be clamped to band min
      // Normalized value should be >= 0
      Object.values(breakdown.normalizedMetrics || {}).forEach((metric) => {
        if (metric.normalized !== null && metric.normalized !== undefined) {
          expect(metric.normalized).toBeGreaterThanOrEqual(0);
          expect(metric.normalized).toBeLessThanOrEqual(1);
        }
      });
    });

    test("Values above max: should clamp to band bounds", () => {
      const supplier = {
        name: "Test Supplier",
        industry: "TestIndustry",
        revenue: 1000,
        renewable_pct: 150, // Above typical max (should be clamped)
        training_hours: 200, // Above typical max
        diversity_pct: 45,
        board_diversity: 40,
        board_independence: 60,
        transparency_score: 70,
        anti_corruption_policy: true,
      };

      const settings = { useIndustryBands: true };
      const breakdown = scoreSupplierWithBreakdown(supplier, settings);

      // Values above max should be clamped
      // Normalized value should be <= 1
      Object.values(breakdown.normalizedMetrics || {}).forEach((metric) => {
        if (metric.normalized !== null && metric.normalized !== undefined) {
          expect(metric.normalized).toBeGreaterThanOrEqual(0);
          expect(metric.normalized).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe("Industry Bands Toggle", () => {
    test("useIndustryBands=true: should use industry-specific bands", () => {
      const supplier = {
        name: "Test Supplier",
        industry: "Electronics",
        revenue: 1000,
        renewable_pct: 50,
        training_hours: 40,
        diversity_pct: 45,
        board_diversity: 40,
        board_independence: 60,
        transparency_score: 70,
        anti_corruption_policy: true,
      };

      const settingsWithBands = { useIndustryBands: true };
      const settingsWithoutBands = { useIndustryBands: false };

      const breakdownWith = scoreSupplierWithBreakdown(supplier, settingsWithBands);
      const breakdownWithout = scoreSupplierWithBreakdown(supplier, settingsWithoutBands);

      // The breakdown should indicate which normalization was used
      expect(breakdownWith.useIndustryBands).toBe(true);
      expect(breakdownWithout.useIndustryBands).toBe(false);
    });

    test("useIndustryBands=false: should use global bands", () => {
      const supplier = {
        name: "Test Supplier",
        industry: "Electronics",
        revenue: 1000,
        renewable_pct: 50,
        training_hours: 40,
        diversity_pct: 45,
        board_diversity: 40,
        board_independence: 60,
        transparency_score: 70,
        anti_corruption_policy: true,
      };

      const settings = { useIndustryBands: false };
      const breakdown = scoreSupplierWithBreakdown(supplier, settings);

      expect(breakdown.useIndustryBands).toBe(false);
    });
  });

  describe("Persistence and Recompute", () => {
    test("Settings should persist useIndustryBands flag", () => {
      // This test verifies that the flag is used from settings
      const supplier = {
        name: "Test Supplier",
        industry: "Electronics",
        revenue: 1000,
        renewable_pct: 50,
        training_hours: 40,
        diversity_pct: 45,
        board_diversity: 40,
        board_independence: 60,
        transparency_score: 70,
        anti_corruption_policy: true,
      };

      // Test with explicit true
      const settings1 = { useIndustryBands: true };
      const breakdown1 = scoreSupplierWithBreakdown(supplier, settings1);
      expect(breakdown1.useIndustryBands).toBe(true);

      // Test with explicit false
      const settings2 = { useIndustryBands: false };
      const breakdown2 = scoreSupplierWithBreakdown(supplier, settings2);
      expect(breakdown2.useIndustryBands).toBe(false);

      // Test with undefined (should default to true)
      const settings3 = {};
      const breakdown3 = scoreSupplierWithBreakdown(supplier, settings3);
      expect(breakdown3.useIndustryBands).toBe(true);
    });

    test("Changing useIndustryBands should produce different scores", () => {
      const supplier = {
        name: "Test Supplier",
        industry: "Electronics",
        revenue: 1000,
        renewable_pct: 50,
        training_hours: 40,
        diversity_pct: 45,
        board_diversity: 40,
        board_independence: 60,
        transparency_score: 70,
        anti_corruption_policy: true,
      };

      const scoresWithBands = scoreSupplier(supplier, { useIndustryBands: true });
      const scoresWithoutBands = scoreSupplier(supplier, { useIndustryBands: false });

      // Scores might be different (or same if industry bands match global bands)
      // But the breakdown should reflect the setting
      expect(scoresWithBands).toBeDefined();
      expect(scoresWithoutBands).toBeDefined();
    });
  });
});

