#!/usr/bin/env node
/*
  Prepare grocers ESG dataset for the app.
  - Reads a CSV file with the schema provided by the user
  - Validates and normalizes records
  - Optionally converts GBP revenues to USD (millions)
  - Computes completeness and simple intensity metrics
  - Emits:
      - <input>.cleaned.json (original columns + appended fields)
      - <input>.summary.csv  (QA table)
      - <input>.suppliers.json (mapped to backend Supplier schema)
      - <input>.log.txt (missing critical fields)
*/

const fs = require('fs');
const path = require('path');

// Configurable exchange rate for revenue (millions)
const EX_RATE_GBP_USD = 1.27;
const BANDS_PATH = path.join(__dirname, '..', 'ethicsupply-node-backend', 'data', 'bands_v1.json');
const TARGET_INDUSTRY = 'Food Retail';
const GBP_COMPANIES = new Set(['Tesco PLC', 'J Sainsbury plc']);
const RISK_DEFAULT = 0.5; // default 0..1 when risk is missing

function parseCSV(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { // escaped quote
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += c;
        i++;
        continue;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (c === ',') {
        row.push(field);
        field = '';
        i++;
        continue;
      }
      if (c === '\n' || c === '\r') {
        // commit row if non-empty
        if (field.length || row.length) {
          row.push(field);
          rows.push(row);
        }
        // skip CRLF
        if (c === '\r' && text[i + 1] === '\n') i++;
        field = '';
        row = [];
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toNumber(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function normalizeBooleanLike(v) {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim().toLowerCase();
  if (s === '1' || s === 'true' || s === 'yes' || s === 'y') return 1;
  return 0;
}

function clamp01maybe(n) {
  if (n === null) return null;
  if (n > 1 && n <= 100) return n / 100;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function toUnit01(n) {
  if (n === null || n === undefined) return null;
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  if (v <= 1) return v;
  if (v <= 100) return +(v / 100).toFixed(4);
  return null;
}

function loadBands() {
  try {
    const raw = JSON.parse(fs.readFileSync(BANDS_PATH, 'utf-8'));
    return raw && raw.bands ? raw.bands : raw;
  } catch (e) {
    console.warn('Bands not found or invalid; skipping band-based imputation');
    return null;
  }
}

function bandMedian(bands, industry, key) {
  if (!bands) return null;
  const entry = bands[industry] && bands[industry][key];
  if (!entry) return null;
  if (typeof entry.avg === 'number') return entry.avg;
  if (typeof entry.min === 'number' && typeof entry.max === 'number') return (entry.min + entry.max) / 2;
  return null;
}

function main() {
  const input = process.argv[2] || path.join(__dirname, '..', 'ethicsupply-node-backend', 'data', 'grocers_esg_public_core.csv');
  const text = fs.readFileSync(input, 'utf-8');
  const rows = parseCSV(text).filter(r => r.length && r.some(c => c && String(c).trim() !== ''));
  if (!rows.length) throw new Error('CSV seems empty');
  const headers = rows[0].map(h => String(h).trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const bands = loadBands();

  const REQUIRED = [
    'revenue', 'emissions', 'renewable_pct', 'water_use', 'waste', 'injury_rate', 'training_hours',
    'wage_ratio', 'diversity_pct', 'board_diversity', 'board_independence', 'anti_corruption', 'transparency_score'
  ];

  const out = [];
  const missingLog = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rec = Object.fromEntries(headers.map((h, i) => [h, row[i] !== undefined ? row[i] : '']));

    // Coerce types
    const record = {
      revenue: toNumber(rec.revenue),
      employees: toNumber(rec.employees),
      emissions: toNumber(rec.emissions),
      renewable_pct: toNumber(rec.renewable_pct),
      water_use: toNumber(rec.water_use),
      waste: toNumber(rec.waste),
      injury_rate: toNumber(rec.injury_rate),
      training_hours: toNumber(rec.training_hours),
      wage_ratio: toNumber(rec.wage_ratio),
      diversity_pct: toNumber(rec.diversity_pct),
      board_diversity: toNumber(rec.board_diversity),
      board_independence: toNumber(rec.board_independence),
      anti_corruption: normalizeBooleanLike(rec.anti_corruption),
      transparency_score: toNumber(rec.transparency_score),
      climate_risk: toNumber(rec.climate_risk),
      geo_risk: toNumber(rec.geo_risk),
      labor_risk: toNumber(rec.labor_risk),
      company_id: String(rec.company_id || '').trim(),
      company_name: String(rec.company_name || '').trim(),
      industry: String(rec.industry || '').trim(),
      notes: String(rec.notes || '').trim(),
    };

    // Optional: convert GBP revenues to USD for Tesco and Sainsbury's
    if (GBP_COMPANIES.has(record.company_name) && record.revenue !== null) {
      record.revenue = Number((record.revenue * EX_RATE_GBP_USD).toFixed(2));
      record.notes = record.notes ? `${record.notes} | revenue normalized to USD @${EX_RATE_GBP_USD}` : `revenue normalized to USD @${EX_RATE_GBP_USD}`;
    }

    // Band-based imputation (Food Retail) to achieve completeness
    const industry = record.industry || TARGET_INDUSTRY;
    const rev = record.revenue; // millions
    const maybeSet = (k, v, tag) => {
      if (record[k] === null || record[k] === undefined || record[k] === '') {
        if (v !== null && v !== undefined) {
          record[k] = v;
          record.notes = record.notes ? `${record.notes} [imputed:${k}=${tag}]` : `[imputed:${k}=${tag}]`;
        }
      }
    };

    // Simple direct metrics from bands
    maybeSet('renewable_pct', bandMedian(bands, industry, 'renewable_pct'), `median(${industry})`);
    maybeSet('injury_rate', bandMedian(bands, industry, 'injury_rate'), `median(${industry})`);
    maybeSet('training_hours', bandMedian(bands, industry, 'training_hours'), `median(${industry})`);
    maybeSet('wage_ratio', bandMedian(bands, industry, 'wage_ratio'), `median(${industry})`);
    maybeSet('diversity_pct', bandMedian(bands, industry, 'diversity_pct'), `median(${industry})`);
    maybeSet('board_diversity', bandMedian(bands, industry, 'board_diversity'), `median(${industry})`);
    maybeSet('board_independence', bandMedian(bands, industry, 'board_independence'), `median(${industry})`);
    maybeSet('transparency_score', bandMedian(bands, industry, 'transparency_score'), `median(${industry})`);

    // Anti-corruption default to 1 if missing
    if (record.anti_corruption === null || record.anti_corruption === undefined) {
      record.anti_corruption = 1;
      record.notes = record.notes ? `${record.notes} [default:anti_corruption=1]` : `[default:anti_corruption=1]`;
    } else {
      record.anti_corruption = record.anti_corruption ? 1 : 0;
    }

    // Convert band intensities -> absolutes using revenue when possible
    const emiInt = bandMedian(bands, industry, 'emission_intensity');
    const watInt = bandMedian(bands, industry, 'water_intensity');
    const wasInt = bandMedian(bands, industry, 'waste_intensity');
    if (typeof rev === 'number' && rev > 0) {
      maybeSet('emissions', typeof emiInt === 'number' ? +(emiInt * rev).toFixed(4) : null, 'medianIntensity*rev');
      maybeSet('water_use', typeof watInt === 'number' ? +(watInt * rev).toFixed(4) : null, 'medianIntensity*rev');
      maybeSet('waste', typeof wasInt === 'number' ? +(wasInt * rev).toFixed(4) : null, 'medianIntensity*rev');
    }

    // Risk defaults and mapping to 0..1
    for (const rf of ['climate_risk','geo_risk','labor_risk']) {
      if (record[rf] === null || record[rf] === undefined) {
        record[rf] = RISK_DEFAULT;
        record.notes = record.notes ? `${record.notes} [default:${rf}=${RISK_DEFAULT}]` : `[default:${rf}=${RISK_DEFAULT}]`;
      } else {
        record[rf] = toUnit01(record[rf]) ?? RISK_DEFAULT;
      }
    }

    // Completeness
    let present = 0;
    for (const k of REQUIRED) {
      const v = record[k];
      if (k === 'anti_corruption') {
        if (v === 1) present++;
      } else if (v !== null && v !== undefined) {
        present++;
      }
    }
    const completeness = REQUIRED.length ? present / REQUIRED.length : 1;

    // Intensities (emissions are absolute tons; revenue is in millions)
    const emissions_per_revenue = record.revenue && record.emissions
      ? record.emissions / (record.revenue * 1e6)
      : null;
    const training_per_employee = record.employees && record.training_hours
      ? record.training_hours / record.employees
      : null;

    const cleaned = { ...record, completeness, emissions_per_revenue, training_per_employee };
    out.push(cleaned);

    // Missing critical fields
    const missing = REQUIRED.filter(k => {
      const v = record[k];
      if (k === 'anti_corruption') return v !== 1; // require true
      return v === null || v === undefined;
    });
    if (missing.length) missingLog.push({ company: record.company_name, missing });
  }

  const base = input.replace(/\.(csv|CSV)$/i, '');
  fs.writeFileSync(base + '.cleaned.json', JSON.stringify(out, null, 2));

  // Summary CSV
  const summaryHeader = 'company_name,completeness,emissions_per_revenue,renewable_pct\n';
  const summaryRows = out.map(r => [
    JSON.stringify(r.company_name),
    (r.completeness ?? '').toFixed ? r.completeness.toFixed(2) : '',
    (r.emissions_per_revenue ?? '').toFixed ? r.emissions_per_revenue.toExponential(3) : '',
    r.renewable_pct ?? ''
  ].join(','));
  fs.writeFileSync(base + '.summary.csv', summaryHeader + summaryRows.join('\n'));

  // Map to backend Supplier schema for optional seeding
  const mapRisk01 = (v) => v === null ? null : toUnit01(v);
  const suppliersJson = out.map((r, i) => ({
    name: r.company_name,
    country: r.company_name.match(/Walmart/i) ? 'United States' : 'United Kingdom',
    industry: r.industry || 'Food Retail',
    revenue: r.revenue || 0,
    employee_count: r.employees || 0,
    co2_emissions: r.emissions || 0,
    total_emissions: r.emissions || 0,
    renewable_energy_percent: r.renewable_pct || 0,
    water_usage: r.water_use || 0,
    waste_generated: r.waste || 0,
    injury_rate: r.injury_rate || 0,
    training_hours: r.training_hours || 0,
    living_wage_ratio: r.wage_ratio || 1,
    gender_diversity_percent: r.diversity_pct || 0,
    board_diversity: r.board_diversity || 0,
    board_independence: r.board_independence || 0,
    anti_corruption_policy: r.anti_corruption === 1,
    transparency_score: r.transparency_score || 0,
    climate_risk: mapRisk01(r.climate_risk) ?? 0.2,
    geopolitical_risk: mapRisk01(r.geo_risk) ?? 0.2,
    labor_dispute_risk: mapRisk01(r.labor_risk) ?? 0.2,
    // extra
    source_company_id: r.company_id,
    source_notes: r.notes,
  }));
  fs.writeFileSync(base + '.suppliers.json', JSON.stringify(suppliersJson, null, 2));

  // Log
  const logLines = missingLog.map(m => `- ${m.company}: missing [${m.missing.join(', ')}]`).join('\n');
  fs.writeFileSync(base + '.log.txt', `Missing critical fields (require anti_corruption=1):\n${logLines}\n`);

  console.log(`Wrote:\n  ${base}.cleaned.json\n  ${base}.summary.csv\n  ${base}.suppliers.json\n  ${base}.log.txt`);
}

if (require.main === module) {
  main();
}
