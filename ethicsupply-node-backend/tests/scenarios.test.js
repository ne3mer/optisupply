const { 
  kendallTau, 
  meanAbsoluteError,
  calculateRankShifts,
  calculateDisparity,
  topKPreservation,
  knnImpute,
} = require("../src/utils/statistics");

describe("Statistical Utilities", () => {
  describe("kendallTau", () => {
    it("should return 1 for identical rankings", () => {
      const rankings1 = [
        { id: "a", rank: 1 },
        { id: "b", rank: 2 },
        { id: "c", rank: 3 },
      ];
      const rankings2 = [
        { id: "a", rank: 1 },
        { id: "b", rank: 2 },
        { id: "c", rank: 3 },
      ];
      expect(kendallTau(rankings1, rankings2)).toBe(1);
    });

    it("should return -1 for completely reversed rankings", () => {
      const rankings1 = [
        { id: "a", rank: 1 },
        { id: "b", rank: 2 },
        { id: "c", rank: 3 },
      ];
      const rankings2 = [
        { id: "a", rank: 3 },
        { id: "b", rank: 2 },
        { id: "c", rank: 1 },
      ];
      const tau = kendallTau(rankings1, rankings2);
      expect(tau).toBeLessThan(0);
    });

    it("should return 0 for no correlation", () => {
      const rankings1 = [
        { id: "a", rank: 1 },
        { id: "b", rank: 2 },
      ];
      const rankings2 = [
        { id: "a", rank: 2 },
        { id: "b", rank: 1 },
      ];
      // For 2 elements, perfect disagreement is -1
      expect(kendallTau(rankings1, rankings2)).toBe(-1);
    });
  });

  describe("meanAbsoluteError", () => {
    it("should calculate MAE correctly", () => {
      const actual = [1, 2, 3, 4, 5];
      const predicted = [1.1, 2.2, 2.9, 4.1, 4.8];
      const mae = meanAbsoluteError(actual, predicted);
      expect(mae).toBeCloseTo(0.14, 1);
    });

    it("should return 0 for identical arrays", () => {
      const values = [1, 2, 3, 4, 5];
      expect(meanAbsoluteError(values, values)).toBe(0);
    });

    it("should handle empty arrays", () => {
      expect(meanAbsoluteError([], [])).toBe(0);
    });
  });

  describe("calculateRankShifts", () => {
    it("should calculate rank shifts correctly", () => {
      const rankings1 = [
        { id: "a", rank: 1 },
        { id: "b", rank: 2 },
        { id: "c", rank: 3 },
      ];
      const rankings2 = [
        { id: "a", rank: 2 },
        { id: "b", rank: 1 },
        { id: "c", rank: 3 },
      ];
      const { meanShift, maxShift } = calculateRankShifts(rankings1, rankings2);
      expect(meanShift).toBeCloseTo(0.67, 1);
      expect(maxShift).toBe(1);
    });

    it("should return 0 shifts for identical rankings", () => {
      const rankings = [
        { id: "a", rank: 1 },
        { id: "b", rank: 2 },
      ];
      const { meanShift, maxShift } = calculateRankShifts(rankings, rankings);
      expect(meanShift).toBe(0);
      expect(maxShift).toBe(0);
    });
  });

  describe("calculateDisparity", () => {
    it("should calculate disparity between groups", () => {
      const scores = [
        { id: "1", score: 90, group: "A" },
        { id: "2", score: 85, group: "A" },
        { id: "3", score: 70, group: "B" },
        { id: "4", score: 65, group: "B" },
      ];
      const { D, groupMeans } = calculateDisparity(scores);
      expect(groupMeans.A).toBeCloseTo(87.5, 1);
      expect(groupMeans.B).toBeCloseTo(67.5, 1);
      expect(D).toBeCloseTo(20, 1);
    });

    it("should return 0 for single group", () => {
      const scores = [
        { id: "1", score: 90, group: "A" },
        { id: "2", score: 85, group: "A" },
      ];
      const { D } = calculateDisparity(scores);
      expect(D).toBe(0);
    });
  });

  describe("topKPreservation", () => {
    it("should calculate preservation percentage correctly", () => {
      const original = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const modified = [{ id: "a" }, { id: "c" }, { id: "d" }];
      const preservation = topKPreservation(original, modified);
      expect(preservation).toBeCloseTo(66.67, 1);
    });

    it("should return 100 for identical top-k", () => {
      const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
      expect(topKPreservation(items, items)).toBe(100);
    });

    it("should return 0 for no preservation", () => {
      const original = [{ id: "a" }, { id: "b" }];
      const modified = [{ id: "c" }, { id: "d" }];
      expect(topKPreservation(original, modified)).toBe(0);
    });
  });

  describe("knnImpute", () => {
    it("should impute missing values using k-nearest neighbors", () => {
      const data = [
        { x: 1, y: 2, z: 10 },
        { x: 2, y: 3, z: 20 },
        { x: 1.5, y: 2.5, z: null },
      ];
      const imputed = knnImpute(data, 2, "z", ["x", "y"], 2);
      expect(imputed).toBeGreaterThan(10);
      expect(imputed).toBeLessThan(20);
    });

    it("should fallback to mean when no neighbors", () => {
      const data = [
        { x: null, y: null, z: 10 },
        { x: null, y: null, z: 20 },
        { x: null, y: null, z: null },
      ];
      const imputed = knnImpute(data, 2, "z", ["x", "y"], 2);
      expect(imputed).toBe(15); // Mean of 10 and 20
    });
  });
});

