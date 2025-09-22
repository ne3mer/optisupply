#!/usr/bin/env node
/*
  Synthetic ESG Data Generator
  - Generates 120 suppliers across 4 industries: Apparel, Electronics, Food Retail, Logistics.
  - Enforces correlations:
      * higher renewable_pct -> slightly lower emission_intensity
      * higher training_hours -> slightly lower injury_rate
      * anti_corruption_policy + higher transparency_score -> lower corruption_risk (for suppliers_seed.csv)
  - Introduces ~15% missingness across non-critical fields.
  - Uses a fixed seed for reproducibility (override with --seed or SEED env).
  - Outputs:
      1) ethicsupply-node-backend/data/sample_esg_dataset.csv (model training/benchmarks)
      2) ethicsupply-node-backend/data/suppliers_seed.csv (auditable raw fields)
      3) ethicsupply-node-backend/data/bands_v1.json (min/max/avg bands per industry)
*/

const fs = require('fs');
const path = require('path');

// ---------- Utilities ----------
function hashStringToInt(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function choice(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function randRange(rng, min, max) {
  return min + (max - min) * rng();
}

function randInt(rng, min, max) {
  return Math.floor(randRange(rng, min, max + 1));
}

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

// Simple normal via Box-Muller
function randNormal(rng, mean = 0, std = 1) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * std;
}

// ---------- Config ----------
const args = process.argv.slice(2);
let seed = process.env.SEED || 'optiethic-seed-1';
let bandsPathArg = null;
let anchorsPathArg = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--seed' && args[i+1]) seed = args[i+1];
  if (args[i] === '--bands' && args[i+1]) bandsPathArg = args[i+1];
  if (args[i] === '--anchors' && args[i+1]) anchorsPathArg = args[i+1];
}
const rng = mulberry32(hashStringToInt(String(seed)));

const INDUSTRIES = [
  'Apparel', 'Electronics', 'Food Retail', 'Logistics'
];

// Per-industry parameter ranges (reasonable defaults; adjustable later)
const industryParams = {
  'Apparel': {
    revenueM: [3000, 12000],      // revenue in millions, aligns with existing dataset magnitudes
    employees: [1500, 30000],
    emissionIntensity: [15, 35],  // emissions per revenue unit
    waterIntensity: [3, 12],
    wasteIntensity: [0.5, 3],
    renewablePct: [20, 60],       // percent [0..100]
    trainingHours: [12, 36],
    injuryRate: [0.8, 3.2],       // incidents per some scale
    wageRatio: [0.8, 1.15],
    diversityPct: [25, 55],
    boardDiversity: [20, 60],
    boardIndependence: [30, 70],
    transparency: [45, 85],
    antiCorruptionProb: 0.75,
    climateRisk: [0.3, 0.7],
    geoRisk: [0.4, 0.8],
    laborRisk: [0.3, 0.7],
  },
  'Electronics': {
    revenueM: [5000, 16000],
    employees: [2000, 40000],
    emissionIntensity: [20, 60],
    waterIntensity: [5, 20],
    wasteIntensity: [0.8, 4],
    renewablePct: [15, 55],
    trainingHours: [14, 40],
    injuryRate: [0.5, 2.5],
    wageRatio: [0.85, 1.2],
    diversityPct: [20, 50],
    boardDiversity: [25, 65],
    boardIndependence: [35, 75],
    transparency: [50, 90],
    antiCorruptionProb: 0.85,
    climateRisk: [0.2, 0.6],
    geoRisk: [0.3, 0.7],
    laborRisk: [0.2, 0.5],
  },
  'Food Retail': {
    revenueM: [4000, 14000],
    employees: [2500, 50000],
    emissionIntensity: [25, 80],
    waterIntensity: [10, 40],
    wasteIntensity: [1, 5],
    renewablePct: [10, 50],
    trainingHours: [10, 30],
    injuryRate: [0.7, 3.0],
    wageRatio: [0.8, 1.1],
    diversityPct: [30, 55],
    boardDiversity: [20, 60],
    boardIndependence: [30, 70],
    transparency: [40, 80],
    antiCorruptionProb: 0.8,
    climateRisk: [0.3, 0.7],
    geoRisk: [0.2, 0.6],
    laborRisk: [0.2, 0.5],
  },
  'Logistics': {
    revenueM: [3000, 12000],
    employees: [1500, 30000],
    emissionIntensity: [40, 120],
    waterIntensity: [2, 8],
    wasteIntensity: [0.3, 1.5],
    renewablePct: [10, 40],
    trainingHours: [10, 28],
    injuryRate: [0.9, 3.5],
    wageRatio: [0.85, 1.15],
    diversityPct: [20, 50],
    boardDiversity: [20, 55],
    boardIndependence: [30, 70],
    transparency: [40, 80],
    antiCorruptionProb: 0.7,
    climateRisk: [0.4, 0.8],
    geoRisk: [0.3, 0.7],
    laborRisk: [0.3, 0.6],
  }
};

