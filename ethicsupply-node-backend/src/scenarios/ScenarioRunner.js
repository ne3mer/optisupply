/**
 * ScenarioRunner - Handles S1-S4 scenario execution
 * Reuses existing scoring functions for consistency
 */

const db = require("../models");
const { scoreSupplier } = require("../utils/esgScoring");
const { knnImpute } = require("../utils/statistics");

/**
 * Convert data rows to CSV format
 */
function toCSV(rows, headers) {
  if (rows.length === 0) {
    return headers.join(",") + "\n";
  }
  
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const value = row[h] ?? row[h.replace(/\s+/g, "")] ?? "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];
  return csvLines.join("\n");
}

/**
 * Create ZIP archive from multiple CSV files
 */
async function createZip(files) {
  try {
    const archiver = require("archiver");
    
    return new Promise((resolve, reject) => {
      const archive = archiver("zip", { zlib: { level: 9 } });
      const chunks = [];
      
      archive.on("data", (chunk) => chunks.push(chunk));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", reject);
      
      Object.entries(files).forEach(([filename, content]) => {
        archive.append(content, { name: filename });
      });
      
      archive.finalize();
    });
  } catch (error) {
    console.error("Error creating ZIP:", error);
    throw new Error("ZIP creation failed. Install archiver: npm install archiver");
  }
}

class ScenarioRunner {
  constructor(baseCfg) {
    this.baseCfg = baseCfg;
  }

  /**
   * Get all suppliers from database
   */
  async getAllSuppliers() {
    return await db.Supplier.find({});
  }

  /**
   * Recompute scores for suppliers with given config
   * Returns rows with all required columns for Chapter 4
   */
  async recompute(suppliers, cfg) {
    const rows = suppliers.map((supplier) => {
      const supplierObj = supplier.toObject ? supplier.toObject() : supplier;
      const scores = scoreSupplier(supplierObj, cfg);

      return {
        SupplierID: supplier._id?.toString() || supplier.id || supplier.SupplierID || "",
        Name: supplier.name || supplier.SupplierName || supplier.Name || "",
        Industry: supplier.industry || supplier.Industry || "Unknown",
        "Environmental Score": Number(scores.environmental_score || 0).toFixed(2),
        "Social Score": Number(scores.social_score || 0).toFixed(2),
        "Governance Score": Number(scores.governance_score || 0).toFixed(2),
        "Composite Score": Number(scores.composite_score || 0).toFixed(2),
        "Risk Penalty": Number(scores.risk_penalty || 0).toFixed(2),
        "Final Score": Number(scores.finalScore || scores.ethical_score || 0).toFixed(2),
        // Store raw values for ranking and objective calculation
        _raw: {
          emission_intensity: this.getEmissionIntensity(supplierObj, scores),
          finalScore: scores.finalScore || scores.ethical_score || 0,
          composite: scores.composite_score || 0,
        },
      };
    });

    // Rank descending by Final Score
    rows.sort((a, b) => parseFloat(b["Final Score"]) - parseFloat(a["Final Score"]));
    rows.forEach((r, i) => {
      r.Rank = i + 1;
    });

    return rows;
  }

  /**
   * Helper: Convert value to number or null
   */
  toNum(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }

  /**
   * Compute Emission Intensity = emissions_tco2e / revenue_musd
   * Fallbacks: if emissions_tco2e missing but co2_tons present, use that
   * If divisor revenue_musd <= 0 or any part is NaN, mark EI as null
   */
  computeEmissionIntensity(supplier) {
    // Prefer emissions_tco2e; fallback to co2_tons or co2_emissions
    const em = this.toNum(supplier.emissions_tco2e) ?? 
               this.toNum(supplier.co2_tons) ?? 
               this.toNum(supplier.co2_emissions);
    const rev = this.toNum(supplier.revenue_musd) ?? 
                this.toNum(supplier.revenue);
    
    if (!em || !rev || rev <= 0) return null;
    return em / rev; // tCO2e per MUSD
  }

  /**
   * Get Margin % from supplier
   * If available directly, use it; otherwise try to derive from revenue/cost
   */
  getMarginPct(supplier) {
    // If available directly
    if (supplier.margin_pct != null) {
      const m = this.toNum(supplier.margin_pct);
      return m;
    }
    
    // Optional: derive if revenue and cost are available
    const revenue = this.toNum(supplier.revenue_musd) ?? this.toNum(supplier.revenue);
    const cost = this.toNum(supplier.cost_musd) ?? this.toNum(supplier.cost);
    if (revenue && cost && revenue > 0) {
      return 100 * ((revenue - cost) / revenue);
    }
    
    return null;
  }