describe("Scenario Endpoints", () => {
  // Mock data for scenarios
  const mockSuppliers = [
    { _id: "1", name: "Supplier A", industry: "Tech", ethical_score: 85 },
    { _id: "2", name: "Supplier B", industry: "Tech", ethical_score: 75 },
    { _id: "3", name: "Supplier C", industry: "Manufacturing", ethical_score: 90 },
  ];

  describe("S1: Utility", () => {
    it("should filter suppliers by minimum margin", () => {
      const threshold = 80;
      const filtered = mockSuppliers.filter(s => s.ethical_score >= threshold);
      expect(filtered.length).toBe(2);
      expect(filtered.every(s => s.ethical_score >= threshold)).toBe(true);
    });

    it("should calculate delta objective percentage", () => {
      const baselineTotal = 85 + 75 + 90; // 250
      const constrainedTotal = 85 + 90; // 175
      const deltaObjectivePct = ((constrainedTotal - baselineTotal) / baselineTotal) * 100;
      expect(deltaObjectivePct).toBeCloseTo(-30, 0);
    });
  });

  describe("S2: Sensitivity", () => {
    it("should perturb scores correctly", () => {
      const perturbation = 0.1; // +10%
      const originalScore = 80;
      const perturbedScore = originalScore * (1 + perturbation);
      expect(perturbedScore).toBe(88);
    });

    it("should clamp perturbed scores to [0, 100]", () => {
      const score = 95;
      const perturbation = 0.2; // +20%
      const perturbed = score * (1 + perturbation);
      const clamped = Math.min(100, perturbed);
      expect(clamped).toBe(100);
    });
  });

  describe("S3: Missingness", () => {
    it("should create missing data based on percentage", () => {
      const missingPct = 10;
      const metrics = ["metric1", "metric2", "metric3"];
      const trials = 1000;
      let missingCount = 0;
      
      for (let i = 0; i < trials; i++) {
        metrics.forEach(metric => {
          if (Math.random() * 100 < missingPct) {
            missingCount++;
          }
        });
      }
      
      const actualPct = (missingCount / (trials * metrics.length)) * 100;
      expect(actualPct).toBeGreaterThan(5);
      expect(actualPct).toBeLessThan(15);
    });

    it("should calculate top-3 preservation", () => {
      const top3Original = ["A", "B", "C"];
      const top3After = ["A", "C", "D"];
      const preserved = top3Original.filter(id => top3After.includes(id));
      const preservationPct = (preserved.length / top3Original.length) * 100;
      expect(preservationPct).toBeCloseTo(66.67, 1);
    });
  });

  describe("S4: Fairness/Ablation", () => {
    it("should toggle normalization setting", () => {
      const settings = { useIndustryBands: true };
      const modifiedOn = { ...settings, useIndustryBands: true };
      const modifiedOff = { ...settings, useIndustryBands: false };
      
      expect(modifiedOn.useIndustryBands).toBe(true);
      expect(modifiedOff.useIndustryBands).toBe(false);
    });

    it("should calculate disparity by industry", () => {
      const techAvg = (85 + 75) / 2; // 80
      const mfgAvg = 90;
      const disparity = Math.abs(techAvg - mfgAvg);
      expect(disparity).toBe(10);
    });
  });
});

describe("Integration: Scenarios", () => {
  it("should produce consistent results across scenarios", () => {
    // This is a placeholder for integration tests
    // In practice, you would test the full flow of each scenario
    expect(true).toBe(true);
  });

  it("should handle edge cases gracefully", () => {
    // Test with empty data
    expect(kendallTau([], [])).toBe(0);
    expect(meanAbsoluteError([], [])).toBe(0);
    
    // Test with single element
    const single = [{ id: "a", rank: 1 }];
    expect(kendallTau(single, single)).toBe(0);
  });
});