const countriesByIndustry = {
  'Apparel': ['Bangladesh', 'Vietnam', 'India', 'China', 'Turkey'],
  'Electronics': ['China', 'Taiwan', 'South Korea', 'Vietnam', 'Malaysia', 'Mexico'],
  'Food Retail': ['United States', 'United Kingdom', 'Germany', 'France', 'Spain', 'Brazil'],
  'Logistics': ['United States', 'Germany', 'Netherlands', 'Singapore', 'United Arab Emirates', 'China']
};

// Non-critical fields for missingness (15%) — keep IDs, name, country, industry, revenue, employees, emissions intact
const MISSINGNESS_FIELDS_CSV = [
  'renewable_pct', 'water_use', 'waste', 'injury_rate', 'training_hours', 'wage_ratio',
  'diversity_pct', 'board_diversity', 'board_independence', 'transparency_score'
  // anti_corruption omitted to keep boolean consistently present
];

const MISSINGNESS_FIELDS_SEED = [
  'renewable_energy_percent', 'water_usage', 'waste_generated', 'injury_rate', 'training_hours',
  'living_wage_ratio', 'gender_diversity_percent', 'board_diversity', 'board_independence', 'transparency_score'
  // keep anti_corruption_policy present
];

const MISSINGNESS_RATE = 0.15;

// ---------- Optional: Load ranges from bands table ----------
function widenRange(min, max, padRatio = 0.05) {
  if (min === null || max === null || min === '' || max === '') return null;
  min = Number(min); max = Number(max);
  if (!isFinite(min) || !isFinite(max)) return null;
  if (max === min) {
    const delta = Math.max(Math.abs(min) * padRatio, 1e-6);
    return [min - delta, max + delta];
  }
  return [min, max];
}

function applyBandsToIndustryParams(bandsObj) {
  // Accept either {bands:{Industry:{metric:{min,max,avg}}}} or {Industry:{metric:{min,max,avg}}}
  const root = bandsObj.bands ? bandsObj.bands : bandsObj;
  const metricMap = [
    ['emission_intensity', 'emissionIntensity'],
    ['water_intensity', 'waterIntensity'],
    ['waste_intensity', 'wasteIntensity'],
    ['renewable_pct', 'renewablePct'],
    ['injury_rate', 'injuryRate'],
    ['training_hours', 'trainingHours'],
    ['wage_ratio', 'wageRatio'],
    ['diversity_pct', 'diversityPct'],
    ['board_diversity', 'boardDiversity'],
    ['board_independence', 'boardIndependence'],
    ['transparency_score', 'transparency'],
  ];

  for (const ind of Object.keys(industryParams)) {
    const indBands = root[ind];
    if (!indBands) continue;
    for (const [bandsKey, paramKey] of metricMap) {
      const entry = indBands[bandsKey];
      if (!entry || entry.min === undefined || entry.max === undefined) continue;
      const r = widenRange(entry.min, entry.max);
      if (!r) continue;
      // Some metrics are percent-like; keep as-is (assumed same unit in bands)
      industryParams[ind][paramKey] = r;
    }
  }
}

