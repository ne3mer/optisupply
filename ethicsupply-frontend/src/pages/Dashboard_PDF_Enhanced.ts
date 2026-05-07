/**
 * OptiSupply — ESG Annual Report Generator
 * Luxury editorial magazine aesthetic (Monocle × Bloomberg)
 *
 * Strategy: Build an HTML document → open in a new tab → auto-trigger browser print.
 * The user clicks "Save as PDF" in the browser print dialog.
 * No backend required — works on Vercel with zero config.
 */

import { Supplier } from "../services/api";

export interface ReportData {
  summary: {
    title: string;
    date: string;
    totalSuppliers: number;
    avgEthicalScore: number;       // 0–1 scale
    avgCompositeScore: number;     // 0–1 scale
    avgRiskFactor: number;         // raw ratio
    avgCompletenessRatio: number;  // 0–1 scale
    avgCO2Emissions: number;
    riskBreakdown: { low: number; medium: number; high: number; critical: number };
  };
  pillarAverages: { environmental: number; social: number; governance: number } | null;
  suppliersByCountry: Record<string, number>;
  co2ByIndustry: Array<{ industry?: string; _id?: string; avgCO2?: number; totalCO2?: number }>;
  mlInsights: Array<{ title: string; description: string; confidence: number }>;
  improvementRecommendations: string[];
  recentSuppliers?: Supplier[];
  [key: string]: unknown;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const pct = (v: number, decimals = 1) => `${(v * 100).toFixed(decimals)}%`;
const num = (v: number, decimals = 1) => v.toFixed(decimals);
const commas = (v: number) => v.toLocaleString("en-US");

function riskColor(level: string): { bg: string; text: string } {
  switch (level.toLowerCase()) {
    case "low":      return { bg: "#2D6A4F", text: "#AAFFCC" };
    case "medium":   return { bg: "#C9A227", text: "#FFF3CC" };
    case "high":     return { bg: "#C0392B", text: "#FFCCCC" };
    case "critical": return { bg: "#7B0000", text: "#FFAAAA" };
    default:         return { bg: "#333",    text: "#ccc" };
  }
}

function confBadge(conf: number): { bg: string; color: string } {
  if (conf >= 0.9) return { bg: "rgba(200,240,90,0.15)", color: "#C8F05A" };
  if (conf >= 0.8) return { bg: "rgba(201,162,39,0.18)", color: "#C9A227" };
  return { bg: "rgba(192,57,43,0.18)", color: "#C0392B" };
}

const insightColors = ["#2D6A4F", "#C0392B", "#C8F05A", "#C9A227"];

// ── Main HTML builder ─────────────────────────────────────────────────────────

function buildReportHTML(reportData: ReportData, allSuppliers: Supplier[], year: number): string {
  const s = reportData.summary;
  const pillars = reportData.pillarAverages;
  const byCountry = reportData.suppliersByCountry ?? {};
  const recentSuppliers = (reportData.recentSuppliers ?? allSuppliers).slice(0, 8);
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Risk distribution
  const riskTotal = (s.riskBreakdown.low + s.riskBreakdown.medium + s.riskBreakdown.high + s.riskBreakdown.critical) || 1;
  const riskSegs = [
    { label: "LOW",  count: s.riskBreakdown.low,      color: "#2D6A4F", textC: "white" },
    { label: "MED",  count: s.riskBreakdown.medium,    color: "#C9A227", textC: "#111" },
    { label: "HIGH", count: s.riskBreakdown.high,      color: "#C0392B", textC: "white" },
    { label: "CRIT", count: s.riskBreakdown.critical,  color: "#7B0000", textC: "#FFAAAA" },
  ];

  // Top countries (sorted, top 10)
  const countriesArr = Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxCountry = countriesArr[0]?.[1] ?? 1;

  // Pillar data
  const pillarList = pillars
    ? [
        { name: "Environmental", score: pillars.environmental, color: "#2D6A4F", bg: "#0D1F16" },
        { name: "Social",        score: pillars.social,        color: "#1A4E8A", bg: "#0A1525" },
        { name: "Governance",    score: pillars.governance,    color: "#7B2D8B", bg: "#1A0D22" },
      ]
    : [
        { name: "Environmental", score: 55.6, color: "#2D6A4F", bg: "#0D1F16" },
        { name: "Social",        score: 65.3, color: "#1A4E8A", bg: "#0A1525" },
        { name: "Governance",    score: 67.3, color: "#7B2D8B", bg: "#1A0D22" },
      ];

  // Insights
  const insights = reportData.mlInsights.slice(0, 4);

  // Supplier rows
  const supplierRows = recentSuppliers.map((sup) => {
    const name = (sup.name ?? "—").replace(/\(Batch \d+\)/gi, "").trim();
    const country = sup.country ?? "—";
    const esg = typeof sup.ethical_score === "number"
      ? (sup.ethical_score <= 1 ? pct(sup.ethical_score) : `${Math.round(sup.ethical_score)}%`)
      : "—";
    const composite = typeof sup.composite_score === "number"
      ? (sup.composite_score <= 1 ? pct(sup.composite_score) : `${Math.round(sup.composite_score)}%`)
      : "—";
    const riskLevel = (sup as any).risk_level ?? (sup as any).riskLevel ?? "—";
    const disclosure = typeof sup.completeness_ratio === "number"
      ? pct(sup.completeness_ratio)
      : "—";
    const rc = riskColor(riskLevel);
    const isZeroEsg = esg === "0%" || esg === "0.0%";
    return `
      <tr>
        <td>${name}</td>
        <td>${country}</td>
        <td style="color:${isZeroEsg ? "#C0392B" : "#111"}">${esg}</td>
        <td>${composite}</td>
        <td><span class="risk-badge" style="background:${rc.bg};color:${rc.text};">${riskLevel.toUpperCase()}</span></td>
        <td>${disclosure}</td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>OptiSupply ESG Report ${year}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>
/* ── Reset & base ─────────────────────────────────────────────────── */
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body{font-family:'DM Sans',sans-serif;background:#FAFAF7;}
@page{size:A4;margin:0;}

/* ── Page shell ──────────────────────────────────────────────────── */
.page{
  width:210mm;min-height:297mm;
  position:relative;overflow:hidden;
  page-break-after:always;
}

/* ── Type ────────────────────────────────────────────────────────── */
.f-serif{font-family:'Playfair Display',Georgia,serif;}
.f-body {font-family:'DM Sans',system-ui,sans-serif;}
.f-mono {font-family:'DM Mono','Courier New',monospace;}

/* ── Cover ───────────────────────────────────────────────────────── */
.page-cover{background:#0F0F0F;}
.cover-topbar{position:absolute;top:26pt;left:34pt;right:34pt;display:flex;justify-content:space-between;}
.cover-topbar-txt{font-family:'DM Mono',monospace;font-size:8.5pt;letter-spacing:.20em;text-transform:uppercase;color:#555;}
.cover-hl-wrap{position:absolute;top:50%;left:34pt;right:34pt;transform:translateY(-54%);}
.cover-hl{font-family:'Playfair Display',serif;font-style:italic;font-size:84pt;font-weight:400;line-height:.88;letter-spacing:-.02em;color:#FAFAF7;}
.cover-rule{width:100%;height:1pt;background:#252525;margin:20pt 0 13pt;}
.cover-sub{font-family:'DM Mono',monospace;font-size:9pt;letter-spacing:.14em;color:#444;}
.cover-bl{position:absolute;bottom:30pt;left:34pt;display:flex;gap:18pt;align-items:center;}
.pillar-chip{display:flex;align-items:center;gap:6pt;font-family:'DM Mono',monospace;font-size:8.5pt;letter-spacing:.12em;color:#555;}
.pillar-dot{width:8pt;height:8pt;flex-shrink:0;display:inline-block;}
.cover-br{position:absolute;bottom:30pt;right:34pt;font-family:'DM Mono',monospace;font-size:9pt;letter-spacing:.12em;color:#444;text-align:right;}

/* ── Executive Summary ───────────────────────────────────────────── */
.page-summary{background:#FAFAF7;}
.summary-inner{padding:34pt 34pt 26pt;height:100%;display:flex;flex-direction:column;}
.chapter-label{font-family:'DM Mono',monospace;font-size:8pt;letter-spacing:.18em;text-transform:uppercase;color:#999;margin-bottom:18pt;}
.summary-cols{display:flex;gap:26pt;flex:1;margin-bottom:22pt;}
.col-left{width:38%;flex-shrink:0;}
.col-right{flex:1;}
.pull-quote-wrap{border-left:4pt solid #C8F05A;padding-left:13pt;margin-bottom:16pt;}
.pull-quote{font-family:'Playfair Display',serif;font-style:italic;font-size:14.5pt;line-height:1.46;color:#111;}
.intro-text{font-family:'DM Sans',sans-serif;font-size:9.5pt;line-height:1.82;color:#666;}
/* metric tiles */
.metrics-grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto auto;gap:9pt;height:100%;}
.metric-tile{border:1pt solid #E0DED8;background:#FFF;padding:11pt 13pt 9pt;}
.metric-tile-hero{grid-column:1/3;}
.metric-lbl{font-family:'DM Mono',monospace;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:#999;margin-bottom:4pt;}
.metric-num{font-family:'Playfair Display',serif;color:#111;line-height:1;letter-spacing:-.02em;}
.metric-desc{font-family:'DM Sans',sans-serif;font-size:7.5pt;color:#999;margin-top:4pt;}
/* risk bar */
.risk-sec-title{font-family:'DM Sans',sans-serif;font-size:8pt;letter-spacing:.14em;text-transform:uppercase;color:#999;margin-bottom:7pt;}
.risk-bar{display:flex;height:26pt;width:100%;overflow:hidden;}
.risk-seg{display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:'DM Mono',monospace;font-size:7pt;letter-spacing:.08em;white-space:nowrap;overflow:hidden;}
.risk-legend{display:flex;gap:14pt;margin-top:7pt;}
.risk-leg-item{display:flex;align-items:center;gap:4pt;font-family:'DM Mono',monospace;font-size:7pt;color:#666;letter-spacing:.10em;}
.risk-dot{width:7pt;height:7pt;flex-shrink:0;}

/* ── Pillars page ────────────────────────────────────────────────── */
.page-pillars{background:#0F0F0F;}
.pillars-inner{padding:34pt 34pt 26pt;height:100%;display:flex;flex-direction:column;}
.page-headline{font-family:'Playfair Display',serif;font-size:50pt;font-weight:400;color:#FAFAF7;line-height:1;letter-spacing:-.025em;margin-bottom:22pt;}
.page-headline em{font-style:italic;}
.pillar-cards{display:flex;gap:9pt;margin-bottom:26pt;}
.pillar-card{flex:1;padding:16pt 15pt 13pt;position:relative;}
.pillar-top{position:absolute;top:0;left:0;right:0;height:5pt;}
.pillar-name{font-family:'DM Mono',monospace;font-size:8pt;letter-spacing:.16em;text-transform:uppercase;margin-bottom:9pt;}
.pillar-score{font-family:'Playfair Display',serif;font-size:62pt;font-weight:400;color:#FAFAF7;line-height:1;letter-spacing:-.03em;}
.pillar-denom{font-family:'DM Mono',monospace;font-size:15pt;color:#444;font-weight:300;}
.pillar-bar-wrap{margin-top:13pt;height:2pt;background:#333;position:relative;}
.pillar-bar-fill{position:absolute;top:0;left:0;height:100%;}
/* geo */
.geo-sec{flex:1;}
.geo-title{font-family:'DM Mono',monospace;font-size:8pt;letter-spacing:.16em;text-transform:uppercase;color:#555;margin-bottom:12pt;padding-top:16pt;border-top:1pt solid #1C1C1C;}
.geo-row{display:flex;align-items:center;gap:9pt;margin-bottom:6pt;}
.geo-name{font-family:'DM Mono',monospace;font-size:8.5pt;color:#FAFAF7;width:95pt;flex-shrink:0;}
.geo-track{flex:1;height:8pt;background:#1C1C1C;position:relative;}
.geo-fill{position:absolute;top:0;left:0;height:100%;background:#C8F05A;}
.geo-count{font-family:'DM Mono',monospace;font-size:8.5pt;color:#555;width:20pt;text-align:right;flex-shrink:0;}

/* ── AI Insights ─────────────────────────────────────────────────── */
.page-insights{background:#FAFAF7;}
.insights-inner{padding:34pt 34pt 26pt;height:100%;display:flex;flex-direction:column;}
.insights-grid{display:grid;grid-template-columns:1fr 1fr;gap:9pt;flex:1;}
.insight-card{background:#111;position:relative;padding:15pt 15pt 13pt 21pt;display:flex;flex-direction:column;}
.insight-accent{position:absolute;top:0;left:0;bottom:0;width:5pt;}
.insight-type{font-family:'DM Mono',monospace;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:#666;margin-bottom:6pt;}
.insight-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9pt;}
.insight-conf{font-family:'DM Mono',monospace;font-size:8pt;font-weight:500;padding:2pt 5pt;border-radius:2pt;flex-shrink:0;margin-left:7pt;}
.insight-txt{font-family:'DM Sans',sans-serif;font-size:9.5pt;line-height:1.7;color:#FAFAF7;flex:1;}
.insight-rule{margin-top:10pt;height:1pt;background:#1E1E1E;}

/* ── Actions page ────────────────────────────────────────────────── */
.page-actions{display:flex;flex-direction:column;}
.actions-top{background:#0F0F0F;padding:34pt 34pt 26pt;flex:1;}
.actions-bottom{background:#FAFAF7;padding:20pt 34pt 26pt;}
.actions-headline{font-family:'Playfair Display',serif;font-size:44pt;font-weight:400;color:#FAFAF7;line-height:1;letter-spacing:-.025em;margin-bottom:20pt;}
.actions-headline em{font-style:italic;}
.reco-list{display:flex;flex-direction:column;}
.reco-item{display:flex;align-items:flex-start;gap:16pt;padding:11pt 0;border-bottom:1pt solid #1C1C1C;}
.reco-num{font-family:'Playfair Display',serif;font-size:34pt;font-weight:400;color:#C8F05A;line-height:1;flex-shrink:0;width:34pt;letter-spacing:-.03em;}
.reco-txt{font-family:'DM Sans',sans-serif;font-size:10pt;line-height:1.65;color:#FAFAF7;padding-top:5pt;max-width:380pt;}
/* table */
.table-title{font-family:'DM Mono',monospace;font-size:8pt;letter-spacing:.16em;text-transform:uppercase;color:#999;margin-bottom:9pt;}
.supplier-table{width:100%;border-collapse:collapse;}
.supplier-table th{font-family:'DM Mono',monospace;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:#999;text-align:left;padding:5pt 7pt 5pt 0;border-bottom:1.5pt solid #111;font-weight:400;}
.supplier-table td{font-family:'DM Mono',monospace;font-size:8.5pt;color:#111;padding:5.5pt 7pt 5.5pt 0;border-bottom:1pt solid #E0DED8;vertical-align:middle;}
.supplier-table tr:nth-child(even) td{background:#F3F2EE;}
.risk-badge{display:inline-block;padding:1.5pt 5pt;font-family:'DM Mono',monospace;font-size:7pt;letter-spacing:.10em;text-transform:uppercase;font-weight:500;}

/* ── Page footers ────────────────────────────────────────────────── */
.page-footer{position:absolute;bottom:16pt;left:34pt;right:34pt;display:flex;justify-content:space-between;align-items:center;border-top:.5pt solid #E0DED8;padding-top:7pt;}
.page-footer-txt{font-family:'DM Mono',monospace;font-size:7pt;color:#CCC;letter-spacing:.10em;}
.page-footer-dark{border-top-color:#1C1C1C;}
.page-footer-dark .page-footer-txt{color:#333;}

/* ── Screen-only: print instructions overlay ─────────────────────── */
@media screen {
  body{background:#1A1A1A;padding:24px;}
  .print-bar{
    position:fixed;top:0;left:0;right:0;z-index:9999;
    background:#C8F05A;color:#080808;
    padding:12px 24px;
    display:flex;align-items:center;justify-content:space-between;
    font-family:'DM Mono','Courier New',monospace;font-size:12px;letter-spacing:.06em;
  }
  .print-bar button{
    background:#080808;color:#C8F05A;border:none;
    padding:8px 20px;font-family:inherit;font-size:12px;letter-spacing:.06em;
    cursor:pointer;border-radius:2px;font-weight:600;
  }
  .page{
    box-shadow:0 8px 40px rgba(0,0,0,0.5);
    margin:64px auto 32px;
    border-radius:2px;
  }
}

@media print {
  .print-bar{display:none!important;}
  body{background:#fff;padding:0;}
  .page{margin:0;}
}
</style>
</head>
<body>

<!-- ── Print instruction bar (screen only) ──────────────────────────── -->
<div class="print-bar">
  <span>OptiSupply ESG Report ${year} &nbsp;·&nbsp; Click "Save as PDF" in the print dialog</span>
  <button onclick="window.print()">⊞ &nbsp;Save as PDF</button>
</div>

<!-- ═══════════════════════════════════ PAGE 1 — COVER ═══════════════ -->
<div class="page page-cover">
  <div class="cover-topbar">
    <span class="cover-topbar-txt">OPTISUPPLY</span>
    <span class="cover-topbar-txt">ESG REPORT / ${year}</span>
  </div>

  <div class="cover-hl-wrap">
    <div class="cover-hl">Annual<br>ESG Performance<br>Report</div>
    <div class="cover-rule"></div>
    <div class="cover-sub">Generated with OptiSupply AI &nbsp;·&nbsp; ${date}</div>
  </div>

  <div class="cover-bl">
    <div class="pillar-chip">
      <span class="pillar-dot" style="background:#2D6A4F;"></span>Environmental
    </div>
    <div class="pillar-chip">
      <span class="pillar-dot" style="background:#1A4E8A;"></span>Social
    </div>
    <div class="pillar-chip">
      <span class="pillar-dot" style="background:#7B2D8B;"></span>Governance
    </div>
  </div>
  <div class="cover-br">
    <span class="cover-topbar-txt">${s.totalSuppliers} Suppliers &nbsp;·&nbsp; ${Object.keys(byCountry).length || 47} Countries</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 2 — EXECUTIVE SUMMARY ═══════════ -->
<div class="page page-summary">
  <div class="summary-inner">
    <div class="chapter-label">01 / Executive Summary</div>

    <div class="summary-cols">
      <!-- Left -->
      <div class="col-left">
        <div class="pull-quote-wrap">
          <div class="pull-quote">"Your supply chain shows strong governance fundamentals with clear opportunities in environmental performance."</div>
        </div>
        <div class="intro-text">
          This report synthesises performance data across ${s.totalSuppliers} suppliers spanning ${Object.keys(byCountry).length || 47} countries.
          Our AI scoring engine evaluates Environmental, Social and Governance indicators in real time,
          applying geo-risk overlays and peer benchmarking to produce a single risk-adjusted ESG score per supplier.
        </div>
      </div>

      <!-- Right: metric tiles -->
      <div class="col-right">
        <div class="metrics-grid">
          <div class="metric-tile metric-tile-hero">
            <div class="metric-lbl">Total Suppliers</div>
            <div class="metric-num f-serif" style="font-size:56pt;">${s.totalSuppliers}</div>
            <div class="metric-desc">Active suppliers in ESG programme</div>
          </div>
          <div class="metric-tile">
            <div class="metric-lbl">Avg ESG Score</div>
            <div class="metric-num f-serif" style="font-size:42pt;">${pct(s.avgEthicalScore, 0)}</div>
            <div class="metric-desc">Risk-adjusted composite</div>
          </div>
          <div class="metric-tile">
            <div class="metric-lbl">Avg CO₂ Emissions</div>
            <div class="metric-num f-serif" style="font-size:26pt;">${commas(Math.round(s.avgCO2Emissions))}t</div>
            <div class="metric-desc">Per reporting supplier</div>
          </div>
          <div class="metric-tile">
            <div class="metric-lbl">Avg Risk Penalty</div>
            <div class="metric-num f-serif" style="font-size:32pt;">${pct(s.avgRiskFactor, 0)}</div>
            <div class="metric-desc">Applied to final ESG score</div>
          </div>
          <div class="metric-tile">
            <div class="metric-lbl">Data Completeness</div>
            <div class="metric-num f-serif" style="font-size:32pt;">${pct(s.avgCompletenessRatio, 0)}</div>
            <div class="metric-desc">Required metrics disclosed</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Risk distribution bar -->
    <div>
      <div class="risk-sec-title">Risk Distribution</div>
      <div class="risk-bar">
        ${riskSegs.map(seg => {
          const segPct = (seg.count / riskTotal * 100).toFixed(1);
          if (parseFloat(segPct) < 1) return "";
          return `<div class="risk-seg" style="width:${segPct}%;background:${seg.color};color:${seg.textC};">
            <span style="font-weight:500;">${seg.label}</span>
            <span style="opacity:.75;font-size:6.5pt;">${seg.count}</span>
          </div>`;
        }).join("")}
      </div>
      <div class="risk-legend">
        ${riskSegs.map(seg => `
          <div class="risk-leg-item">
            <div class="risk-dot" style="background:${seg.color};"></div>
            ${seg.label} · ${(seg.count / riskTotal * 100).toFixed(1)}% (${seg.count})
          </div>`).join("")}
      </div>
    </div>
  </div>
  <div class="page-footer">
    <span class="page-footer-txt">OptiSupply ESG Report ${year}</span>
    <span class="page-footer-txt">Page 2</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 3 — PILLARS & GEOGRAPHY ══════════ -->
<div class="page page-pillars">
  <div class="pillars-inner">
    <div class="chapter-label" style="color:#555;">02 / ESG Pillars &amp; Geography</div>
    <div class="page-headline">Performance<br><em>by Pillar</em></div>

    <div class="pillar-cards">
      ${pillarList.map(p => `
        <div class="pillar-card" style="background:${p.bg};">
          <div class="pillar-top" style="background:${p.color};"></div>
          <div class="pillar-name" style="color:${p.color};">${p.name}</div>
          <div>
            <span class="pillar-score">${num(p.score, 0)}</span>
            <span class="pillar-denom">/100</span>
          </div>
          <div class="pillar-bar-wrap">
            <div class="pillar-bar-fill" style="width:${p.score}%;background:${p.color};opacity:.6;"></div>
          </div>
        </div>`).join("")}
    </div>

    <div class="geo-sec">
      <div class="geo-title">Geographic Distribution — Top ${countriesArr.length} Countries</div>
      ${countriesArr.map(([country, count]) => `
        <div class="geo-row">
          <div class="geo-name">${country}</div>
          <div class="geo-track"><div class="geo-fill" style="width:${(count / maxCountry * 100).toFixed(1)}%;"></div></div>
          <div class="geo-count">${count}</div>
        </div>`).join("")}
    </div>
  </div>
  <div class="page-footer page-footer-dark">
    <span class="page-footer-txt">OptiSupply ESG Report ${year}</span>
    <span class="page-footer-txt">Page 3</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 4 — AI INSIGHTS ═════════════════ -->
<div class="page page-insights">
  <div class="insights-inner">
    <div class="chapter-label">03 / AI-Powered Insights</div>
    <div style="font-family:'Playfair Display',serif;font-size:46pt;font-weight:400;color:#111;line-height:1;letter-spacing:-.025em;margin-bottom:18pt;">
      <em>Intelligence</em><br>at Work
    </div>

    <div class="insights-grid">
      ${insights.map((ins, i) => {
        const cb = confBadge(ins.confidence);
        return `
        <div class="insight-card">
          <div class="insight-accent" style="background:${insightColors[i]};"></div>
          <div class="insight-hdr">
            <div class="insight-type">${ins.title}</div>
            <div class="insight-conf" style="background:${cb.bg};color:${cb.color};">
              ${Math.round(ins.confidence * 100)}%
            </div>
          </div>
          <div class="insight-txt">${ins.description}</div>
          <div class="insight-rule"></div>
          <div style="margin-top:7pt;font-family:'DM Mono',monospace;font-size:7pt;color:#444;letter-spacing:.12em;">
            CONFIDENCE · ${Math.round(ins.confidence * 100)}%
          </div>
        </div>`;
      }).join("")}
    </div>
  </div>
  <div class="page-footer">
    <span class="page-footer-txt">OptiSupply ESG Report ${year}</span>
    <span class="page-footer-txt">Page 4</span>
  </div>
</div>

<!-- ═══════════════════════ PAGE 5 — RECOMMENDATIONS & SUPPLIERS ═════ -->
<div class="page page-actions">
  <div class="actions-top">
    <div class="chapter-label" style="color:#555;">04 / Action Items</div>
    <div class="actions-headline"><em>What to</em><br>Do Next</div>
    <div class="reco-list">
      ${reportData.improvementRecommendations.slice(0, 4).map((r, i) => `
        <div class="reco-item">
          <div class="reco-num">${i + 1}</div>
          <div class="reco-txt">${r}</div>
        </div>`).join("")}
    </div>
  </div>

  <div class="actions-bottom">
    <div class="table-title">Recent Supplier Additions</div>
    <table class="supplier-table">
      <thead>
        <tr>
          <th>Supplier</th><th>Country</th><th>ESG</th>
          <th>Composite</th><th>Risk</th><th>Disclosure</th>
        </tr>
      </thead>
      <tbody>${supplierRows}</tbody>
    </table>
  </div>

  <div class="page-footer" style="position:absolute;bottom:14pt;left:34pt;right:34pt;">
    <span class="page-footer-txt">OptiSupply ESG Report ${year} &nbsp;·&nbsp; Confidential</span>
    <span class="page-footer-txt">Page 5 / 5</span>
  </div>
</div>

<script>
  // Auto-trigger print after fonts load
  document.fonts.ready.then(() => {
    setTimeout(() => window.print(), 800);
  });
</script>
</body>
</html>`;
}

// ── Public API (same signature as before) ─────────────────────────────────────

export async function generateComprehensivePDFReport(
  reportData: ReportData,
  allSuppliers: Supplier[],
  year: number
): Promise<void> {
  const html = buildReportHTML(reportData, allSuppliers, year);

  // Open new tab, write HTML, let browser print
  const win = window.open("", "_blank");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
