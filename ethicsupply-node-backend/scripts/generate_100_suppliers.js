/**
 * Generate 100 suppliers with realistic data for all fields
 * Output: CSV file ready for import
 */

const fs = require("fs");
const path = require("path");

// Industries and their typical characteristics
const industries = [
  {
    name: "Technology",
    baseEmissions: 50000,
    baseWater: 20000,
    baseWaste: 500,
    renewableBase: 60,
  },
  {
    name: "Manufacturing",
    baseEmissions: 150000,
    baseWater: 40000,
    baseWaste: 1200,
    renewableBase: 30,
  },
  {
    name: "Textiles & Apparel",
    baseEmissions: 80000,
    baseWater: 30000,
    baseWaste: 800,
    renewableBase: 25,
  },
  {
    name: "Electronics",
    baseEmissions: 120000,
    baseWater: 35000,
    baseWaste: 1000,
    renewableBase: 40,
  },
  {
    name: "Food & Beverage",
    baseEmissions: 100000,
    baseWater: 50000,
    baseWaste: 1500,
    renewableBase: 35,
  },
  {
    name: "Automotive",
    baseEmissions: 200000,
    baseWater: 60000,
    baseWaste: 2000,
    renewableBase: 25,
  },
  {
    name: "Pharmaceuticals",
    baseEmissions: 90000,
    baseWater: 25000,
    baseWaste: 700,
    renewableBase: 45,
  },
  {
    name: "Energy",
    baseEmissions: 300000,
    baseWater: 80000,
    baseWaste: 2500,
    renewableBase: 50,
  },
  {
    name: "Chemicals",
    baseEmissions: 180000,
    baseWater: 45000,
    baseWaste: 1800,
    renewableBase: 20,
  },
  {
    name: "Construction",
    baseEmissions: 110000,
    baseWater: 40000,
    baseWaste: 1300,
    renewableBase: 15,
  },
];

const countries = [
  { name: "United States", riskGeo: 0.2, riskClimate: 0.3, riskLabor: 0.15 },
  { name: "Germany", riskGeo: 0.15, riskClimate: 0.25, riskLabor: 0.1 },
  { name: "China", riskGeo: 0.4, riskClimate: 0.35, riskLabor: 0.3 },
  { name: "India", riskGeo: 0.35, riskClimate: 0.4, riskLabor: 0.35 },
  { name: "Japan", riskGeo: 0.25, riskClimate: 0.3, riskLabor: 0.15 },
  { name: "South Korea", riskGeo: 0.3, riskClimate: 0.3, riskLabor: 0.2 },
  { name: "United Kingdom", riskGeo: 0.2, riskClimate: 0.25, riskLabor: 0.15 },
  { name: "France", riskGeo: 0.2, riskClimate: 0.25, riskLabor: 0.15 },
  { name: "Singapore", riskGeo: 0.15, riskClimate: 0.35, riskLabor: 0.1 },
  { name: "Canada", riskGeo: 0.15, riskClimate: 0.3, riskLabor: 0.1 },
];

