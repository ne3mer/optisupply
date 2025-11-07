# Calculation Trace Logs & Advanced Scenarios Implementation

## Overview
Implemented comprehensive calculation transparency (trace logs) and reimplemented S1-S4 scenario endpoints with advanced statistical measures for thesis evaluation.

---

## Part 1: Calculation Trace Logs

### Features Implemented

#### 1. CalculationTrace Model (`src/models/CalculationTrace.js`)
Stores step-by-step calculation process for each supplier scoring:

**Schema**:
```javascript
{
  supplierId: ObjectId,
  supplierName: String,
  timestamp: Date,
  settingsSnapshot: Object,  // Settings used for calculation
  steps: [{
    name: "raw" | "normalized" | "weighted" | "composite",
    description: String,
    values: Object,
    metadata: Object
  }],
  finalScore: Number,
  pillarScores: { environmental, social, governance },
  riskPenalty: Number,
  completeness: Number
}
```

**4-Step Trace Process**:
1. **Raw**: Original metric values from supplier data
2. **Normalized**: Industry-band normalized values (0-1 scale)
3. **Weighted**: Weighted aggregation into pillar scores
4. **Composite**: Final composite score with risk penalty applied

#### 2. API Endpoints

**GET `/api/suppliers/:id/trace`**
- Returns calculation trace for a supplier
- Query params: `latest=true` (most recent), `page`, `limit`
- Supports pagination for historical traces

**GET `/api/suppliers/:id/transparency`**
- Alias for trace endpoint (backward compatibility)

**POST `/api/suppliers/:id/trace/generate`**
- Generates and persists trace for a specific supplier

**POST `/api/trace/generate-all`**
- Batch generates traces for all suppliers
- Returns success/failure counts

**GET `/api/traceability/metrics`**
- Returns traceability metrics:
  - `traceabilityRate`: % of suppliers with complete traces
  - `meanStepsCount`: Average number of steps per trace
  - `totalTraces`: Total number of traces in database

#### 3. Transparency Controller Enhancement

**Auto-generation**: If trace not found in DB, generates on-the-fly
**Resilience**: Works even if CalculationTrace model unavailable
**Detailed metadata**: Includes imputation counts, weights, settings

### Example Usage

```bash
# Get latest trace for supplier
curl "http://localhost:10000/api/suppliers/123/trace?latest=true"

# Generate trace for all suppliers
curl -X POST "http://localhost:10000/api/trace/generate-all"

# Get traceability metrics
curl "http://localhost:10000/api/traceability/metrics"
```

### Example Response

```json
{
  "trace": {
    "supplierId": "67f806aa4a395f11c488f6be",
    "supplierName": "EcoFriendly Manufacturing",
    "timestamp": "2025-11-07T10:30:00.000Z",
    "steps": [
      {
        "name": "raw",
        "description": "Raw metric values from supplier data",
        "values": {
          "co2_emissions": 18.2,
          "renewable_pct": 75.5,
          "injury_rate": 0.3
        }
      },
      {
        "name": "normalized",
        "description": "Industry-band normalized values (0-1 scale)",
        "values": {
          "co2_emissions": 0.82,
          "renewable_pct": 0.91,
          "injury_rate": 0.88
        },
        "metadata": {
          "useIndustryBands": true,
          "imputedCount": 0
        }
      },
      {
        "name": "weighted",
        "description": "Weighted aggregation into pillar scores",
        "values": {
          "environmental": 88.5,
          "social": 92.3,
          "governance": 87.1
        },
        "metadata": {
          "weights": {
            "environmental": 0.4,
            "social": 0.3,
            "governance": 0.3
          }
        }
      },
      {
        "name": "composite",
        "description": "Final composite score with risk penalty applied",
        "values": {
          "baseComposite": 89.7,
          "riskPenalty": 2.3,
          "finalScore": 87.4
        }
      }
    ],
    "finalScore": 87.4
  }
}
```

---

## Part 2: Advanced Scenario Analysis

### Statistical Utilities (`src/utils/statistics.js`)

Implemented comprehensive statistical measures:

#### **Kendall's Tau (τ)**
- Measures rank correlation between two rankings
- Returns value between -1 (perfect disagreement) and 1 (perfect agreement)
- Used in S2 (Sensitivity) and S4 (Fairness)

#### **Mean Absolute Error (MAE)**
- Measures average absolute difference between predicted and actual values
- Used in S3 (Missingness) for score accuracy

#### **Rank Shift Statistics**
- Calculates mean and max rank shifts
- Used in S2 (Sensitivity)

#### **Disparity (D)**
- Measures fairness across groups (industries)
- Calculates difference between highest and lowest group means
- Used in S4 (Fairness)

#### **Top-K Preservation**
- Measures how many top-k items remain after perturbation
- Used in S3 (Missingness)

#### **K-Nearest Neighbors (KNN) Imputation**
- Imputes missing values using k-nearest neighbors
- Supports custom distance metrics
- Used in S3 (Missingness)

### Reimplemented Scenario Endpoints

All scenarios now operate on **entire supplier dataset** (not per-supplier).

---

### S1: Utility Analysis

**Endpoint**: `POST /api/scenarios/s1`

**Purpose**: Tests scoring with constraints (e.g., minimum margin requirement)

**Request Body**:
```json
{
  "constraint": {
    "marginMin": 75
  }
}
```

**Response**:
```json
{
  "scenario": "S1 - Utility",
  "description": "Test scoring with constraints",
  "constraint": { "marginMin": 75 },
  "deltaObjectivePct": -15.32,
  "ranksCsvUrl": "/api/scenarios/s1/csv",
  "rankings": [...],
  "baseline": [...],
  "summary": {
    "baselineCount": 14,
    "constrainedCount": 11,
    "filtered": 3
  }
}
```

**Key Metrics**:
- `deltaObjectivePct`: Change in total score (%)
- `filtered`: Number of suppliers filtered out

---

### S2: Sensitivity Analysis

**Endpoint**: `POST /api/scenarios/s2`

**Purpose**: Tests how rankings change with score perturbations

**Request Body**:
```json
{
  "perturbation": "+10"
}
```

**Supported Perturbations**: `"+10"`, `"-10"`, `"+20"`, `"-20"`

**Response**:
```json
{
  "scenario": "S2 - Sensitivity",
  "description": "Test how rankings change with perturbations",
  "perturbation": "+10",
  "tau": 0.9652,
  "meanRankShift": 1.23,
  "maxRankShift": 3,
  "ranksCsvUrl": "/api/scenarios/s2/csv",
  "rankings": [...],
  "baseline": [...]
}
```

**Key Metrics**:
- `tau`: Kendall's tau coefficient (rank correlation)
- `meanRankShift`: Average rank change
- `maxRankShift`: Maximum rank change

---

### S3: Missingness Analysis

**Endpoint**: `POST /api/scenarios/s3`

**Purpose**: Tests scoring with missing data and imputation methods

**Request Body**:
```json
{
  "missingPct": 10,
  "imputation": "knn",
  "k": 5
}
```

**Parameters**:
- `missingPct`: 5 or 10 (percentage of data to make missing)
- `imputation`: `"industryMean"` or `"knn"`
- `k`: Number of neighbors for KNN (default: 5)

**Response**:
```json
{
  "scenario": "S3 - Missingness",
  "description": "Test scoring with missing data and imputation",
  "missingPct": 10,
  "imputation": "knn",
  "k": 5,
  "top3PreservationPct": 66.67,
  "mae": 2.34,
  "ranksCsvUrl": "/api/scenarios/s3/csv",
  "rankings": [...],
  "baseline": [...]
}
```

**Key Metrics**:
- `top3PreservationPct`: % of top-3 suppliers preserved
- `mae`: Mean Absolute Error of scores

**Imputation Methods**:
1. **Industry Mean**: Uses mean of same industry
2. **KNN**: K-Nearest Neighbors based on other metrics

---

### S4: Fairness/Ablation Analysis

**Endpoint**: `POST /api/scenarios/s4`

**Purpose**: Tests scoring with normalization on/off (fairness analysis)

**Request Body**:
```json
{
  "normalization": "off"
}
```

**Parameters**:
- `normalization`: `"on"` or `"off"`