// ---------- Optional: Anchors blending ----------
const ANCHOR_ALPHA = 0.2; // fixed per requirement

function loadAnchors(anchorsJson) {
  // Accept either {anchors:{Industry:{metric:mean}}} or {Industry:{metric:mean}}
  return anchorsJson.anchors ? anchorsJson.anchors : anchorsJson;
}

function resampleTail(value, min, max) {
  if (value < min) {
    // resample near lower tail within band
    return min + (max - min) * (0.01 + 0.04 * rng());
  }
  if (value > max) {
    // resample near upper tail within band
    return max - (max - min) * (0.01 + 0.04 * rng());
  }
  return value;
}

function applyAnchorsToSample(industry, values, anchors) {
  // values contains: renewable_pct, emissionIntensity, waterIntensity, wasteIntensity, revenue, etc.
  // anchors is a map { metric: mean }
  const indAnchors = anchors[industry];
  if (!indAnchors) return values;

  const params = industryParams[industry] || {};

  // renewable_pct (percent 0..100 range)
  if (typeof indAnchors.renewable_pct === 'number') {
    const band = params.renewablePct || [0, 100];
    let blended = ANCHOR_ALPHA * indAnchors.renewable_pct + (1 - ANCHOR_ALPHA) * values.renewable_pct;
    blended = resampleTail(blended, band[0], band[1]);
    values.renewable_pct = clamp(blended, band[0], band[1]);
  }

  // emission_intensity (apply on intensity, then recompute emissions)
  if (typeof indAnchors.emission_intensity === 'number') {
    const band = params.emissionIntensity || [values.emissionIntensity * 0.8, values.emissionIntensity * 1.2];
    let blended = ANCHOR_ALPHA * indAnchors.emission_intensity + (1 - ANCHOR_ALPHA) * values.emissionIntensity;
    blended = resampleTail(blended, band[0], band[1]);
    values.emissionIntensity = clamp(blended, band[0], band[1]);
    values.emissions = Math.max(0, Math.round(values.emissionIntensity * values.revenue));
  }

  // water_intensity -> adjust water_use
  if (typeof indAnchors.water_intensity === 'number') {
    const band = params.waterIntensity || [values.waterIntensity * 0.8, values.waterIntensity * 1.2];
    let blended = ANCHOR_ALPHA * indAnchors.water_intensity + (1 - ANCHOR_ALPHA) * values.waterIntensity;
    blended = resampleTail(blended, band[0], band[1]);
    values.waterIntensity = clamp(blended, band[0], band[1]);
    values.water_use = Math.max(0, Math.round(values.waterIntensity * values.revenue));
  }

  // waste_intensity -> adjust waste
  if (typeof indAnchors.waste_intensity === 'number') {
    const band = params.wasteIntensity || [values.wasteIntensity * 0.8, values.wasteIntensity * 1.2];
    let blended = ANCHOR_ALPHA * indAnchors.waste_intensity + (1 - ANCHOR_ALPHA) * values.wasteIntensity;
    blended = resampleTail(blended, band[0], band[1]);
    values.wasteIntensity = clamp(blended, band[0], band[1]);
    values.waste = Math.max(0, Math.round(values.wasteIntensity * values.revenue));
  }

  return values;
}

// ---------- Generation ----------
const TOTAL = 120;
const PER_INDUSTRY = TOTAL / INDUSTRIES.length; // 30 each

function maybeMissing(field, value, fields, rng) {
  if (!fields.includes(field)) return value;
  return rng() < MISSINGNESS_RATE ? '' : value;
}

