#!/usr/bin/env node
/*
  Export thesis-ready assets under /reports.
  - reports/fig_weight_sensitivity.png (bar chart of ESG pillar weights); falls back to SVG if node-canvas unavailable
  - reports/table_before_after.csv (scenario deltas using anchors or heuristic)
  - reports/bands_v1_table.csv (flattened bands table)
  - reports/methodology.md (generated summary + embedded calibration_note.md + extracted code comments)
*/

const fs = require('fs');
const path = require('path');

// ---------- Paths ----------
const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');
const DATA_DIR = path.join(ROOT, 'ethicsupply-node-backend', 'data');
const BANDS_PATH = path.join(DATA_DIR, 'bands_v1.json');
const CAL_NOTE_PATH = path.join(REPORTS_DIR, 'calibration_note.md');
const ESG_SCORING_PATH = path.join(ROOT, 'ethicsupply-node-backend', 'src', 'utils', 'esgScoring.js');

if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

// ---------- Utilities ----------
function readJSONSafe(p, fallback = null) {
  try {
    if (!fs.existsSync(p)) return fallback;
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to read JSON at ${p}:`, e.message);
    return fallback;
  }
}

function writeCSV(p, rows) {
  const csv = rows.map(r => r.map(v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\n');
  fs.writeFileSync(p, csv);
}

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

// Parse anchors block from calibration_note.md (```json ... ```)
function parseAnchorsFromCalibrationNote(notePath) {
  try {
    if (!fs.existsSync(notePath)) return null;
    const text = fs.readFileSync(notePath, 'utf-8');
    const m = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!m) return null;
    const jsonStr = m[1];
    const parsed = JSON.parse(jsonStr);
    return parsed.anchors ? parsed.anchors : parsed;
  } catch (e) {
    console.warn('Failed to parse anchors from calibration note:', e.message);
    return null;
  }
}

// ---------- 1) fig_weight_sensitivity.png ----------
function renderWeightsFigure() {
  const OUT_PNG = path.join(REPORTS_DIR, 'fig_weight_sensitivity.png');
  const OUT_SVG = path.join(REPORTS_DIR, 'fig_weight_sensitivity.svg');
  let Canvas, createCanvas;
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    Canvas = require('canvas');
    createCanvas = Canvas.createCanvas;
  } catch (_) {
    Canvas = null;
  }

  const weights = [
    { label: 'Environmental', value: 0.4, color: '#00F0FF' },
    { label: 'Social', value: 0.3, color: '#FF00FF' },
    { label: 'Governance', value: 0.3, color: '#4D5BFF' },
  ];

  const width = 720, height = 420, padding = 60, barW = 120, gap = 60, baseY = height - padding;
  if (createCanvas) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    // background
    ctx.fillStyle = '#0D0F1A';
    ctx.fillRect(0, 0, width, height);
    // axes
    ctx.strokeStyle = 'rgba(77,91,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, baseY);
    ctx.lineTo(width - padding, baseY);
    ctx.stroke();
    // title
    ctx.fillStyle = '#E0E0FF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Weight Sensitivity (Composite Weights)', padding, 40);
    // bars
    let x = padding + 20;
    weights.forEach(w => {
      const h = (baseY - padding) * w.value;
      ctx.fillStyle = w.color;
      ctx.fillRect(x, baseY - h, barW, h);
      ctx.fillStyle = '#E0E0FF';
      ctx.font = '14px sans-serif';
      ctx.fillText(`${Math.round(w.value * 100)}%`, x + 30, baseY - h - 8);
      ctx.fillText(w.label, x, baseY + 20);
      x += barW + gap;
    });
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(OUT_PNG, buf);
    return { png: OUT_PNG, svg: null };
  }

  // Fallback: SVG
  const maxH = height - 2 * padding;
  let x = padding + 20;
  const bars = weights.map(w => {
    const h = maxH * w.value;
    const rect = `<rect x="${x}" y="${baseY - h}" width="${barW}" height="${h}" fill="${w.color}" />`;
    const label = `<text x="${x}" y="${baseY + 20}" fill="#E0E0FF" font-size="14">${w.label}</text>`;
    const val = `<text x="${x + 30}" y="${baseY - h - 8}" fill="#E0E0FF" font-size="14">${Math.round(w.value * 100)}%</text>`;
    x += barW + gap;
    return rect + label + val;
  }).join('\n');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#0D0F1A"/>
  <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${baseY}" stroke="rgba(77,91,255,0.4)"/>
  <line x1="${padding}" y1="${baseY}" x2="${width - padding}" y2="${baseY}" stroke="rgba(77,91,255,0.4)"/>
  <text x="${padding}" y="40" fill="#E0E0FF" font-size="20" font-weight="bold">Weight Sensitivity (Composite Weights)</text>
  ${bars}
</svg>`;
  fs.writeFileSync(OUT_SVG, svg, 'utf-8');
  console.warn('node-canvas not available. Wrote SVG fallback instead of PNG.');
  return { png: null, svg: OUT_SVG };
}

// ---------- 2) reports/bands_v1_table.csv ----------
function exportBandsTable(bandsJson) {
  const OUT = path.join(REPORTS_DIR, 'bands_v1_table.csv');
  const root = bandsJson && bandsJson.bands ? bandsJson.bands : bandsJson;
  const header = ['industry', 'metric', 'min', 'avg', 'max'];
  const rows = [header];
  if (root) {
    for (const [industry, metrics] of Object.entries(root)) {
      for (const [metric, v] of Object.entries(metrics)) {
        rows.push([industry, metric, v.min ?? '', v.avg ?? '', v.max ?? '']);
      }
    }
  }
  writeCSV(OUT, rows);
  return OUT;
}

// ---------- 3) reports/table_before_after.csv ----------
function exportBeforeAfter(bandsJson, anchors) {
  const OUT = path.join(REPORTS_DIR, 'table_before_after.csv');
  const root = bandsJson && bandsJson.bands ? bandsJson.bands : bandsJson;
  const metrics = ['renewable_pct', 'emission_intensity', 'water_intensity', 'waste_intensity', 'injury_rate', 'training_hours', 'wage_ratio', 'diversity_pct', 'board_diversity', 'board_independence', 'transparency_score'];
  const header = ['industry', 'metric', 'before_avg', 'after_avg', 'delta'];
  const rows = [header];

  const heuristicAfter = (m, avg) => {
    // If no anchors, simulate an improvement scenario
    switch (m) {
      case 'renewable_pct': return avg * 1.10;
      case 'emission_intensity': return avg * 0.92;
      case 'water_intensity': return avg * 0.95;
      case 'waste_intensity': return avg * 0.95;
      case 'injury_rate': return avg * 0.90;
      case 'training_hours': return avg * 1.10;
      case 'wage_ratio': return clamp(avg + 0.03, 0, 2);
      case 'diversity_pct': return avg * 1.08;
      case 'board_diversity': return avg * 1.06;
      case 'board_independence': return avg * 1.04;
      case 'transparency_score': return avg * 1.10;
      default: return avg;
    }
  };

  if (root) {
    for (const [industry, mobj] of Object.entries(root)) {
      metrics.forEach((metric) => {
        const avg = (mobj[metric] && mobj[metric].avg != null) ? Number(mobj[metric].avg) : null;
        if (avg == null || Number.isNaN(avg)) return;
        let after = heuristicAfter(metric, avg);
        if (anchors && anchors[industry] && typeof anchors[industry][metric] === 'number') {
          after = anchors[industry][metric];
        }
        const delta = after - avg;
        rows.push([industry, metric, avg.toFixed(4), after.toFixed(4), delta.toFixed(4)]);
      });
    }
  }
  writeCSV(OUT, rows);
  return OUT;
}

// ---------- 4) reports/methodology.md ----------
function exportMethodology(calibrationNotePath) {
  const OUT = path.join(REPORTS_DIR, 'methodology.md');
  const parts = [];
  parts.push('# Synthetic Dataset Methodology');
  parts.push('');
  parts.push('This appendix describes the synthetic data generation and scoring approach used in the prototype.');
  parts.push('');
  parts.push('## Generation Overview');
  parts.push('- Four industries (Apparel, Electronics, Food Retail, Logistics)');
  parts.push('- Per-industry ranges for all metrics, intensities derived by dividing absolute metrics by revenue');
  parts.push('- Correlations: more renewable energy lowers emission intensity; more training lowers injury rate; anti-corruption policy and transparency lower corruption risk');
  parts.push('- ~15% random missingness on non-critical fields to simulate disclosure gaps');
  parts.push('- Optional bands constrain ranges; optional anchors gently nudge means (alpha = 0.2)');
  parts.push('');
  parts.push('## Scoring Overview');
  parts.push('- Normalize each metric to [0,1] per industry band (lower-is-better vs higher-is-better, with wage ratio special handling)');
  parts.push('- Pillars in [0,100]: Environmental(40%), Social(30%), Governance(30%)');
  parts.push('- Ethical score = Composite × (1 − RiskFactor); completeness < 0.7 caps final at 50');
  parts.push('- Risk factor from climate/geopolitical/labor risks; risk levels: low/medium/high/critical');
  parts.push('');

  // Extract code comments from esgScoring.js for traceability
  try {
    if (fs.existsSync(ESG_SCORING_PATH)) {
      const src = fs.readFileSync(ESG_SCORING_PATH, 'utf-8');
      const lines = src.split(/\r?\n/).filter(l => l.trim().startsWith('//'));
      if (lines.length) {
        parts.push('## Collected Code Comments (esgScoring.js)');
        parts.push('');
        parts.push('```');
        lines.slice(0, 200).forEach(l => parts.push(l.replace(/^\/\//, '').trim()));
        parts.push('```');
        parts.push('');
      }
    }
  } catch (e) {
    // ignore
  }

  // Append calibration note if present
  try {
    if (fs.existsSync(calibrationNotePath)) {
      const cal = fs.readFileSync(calibrationNotePath, 'utf-8');
      parts.push('## Calibration Note');
      parts.push('');
      parts.push(cal);
    }
  } catch (e) {
    // ignore
  }

  fs.writeFileSync(OUT, parts.join('\n'));
  return OUT;
}

// ---------- Main ----------
(function main() {
  const bandsJson = readJSONSafe(BANDS_PATH, null);
  const anchors = parseAnchorsFromCalibrationNote(CAL_NOTE_PATH);

  const fig = renderWeightsFigure();
  const bandsCsv = exportBandsTable(bandsJson || {});
  const beforeAfterCsv = exportBeforeAfter(bandsJson || {}, anchors);
  const methodologyMd = exportMethodology(CAL_NOTE_PATH);

  console.log('Exported thesis assets:');
  if (fig.png) console.log(' -', fig.png); else if (fig.svg) console.log(' -', fig.svg);
  console.log(' -', bandsCsv);
  console.log(' -', beforeAfterCsv);
  console.log(' -', methodologyMd);
})();

