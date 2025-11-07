# OptiSupply Codebase Mapping - Chapter 4 Evaluation Features

## 1. Normalization

### Files:

- **Backend**: `ethicsupply-node-backend/src/utils/esgScoring.js`

  - Functions: `normalizeLowerIsBetter()`, `normalizeHigherIsBetter()`, `normalizeWageRatio()`
  - Uses: `getMetricBand(metric, industry)` - gets industry-specific or global bands
  - Data flow: `scoreSupplierAgainstBenchmarks()` → `getMetricBand()` → normalization functions
  - **Current**: Always uses industry bands if available, falls back to global
  - **Missing**: Toggle to force global normalization (ignore industry bands)

- **Frontend**: `ethicsupply-frontend/src/scoring/normalize.ts`
  - Function: `normalizeAndScore()`
  - Uses: `intensityBenchmarks` from `constants.ts` (hardcoded industry benchmarks)
  - **Current**: Uses industry-specific benchmarks
  - **Missing**: Toggle to use global min/max instead

### Data Flow:

```
Supplier Data → buildSupplierMetricPayload() → scoreSupplierAgainstBenchmarks()
  → getMetricBand(metric, industry) → normalizeLowerIsBetter/HigherIsBetter()
  → normalized values → computePillarScores() → composite score
```

---

## 2. Scoring/Weights

### Files:

- **Backend**: `ethicsupply-node-backend/src/utils/esgScoring.js`

  - Function: `computePillarScores()` - hardcoded weights:
    - Environmental: emission_intensity 0.4, renewable_pct 0.2, water_intensity 0.2, waste_intensity 0.2
    - Social: injury_rate 0.3, training_hours 0.2, wage_ratio 0.2, diversity_pct 0.3
    - Governance: board_diversity 0.25, board_independence 0.25, anti_corruption 0.2, transparency 0.3
  - Function: `scoreSupplier()` - composite weights: E 0.4, S 0.3, G 0.3 (hardcoded)
  - **Missing**: Configurable weights, persistence

- **Model**: `ethicsupply-node-backend/src/models/ScoringWeight.js`

  - Schema exists but not used in scoring logic
  - **Missing**: Integration with scoring functions

- **Frontend**: `ethicsupply-frontend/src/scoring/constants.ts`
  - Hardcoded: `ENVIRONMENTAL_METRIC_WEIGHTS`, `SOCIAL_METRIC_WEIGHTS`, `GOVERNANCE_METRIC_WEIGHTS`, `PILLAR_WEIGHTS`
  - **Missing**: UI to configure and persist weights

### Data Flow:

```
Normalized metrics → computePillarScores(weights) → pillar scores
  → composite = E*wE + S*wS + G*wG → risk adjustment → final score
```

---

## 3. Risk/Penalty

### Files:

- **Backend**: `ethicsupply-node-backend/src/utils/esgScoring.js`
  - Function: `computeRiskFactor(supplier)` - averages climate_risk, geopolitical_risk, labor_dispute_risk
  - Function: `determineRiskLevel(riskFactor)` - thresholds: <0.2 low, <0.4 medium, <0.6 high, else critical
  - Function: `scoreSupplier()` - applies: `riskAdjusted = baseComposite * (1 - riskFactor)`
  - **Issue**: Returns 0.2 default if no risks present, but may show N/A in UI
  - **Missing**: Ensure always returns numeric value

### Data Flow:

```
Supplier risks → computeRiskFactor() → riskFactor (0-1)
  → baseComposite * (1 - riskFactor) → riskAdjusted score
```

---

## 4. Transparency Logs

### Files:

- **Backend**: `ethicsupply-node-backend/src/utils/esgScoring.js`

  - Function: `scoreSupplierWithBreakdown()` - returns:
    - `normalizedMetrics`: {metric: {value, normalized, imputed}}
    - `pillarScores`: {environmental, social, governance}
    - `weights`: all weights used
    - `composite`: pre-risk composite
    - `risk`: {factor, level}
    - `completeness_ratio`
    - `ethical_score`: final
  - **Current**: Breakdown exists but may not be fully exposed per supplier
  - **Missing**: Endpoint to get full trace per supplier, UI display

- **Frontend**: `ethicsupply-frontend/src/scoring/normalize.ts`
  - Function: `normalizeAndScore()` - returns `notes[]` array
  - **Missing**: Full trace display

### Data Flow:

```
Raw supplier data → normalized (with imputation flags) → weighted pillar scores
  → composite → risk adjustment → final score
  → breakdown object with all intermediate values
```

---

## 5. Suppliers CRUD

### Files:

- **Backend**: `ethicsupply-node-backend/src/controllers/supplierController.js`

  - Functions: `getSuppliers()`, `getSupplierById()`, `createSupplier()`, `updateSupplier()`, `deleteSupplier()`
  - Routes: `/api/suppliers` (GET, POST), `/api/suppliers/:id` (GET, PUT, DELETE)
  - **Current**: Full CRUD exists, scores calculated on create/update

- **Model**: `ethicsupply-node-backend/src/models/Supplier.js`
  - Schema includes all ESG fields and calculated scores
  - **Current**: Complete

### Data Flow:

```
API Request → supplierController → Supplier Model → MongoDB
  → calculateSupplierScores() → save with scores
```

---

## 6. Settings/Methodology Pages

### Files:

- **Settings**: `ethicsupply-frontend/src/pages/Settings.tsx`

  - **Current**: Only dark mode and API endpoint
  - **Missing**: Normalization toggle, weight configuration

- **Methodology**: `ethicsupply-frontend/src/pages/Methodology.tsx`
  - **Current**: Displays methodology, bands viewer
  - **Missing**: Weight configuration UI

### Data Flow:

```
Settings UI → localStorage/API → persist preferences
  → scoring functions read preferences → apply in calculations
```

---

## 7. CSV Export

### Files:

- **Tools**: `tools/export_thesis_assets.js` - has CSV writing utilities
- **Missing**: Endpoint to export supplier rankings as CSV
- **Missing**: Frontend button to trigger export

### Data Flow:

```
GET /api/suppliers/export?format=csv → fetch all suppliers with scores
  → format as CSV → download
```

---

## 8. Scenario Engine (S1-S4)

### Missing:

- **S1 (Utility)**: Test scoring with different weight configurations
- **S2 (Sensitivity)**: Test how scores change with small input variations
- **S3 (Missingness)**: Test scoring with missing data (imputation behavior)
- **S4 (Ablation)**: Test scoring with individual metrics/pillars removed

### Required:

- Endpoints: `/api/scenarios/s1`, `/api/scenarios/s2`, `/api/scenarios/s3`, `/api/scenarios/s4`
- Controller: `scenarioController.js`

---

## Summary of Missing Features

1. ✅ Normalization: Logic exists, needs toggle
2. ❌ Configurable weights: Model exists, not integrated
3. ⚠️ Risk penalty: Logic exists, may show N/A
4. ⚠️ Transparency: Breakdown exists, needs endpoint/UI
5. ✅ Suppliers CRUD: Complete
6. ⚠️ Settings: Basic exists, needs normalization/weights UI
7. ❌ CSV export: Missing
8. ❌ Scenario engine: Missing
