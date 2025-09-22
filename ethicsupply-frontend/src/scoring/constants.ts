import { Industry } from "../types/esg";

type IndustryBenchmarks = Record<Industry, { bad: number; good: number }>;

type IntensityBenchmarks = {
  emissions: IndustryBenchmarks;
  water: IndustryBenchmarks;
  waste: IndustryBenchmarks;
};

export const intensityBenchmarks: IntensityBenchmarks = {
  emissions: {
    Energy: { bad: 50000, good: 5000 },
    Manufacturing: { bad: 10000, good: 1000 },
    Retail: { bad: 2000, good: 200 },
    Technology: { bad: 700, good: 70 },
    Healthcare: { bad: 3000, good: 300 },
    Other: { bad: 5000, good: 500 },
  },
  water: {
    Energy: { bad: 1200, good: 120 },
    Manufacturing: { bad: 800, good: 80 },
    Retail: { bad: 200, good: 20 },
    Technology: { bad: 60, good: 6 },
    Healthcare: { bad: 300, good: 30 },
    Other: { bad: 400, good: 40 },
  },
  waste: {
    Energy: { bad: 1500, good: 150 },
    Manufacturing: { bad: 900, good: 90 },
    Retail: { bad: 120, good: 12 },
    Technology: { bad: 80, good: 8 },
    Healthcare: { bad: 250, good: 25 },
    Other: { bad: 300, good: 30 },
  },
};

export const ENVIRONMENTAL_METRIC_WEIGHTS = {
  emissionsIntensity: 0.4,
  renewableShare: 0.2,
  waterIntensity: 0.2,
  wasteIntensity: 0.2,
} as const;

export const SOCIAL_METRIC_WEIGHTS = {
  injuryRate: 0.3,
  trainingHours: 0.2,
  wageRatio: 0.2,
  diversity: 0.3,
} as const;

export const GOVERNANCE_METRIC_WEIGHTS = {
  boardDiversity: 0.25,
  boardIndependence: 0.25,
  antiCorruption: 0.2,
  transparency: 0.3,
} as const;

export const PILLAR_WEIGHTS = {
  environmental: 0.4,
  social: 0.3,
  governance: 0.3,
} as const;

export const TRAINING_HOURS_CAP = 60; // hours per employee -> 100 score
export const INJURY_RATE_FULL_SCORE = 0; // zero injuries -> 100
export const INJURY_RATE_ZERO_SCORE = 5; // 5 per 200k hrs -> 0 score
export const WAGE_RATIO_MIN = 0.7; // below 0.7 -> 0 score
export const WAGE_RATIO_TARGET = 1.0; // 1.0 or above -> 100 score
export const DEFAULT_RISK_FACTOR = 0.15;
export const DISCLOSURE_CAP_THRESHOLD = 0.7; // 70%
export const DISCLOSURE_CAP_SCORE = 50;

export const ESG_METRIC_KEYS = [
  "ghgScope1_tCO2e",
  "ghgScope2_tCO2e",
  "energyRenewable_pct",
  "waterUse_megaliters",
  "waste_tonnes",
  "injuryRate_per200kHrs",
  "trainingHours_perEmployee",
  "wageRatio_vsLivingWage",
  "workforceDiversity_pct",
  "boardDiversity_pct",
  "boardIndependence_pct",
  "antiCorruptionPolicy",
  "transparencyScore_0to100",
] as const;

export type ESGMetricKey = typeof ESG_METRIC_KEYS[number];
