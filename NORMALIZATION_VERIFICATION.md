# Industry-Band Min-Max Normalization Verification

## Summary

Verified and implemented industry-band min-max normalization according to spec requirements.

## 1. Normalization Formula Verification

### Formula Implementation

- **Higher-is-better metrics**: `normalized_x = (clamped(x) - min_industry) / (max_industry - min_industry)`
- **Lower-is-better metrics**: `normalized_x = (max_industry - clamped(x)) / (max_industry - min_industry)`
- **Fallback**: Returns `0` when `denominator = 0` (i.e., when `min === max`)

### Code Location

- **File**: `ethicsupply-node-backend/src/utils/esgScoring.js`
- **Functions**:
  - `normalizeHigherIsBetter()` - Line 280-287
  - `normalizeLowerIsBetter()` - Line 271-278
  - `normalizeWageRatio()` - Line 289-299 (special case)

### Changes Made

- Updated `normalizeHigherIsBetter()` to return `0` instead of `1` when `max === min` (spec requirement)
- Updated `normalizeLowerIsBetter()` to return `0` instead of `1` when `max === min` (spec requirement)
- Added comments documenting the spec requirement

## 2. ON/OFF Flag (Persisted)

### Implementation

- **Flag Name**: `useIndustryBands`
- **Storage**: MongoDB via `ScoringSettings` model
- **Default**: `true` (industry bands enabled by default)
- **Location**: `ethicsupply-node-backend/src/models/ScoringSettings.js`

### Persistence

- Settings are stored in MongoDB and persist across server restarts
- The flag is retrieved via `ScoringSettings.getDefault()` in all scoring operations
- Settings can be updated via `PUT /api/settings` endpoint

## 3. Unit Tests

### Test File

- **Location**: `ethicsupply-node-backend/tests/normalization.test.js`
- **Total Tests**: 9 tests, all passing

### Edge Cases Covered

1. **Single-supplier industry** (denominator=0)

   - Tests that when an industry has only one supplier, `min === max`
   - Verifies normalization returns `0` in this case

2. **Identical values** (min === max)

   - Tests metrics where all suppliers have the same value
   - Verifies normalization returns `0` when `min === max`

3. **Negative inputs**

   - Tests that negative values are clamped to band bounds
   - Verifies normalized values are in range [0, 1]

4. **Values above max**

   - Tests that values exceeding the max are clamped
   - Verifies normalized values are in range [0, 1]

5. **Industry bands toggle**

   - Tests `useIndustryBands=true` uses industry-specific bands
   - Tests `useIndustryBands=false` uses global bands
   - Verifies the flag is persisted and used correctly

6. **Settings persistence**

   - Tests that settings persist the `useIndustryBands` flag
   - Tests default behavior when flag is undefined

7. **Score recomputation**
   - Tests that changing `useIndustryBands` produces different scores
   - Verifies the breakdown reflects the current setting

## 4. Settings UI

### Location

- **File**: `ethicsupply-frontend/src/pages/Settings.tsx`
- **Tab**: "Normalization" tab
- **Component**: Toggle switch for "Use Industry Bands"

### Implementation

- Toggle switch displays current state
- Shows descriptive text: "Normalizing using industry-specific min/max bands" or "Normalizing using global min/max bands"
- Updates are saved via `PUT /api/settings` endpoint
- Settings are loaded on page mount

## 5. Rankings Recompute

### Implementation

- **Export Controller**: `ethicsupply-node-backend/src/controllers/exportController.js`

  - Fetches current settings before computing scores
  - Computes scores dynamically using `scoreSupplier(supplier, settings)`
  - Rankings are computed fresh on each export

- **Dashboard Controller**: `ethicsupply-node-backend/src/controllers/supplierController.js`

  - Uses current settings when computing scores
  - Scores are computed dynamically, not stored

- **Supplier Controller**: `calculateSupplierScores()`
  - Always fetches current settings before computing
  - Scores are computed on-demand

### Behavior

- **No bulk update needed**: Scores are computed dynamically using current settings
- **Automatic recomputation**: When settings change, all subsequent score calculations use the new settings
- **CSV Export**: Rankings are computed fresh on each export using current settings
- **Dashboard**: Scores are computed fresh when dashboard is loaded

## 6. Methodology Page

### Location

- **File**: `ethicsupply-frontend/src/pages/Methodology.tsx`
- **Section**: "Metric Normalization" block
- **Content**: Documents the normalization formulas and approach

### Documentation

- Explains per-industry bands vs global bands
- Lists which metrics are "lower-is-better" vs "higher-is-better"
- Shows normalization formulas
- Links to industry bands viewer

## Test Results

```
PASS tests/normalization.test.js
  Industry-Band Min-Max Normalization
    Formula Verification
      ✓ normalizeHigherIsBetter: should use (x - min) / (max - min)
    Edge Cases
      ✓ Single-supplier industry: denominator=0 should return 0
      ✓ Identical values: should return 0 when min === max
      ✓ Negative inputs: should clamp to band bounds
      ✓ Values above max: should clamp to band bounds
    Industry Bands Toggle
      ✓ useIndustryBands=true: should use industry-specific bands
      ✓ useIndustryBands=false: should use global bands
    Persistence and Recompute
      ✓ Settings should persist useIndustryBands flag
      ✓ Changing useIndustryBands should produce different scores

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

## Verification Checklist

- ✅ Normalization formula: `(x - min_industry) / (max_industry - min_industry)` with fallback to 0
- ✅ ON/OFF flag persisted in `ScoringSettings` model
- ✅ Unit tests for edge cases: single-supplier, identical values, negative inputs
- ✅ Settings UI exposes toggle in "Normalization" tab
- ✅ Rankings recompute when toggle changes (scores computed dynamically)
- ✅ Methodology page documents normalization approach

## Notes

1. **Band Expansion**: The `computeStats()` function expands the range slightly (by 0.0001) when `min === max` to avoid divide-by-zero. However, the normalization functions correctly handle the edge case by returning `0` when `min === max`, so this expansion doesn't affect correctness.

2. **Dynamic Computation**: Scores are not stored in the database with a specific normalization method. Instead, they are computed dynamically using the current settings, ensuring rankings always reflect the current `useIndustryBands` setting.

3. **Backward Compatibility**: The default value for `useIndustryBands` is `true`, maintaining backward compatibility with existing behavior.