function generateSupplier(industry, idx, rng) {
  const p = industryParams[industry];
  const country = choice(rng, countriesByIndustry[industry]);
  const companyId = `${industry[0]}${String(idx + 1).padStart(3, '0')}`;
  const companyName = `${industry}Corp ${String(idx + 1).padStart(3, '0')}`;

  const revenue = Math.round(randRange(rng, p.revenueM[0], p.revenueM[1]));
  const employees = Math.round(randRange(rng, p.employees[0], p.employees[1]));

  // Renewable percent and correlation: more renewables → lower emissions intensity
  const renewable_pct = clamp(randNormal(rng, (p.renewablePct[0] + p.renewablePct[1]) / 2, 8), p.renewablePct[0], p.renewablePct[1]);
  const renewNorm = renewable_pct / 100;

  // Base emission intensity then reduce with renewables (alpha)
  const baseEI = randRange(rng, p.emissionIntensity[0], p.emissionIntensity[1]);
  const emissionIntensity = clamp(baseEI * (1 - 0.25 * renewNorm) + randNormal(rng, 0, baseEI * 0.05), p.emissionIntensity[0] * 0.8, p.emissionIntensity[1] * 1.1);
  const emissions = Math.max(0, Math.round(emissionIntensity * revenue));

  // Water & waste intensities
  const baseWI = randRange(rng, p.waterIntensity[0], p.waterIntensity[1]);
  const waterIntensity = clamp(baseWI * (1 - 0.05 * renewNorm) + randNormal(rng, 0, baseWI * 0.05), p.waterIntensity[0] * 0.8, p.waterIntensity[1] * 1.1);
  const water_use = Math.max(0, Math.round(waterIntensity * revenue));

  const baseWaI = randRange(rng, p.wasteIntensity[0], p.wasteIntensity[1]);
  const wasteIntensity = clamp(baseWaI + randNormal(rng, 0, baseWaI * 0.05), p.wasteIntensity[0] * 0.8, p.wasteIntensity[1] * 1.1);
  const waste = Math.max(0, Math.round(wasteIntensity * revenue));

  // Training and injury correlation: more training → less injury
  const training_hours = clamp(randRange(rng, p.trainingHours[0], p.trainingHours[1]), p.trainingHours[0], p.trainingHours[1]);
  const trainNorm = (training_hours - p.trainingHours[0]) / (p.trainingHours[1] - p.trainingHours[0] || 1);
  const baseInjury = randRange(rng, p.injuryRate[0], p.injuryRate[1]);
  const injury_rate = clamp(baseInjury * (1 - 0.35 * trainNorm) + randNormal(rng, 0, baseInjury * 0.07), 0, p.injuryRate[1]);

  // Wage ratio, diversity, board metrics
  const wage_ratio = clamp(randNormal(rng, (p.wageRatio[0] + p.wageRatio[1]) / 2, 0.06), p.wageRatio[0], p.wageRatio[1]);
  const diversity_pct = clamp(randNormal(rng, (p.diversityPct[0] + p.diversityPct[1]) / 2, 6), p.diversityPct[0], p.diversityPct[1]);
  const board_diversity = clamp(randNormal(rng, (p.boardDiversity[0] + p.boardDiversity[1]) / 2, 7), p.boardDiversity[0], p.boardDiversity[1]);
  const board_independence = clamp(randNormal(rng, (p.boardIndependence[0] + p.boardIndependence[1]) / 2, 7), p.boardIndependence[0], p.boardIndependence[1]);
  const transparency_score = clamp(randNormal(rng, (p.transparency[0] + p.transparency[1]) / 2, 6), p.transparency[0], p.transparency[1]);
  const anti_corruption_policy = rng() < p.antiCorruptionProb ? 1 : 0;

  // Risks (0..1)
  const climate_risk = clamp(randNormal(rng, (p.climateRisk[0] + p.climateRisk[1]) / 2, 0.08), 0, 1);
  const geo_risk = clamp(randNormal(rng, (p.geoRisk[0] + p.geoRisk[1]) / 2, 0.08), 0, 1);
  const labor_risk = clamp(randNormal(rng, (p.laborRisk[0] + p.laborRisk[1]) / 2, 0.07), 0, 1);

  // Corruption risk (0..1) for suppliers_seed.csv (not part of training CSV schema)
  // Base around 0.4..0.7 depending on transparency and policy
  let corruption_risk = clamp(0.55 - 0.2 * (transparency_score / 100) - 0.15 * anti_corruption_policy + randNormal(rng, 0, 0.07), 0, 1);

  // Map to suppliers_seed fields
  const supplierSeed = {
    name: companyName,
    country,
    industry,
    revenue,
    employees,
    total_emissions: emissions,
    co2_emissions: emissions,
    water_usage: water_use,
    waste_generated: waste,
    renewable_energy_percent: renewable_pct,
    injury_rate: Number(injury_rate.toFixed(3)),
    training_hours: Number(training_hours.toFixed(2)),
    living_wage_ratio: Number(wage_ratio.toFixed(3)),
    gender_diversity_percent: Number(diversity_pct.toFixed(2)),
    board_diversity: Number(board_diversity.toFixed(2)),
    board_independence: Number(board_independence.toFixed(2)),
    transparency_score: Number(transparency_score.toFixed(2)),
    anti_corruption_policy: anti_corruption_policy ? true : false,
    climate_risk: Number(climate_risk.toFixed(3)),
    geopolitical_risk: Number(geo_risk.toFixed(3)),
    labor_dispute_risk: Number(labor_risk.toFixed(3)),
    corruption_risk: Number(corruption_risk.toFixed(3)),
  };

  // Map to training/benchmark CSV schema
  const trainingCsv = {
    revenue,
    employees,
    emissions,                     // absolute emissions
    renewable_pct: Number(renewable_pct.toFixed(2)),
    water_use: water_use,
    waste: waste,
    injury_rate: Number(injury_rate.toFixed(3)),
    training_hours: Number(training_hours.toFixed(2)),
    wage_ratio: Number(wage_ratio.toFixed(3)),
    diversity_pct: Number(diversity_pct.toFixed(2)),
    board_diversity: Number(board_diversity.toFixed(2)),
    board_independence: Number(board_independence.toFixed(2)),
    anti_corruption: anti_corruption_policy ? 1 : 0,
    transparency_score: Number(transparency_score.toFixed(2)),
    climate_risk: Number(climate_risk.toFixed(3)),
    geo_risk: Number(geo_risk.toFixed(3)),
    labor_risk: Number(labor_risk.toFixed(3)),
    company_id: companyId,
    company_name: companyName,
    industry,
  };

  // Apply missingness to non-critical fields
  for (const f of MISSINGNESS_FIELDS_CSV) {
    trainingCsv[f] = maybeMissing(f, trainingCsv[f], MISSINGNESS_FIELDS_CSV, rng);
  }
  for (const f of MISSINGNESS_FIELDS_SEED) {
    supplierSeed[f] = maybeMissing(f, supplierSeed[f], MISSINGNESS_FIELDS_SEED, rng);
  }

  return { supplierSeed, trainingCsv };
}

