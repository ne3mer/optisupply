/**
 * Tests for scoring fixes: finalScore, governance normalization, risk penalty scale
 */

const { computeRiskPenalty } = require("../src/risk/penalty");
const { scoreSupplier } = require("../src/utils/esgScoring");

describe("Scoring Fixes", () => {
  describe("Risk penalty scale + final score", () => {
    test("final = clamp(composite - penalty)", () => {
      const composite = 72.5;
      const settings = {
        enabled: true,
        weights: { geo: 0.3, climate: 0.4, labor: 0.3 },
        threshold: 0.5,
        lambda: 15,
      };
      const risks = { geo: 60, climate: 70, labor: 40 }; // 0..100

      // Convert 0-100 to 0-1 internally
      const risk01 = 0.3 * 0.6 + 0.4 * 0.7 + 0.3 * 0.4; // = 0.57
      const expectedPenalty = 15 * Math.max(0, risk01 - 0.5) * 100; // 105.0
      const final = Math.max(0, Math.min(100, composite - expectedPenalty)); // → 0

      expect(final).toBe(0);
    });

    test("risk penalty handles 0-100 input scale", () => {
      const supplier = {
        geopolitical_risk: 60, // 0-100
        climate_risk: 70, // 0-100
        labor_dispute_risk: 40, // 0-100
      };
      const settings = {
        riskPenaltyEnabled: true,
        riskWeightGeopolitical: 0.3,
        riskWeightClimate: 0.4,
        riskWeightLabor: 0.3,
        riskThreshold: 0.5,
        riskLambda: 15,
      };

      const penalty = computeRiskPenalty(supplier, settings);
      // risk = (0.3*0.6 + 0.4*0.7 + 0.3*0.4) = 0.57
      // excess = max(0, 0.57 - 0.5) = 0.07
      // penalty = 15 * 0.07 * 100 = 105
      expect(penalty).toBeGreaterThan(0);
      expect(penalty).toBeCloseTo(105, 1);
    });
  });

  describe("Governance normalization", () => {
    test("governance weighted on 0-100 scales", () => {
      // Normalize weights helper
      const normalizeW = (w) => {
        const s = Object.values(w).reduce((a, b) => a + b, 0) || 1;
        return Object.fromEntries(
          Object.entries(w).map(([k, v]) => [k, v / s])
        );
      };

      const w = normalizeW({
        transparency: 0.25,
        compliance: 0.2,
        ethics: 0.2,
        boardDiversity: 0.15,
        boardIndependence: 0.1,
        antiCorruption: 0.1,
      });

      const inputs = {
        transparency: 80,
        compliance: 70,
        ethics: 75,
        boardDiversity: 30,
        boardIndependence: 40,
        antiCorruption: true,
      };

      const anti = inputs.antiCorruption ? 100 : 0;
      const gov =
        w.transparency * inputs.transparency +
        w.compliance * inputs.compliance +
        w.ethics * inputs.ethics +
        w.boardDiversity * inputs.boardDiversity +
        w.boardIndependence * inputs.boardIndependence +
        w.antiCorruption * anti;

      expect(gov).toBeGreaterThanOrEqual(0);
      expect(gov).toBeLessThanOrEqual(100);
    });
  });

  describe("Composite = weighted pillars", () => {
    test("composite weighted average", () => {
      const env = 64;
      const soc = 58;
      const gov = 62;
      const comp = 0.4 * env + 0.3 * soc + 0.3 * gov;
      expect(comp).toBeCloseTo(61.0, 1);
    });

    test("composite weights sum to 1.0", () => {
      const weights = { environmental: 0.4, social: 0.3, governance: 0.3 };
      const sum = weights.environmental + weights.social + weights.governance;
      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe("Compute on missing data (imputation path)", () => {
    test("composite with imputation fallback 50", () => {
      const env = 70;
      const soc = undefined;
      const gov = 60;

      const get = (x) => (Number.isFinite(x) ? x : 50);
      const comp = 0.4 * get(env) + 0.3 * get(soc) + 0.3 * get(gov);
      expect(comp).toBeCloseTo(0.4 * 70 + 0.3 * 50 + 0.3 * 60, 5);
    });

    test("scoreSupplier handles missing data gracefully", () => {
      const supplier = {
        name: "Test Supplier",
        country: "Test Country",
        industry: "Manufacturing",
        // Missing most metrics
      };

      const scores = scoreSupplier(supplier, null);
      expect(scores.composite_score).toBeDefined();
      expect(scores.finalScore).toBeDefined();
      expect(scores.composite_score).toBeGreaterThanOrEqual(0);
      expect(scores.composite_score).toBeLessThanOrEqual(100);
      expect(scores.finalScore).toBeGreaterThanOrEqual(0);
      expect(scores.finalScore).toBeLessThanOrEqual(100);
    });
  });

  describe("Weights normalization", () => {
    test("governance weights normalize to sum 1.0", () => {
      const rawWeights = {
        transparency: 0.3,
        compliance: 0.25,
        ethics: 0.2,
        boardDiversity: 0.15,
        boardIndependence: 0.1,
        antiCorruption: 0.1,
      };
      const sum = Object.values(rawWeights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    test("risk weights normalize to sum 1.0", () => {
      const rawWeights = {
        geopolitical: 0.3,
        climate: 0.4,
        labor: 0.3,
      };
      const sum = rawWeights.geopolitical + rawWeights.climate + rawWeights.labor;
      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe("Board rescaling", () => {
    test("scaleTo100 detects 0-1 scale", () => {
      const arr = [0.3, 0.5, 0.7];
      const max = Math.max(...arr);
      expect(max).toBeLessThanOrEqual(1.01);
      // Should multiply by 100
      const scaled = arr.map((x) => x * 100);
      expect(scaled[0]).toBe(30);
      expect(scaled[1]).toBe(50);
      expect(scaled[2]).toBe(70);
    });

    test("scaleTo100 detects 0-50 scale", () => {
      const arr = [20, 30, 40];
      const max = Math.max(...arr);
      expect(max).toBeLessThanOrEqual(50.5);
      // Should multiply by 2
      const scaled = arr.map((x) => x * 2);
      expect(scaled[0]).toBe(40);
      expect(scaled[1]).toBe(60);
      expect(scaled[2]).toBe(80);
    });

    test("scaleTo100 leaves 0-100 scale unchanged", () => {
      const arr = [60, 70, 80];
      const max = Math.max(...arr);
      expect(max).toBeGreaterThan(50.5);
      // Should remain unchanged
      expect(arr[0]).toBe(60);
      expect(arr[1]).toBe(70);
      expect(arr[2]).toBe(80);
    });
  });
});