  /**
   * Impute missing values by industry mean
   */
  imputeByIndustryMean(rows, key) {
    const byInd = {};
    rows.forEach(r => {
      const ind = r.Industry || "Unknown";
      if (!byInd[ind]) byInd[ind] = [];
      if (r[key] != null && Number.isFinite(r[key])) {
        byInd[ind].push(r[key]);
      }
    });
    
    const means = {};
    Object.keys(byInd).forEach(ind => {
      const arr = byInd[ind];
      means[ind] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    });
    
    rows.forEach(r => {
      if (r[key] == null || !Number.isFinite(r[key])) {
        r[key] = means[r.Industry || "Unknown"] ?? null;
      }
    });
    
    return rows;
  }

  /**
   * Calculate mean objective (e.g., mean emission intensity)
   */
  meanObjective(rows, key) {
    const values = rows
      .map((r) => {
        const val = r._raw?.[key] ?? r[key];
        return typeof val === "number" ? val : parseFloat(val) || 0;
      })
      .filter((v) => Number.isFinite(v) && v !== null && v !== undefined);
    
    if (values.length === 0) return NaN;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Normalize weights to sum to 1.0
   */
  normalizeWeights(w) {
    const sum = (w.e || 0) + (w.s || 0) + (w.g || 0);
    if (sum === 0) return { e: 1/3, s: 1/3, g: 1/3 };
    return { e: (w.e || 0) / sum, s: (w.s || 0) / sum, g: (w.g || 0) / sum };
  }

  /**
   * Get baseline rankings
   */
  async baseline() {
    const suppliers = await this.getAllSuppliers();
    return this.recompute(suppliers, this.baseCfg);
  }

  /**
   * S1: Utility Analysis
   * Objective: minimize emission_intensity
   * Constraint: margin_pct >= minMarginPct
   */
  async runS1(minMarginPct = 10) {
    const suppliers = await this.getAllSuppliers();
    
    // Build baseline rows with all scores
    const baseRows = suppliers.map((supplier) => {
      const supplierObj = supplier.toObject ? supplier.toObject() : supplier;
      const scores = scoreSupplier(supplierObj, this.baseCfg);
      
      return {
        SupplierID: supplier._id?.toString() || supplier.id || supplier.SupplierID || "",
        Name: supplier.name || supplier.SupplierName || supplier.Name || "",
        Industry: supplier.industry || supplier.Industry || "Unknown",
        "Environmental Score": Number(scores.environmental_score || 0).toFixed(2),
        "Social Score": Number(scores.social_score || 0).toFixed(2),
        "Governance Score": Number(scores.governance_score || 0).toFixed(2),
        "Composite Score": Number(scores.composite_score || 0).toFixed(2),
        "Risk Penalty": Number(scores.risk_penalty || 0).toFixed(2),
        "Final Score": Number(scores.finalScore || scores.ethical_score || 0).toFixed(2),
        _raw: supplierObj,
        _finalScoreNum: Number(scores.finalScore || scores.ethical_score || 0),
      };
    });
    
    // Attach EI & Margin to all rows
    baseRows.forEach(r => {
      r["Emission Intensity"] = this.computeEmissionIntensity(r._raw);
      r["Margin %"] = this.getMarginPct(r._raw);
    });
    
    // Compute baseline objective (mean EI on rows that have EI, before constraint)
    const baseEiArr = baseRows
      .map(r => r["Emission Intensity"])
      .filter(v => v != null && Number.isFinite(v));
    const baselineObjective = baseEiArr.length 
      ? baseEiArr.reduce((a, b) => a + b, 0) / baseEiArr.length 
      : null;
    
    // Impute missing EI by industry mean
    this.imputeByIndustryMean(baseRows, "Emission Intensity");
    
    // Keep only rows with EI defined (after imputation)
    const withEi = baseRows.filter(r => 
      r["Emission Intensity"] != null && Number.isFinite(r["Emission Intensity"])
    );
    
    // Strict margin constraint: keep only rows with known margin >= threshold
    const constrained = withEi.filter(r => {
      const m = this.toNum(r["Margin %"]);
      return m != null && m >= minMarginPct;
    });
    
    if (!constrained.length) {
      const err = new Error(
        `S1 produced no rows after applying Margin % ≥ ${minMarginPct}. ` +
        `Make sure suppliers have margin_pct field. Found ${withEi.length} suppliers with EI, ` +
        `but ${withEi.length - constrained.length} failed margin constraint.`
      );
      err.status = 400;
      throw err;
    }
    
    // Rank: min EI (ascending), tie-break by higher Final Score (descending)
    constrained.sort((a, b) => {
      const eiA = a["Emission Intensity"];
      const eiB = b["Emission Intensity"];
      const d = eiA - eiB;
      if (Math.abs(d) > 0.0001) return d; // EI difference is significant
      // Tie-breaker: higher Final Score is better
      return b._finalScoreNum - a._finalScoreNum;
    });
    
    constrained.forEach((r, i) => {
      r.Rank = i + 1;
    });
    
    // S1 objective = mean EI in constrained set
    const s1EiArr = constrained
      .map(r => r["Emission Intensity"])
      .filter(Number.isFinite);
    const s1Objective = s1EiArr.length 
      ? s1EiArr.reduce((a, b) => a + b, 0) / s1EiArr.length 
      : null;
    
    // Shape final CSV rows (remove internals, include EI and Margin)
    const out = constrained.map(r => ({
      SupplierID: r.SupplierID,
      Rank: r.Rank,
      Name: r.Name,
      Industry: r.Industry,
      "Environmental Score": r["Environmental Score"],
      "Social Score": r["Social Score"],
      "Governance Score": r["Governance Score"],
      "Composite Score": r["Composite Score"],
      "Risk Penalty": r["Risk Penalty"],
      "Final Score": r["Final Score"],
      "Emission Intensity": r["Emission Intensity"] != null 
        ? Number(r["Emission Intensity"]).toFixed(6) 
        : "",
      "Margin %": r["Margin %"] != null 
        ? Number(r["Margin %"]).toFixed(2) 
        : "",
    }));
    
    const headers = [
      "SupplierID",
      "Rank",
      "Name",
      "Industry",
      "Environmental Score",
      "Social Score",
      "Governance Score",
      "Composite Score",
      "Risk Penalty",
      "Final Score",
      "Emission Intensity",
      "Margin %",
    ];
    
    return {
      csv: toCSV(out, headers),
      baselineObjective,
      s1Objective,
    };
  }

  /**
   * S2: Sensitivity Analysis
   * Perturb weights by ±10% and ±20%
   * Returns 4 CSVs: s2p10.csv, s2m10.csv, s2p20.csv, s2m20.csv
   */
  async runS2() {
    const deltas = [0.10, -0.10, 0.20, -0.20];
    const labels = ["p10", "m10", "p20", "m20"];
    const suppliers = await this.getAllSuppliers();
    const out = {};

    for (let i = 0; i < deltas.length; i++) {
      const d = deltas[i];
      const baseWeights = {
        e: this.baseCfg.environmentalWeight || 0.4,
        s: this.baseCfg.socialWeight || 0.3,
        g: this.baseCfg.governanceWeight || 0.3,
      };

      // Perturb environmental weight
      const perturbedWeights = this.normalizeWeights({
        e: baseWeights.e * (1 + d),
        s: baseWeights.s,
        g: baseWeights.g,
      });

      const cfg = {
        ...this.baseCfg,
        environmentalWeight: perturbedWeights.e,
        socialWeight: perturbedWeights.s,
        governanceWeight: perturbedWeights.g,
      };

      const rows = await this.recompute(suppliers, cfg);
      
      const headers = [
        "SupplierID",
        "Rank",
        "Name",
        "Industry",
        "Environmental Score",
        "Social Score",
        "Governance Score",
        "Composite Score",
        "Risk Penalty",
        "Final Score",
      ];
      
      out[`s2${labels[i]}.csv`] = toCSV(rows, headers);
    }

    return out;
  }

  /**
   * Inject MCAR (Missing Completely At Random) missingness
   */
  injectMCAR(suppliers, p) {
    const numericFields = [
      "co2_emissions",
      "water_usage",
      "renewable_energy_percent",
      "wage_fairness",
      "human_rights_index",
      "transparency_score",
      "compliance_systems",
      "ethics_program",
    ];

    return suppliers.map((supplier) => {
      const cloned = JSON.parse(JSON.stringify(supplier.toObject ? supplier.toObject() : supplier));
      
      numericFields.forEach((field) => {
        if (Math.random() < p) {
          cloned[field] = null;
        }
      });
      
      return cloned;
    });
  }

  /**
   * Impute missing values using mean or KNN
   */
  async impute(suppliers, mode) {
    if (mode === "mean") {
      // Industry-mean imputation
      const industryMeans = {};
      
      // Calculate means by industry
      suppliers.forEach((s) => {
        const industry = s.industry || "Unknown";
        if (!industryMeans[industry]) {
          industryMeans[industry] = {};
        }
        
        const numericFields = [
          "co2_emissions",
          "water_usage",
          "renewable_energy_percent",
          "wage_fairness",
          "human_rights_index",
          "transparency_score",
          "compliance_systems",
          "ethics_program",
        ];
        
        numericFields.forEach((field) => {
          const val = s[field];
          if (val !== null && val !== undefined && Number.isFinite(val)) {
            if (!industryMeans[industry][field]) {
              industryMeans[industry][field] = { sum: 0, count: 0 };
            }
            industryMeans[industry][field].sum += val;
            industryMeans[industry][field].count += 1;
          }
        });
      });
      
      // Calculate means
      Object.keys(industryMeans).forEach((industry) => {
        Object.keys(industryMeans[industry]).forEach((field) => {
          const { sum, count } = industryMeans[industry][field];
          industryMeans[industry][field] = count > 0 ? sum / count : 0;
        });
      });
      
      // Impute missing values
      return suppliers.map((s) => {
        const cloned = JSON.parse(JSON.stringify(s));
        const industry = cloned.industry || "Unknown";
        
        const numericFields = [
          "co2_emissions",
          "water_usage",
          "renewable_energy_percent",
          "wage_fairness",
          "human_rights_index",
          "transparency_score",
          "compliance_systems",
          "ethics_program",
        ];
        
        numericFields.forEach((field) => {
          if (cloned[field] === null || cloned[field] === undefined) {
            cloned[field] = industryMeans[industry]?.[field] || 0;
          }
        });
        
        return cloned;
      });
    } else if (mode === "knn") {
      // KNN imputation (K=5)
      const featureNames = [
        "co2_emissions",
        "water_usage",
        "renewable_energy_percent",
        "wage_fairness",
        "human_rights_index",
        "transparency_score",
        "compliance_systems",
        "ethics_program",
      ];
      
      const data = suppliers.map((s) => s.toObject ? s.toObject() : s);
      
      // Impute each missing value using KNN
      for (let i = 0; i < data.length; i++) {
        featureNames.forEach((field) => {
          if (data[i][field] === null || data[i][field] === undefined) {
            data[i][field] = knnImpute(data, i, field, featureNames, 5);
          }
        });
      }
      
      return data;
    }
    
    return suppliers;
  }

  /**
   * S3: Missingness Analysis
   * MCAR 5% & 10% × imputation mean/knn (K=5)
   * Returns 4 CSVs: s3_5_mean.csv, s3_10_mean.csv, s3_5_knn.csv, s3_10_knn.csv
   */
  async runS3() {
    const specs = [
      { p: 0.05, impute: "mean" },
      { p: 0.10, impute: "mean" },
      { p: 0.05, impute: "knn" },
      { p: 0.10, impute: "knn" },
    ];
    
    const out = {};
    
    for (const spec of specs) {
      const suppliers = await this.getAllSuppliers();
      const withMissing = this.injectMCAR(suppliers, spec.p);
      const imputed = await this.impute(withMissing, spec.impute);
      
      const rows = await this.recompute(imputed, this.baseCfg);
      
      const headers = [
        "SupplierID",
        "Rank",
        "Name",
        "Industry",
        "Environmental Score",
        "Social Score",
        "Governance Score",
        "Composite Score",
        "Risk Penalty",
        "Final Score",
      ];
      
      const tag = spec.impute === "mean" ? "mean" : "knn";
      out[`s3_${Math.round(spec.p * 100)}_${tag}.csv`] = toCSV(rows, headers);
    }
    
    return out;
  }

  /**
   * S4: Ablation Analysis
   * Normalization OFF vs ON
   * Returns 2 CSVs: s4_off.csv, s4_on.csv
   */
  async runS4() {
    const suppliers = await this.getAllSuppliers();
    
    const cfgOff = { ...this.baseCfg, useIndustryBands: false };
    const cfgOn = { ...this.baseCfg, useIndustryBands: true };
    
    const rowsOff = await this.recompute(suppliers, cfgOff);
    const rowsOn = await this.recompute(suppliers, cfgOn);
    
    const headers = [
      "SupplierID",
      "Rank",
      "Name",
      "Industry",
      "Environmental Score",
      "Social Score",
      "Governance Score",
      "Composite Score",
      "Risk Penalty",
      "Final Score",
    ];
    
    return {
      off: toCSV(rowsOff, headers),
      on: toCSV(rowsOn, headers),
    };
  }
}

module.exports = { ScenarioRunner, createZip };

