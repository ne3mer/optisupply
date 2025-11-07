const fs = require("fs");
const path = require("path");

const DATASET_PATH = path.join(__dirname, "../../data/sample_esg_dataset.csv");
const BANDS_PATH = path.join(__dirname, "../../data/bands_v1.json");

const METRIC_KEYS = [
  "emission_intensity",
  "renewable_pct",
  "water_intensity",
  "waste_intensity",
  "injury_rate",
  "training_hours",
  "wage_ratio",
  "diversity_pct",
  "board_diversity",
  "board_independence",
  "transparency_score",
];

let INDUSTRY_STATS = {};
let GLOBAL_STATS = {};
let INDUSTRY_AVERAGES = {};
let DATASET_META = {
  version: "synthetic-v1",
  seed: undefined,
  generatedAt: undefined,
  bandsVersion: "v1",
};

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const [headerLine, ...lines] = raw.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim());

  return lines.map((line) => {
    const values = line.split(",");
    const record = {};
    headers.forEach((header, idx) => {
      const rawValue = values[idx];
      if (rawValue === undefined || rawValue === "") {
        record[header] = null;
        return;
      }
      // Attempt to parse numbers, otherwise keep as string
      const numeric = Number(rawValue);
      record[header] = Number.isNaN(numeric) ? rawValue : numeric;
    });
    return record;
  });
}