// Company name generators
const companyPrefixes = [
  "Global",
  "Advanced",
  "Sustainable",
  "Eco",
  "Green",
  "Premium",
  "Elite",
  "Prime",
  "Superior",
  "Innovative",
  "Modern",
  "Future",
  "Next",
  "Pro",
  "Ultra",
];
const companySuffixes = [
  "Solutions",
  "Industries",
  "Corp",
  "Group",
  "Enterprises",
  "Systems",
  "Technologies",
  "Manufacturing",
  "Services",
  "Network",
  "Partners",
  "Holdings",
  "International",
  "Limited",
  "Inc",
];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function round(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function generateCompanyName(index) {
  const prefix = randomElement(companyPrefixes);
  const suffix = randomElement(companySuffixes);
  const industry = randomElement(industries).name;
  const type = randomElement(["Co.", "Ltd.", "Inc.", "LLC", "Corp.", ""]);
  return `${prefix} ${industry} ${suffix} ${type}`.trim();
}

function calculateScores(supplier) {
  // Environmental Score (0-100)
  const envFactors = [
    (supplier.renewable_energy_percent / 100) * 30,
    (1 - supplier.energy_efficiency) * 20 + supplier.energy_efficiency * 20,
    (1 - supplier.waste_management_score) * 15 +
      supplier.waste_management_score * 15,
    (1 - supplier.pollution_control) * 15 + supplier.pollution_control * 15,
    Math.min(
      100,
      supplier.total_emissions / supplier.revenue_musd < 100 ? 20 : 10
    ),
  ];
  const environmental_score = Math.min(
    100,
    Math.max(
      0,
      envFactors.reduce((a, b) => a + b, 0)
    )
  );

  // Social Score (0-100)
  const socialFactors = [
    supplier.living_wage_ratio * 20,
    (supplier.gender_diversity_percent / 100) * 15,
    supplier.worker_safety * 15,
    supplier.community_engagement * 15,
    supplier.diversity_inclusion_score * 15,
    Math.max(0, 20 - supplier.injury_rate * 10),
    (supplier.training_hours / 50) * 10,
  ];
  const social_score = Math.min(
    100,
    Math.max(
      0,
      socialFactors.reduce((a, b) => a + b, 0)
    )
  );

  // Governance Score (0-100)
  const govFactors = [
    (supplier.transparency_score / 100) * 25,
    (supplier.board_diversity / 100) * 15,
    (supplier.board_independence / 100) * 15,
    supplier.ethics_program * 15,
    supplier.compliance_systems * 15,
    supplier.anti_corruption_policy ? 15 : 0,
    (1 - supplier.corruption_risk) * 10,
  ];
  const governance_score = Math.min(
    100,
    Math.max(
      0,
      govFactors.reduce((a, b) => a + b, 0)
    )
  );

  // Composite Score (weighted average: E=0.4, S=0.3, G=0.3)
  const composite_score = round(
    environmental_score * 0.4 + social_score * 0.3 + governance_score * 0.3,
    1
  );

  // Risk Factor (weighted average of risk scores)
  const risk_factor = round(
    supplier.geopolitical_risk * 0.33 +
      supplier.climate_risk * 0.33 +
      supplier.labor_dispute_risk * 0.34,
    2
  );

  // Risk Penalty (if risk_factor > 0.5)
  const risk_excess = Math.max(0, risk_factor - 0.5);
  const risk_penalty =
    risk_excess > 0 ? round(15 * risk_excess * 100, 1) : null;

  // Final Score (composite - penalty, clamped 0-100)
  const finalScore = Math.max(
    0,
    Math.min(100, round(composite_score - (risk_penalty || 0), 1))
  );

  // Risk Level
  let risk_level = "low";
  if (risk_factor >= 0.7) risk_level = "critical";
  else if (risk_factor >= 0.5) risk_level = "high";
  else if (risk_factor >= 0.3) risk_level = "medium";

  // Ethical Score (same as finalScore)
  const ethical_score = finalScore;

  // Completeness Ratio (estimate based on filled fields)
  const totalFields = 48;
  const filledFields = Object.values(supplier).filter(
    (v) => v !== null && v !== undefined && v !== ""
  ).length;
  const completeness_ratio = round(filledFields / totalFields, 2);

  return {
    environmental_score: round(environmental_score, 1),
    social_score: round(social_score, 1),
    governance_score: round(governance_score, 1),
    composite_score,
    risk_factor,
    risk_penalty,
    finalScore,
    risk_level,
    ethical_score,
    completeness_ratio,
  };
}

function generateSupplier(index) {
  const industry = randomElement(industries);
  const country = randomElement(countries);

  // Revenue and cost (realistic ranges)
  const revenue_musd = round(randomBetween(100, 5000), 1);
  const margin_pct = round(randomBetween(5, 35), 1);
  const cost_musd = round(revenue_musd * (1 - margin_pct / 100), 1);
  const revenue = revenue_musd; // Legacy field

  // Employee count (scales with revenue)
  const employee_count = randomInt(
    Math.floor(revenue_musd * 2),
    Math.floor(revenue_musd * 8)
  );

  // Environmental metrics (industry-based)
  const total_emissions = randomInt(
    Math.floor(industry.baseEmissions * 0.7),
    Math.floor(industry.baseEmissions * 1.5)
  );
  const co2_emissions = total_emissions;
  const water_usage = randomInt(
    Math.floor(industry.baseWater * 0.7),
    Math.floor(industry.baseWater * 1.5)
  );
  const waste_generated = randomInt(
    Math.floor(industry.baseWaste * 0.7),
    Math.floor(industry.baseWaste * 1.5)
  );
  const renewable_energy_percent = round(
    randomBetween(industry.renewableBase - 20, industry.renewableBase + 30),
    1
  );

  // Scores (0-1 range)
  const energy_efficiency = round(randomBetween(0.4, 0.95), 2);
  const waste_management_score = round(randomBetween(0.4, 0.95), 2);
  const pollution_control = round(randomBetween(0.4, 0.95), 2);

  // Social metrics
  const injury_rate = round(randomBetween(0.2, 2.5), 2);
  const training_hours = round(randomBetween(10, 50), 1);
  const living_wage_ratio = round(randomBetween(0.8, 1.5), 2);
  const gender_diversity_percent = round(randomBetween(20, 55), 1);
  const wage_fairness = round(randomBetween(0.5, 0.95), 2);
  const human_rights_index = round(randomBetween(0.5, 0.95), 2);
  const community_engagement = round(randomBetween(0.4, 0.9), 2);
  const worker_safety = round(randomBetween(0.5, 0.95), 2);
  const diversity_inclusion_score = round(randomBetween(0.4, 0.9), 2);

  // Governance metrics
  const board_diversity = round(randomBetween(20, 60), 1);
  const board_independence = round(randomBetween(40, 80), 1);
  const transparency_score = round(randomBetween(50, 90), 1);
  const anti_corruption_policy = Math.random() > 0.3; // 70% have policy
  const ethics_program = round(randomBetween(0.5, 0.95), 2);
  const compliance_systems = round(randomBetween(0.5, 0.95), 2);
  const corruption_risk = round(randomBetween(0.2, 0.6), 2);

  // Supply chain metrics
  const delivery_efficiency = round(randomBetween(0.6, 0.95), 2);
  const quality_control_score = round(randomBetween(0.5, 0.95), 2);
  const supplier_diversity = round(randomBetween(0.4, 0.9), 2);
  const traceability = round(randomBetween(0.5, 0.95), 2);

  // Risk factors (country-based with variation)
  const geopolitical_risk = round(
    randomBetween(
      Math.max(0.1, country.riskGeo - 0.1),
      Math.min(0.9, country.riskGeo + 0.2)
    ),
    2
  );
  const climate_risk = round(
    randomBetween(
      Math.max(0.1, country.riskClimate - 0.1),
      Math.min(0.9, country.riskClimate + 0.2)
    ),
    2
  );
  const labor_dispute_risk = round(
    randomBetween(
      Math.max(0.1, country.riskLabor - 0.1),
      Math.min(0.9, country.riskLabor + 0.2)
    ),
    2
  );

  const supplier = {
    name: generateCompanyName(index),
    country: country.name,
    industry: industry.name,
    revenue: revenue,
    revenue_musd: revenue_musd,
    cost_musd: cost_musd,
    margin_pct: margin_pct,
    employee_count: employee_count,
    co2_emissions: co2_emissions,
    total_emissions: total_emissions,
    water_usage: water_usage,
    waste_generated: waste_generated,
    renewable_energy_percent: renewable_energy_percent,
    injury_rate: injury_rate,
    training_hours: training_hours,
    living_wage_ratio: living_wage_ratio,
    gender_diversity_percent: gender_diversity_percent,
    board_diversity: board_diversity,
    board_independence: board_independence,
    transparency_score: transparency_score,
    anti_corruption_policy: anti_corruption_policy,
    delivery_efficiency: delivery_efficiency,
    energy_efficiency: energy_efficiency,
    waste_management_score: waste_management_score,
    pollution_control: pollution_control,
    community_engagement: community_engagement,
    worker_safety: worker_safety,
    diversity_inclusion_score: diversity_inclusion_score,
    supplier_diversity: supplier_diversity,
    traceability: traceability,
    quality_control_score: quality_control_score,
    wage_fairness: wage_fairness,
    human_rights_index: human_rights_index,
    geopolitical_risk: geopolitical_risk,
    climate_risk: climate_risk,
    labor_dispute_risk: labor_dispute_risk,
    corruption_risk: corruption_risk,
    ethics_program: ethics_program,
    compliance_systems: compliance_systems,
  };

  // Calculate scores
  const scores = calculateScores(supplier);

  return {
    ...supplier,
    ...scores,
  };
}

// Generate 40 suppliers (reduced from 100 to avoid "request entity too large" error)
const suppliers = [];
for (let i = 0; i < 40; i++) {
  suppliers.push(generateSupplier(i));
}

// CSV Headers (all 48 fields)
const headers = [
  "name",
  "country",
  "industry",
  "revenue",
  "revenue_musd",
  "cost_musd",
  "margin_pct",
  "employee_count",
  "co2_emissions",
  "total_emissions",
  "water_usage",
  "waste_generated",
  "renewable_energy_percent",
  "injury_rate",
  "training_hours",
  "living_wage_ratio",
  "gender_diversity_percent",
  "board_diversity",
  "board_independence",
  "transparency_score",
  "anti_corruption_policy",
  "delivery_efficiency",
  "energy_efficiency",
  "waste_management_score",
  "pollution_control",
  "community_engagement",
  "worker_safety",
  "diversity_inclusion_score",
  "supplier_diversity",
  "traceability",
  "quality_control_score",
  "wage_fairness",
  "human_rights_index",
  "geopolitical_risk",
  "climate_risk",
  "labor_dispute_risk",
  "corruption_risk",
  "ethics_program",
  "compliance_systems",
  "risk_factor",
  "risk_penalty",
  "ethical_score",
  "environmental_score",
  "social_score",
  "governance_score",
  "risk_level",
  "composite_score",
  "finalScore",
  "completeness_ratio",
];

// Convert to CSV
function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const csvRows = [
  headers.join(","),
  ...suppliers.map((supplier) =>
    headers
      .map((header) => {
        const value = supplier[header];
        if (typeof value === "boolean") return value ? "true" : "false";
        return escapeCSV(value);
      })
      .join(",")
  ),
];

const csvContent = csvRows.join("\n");

// Write to file
const outputPath = path.join(__dirname, "../data/40_suppliers.csv");
fs.writeFileSync(outputPath, csvContent, "utf8");

console.log(
  `✅ Generated ${suppliers.length} suppliers with all fields filled`
);
console.log(`📁 Saved to: ${outputPath}`);
console.log(`📊 Total fields per supplier: ${headers.length}`);
console.log(`📈 Sample suppliers:`);
suppliers.slice(0, 3).forEach((s, i) => {
  console.log(
    `   ${i + 1}. ${s.name} (${s.country}, ${s.industry}) - Score: ${
      s.finalScore
    }`
  );
});