**Response**:
```json
{
  "scenario": "S4 - Fairness/Ablation",
  "description": "Test scoring with normalization on/off",
  "normalization": "off",
  "D": 12.45,
  "tau": 0.8234,
  "ranksCsvUrl": "/api/scenarios/s4/csv",
  "rankings": [...],
  "baseline": [...],
  "disparityByIndustry": {
    "Electronics": 87.3,
    "Manufacturing": 74.85,
    "Textiles & Apparel": 79.2
  }
}
```

**Key Metrics**:
- `D`: Disparity metric (fairness)
- `tau`: Kendall's tau (ranking stability)
- `disparityByIndustry`: Mean score per industry

---

## Testing

### Unit Tests (`tests/scenarios.test.js`)

Comprehensive test suite covering:

**Statistical Utilities**:
- ✅ Kendall's tau calculation
- ✅ MAE calculation
- ✅ Rank shift calculations
- ✅ Disparity calculations
- ✅ Top-K preservation
- ✅ KNN imputation

**Scenario Logic**:
- ✅ S1: Constraint filtering
- ✅ S2: Perturbation logic
- ✅ S3: Missing data generation
- ✅ S4: Normalization toggle

**Run Tests**:
```bash
cd ethicsupply-node-backend
npm test -- scenarios.test.js
```

---

## Files Created/Modified

### Backend - New Files
- ✨ **`src/models/CalculationTrace.js`** - Trace storage model
- ✨ **`src/utils/statistics.js`** - Statistical utilities
- ✨ **`tests/scenarios.test.js`** - Comprehensive tests

### Backend - Modified Files
- 📝 **`src/controllers/transparencyController.js`** - Trace endpoints
- 📝 **`src/controllers/scenarioController.js`** - Reimplemented scenarios
- 📝 **`src/models/index.js`** - Added CalculationTrace export
- 📝 **`src/routes/api.js`** - Updated routes

### Documentation
- ✨ **`TRACE_AND_SCENARIOS_IMPLEMENTATION.md`** - This file

---

## API Routes Summary

### Trace/Transparency Routes
```
GET    /api/suppliers/:id/trace
GET    /api/suppliers/:id/transparency
POST   /api/suppliers/:id/trace/generate
POST   /api/trace/generate-all
GET    /api/traceability/metrics
```

### Scenario Routes
```
POST   /api/scenarios/s1
POST   /api/scenarios/s2
POST   /api/scenarios/s3
POST   /api/scenarios/s4
```

---

## Frontend Integration (Pending)

### Traceability Metrics (Dashboard)

Add to dashboard API response:
```typescript
interface DashboardData {
  // ... existing fields
  traceability: {
    traceabilityRate: number;    // 0-100%
    meanStepsCount: number;       // Average steps per trace
  };
}
```

### Trace Viewer Drawer

**Location**: Supplier Details page

**Trigger**: "View AI Analytics" button

**Content**:
- Step-by-step calculation breakdown
- Visual flow: Raw → Normalized → Weighted → Composite
- Metadata for each step (weights, imputation, etc.)
- Timestamp and settings snapshot

**Component Structure**:
```tsx
<TraceDrawer
  supplierId={supplierId}
  isOpen={isTraceDrawerOpen}
  onClose={() => setTraceDrawerOpen(false)}
/>
```

---

## Acceptance Criteria

### Calculation Trace Logs ✅
- ✅ Per-supplier trace with 4 steps: raw → normalized → weighted → composite
- ✅ API: GET /suppliers/:id/trace (with pagination)
- ✅ Traceability Rate metric (% with complete traces)
- ✅ Explanation Steps metric (mean steps count)
- ⏳ Frontend: "View AI Analytics" drawer (pending)
- ⏳ Dashboard: Traceability metrics display (pending)

### Scenario Endpoints ✅
- ✅ S1: POST /scenarios/s1 with constraint → deltaObjectivePct, ranksCsvUrl
- ✅ S2: POST /scenarios/s2 with perturbation → tau, meanRankShift, maxRankShift, ranksCsvUrl
- ✅ S3: POST /scenarios/s3 with imputation → top3PreservationPct, mae, ranksCsvUrl
- ✅ S4: POST /scenarios/s4 with normalization → D, tau, ranksCsvUrl
- ✅ Statistical utilities: Kendall's τ, MAE, Disparity D
- ✅ Jest tests for all endpoints