function computeBands(rows) {
  // rows: array of trainingCsv rows
  // return { [industry]: { metric: {min,max,avg} } }
  const metrics = [
    'emission_intensity', 'renewable_pct', 'water_intensity', 'waste_intensity',
    'injury_rate', 'training_hours', 'wage_ratio', 'diversity_pct',
    'board_diversity', 'board_independence', 'transparency_score'
  ];
  const byIndustry = {};

  for (const r of rows) {
    const ind = r.industry;
    if (!byIndustry[ind]) byIndustry[ind] = {};

    // derive intensities
    const revenue = Number(r.revenue);
    const emissions = Number(r.emissions);
    const water_use = Number(r.water_use);
    const waste = Number(r.waste);
    const ei = revenue && emissions ? emissions / revenue : null;
    const wi = revenue && water_use ? water_use / revenue : null;
    const wasi = revenue && waste ? waste / revenue : null;

    const values = {
      emission_intensity: isFinite(ei) ? ei : null,
      renewable_pct: r.renewable_pct === '' ? null : Number(r.renewable_pct),
      water_intensity: isFinite(wi) ? wi : null,
      waste_intensity: isFinite(wasi) ? wasi : null,
      injury_rate: r.injury_rate === '' ? null : Number(r.injury_rate),
      training_hours: r.training_hours === '' ? null : Number(r.training_hours),
      wage_ratio: r.wage_ratio === '' ? null : Number(r.wage_ratio),
      diversity_pct: r.diversity_pct === '' ? null : Number(r.diversity_pct),
      board_diversity: r.board_diversity === '' ? null : Number(r.board_diversity),
      board_independence: r.board_independence === '' ? null : Number(r.board_independence),
      transparency_score: r.transparency_score === '' ? null : Number(r.transparency_score),
    };

    for (const m of metrics) {
      const v = values[m];
      if (v === null || Number.isNaN(v)) continue;
      if (!byIndustry[ind][m]) byIndustry[ind][m] = { min: v, max: v, sum: 0, count: 0 };
      const s = byIndustry[ind][m];
      s.min = Math.min(s.min, v);
      s.max = Math.max(s.max, v);
      s.sum += v;
      s.count += 1;
    }
  }

  // finalize avg
  const result = {};
  for (const [ind, obj] of Object.entries(byIndustry)) {
    result[ind] = {};
    for (const [m, s] of Object.entries(obj)) {
      result[ind][m] = {
        min: Number(s.min.toFixed(4)),
        max: Number(s.max.toFixed(4)),
        avg: Number((s.sum / (s.count || 1)).toFixed(4)),
      };
    }
  }
  return result;
}

