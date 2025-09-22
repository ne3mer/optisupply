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

function getMetricBand(metric, industry) {
  const industryStats = INDUSTRY_STATS[industry];
  if (industryStats && industryStats[metric]) {
    return industryStats[metric];
  }
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
  if (max === min) return 1;
  const clamped = clamp(value, min, max);
  return (max - clamped) / (max - min);
}

function normalizeHigherIsBetter(value, band) {
  if (value === null || value === undefined) return null;
  const { min, max } = band;
  if (max === min) return 1;
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

function computeRiskFactor(supplier) {
  const risks = [
    toNumber(supplier.climate_risk),
    toNumber(supplier.geopolitical_risk),
    toNumber(supplier.labor_dispute_risk),
  ].filter((value) => typeof value === "number" && !Number.isNaN(value));

  if (!risks.length) return 0.2; // moderate default
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

function scoreSupplierAgainstBenchmarks(supplier) {
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

    const band = getMetricBand(metric, industry);
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

function computePillarScores(normalizedMetrics) {
  const { normalized, antiCorruptionScore } = normalizedMetrics;

  const env = (
    (normalized.emission_intensity?.normalized ?? 0) * 0.4 +
    (normalized.renewable_pct?.normalized ?? 0) * 0.2 +
    (normalized.water_intensity?.normalized ?? 0) * 0.2 +
    (normalized.waste_intensity?.normalized ?? 0) * 0.2
  ) * 100;

  const social = (
    (normalized.injury_rate?.normalized ?? 0) * 0.3 +
    (normalized.training_hours?.normalized ?? 0) * 0.2 +
    (normalized.wage_ratio?.normalized ?? 0) * 0.2 +
    (normalized.diversity_pct?.normalized ?? 0) * 0.3
  ) * 100;

  const governance = (
    (normalized.board_diversity?.normalized ?? 0) * 0.25 +
    (normalized.board_independence?.normalized ?? 0) * 0.25 +
    antiCorruptionScore * 0.2 +
    (normalized.transparency_score?.normalized ?? 0) * 0.3
  ) * 100;

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

function scoreSupplier(supplier) {
  const { normalized, antiCorruptionScore, completenessRatio } =
    scoreSupplierAgainstBenchmarks(supplier);

  const pillarScores = computePillarScores({ normalized, antiCorruptionScore });

  const baseComposite =
    pillarScores.environmental * 0.4 +
    pillarScores.social * 0.3 +
    pillarScores.governance * 0.3;

  const riskFactor = computeRiskFactor(supplier);
  const riskAdjusted = baseComposite * (1 - riskFactor);

  let finalScore = riskAdjusted;
  if (completenessRatio < 0.7) {
    finalScore = Math.min(finalScore, 50);
  }

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
    ethical_score: finalScore,
    risk_factor: riskFactor,
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

module.exports = {
  scoreSupplier,
  getDatasetMeta: () => ({ ...DATASET_META }),
  loadDatasetForTesting: () => ({
    INDUSTRY_STATS,
    INDUSTRY_AVERAGES,
    GLOBAL_STATS,
  }),
};