function safeDivide(numerator, denominator, fallback = null) {
  if (numerator === null || numerator === undefined) return fallback;
  if (denominator === null || denominator === undefined) return fallback;
  if (denominator === 0) return fallback;
  return numerator / denominator;
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function clamp(value, min, max) {
  if (value === null || value === undefined) return null;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function deriveMetrics(record) {
  const revenue = record.revenue || 0;
  const employees = record.employees || 0;

  // Use revenue scaled to millions to keep intensities interpretable
  const revenueScale = revenue > 0 ? revenue : null;
  const employeeScale = employees > 0 ? employees : null;

  const emissionIntensity = safeDivide(record.emissions, revenueScale, null);
  const waterIntensity = safeDivide(record.water_use, revenueScale, null);
  const wasteIntensity = safeDivide(record.waste, revenueScale, null);

  return {
    emission_intensity: emissionIntensity,
    renewable_pct: record.renewable_pct,
    water_intensity: waterIntensity,
    waste_intensity: wasteIntensity,
    injury_rate: record.injury_rate,
    training_hours: record.training_hours,
    wage_ratio: record.wage_ratio,
    diversity_pct: record.diversity_pct,
    board_diversity: record.board_diversity,
    board_independence: record.board_independence,
    transparency_score: record.transparency_score,
    anti_corruption: record.anti_corruption,
    climate_risk: record.climate_risk,
    geo_risk: record.geo_risk,
    labor_risk: record.labor_risk,
    industry: record.industry || "Unknown",
  };
}

function computeStats(records) {
  const statsByIndustry = {};
  const totals = {};
  const counts = {};

  records.forEach((record) => {
    const metrics = deriveMetrics(record);
    const industry = metrics.industry;
    if (!statsByIndustry[industry]) {
      statsByIndustry[industry] = {};
    }
    if (!totals[industry]) totals[industry] = {};
    if (!counts[industry]) counts[industry] = {};

    METRIC_KEYS.forEach((metricKey) => {
      const value = metrics[metricKey];
      if (value === null || value === undefined) return;
      const industryStats = statsByIndustry[industry];

      if (!industryStats[metricKey]) {
        industryStats[metricKey] = {
          min: value,
          max: value,
        };
      } else {
        industryStats[metricKey].min = Math.min(
          industryStats[metricKey].min,
          value
        );
        industryStats[metricKey].max = Math.max(
          industryStats[metricKey].max,
          value
        );
      }

      if (!totals[industry][metricKey]) totals[industry][metricKey] = 0;
      if (!counts[industry][metricKey]) counts[industry][metricKey] = 0;
      totals[industry][metricKey] += value;
      counts[industry][metricKey] += 1;
    });
  });

  const industryAverages = {};
  Object.keys(totals).forEach((industry) => {
    industryAverages[industry] = {};
    Object.keys(totals[industry]).forEach((metricKey) => {
      industryAverages[industry][metricKey] =
        totals[industry][metricKey] / counts[industry][metricKey];
      const band = statsByIndustry[industry][metricKey];
      if (band.min === band.max) {
        // Expand range slightly to avoid divide-by-zero during normalization
        statsByIndustry[industry][metricKey] = {
          min: band.min - 0.0001,
          max: band.max + 0.0001,
        };
      }
    });
  });

  // Compute global stats by aggregating across records
  const globalTotals = {};
  const globalCounts = {};
  const globalBands = {};

  records.forEach((record) => {
    const metrics = deriveMetrics(record);
    METRIC_KEYS.forEach((metricKey) => {
      const value = metrics[metricKey];
      if (value === null || value === undefined) return;
      if (!globalBands[metricKey]) {
        globalBands[metricKey] = { min: value, max: value };
      } else {
        globalBands[metricKey].min = Math.min(globalBands[metricKey].min, value);
        globalBands[metricKey].max = Math.max(globalBands[metricKey].max, value);
      }
      if (!globalTotals[metricKey]) globalTotals[metricKey] = 0;
      if (!globalCounts[metricKey]) globalCounts[metricKey] = 0;
      globalTotals[metricKey] += value;
      globalCounts[metricKey] += 1;
    });
  });

  const globalAverages = {};
  Object.keys(globalTotals).forEach((metricKey) => {
    globalAverages[metricKey] =
      globalTotals[metricKey] / globalCounts[metricKey];
    const band = globalBands[metricKey];
    if (band.min === band.max) {
      globalBands[metricKey] = {
        min: band.min - 0.0001,
        max: band.max + 0.0001,
      };
    }
  });

  return {
    statsByIndustry,
    industryAverages,
    globalStats: globalBands,
    globalAverages,
  };
}

function getMetricBand(metric, industry, useIndustryBands = true) {
  if (useIndustryBands) {
    const industryStats = INDUSTRY_STATS[industry];
    if (industryStats && industryStats[metric]) {
      return industryStats[metric];
    }
  }
  // Use global bands (either forced or as fallback)
  return (
    GLOBAL_STATS[metric] || {
      min: 0,
      max: 1,
    }
  );
}

function getMetricAverage(metric, industry) {
  const industryAvg = INDUSTRY_AVERAGES[industry];
  if (industryAvg && industryAvg[metric] !== undefined) {
    return industryAvg[metric];
  }
  const global = INDUSTRY_AVERAGES.__global__;
  if (global && global[metric] !== undefined) return global[metric];
  return 0.5;
}

function applyBandsJson(bandsJson) {
  // Accept {seed, bands:{Industry:{metric:{min,max,avg}}}} or {Industry:{metric:{min,max,avg}}}
  const root = bandsJson.bands ? bandsJson.bands : bandsJson;
  const metrics = METRIC_KEYS;

  const newIndustryStats = {};
  const newIndustryAvgs = {};
  const global = {};

  for (const [industry, metricsObj] of Object.entries(root)) {
    newIndustryStats[industry] = {};
    newIndustryAvgs[industry] = {};
    for (const metric of metrics) {
      const entry = metricsObj[metric];
      if (!entry) continue;
      if (entry.min !== undefined && entry.max !== undefined) {
        newIndustryStats[industry][metric] = { min: Number(entry.min), max: Number(entry.max) };
        if (!global[metric]) {
          global[metric] = { min: Number(entry.min), max: Number(entry.max) };
        } else {
          global[metric].min = Math.min(global[metric].min, Number(entry.min));
          global[metric].max = Math.max(global[metric].max, Number(entry.max));
        }
      }
      if (entry.avg !== undefined) {
        newIndustryAvgs[industry][metric] = Number(entry.avg);
      }
    }
  }

  INDUSTRY_STATS = newIndustryStats;
  INDUSTRY_AVERAGES = { ...newIndustryAvgs, __global__: Object.fromEntries(
    Object.entries(global).map(([k, v]) => [k, (v.min + v.max) / 2])
  ) };
  GLOBAL_STATS = global;
}

function normalizeLowerIsBetter(value, band) {
  if (value === null || value === undefined) return null;
  const { min, max } = band;
  // Fallback to 0 if denominator is 0 (spec requirement)
  if (max === min) return 0;
  const clamped = clamp(value, min, max);
  return (max - clamped) / (max - min);
}

function normalizeHigherIsBetter(value, band) {
  if (value === null || value === undefined) return null;
  const { min, max } = band;
  // Fallback to 0 if denominator is 0 (spec requirement: normalized_x = (x - min_industry) / (max_industry - min_industry))
  if (max === min) return 0;
  const clamped = clamp(value, min, max);
  return (clamped - min) / (max - min);
}

function normalizeWageRatio(value, band) {
  if (value === null || value === undefined) return null;
  // Treat closeness to or above 1 as positive
  const upperBound = Math.max(band.max, 1.2);
  const lowerBound = Math.min(band.min, 0.6);
  const clamped = clamp(value, lowerBound, upperBound);
  if (clamped >= 1) {
    // Reward ratios above parity up to 1.2, but saturate at 1
    return Math.min(1, (clamped - 1) / (upperBound - 1) + 1);
  }
  // Below 1, penalize linearly toward 0
  return (clamped - lowerBound) / (1 - lowerBound);
}

// Import risk penalty calculation from separate module
const { computeRiskPenalty: computeRiskPenaltyFromModule } = require("../risk/penalty");

/**
 * Compute risk penalty (wrapper for backward compatibility)
 * Uses the separate risk/penalty module
 * 
 * @param {Object} supplier - Supplier data with risk fields
 * @param {Object} settings - Scoring settings with risk weights, threshold, lambda
 * @returns {number|null} - Penalty value (0-100) or null if disabled
 */
function computeRiskPenalty(supplier, settings = null) {
  // Convert settings format for the module
  const moduleSettings = settings ? {
    enabled: settings.riskPenaltyEnabled !== false,
    weights: {
      geo: settings.riskWeightGeopolitical,
      climate: settings.riskWeightClimate,
      labor: settings.riskWeightLabor,
    },
    threshold: settings.riskThreshold,
    lambda: settings.riskLambda,
    // Also pass through original format for compatibility
    riskPenaltyEnabled: settings.riskPenaltyEnabled,
    riskWeightGeopolitical: settings.riskWeightGeopolitical,
    riskWeightClimate: settings.riskWeightClimate,
    riskWeightLabor: settings.riskWeightLabor,
    riskThreshold: settings.riskThreshold,
    riskLambda: settings.riskLambda,
  } : null;

  const penalty = computeRiskPenaltyFromModule(supplier, moduleSettings);
  
  // For backward compatibility: return null if disabled (frontend shows "N/A")
  if (settings && settings.riskPenaltyEnabled === false) {
    return null;
  }
  
  return penalty;
}

/**
 * Legacy function for backward compatibility
 * Returns risk factor (0-1) for use in multiplier approach
 */
function computeRiskFactor(supplier, defaultRiskFactor = 0.15) {
  const risks = [
    toNumber(supplier.climate_risk),
    toNumber(supplier.geopolitical_risk),
    toNumber(supplier.labor_dispute_risk),
  ].filter((value) => typeof value === "number" && !Number.isNaN(value));

  if (!risks.length) return defaultRiskFactor; // Use configurable default
  const avg =
    risks.reduce((sum, value) => sum + Math.max(0, Math.min(1, value)), 0) /
    risks.length;
  return Math.max(0, Math.min(1, avg));
}

function buildSupplierMetricPayload(supplier) {
  const revenue = supplier.revenue ?? null;
  const emissions =
    toNumber(supplier.total_emissions) ?? toNumber(supplier.co2_emissions);
  const waterUse =
    toNumber(supplier.water_usage) ?? toNumber(supplier.water_use);
  const waste =
    toNumber(supplier.waste_generated) ?? toNumber(supplier.waste);

  const renewablePct = toNumber(supplier.renewable_energy_percent);
  const injuryRate = toNumber(supplier.injury_rate);
  const trainingHours = toNumber(supplier.training_hours);
  const wageRatio =
    toNumber(supplier.living_wage_ratio) ?? toNumber(supplier.wage_ratio);
  const diversityPct =
    toNumber(supplier.gender_diversity_percent) ??
    toNumber(supplier.diversity_inclusion_score);
  const boardDiversity = toNumber(supplier.board_diversity);
  const boardIndependence = toNumber(supplier.board_independence);
  const transparencyScore = toNumber(supplier.transparency_score);

  return {
    emission_intensity: safeDivide(emissions, toNumber(revenue), null),
    renewable_pct: renewablePct,
    water_intensity: safeDivide(waterUse, toNumber(revenue), null),
    waste_intensity: safeDivide(waste, toNumber(revenue), null),
    injury_rate: injuryRate,
    training_hours: trainingHours,
    wage_ratio: wageRatio,
    diversity_pct: diversityPct,
    board_diversity: boardDiversity,
    board_independence: boardIndependence,
    transparency_score: transparencyScore,
    anti_corruption:
      typeof supplier.anti_corruption_policy === "boolean"
        ? supplier.anti_corruption_policy
        : supplier.anti_corruption_policy === 1,
  };
}

function scoreSupplierAgainstBenchmarks(supplier, useIndustryBands = true) {
  const industry = supplier.industry || "Unknown";
  const metricValues = buildSupplierMetricPayload(supplier);

  const normalized = {};
  const completeness = { present: 0, total: 0 };

  Object.entries(metricValues).forEach(([metric, rawValue]) => {
    if (metric === "anti_corruption") return; // handled separately
    completeness.total += 1;

    let value = rawValue;
    let imputed = false;
    if (value === null || value === undefined || Number.isNaN(value)) {
      value = getMetricAverage(metric, industry);
      imputed = true;
    }

    const band = getMetricBand(metric, industry, useIndustryBands);
    let normalizedValue = null;
    if (metric === "emission_intensity" ||
        metric === "water_intensity" ||
        metric === "waste_intensity" ||
        metric === "injury_rate") {
      normalizedValue = normalizeLowerIsBetter(value, band);
    } else if (metric === "wage_ratio") {
      normalizedValue = normalizeWageRatio(value, band);
    } else {
      normalizedValue = normalizeHigherIsBetter(value, band);
    }

    normalized[metric] = {
      value,
      normalized: normalizedValue,
      imputed,
      band: { min: band.min, max: band.max }, // Include band info for transparency
    };

    if (!imputed) completeness.present += 1;
  });

  // Anti-corruption is boolean; treat missing as 0
  const antiCorruptionRaw = metricValues.anti_corruption;
  const antiCorruptionScore = antiCorruptionRaw ? 1 : 0;
  if (antiCorruptionRaw !== null && antiCorruptionRaw !== undefined) {
    completeness.total += 1;
    if (antiCorruptionRaw === true || antiCorruptionRaw === 1) {
      completeness.present += 1;
    }
  }

  return {
    normalized,
    antiCorruptionScore,
    completenessRatio:
      completeness.total > 0 ? completeness.present / completeness.total : 1,
  };
}

/**
 * Normalize weights to sum to 1.0
 */
function normalizeWeights(weights) {
  const entries = Object.entries(weights);
  const sum = entries.reduce((acc, [, v]) => acc + (Number.isFinite(v) ? v : 0), 0);
  if (sum === 0 || !Number.isFinite(sum)) {
    // If all weights are 0 or invalid, use equal weights
    const equalWeight = 1 / entries.length;
    return Object.fromEntries(entries.map(([k]) => [k, equalWeight]));
  }
  return Object.fromEntries(entries.map(([k, v]) => [k, Number.isFinite(v) ? v / sum : 0]));
}

/**
 * Scale array values to 0-100 range
 * Detects if values are 0-1, 0-50, or already 0-100
 */
function scaleTo100(arr) {
  const clean = arr.filter(x => Number.isFinite(x) && x !== null && x !== undefined);
  if (clean.length === 0) return arr;
  
  const max = Math.max(...clean, 0);
  
  // If max <= 1.01, assume 0-1 scale → multiply by 100
  if (max <= 1.01) {
    return arr.map(x => Number.isFinite(x) && x !== null && x !== undefined ? x * 100 : x);
  }
  
  // If max <= 50.5, assume 0-50 scale → multiply by 2
  if (max <= 50.5) {
    return arr.map(x => Number.isFinite(x) && x !== null && x !== undefined ? x * 2 : x);
  }
  
  // Already ~0-100, return as-is
  return arr;
}

/**
 * Convert value to 0-100 scale
 * Handles values that might be 0-1, 0-100, or percentages
 */
function toZeroToHundred(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  // If value > 1, assume it's already 0-100 scale
  // If value <= 1, assume it's 0-1 scale and convert
  return value > 1 ? Math.max(0, Math.min(100, value)) : Math.max(0, Math.min(100, value * 100));
}

function computePillarScores(normalizedMetrics, weights = null, supplier = null) {
  const { normalized, antiCorruptionScore } = normalizedMetrics;

  // Default weights
  const defaultWeights = {
    environmental: {
      emission_intensity: 0.4,
      renewable_pct: 0.2,
      water_intensity: 0.2,
      waste_intensity: 0.2,
    },
    social: {
      injury_rate: 0.3,
      training_hours: 0.2,
      wage_ratio: 0.2,
      diversity_pct: 0.3,
    },
    governance: {
      transparency: 0.25,
      compliance: 0.20,
      ethics: 0.20,
      boardDiversity: 0.15,
      boardIndependence: 0.10,
      antiCorruption: 0.10,
    },
  };

  const w = weights || defaultWeights;

  // Environmental: use normalized values (already 0-1 from normalization)
  const env = (
    (normalized.emission_intensity?.normalized ?? 0) * (w.environmental?.emission_intensity ?? defaultWeights.environmental.emission_intensity) +
    (normalized.renewable_pct?.normalized ?? 0) * (w.environmental?.renewable_pct ?? defaultWeights.environmental.renewable_pct) +
    (normalized.water_intensity?.normalized ?? 0) * (w.environmental?.water_intensity ?? defaultWeights.environmental.water_intensity) +
    (normalized.waste_intensity?.normalized ?? 0) * (w.environmental?.waste_intensity ?? defaultWeights.environmental.waste_intensity)
  ) * 100;

  // Social: use normalized values (already 0-1 from normalization)
  const social = (
    (normalized.injury_rate?.normalized ?? 0) * (w.social?.injury_rate ?? defaultWeights.social.injury_rate) +
    (normalized.training_hours?.normalized ?? 0) * (w.social?.training_hours ?? defaultWeights.social.training_hours) +
    (normalized.wage_ratio?.normalized ?? 0) * (w.social?.wage_ratio ?? defaultWeights.social.wage_ratio) +
    (normalized.diversity_pct?.normalized ?? 0) * (w.social?.diversity_pct ?? defaultWeights.social.diversity_pct)
  ) * 100;

  // Governance: ALL metrics on 0-100 basis, weighted average
  // Get raw values from supplier or normalized, convert to 0-100
  // Transparency: may be in normalized (0-1) or supplier (0-100 or 0-1)
  const transparency = toZeroToHundred(
    supplier?.transparency_score ?? normalized.transparency_score?.value ?? (normalized.transparency_score?.normalized ?? 0.5) * 100
  ) ?? 50;
  
  // Compliance: may not be in normalized, get from supplier directly
  const compliance = toZeroToHundred(
    supplier?.compliance_systems ?? 50
  ) ?? 50;
  
  // Ethics program: may not be in normalized, get from supplier directly
  const ethicsProgram = toZeroToHundred(
    supplier?.ethics_program ?? 50
  ) ?? 50;
  
  // Board diversity and independence: use scaleTo100 to detect and rescale properly
  const boardDiversityRaw = supplier?.board_diversity ?? normalized.board_diversity?.value ?? normalized.board_diversity?.normalized * 100 ?? 50;
  const boardIndependenceRaw = supplier?.board_independence ?? normalized.board_independence?.value ?? normalized.board_independence?.normalized * 100 ?? 50;
  
  // Scale board metrics to 0-100 using smart detection
  const [boardDiversityScaled, boardIndependenceScaled] = scaleTo100([boardDiversityRaw, boardIndependenceRaw]);
  const boardDiversity = Number.isFinite(boardDiversityScaled) ? Math.max(0, Math.min(100, boardDiversityScaled)) : 50;
  const boardIndependence = Number.isFinite(boardIndependenceScaled) ? Math.max(0, Math.min(100, boardIndependenceScaled)) : 50;
  
  // Anti-corruption: boolean to 0-100
  const antiCorruption = (antiCorruptionScore === 1 || supplier?.anti_corruption_policy === true || supplier?.anti_corruption_policy === 1) ? 100 : 0;

  // Normalize governance weights to sum to 1.0
  const govWeights = normalizeWeights({
    transparency: w.governance?.transparency ?? defaultWeights.governance.transparency,
    compliance: w.governance?.compliance ?? defaultWeights.governance.compliance,
    ethics: w.governance?.ethics ?? defaultWeights.governance.ethics,
    boardDiversity: w.governance?.boardDiversity ?? defaultWeights.governance.boardDiversity,
    boardIndependence: w.governance?.boardIndependence ?? defaultWeights.governance.boardIndependence,
    antiCorruption: w.governance?.antiCorruption ?? defaultWeights.governance.antiCorruption,
  });

  // Governance weighted average (all inputs 0-100, weights sum to 1.0)
  const governance = (
    govWeights.transparency * transparency +
    govWeights.compliance * compliance +
    govWeights.ethics * ethicsProgram +
    govWeights.boardDiversity * boardDiversity +
    govWeights.boardIndependence * boardIndependence +
    govWeights.antiCorruption * antiCorruption
  );

  return {
    environmental: env,
    social,
    governance,
  };
}

function determineRiskLevel(riskFactor) {
  if (riskFactor < 0.2) return "low";
  if (riskFactor < 0.4) return "medium";
  if (riskFactor < 0.6) return "high";
  return "critical";
}

function scoreSupplier(supplier, settings = null) {
  const useIndustryBands = settings?.useIndustryBands !== false; // default true
  const riskPenaltyEnabled = settings?.riskPenaltyEnabled !== false; // default true
  const defaultRiskFactor = settings?.defaultRiskFactor ?? 0.15;

  const { normalized, antiCorruptionScore, completenessRatio } =
    scoreSupplierAgainstBenchmarks(supplier, useIndustryBands);

  // Build weights from settings or use defaults
  const weights = settings ? {
    environmental: {
      emission_intensity: settings.emissionIntensityWeight ?? 0.4,
      renewable_pct: settings.renewableShareWeight ?? 0.2,
      water_intensity: settings.waterIntensityWeight ?? 0.2,
      waste_intensity: settings.wasteIntensityWeight ?? 0.2,
    },
    social: {
      injury_rate: settings.injuryRateWeight ?? 0.3,
      training_hours: settings.trainingHoursWeight ?? 0.2,
      wage_ratio: settings.wageRatioWeight ?? 0.2,
      diversity_pct: settings.diversityWeight ?? 0.3,
    },
    governance: {
      transparency: settings.transparencyWeight ?? 0.25,
      compliance: settings.complianceWeight ?? 0.20,
      ethics: settings.ethicsProgramWeight ?? 0.20,
      boardDiversity: settings.boardDiversityWeight ?? 0.15,
      boardIndependence: settings.boardIndependenceWeight ?? 0.10,
      antiCorruption: settings.antiCorruptionWeight ?? 0.10,
    },
  } : null;

  // Pass supplier to computePillarScores for governance raw value access
  const pillarScores = computePillarScores({ normalized, antiCorruptionScore }, weights, supplier);

  const envWeight = settings?.environmentalWeight ?? 0.4;
  const socialWeight = settings?.socialWeight ?? 0.3;
  const govWeight = settings?.governanceWeight ?? 0.3;

  // Normalize composite weights to sum to 1.0
  const compositeWeights = normalizeWeights({
    environmental: envWeight,
    social: socialWeight,
    governance: govWeight,
  });

  // Composite: weighted average of pillar scores (all on 0-100 scale, weights sum to 1.0)
  const baseComposite =
    pillarScores.environmental * compositeWeights.environmental +
    pillarScores.social * compositeWeights.social +
    pillarScores.governance * compositeWeights.governance;

  // Ensure composite is computed even with missing fields (use defaults/imputation)
  if (isNaN(baseComposite) || baseComposite === null || baseComposite === undefined) {
    console.warn(`[scoring] Composite score could not be computed for supplier ${supplier?.name || supplier?.id || 'unknown'}. Using defaults.`);
    // Use sensible defaults if computation fails
    const defaultComposite = 50;
    const defaultFinalScore = 50;
    return {
      environmental_score: 50,
      social_score: 50,
      governance_score: 50,
      composite_score: defaultComposite,
      finalScore: defaultFinalScore,
      ethical_score: defaultFinalScore,
      risk_factor: 0,
      risk_penalty: 0,
      risk_level: "medium",
      completeness_ratio: completenessRatio,
    };
  }

  // Compute risk penalty using new spec
  const riskPenalty = computeRiskPenalty(supplier, settings);
  
  // Ensure penalty is non-negative (should already be, but guard against negative)
  const safePenalty = Math.max(0, riskPenalty || 0);
  
  // Apply penalty: finalScore = clamp(composite - penalty, 0, 100)
  // Single-apply: only subtract penalty once, never re-penalize
  const finalScore = Math.min(100, Math.max(0, baseComposite - safePenalty));

  // Apply disclosure cap (separate from risk penalty)
  const cappedFinalScore = completenessRatio < 0.7 
    ? Math.min(finalScore, 50) 
    : finalScore;

  // For backward compatibility, also compute risk_factor (0-1) for display
  const riskFactor = riskPenalty !== null 
    ? (riskPenalty / 100) // Convert penalty (0-100) to factor (0-1) for display
    : (riskPenaltyEnabled ? computeRiskFactor(supplier, defaultRiskFactor) : 0);

  const riskLevel = determineRiskLevel(riskFactor);

  // Log completeness ratio (may be noisy if called in bulk)
  try {
    // supplier may include name or id
    const label = supplier?.name || supplier?._id || supplier?.id || 'supplier';
    console.log(`[scoring] completeness_ratio for ${label}: ${completenessRatio}`);
  } catch {}

  return {
    environmental_score: pillarScores.environmental,
    social_score: pillarScores.social,
    governance_score: pillarScores.governance,
    composite_score: baseComposite,
    finalScore: cappedFinalScore, // Final score (post-penalty, post-disclosure cap)
    ethical_score: cappedFinalScore, // Backward compatibility
    risk_factor: riskFactor, // 0-1 for backward compatibility
    risk_penalty: riskPenalty, // 0-100 or null (null = disabled, shows "N/A")
    risk_level: riskLevel,
    completeness_ratio: completenessRatio,
  };
}

(function initialise() {
  // Default generic ranges
  METRIC_KEYS.forEach((metric) => {
    GLOBAL_STATS[metric] = { min: 0, max: 1 };
  });
  INDUSTRY_STATS = {};
  INDUSTRY_AVERAGES = { __global__: METRIC_KEYS.reduce((acc, key) => ({
    ...acc,
    [key]: 0.5,
  }), {}) };

  // Load CSV dataset if present (for compatibility)
  if (fs.existsSync(DATASET_PATH)) {
    const records = parseCSV(DATASET_PATH);
    const { statsByIndustry, industryAverages, globalStats, globalAverages } =
      computeStats(records);

    INDUSTRY_STATS = statsByIndustry;
    INDUSTRY_AVERAGES = { ...industryAverages, __global__: globalAverages };
    GLOBAL_STATS = globalStats;

    try {
      const stat = fs.statSync(DATASET_PATH);
      DATASET_META.generatedAt = stat.mtime.toISOString();
    } catch {}
  } else {
    console.warn(`ESG dataset not found at ${DATASET_PATH}. Using generic ranges.`);
  }

  // If bands JSON exists, prefer it for stats/averages and set metadata
  if (fs.existsSync(BANDS_PATH)) {
    try {
      const bandsRaw = fs.readFileSync(BANDS_PATH, 'utf-8');
      const bandsJson = JSON.parse(bandsRaw);
      applyBandsJson(bandsJson);
      if (bandsJson.seed) DATASET_META.seed = bandsJson.seed;
      DATASET_META.bandsVersion = 'v1';
      if (!DATASET_META.generatedAt) {
        try {
          const st = fs.statSync(BANDS_PATH);
          DATASET_META.generatedAt = st.mtime.toISOString();
        } catch {}
      }
    } catch (e) {
      console.error('Failed to load bands_v1.json:', e.message);
    }
  }
})();

// Export computeRiskPenalty for testing
function computeRiskPenaltyForTesting(supplier, settings) {
  return computeRiskPenalty(supplier, settings);
}

module.exports = {
  scoreSupplier,
  computeRiskPenalty: computeRiskPenaltyForTesting, // Export for testing
  // Expose a richer breakdown for UI explanations
  scoreSupplierWithBreakdown: (supplier, settings = null) => {
    const useIndustryBands = settings?.useIndustryBands !== false;
    const riskPenaltyEnabled = settings?.riskPenaltyEnabled !== false;
    const defaultRiskFactor = settings?.defaultRiskFactor ?? 0.15;

    const { normalized, antiCorruptionScore, completenessRatio } =
      scoreSupplierAgainstBenchmarks(supplier, useIndustryBands);

    // Build weights from settings
    const weights = settings ? {
      environmental: {
        emission_intensity: settings.emissionIntensityWeight ?? 0.4,
        renewable_pct: settings.renewableShareWeight ?? 0.2,
        water_intensity: settings.waterIntensityWeight ?? 0.2,
        waste_intensity: settings.wasteIntensityWeight ?? 0.2,
      },
      social: {
        injury_rate: settings.injuryRateWeight ?? 0.3,
        training_hours: settings.trainingHoursWeight ?? 0.2,
        wage_ratio: settings.wageRatioWeight ?? 0.2,
        diversity_pct: settings.diversityWeight ?? 0.3,
      },
      governance: {
        transparency: settings.transparencyWeight ?? 0.25,
        compliance: settings.complianceWeight ?? 0.20,
        ethics: settings.ethicsProgramWeight ?? 0.20,
        boardDiversity: settings.boardDiversityWeight ?? 0.15,
        boardIndependence: settings.boardIndependenceWeight ?? 0.10,
        antiCorruption: settings.antiCorruptionWeight ?? 0.10,
      },
      composite: {
        environmental: settings.environmentalWeight ?? 0.4,
        social: settings.socialWeight ?? 0.3,
        governance: settings.governanceWeight ?? 0.3,
      },
    } : {
      environmental: {
        emission_intensity: 0.4,
        renewable_pct: 0.2,
        water_intensity: 0.2,
        waste_intensity: 0.2,
      },
      social: {
        injury_rate: 0.3,
        training_hours: 0.2,
        wage_ratio: 0.2,
        diversity_pct: 0.3,
      },
      governance: {
        transparency: 0.25,
        compliance: 0.20,
        ethics: 0.20,
        boardDiversity: 0.15,
        boardIndependence: 0.10,
        antiCorruption: 0.10,
      },
      composite: { environmental: 0.4, social: 0.3, governance: 0.3 },
    };

    const pillarScores = computePillarScores({
      normalized,
      antiCorruptionScore,
    }, weights, supplier);

    // Normalize composite weights to sum to 1.0
    const compositeWeights = normalizeWeights({
      environmental: weights.composite.environmental,
      social: weights.composite.social,
      governance: weights.composite.governance,
    });

    // Composite: weighted average (not sum, weights sum to 1.0)
    const composite =
      pillarScores.environmental * compositeWeights.environmental +
      pillarScores.social * compositeWeights.social +
      pillarScores.governance * compositeWeights.governance;

    // Ensure composite is computed
    if (isNaN(composite) || composite === null || composite === undefined) {
      console.warn(`[scoring] Composite could not be computed for supplier ${supplier?.name || supplier?.id || 'unknown'}`);
      return {
        normalizedMetrics: normalized,
        pillarScores: { environmental: 50, social: 50, governance: 50 },
        weights,
        composite: 50,
        risk: { factor: 0, penalty: 0, level: "medium", enabled: riskPenaltyEnabled },
        completeness_ratio: completenessRatio,
        ethical_score: 50,
        finalScore: 50,
        useIndustryBands,
      };
    }

    // Compute risk penalty using new spec
    const riskPenalty = computeRiskPenalty(supplier, settings);
    
    // Ensure penalty is non-negative (should already be, but guard against negative)
    const safePenalty = Math.max(0, riskPenalty || 0);
    
    // Apply penalty: finalScore = clamp(composite - penalty, 0, 100)
    // Single-apply: only subtract penalty once, never re-penalize
    const finalScore = Math.min(100, Math.max(0, composite - safePenalty));
    
    const finalEthical = completenessRatio < 0.7 ? Math.min(finalScore, 50) : finalScore;
    
    // For display
    const riskFactor = riskPenalty !== null 
      ? (riskPenalty / 100)
      : (riskPenaltyEnabled ? computeRiskFactor(supplier, defaultRiskFactor) : 0);
    const riskLevel = determineRiskLevel(riskFactor);

    return {
      normalizedMetrics: normalized, // map: metric -> { value, normalized, band, imputed }
      pillarScores, // { environmental, social, governance }
      weights,
      composite,
      risk: { 
        factor: riskFactor, 
        penalty: riskPenalty, // 0-100 or null
        level: riskLevel, 
        enabled: riskPenaltyEnabled 
      },
      completeness_ratio: completenessRatio,
      ethical_score: finalEthical,
      useIndustryBands,
    };
  },
  getDatasetMeta: () => ({ ...DATASET_META }),
  loadDatasetForTesting: () => ({
    INDUSTRY_STATS,
    INDUSTRY_AVERAGES,
    GLOBAL_STATS,
  }),
};