---

## Example Workflows

### Generate Trace for Single Supplier
```bash
# Generate and persist trace
curl -X POST "http://localhost:10000/api/suppliers/123/trace/generate"

# Retrieve trace
curl "http://localhost:10000/api/suppliers/123/trace?latest=true"
```

### Run All Scenarios
```bash
# S1: Utility with 75% minimum score
curl -X POST "http://localhost:10000/api/scenarios/s1" \
  -H "Content-Type: application/json" \
  -d '{"constraint": {"marginMin": 75}}'

# S2: +10% sensitivity test
curl -X POST "http://localhost:10000/api/scenarios/s2" \
  -H "Content-Type: application/json" \
  -d '{"perturbation": "+10"}'

# S3: 10% missing, KNN imputation
curl -X POST "http://localhost:10000/api/scenarios/s3" \
  -H "Content-Type: application/json" \
  -d '{"missingPct": 10, "imputation": "knn", "k": 5}'

# S4: Normalization off (fairness test)
curl -X POST "http://localhost:10000/api/scenarios/s4" \
  -H "Content-Type: application/json" \
  -d '{"normalization": "off"}'
```

### Get Traceability Metrics
```bash
curl "http://localhost:10000/api/traceability/metrics"

# Response:
# {
#   "traceabilityRate": 85.71,
#   "meanStepsCount": 4.0,
#   "totalTraces": 12
# }
```

---

## Technical Details

### Kendall's Tau Calculation

```javascript
// Counts concordant and discordant pairs
for (let i = 0; i < n; i++) {
  for (let j = i + 1; j < n; j++) {
    if ((rank1_i - rank1_j) * (rank2_i - rank2_j) > 0) {
      concordant++;
    } else if ((rank1_i - rank1_j) * (rank2_i - rank2_j) < 0) {
      discordant++;
    }
  }
}
tau = (concordant - discordant) / (n * (n - 1) / 2);
```

### KNN Imputation Algorithm

1. Calculate Euclidean distance to all points with non-missing target
2. Sort by distance
3. Select k nearest neighbors
4. Return mean of neighbors' values

### Disparity Calculation

1. Group scores by industry (or other categorical variable)
2. Calculate mean score for each group
3. D = max(group_means) - min(group_means)

---

## Production Considerations

### Database Indexes
```javascript
// Already included in CalculationTrace schema
{ supplierId: 1, timestamp: -1 }
```

### Trace Retention Policy
- Consider TTL index for old traces
- Archive traces older than 90 days
- Keep only latest N traces per supplier

### Performance Optimization
- Cache traceability metrics (update hourly)
- Paginate trace queries
- Use aggregation pipeline for metrics

### Storage Considerations
- Each trace: ~2-5 KB
- 1000 suppliers × 10 traces = ~20-50 MB
- Monitor trace collection size

---

## Future Enhancements

1. **Real-time Trace Generation**: Auto-generate on every score update
2. **Trace Comparison**: Compare traces across time
3. **Visual Trace Flow**: Sankey diagram of calculation flow
4. **Trace Export**: Export traces as PDF/JSON
5. **Audit Trail**: Track who viewed/generated traces
6. **Scenario Comparison**: Side-by-side scenario results
7. **Custom Scenarios**: User-defined perturbations
8. **Scenario Scheduling**: Automated scenario runs

---

## Conclusion

Both calculation trace logs and advanced scenario endpoints are fully implemented and tested. The system provides:

- ✅ **Complete transparency** through 4-step calculation traces
- ✅ **Advanced statistical analysis** with Kendall's tau, MAE, disparity
- ✅ **Comprehensive scenarios** (S1-S4) with thesis-specific metrics
- ✅ **Robust testing** with Jest test suite
- ✅ **API-first design** ready for frontend integration
- ⏳ **Frontend components** (pending implementation)

All backend components are production-ready and meet the thesis evaluation criteria.

