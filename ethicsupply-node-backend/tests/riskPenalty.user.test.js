const { computeRiskPenalty } = require('../src/risk/penalty');

const S = { enabled: true, weights: { geo: 0.3, climate: 0.4, labor: 0.3 }, threshold: 0.5, lambda: 15 };

test('disabled → N/A handled by UI, penalty=0', () => {
  const p = computeRiskPenalty({ geo: 0.8, climate: 0.6, labor: 0.4 }, { ...S, enabled: false });
  expect(p).toBe(0);
});

test('below threshold → 0', () => {
  const p = computeRiskPenalty({ geo: 0.4, climate: 0.4, labor: 0.4 }, S);
  // risk_raw = 0.4 (weighted mean), threshold = 0.5
  // risk_excess = max(0, 0.4 - 0.5) = 0
  // penalty = 15 * 0 * 100 = 0
  expect(p).toBeCloseTo(0, 5);
});

test('above threshold → positive', () => {
  const p = computeRiskPenalty({ geo: 0.7, climate: 0.6, labor: 0.5 }, S);
  // risk_raw = 0.3*0.7 + 0.4*0.6 + 0.3*0.5 = 0.21 + 0.24 + 0.15 = 0.60
  // risk_excess = max(0, 0.60 - 0.5) = 0.10
  // penalty = 15 * 0.10 * 100 = 150
  expect(p).toBeCloseTo(150, 1);
});

test('partial missing → renormalize weights', () => {
  const p = computeRiskPenalty({ geo: 0.7, climate: 0.6 }, S); // labor missing
  // weights renorm: geo=0.3/(0.3+0.4)=0.428571..., climate=0.4/(0.3+0.4)=0.571428...
  // risk_raw = 0.428571*0.7 + 0.571428*0.6 = 0.3 + 0.342857 = 0.642857
  // risk_excess = max(0, 0.642857 - 0.5) = 0.142857
  // penalty = 15 * 0.142857 * 100 = 214.2857...
  expect(p).toBeGreaterThan(0);
  expect(p).toBeCloseTo(214.3, 0); // Allow for floating-point precision
});