// ---------- Main ----------
(function main() {
  const outDir = path.join(process.cwd(), 'ethicsupply-node-backend', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  if (bandsPathArg) {
    const p = path.isAbsolute(bandsPathArg) ? bandsPathArg : path.join(process.cwd(), bandsPathArg);
    if (!fs.existsSync(p)) {
      console.error(`Bands file not found: ${p}`);
      process.exit(1);
    }
    try {
      const raw = fs.readFileSync(p, 'utf-8');
      const bandsJson = JSON.parse(raw);
      applyBandsToIndustryParams(bandsJson);
      console.log(`Applied bands from ${p}`);
    } catch (e) {
      console.error('Failed to parse bands JSON:', e.message);
      process.exit(1);
    }
  }

  const trainingHeader = [
    'revenue','employees','emissions','renewable_pct','water_use','waste','injury_rate','training_hours','wage_ratio','diversity_pct','board_diversity','board_independence','anti_corruption','transparency_score','climate_risk','geo_risk','labor_risk','company_id','company_name','industry'
  ];

  const seedHeader = [
    'name','country','industry','revenue','employees','total_emissions','co2_emissions','water_usage','waste_generated','renewable_energy_percent','injury_rate','training_hours','living_wage_ratio','gender_diversity_percent','board_diversity','board_independence','transparency_score','anti_corruption_policy','climate_risk','geopolitical_risk','labor_dispute_risk','corruption_risk'
  ];

  const trainingRows = [];
  const seedRows = [];

  let anchors = null;
  if (anchorsPathArg) {
    const p = path.isAbsolute(anchorsPathArg) ? anchorsPathArg : path.join(process.cwd(), anchorsPathArg);
    if (!fs.existsSync(p)) {
      console.error(`Anchors file not found: ${p}`);
      process.exit(1);
    }
    try {
      const raw = fs.readFileSync(p, 'utf-8');
      anchors = loadAnchors(JSON.parse(raw));
      console.log(`Applied anchors from ${p} with alpha=${ANCHOR_ALPHA}`);
    } catch (e) {
      console.error('Failed to parse anchors JSON:', e.message);
      process.exit(1);
    }
  }

  for (const ind of INDUSTRIES) {
    for (let i = 0; i < PER_INDUSTRY; i++) {
      let { supplierSeed, trainingCsv } = generateSupplier(ind, i, rng);

      // If anchors present, blend select metrics toward anchor means
      if (anchors) {
        // Build a values object to adjust
        const values = {
          renewable_pct: trainingCsv.renewable_pct === '' ? null : Number(trainingCsv.renewable_pct),
          revenue: Number(trainingCsv.revenue),
          emissions: Number(trainingCsv.emissions),
          water_use: trainingCsv.water_use === '' ? null : Number(trainingCsv.water_use),
          waste: trainingCsv.waste === '' ? null : Number(trainingCsv.waste),
        };
        values.emissionIntensity = values.revenue && values.emissions ? values.emissions / values.revenue : null;
        values.waterIntensity = values.revenue && values.water_use ? values.water_use / values.revenue : null;
        values.wasteIntensity = values.revenue && values.waste ? values.waste / values.revenue : null;

        // Only apply if we have required values
        const adjusted = applyAnchorsToSample(ind, values, anchors);

        // Write back into rows (respect missingness: if field was missing, keep it missing)
        if (trainingCsv.renewable_pct !== '' && adjusted.renewable_pct != null) {
          trainingCsv.renewable_pct = Number(adjusted.renewable_pct.toFixed(2));
          supplierSeed.renewable_energy_percent = Number(adjusted.renewable_pct.toFixed(2));
        }
        if (adjusted.emissions != null) {
          trainingCsv.emissions = adjusted.emissions;
          supplierSeed.total_emissions = adjusted.emissions;
          supplierSeed.co2_emissions = adjusted.emissions;
        }
        if (trainingCsv.water_use !== '' && adjusted.water_use != null) {
          trainingCsv.water_use = adjusted.water_use;
          supplierSeed.water_usage = adjusted.water_use;
        }
        if (trainingCsv.waste !== '' && adjusted.waste != null) {
          trainingCsv.waste = adjusted.waste;
          supplierSeed.waste_generated = adjusted.waste;
        }
      }
      trainingRows.push(trainingCsv);
      seedRows.push(supplierSeed);
    }
  }

  // Write training CSV
  const trainingPath = path.join(outDir, 'sample_esg_dataset.csv');
  const trainingLines = [trainingHeader.join(',')];
  for (const r of trainingRows) {
    const line = trainingHeader.map((h) => r[h] !== undefined ? r[h] : '').join(',');
    trainingLines.push(line);
  }
  fs.writeFileSync(trainingPath, trainingLines.join('\n'));

  // Write seed CSV
  const seedPath = path.join(outDir, 'suppliers_seed.csv');
  const seedLines = [seedHeader.join(',')];
  for (const r of seedRows) {
    const line = seedHeader.map((h) => r[h] !== undefined ? r[h] : '').join(',');
    seedLines.push(line);
  }
  fs.writeFileSync(seedPath, seedLines.join('\n'));

  // Compute and write bands JSON
  const bands = computeBands(trainingRows);
  const bandsPath = path.join(outDir, 'bands_v1.json');
  fs.writeFileSync(bandsPath, JSON.stringify({ seed, bands }, null, 2));

  console.log('Synthetic ESG data generated:');
  console.log(`- ${trainingPath}`);
  console.log(`- ${seedPath}`);
  console.log(`- ${bandsPath}`);

  // Write calibration note if anchors applied
  if (anchorsPathArg) {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const notePath = path.join(reportsDir, 'calibration_note.md');
    const lines = [];
    lines.push('# Calibration Note');
    lines.push('');
    lines.push(`- Date: ${new Date().toISOString()}`);
    lines.push(`- Seed: ${seed}`);
    lines.push(`- Bands file: ${bandsPathArg ? bandsPathArg : '(defaults or live-computed)'}`);
    lines.push(`- Anchors file: ${anchorsPathArg}`);
    lines.push(`- Blending alpha: ${ANCHOR_ALPHA}`);
    lines.push('');
    lines.push('Blending formula per metric: new = alpha * anchor_mean + (1 - alpha) * synthetic_value');
    lines.push('After blending, extreme values are lightly resampled to remain within bands.');
    lines.push('');
    lines.push('## Applied Anchors');
    lines.push('');
    lines.push('```json');
    try {
      const anchorsRaw = fs.readFileSync(path.isAbsolute(anchorsPathArg) ? anchorsPathArg : path.join(process.cwd(), anchorsPathArg), 'utf-8');
      lines.push(anchorsRaw.trim());
    } catch (e) {
      lines.push(JSON.stringify(anchors, null, 2));
    }
    lines.push('```');
    fs.writeFileSync(notePath, lines.join('\n'));
    console.log(`- ${notePath}`);
  }
})();
