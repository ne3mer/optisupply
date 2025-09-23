# Scoring Edge Cases – Test Summary

This note summarizes the unit tests that validate critical edge behavior of the ESG scoring pipeline.

Files:
- Backend tests: `ethicsupply-node-backend/tests/esgScoring.edge.test.js`
- Scoring util under test: `ethicsupply-node-backend/src/utils/esgScoring.js`

## Cases Covered

1) Completeness Cap
- Condition: `completeness_ratio < 0.7`
- Expected: `ethical_score` is capped at `≤ 50`.
- Rationale: Avoid overconfidence when disclosure is sparse; the final score is bounded even if normalized metrics look good.

2) Risk Thresholds → Levels
- Inputs: risk factor approximated via `climate_risk` (averaged with other risks if present)
- Thresholds:
  - `< 0.2` → `low`
  - `< 0.4` → `medium`
  - `< 0.6` → `high`
  - `≥ 0.6` → `critical`
- Cases validated: `0.19 → low`, `0.21 → medium`, `0.41 → high`, `0.61 → critical`.

3) Anti-Corruption Handling
- Missing → treated as `0` (no credit); does not count toward completeness totals.
- Presence (`true`/`1`) → contributes to completeness and increases the governance pillar.
- Validations:
  - `completeness_ratio(present) ≥ completeness_ratio(missing)`
  - `governance_score(present) ≥ governance_score(missing)`

## How to Run

```
cd ethicsupply-node-backend
npm test
```

Tests run with Jest in band to avoid cross‑test interference.

