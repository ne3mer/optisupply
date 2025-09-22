import { SupplierESGInput } from "../types/esg";
import {
  intensityBenchmarks,
  ENVIRONMENTAL_METRIC_WEIGHTS,
  SOCIAL_METRIC_WEIGHTS,
  GOVERNANCE_METRIC_WEIGHTS,
  PILLAR_WEIGHTS,
  TRAINING_HOURS_CAP,
  INJURY_RATE_FULL_SCORE,
  INJURY_RATE_ZERO_SCORE,
  WAGE_RATIO_MIN,
  WAGE_RATIO_TARGET,
  DEFAULT_RISK_FACTOR,
  DISCLOSURE_CAP_SCORE,
  DISCLOSURE_CAP_THRESHOLD,
  ESG_METRIC_KEYS,
} from "./constants";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const linearScale = (value: number, min: number, max: number) => {
  if (max === min) return 0;
  const clamped = clamp(value, min, max);
  const scaled = (clamped - min) / (max - min);
  return scaled;
};

const scaleHigherIsBetter = (
  value: number,
  min: number,
  max: number
) => linearScale(value, min, max) * 100;

const scaleLowerIsBetter = (
  value: number,
  bad: number,
  good: number
) => {
  if (good === bad) return 0;
  const clamped = clamp(value, Math.min(good, bad), Math.max(good, bad));
  const score = (bad - clamped) / (bad - good);
  return clamp(score * 100, 0, 100);
};

const deriveIntensity = (value: number | null, revenue: number | null) => {
  if (value === null || value === undefined) return null;
  if (!revenue || revenue <= 0) return null;
  return value / revenue;
};

const scoreInjuryRate = (value: number) => {
  if (value <= INJURY_RATE_FULL_SCORE) return 100;
  if (value >= INJURY_RATE_ZERO_SCORE) return 0;
  return (
    ((INJURY_RATE_ZERO_SCORE - value) /
      (INJURY_RATE_ZERO_SCORE - INJURY_RATE_FULL_SCORE)) *
    100
  );
};

const scoreTrainingHours = (value: number) => {
  if (value <= 0) return 0;
  if (value >= TRAINING_HOURS_CAP) return 100;
  return clamp((value / TRAINING_HOURS_CAP) * 100, 0, 100);
};

const scoreWageRatio = (value: number) => {
  if (value <= WAGE_RATIO_MIN) return 0;
  if (value >= WAGE_RATIO_TARGET) return 100;
  return (
    ((value - WAGE_RATIO_MIN) / (WAGE_RATIO_TARGET - WAGE_RATIO_MIN)) * 100
  );
};

const average = (values: Array<number>) => {
  if (!values.length) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
};

const countNonNull = (input: SupplierESGInput) =>
  ESG_METRIC_KEYS.reduce((count, key) => {
    const value = (input as any)[key];
    return value !== null && value !== undefined ? count + 1 : count;
  }, 0);

const expectedMetricCount = ESG_METRIC_KEYS.length;

export interface NormalizedSupplierScores {
  metrics: Record<string, number | null>; // normalized metrics 0-100
  environment: number;
  social: number;
  governance: number;
  compositeNoRisk: number;
  riskFactor: number;
  finalScore: number;
  completenessPct: number;
  notes: string[];
}

export const normalizeAndScore = (
  input: SupplierESGInput,
  industryProxy?: Partial<Record<keyof SupplierESGInput, number>>
): NormalizedSupplierScores => {
  const notes: string[] = [];

  const revenue = input.revenueUSDm ?? null;
  const scope1 = input.ghgScope1_tCO2e ?? 0;
  const scope2 = input.ghgScope2_tCO2e ?? 0;
  const totalEmissions =
    input.ghgScope1_tCO2e === null && input.ghgScope2_tCO2e === null
      ? null
      : scope1 + scope2;

  const intensities = {
    emissions: deriveIntensity(totalEmissions, revenue),
    water: deriveIntensity(input.waterUse_megaliters, revenue),
    waste: deriveIntensity(input.waste_tonnes, revenue),
  };

  const industry = input.industry || "Other";

  const normalizedMetrics: Record<string, number | null> = {};

  const pickValue = (key: keyof SupplierESGInput) => {
    const raw = input[key];
    if (raw === null || raw === undefined) {
      const fallback = industryProxy?.[key];
      if (fallback !== undefined) {
        notes.push(`Used proxy for ${key}: ${fallback}`);
        return fallback;
      }
      notes.push(`Missing ${String(key)}`);
      return null;
    }
    return raw;
  };

  // Environmental metrics
  const emissionIntensity = intensities.emissions;
  if (emissionIntensity !== null) {
    const benchmark = intensityBenchmarks.emissions[industry];
    normalizedMetrics.emissionIntensity = scaleLowerIsBetter(
      emissionIntensity,
      benchmark.bad,
      benchmark.good
    );
  } else {
    normalizedMetrics.emissionIntensity = null;
  }

  const renewableShare = pickValue("energyRenewable_pct");
  normalizedMetrics.renewableShare =
    renewableShare !== null ? clamp(renewableShare, 0, 100) : null;

  const waterIntensity = intensities.water;
  if (waterIntensity !== null) {
    const benchmark = intensityBenchmarks.water[industry];
    normalizedMetrics.waterIntensity = scaleLowerIsBetter(
      waterIntensity,
      benchmark.bad,
      benchmark.good
    );
  } else {
    normalizedMetrics.waterIntensity = null;
  }

  const wasteIntensity = intensities.waste;
  if (wasteIntensity !== null) {
    const benchmark = intensityBenchmarks.waste[industry];
    normalizedMetrics.wasteIntensity = scaleLowerIsBetter(
      wasteIntensity,
      benchmark.bad,
      benchmark.good
    );
  } else {
    normalizedMetrics.wasteIntensity = null;
  }

  // Social metrics
  const injuryRate = pickValue("injuryRate_per200kHrs");
  normalizedMetrics.injuryRate =
    injuryRate !== null ? scoreInjuryRate(injuryRate) : null;

  const trainingHours = pickValue("trainingHours_perEmployee");
  normalizedMetrics.trainingHours =
    trainingHours !== null ? scoreTrainingHours(trainingHours) : null;

  const wageRatio = pickValue("wageRatio_vsLivingWage");
  normalizedMetrics.wageRatio =
    wageRatio !== null ? clamp(scoreWageRatio(wageRatio), 0, 100) : null;

  const diversity = pickValue("workforceDiversity_pct");
  normalizedMetrics.diversity =
    diversity !== null ? clamp(diversity, 0, 100) : null;

  // Governance metrics
  const boardDiversity = pickValue("boardDiversity_pct");
  normalizedMetrics.boardDiversity =
    boardDiversity !== null ? clamp(boardDiversity, 0, 100) : null;

  const boardIndependence = pickValue("boardIndependence_pct");
  normalizedMetrics.boardIndependence =
    boardIndependence !== null ? clamp(boardIndependence, 0, 100) : null;

  const antiCorruption = pickValue("antiCorruptionPolicy");
  normalizedMetrics.antiCorruption = antiCorruption ? 100 : 0;
  if (!antiCorruption) {
    notes.push("No anti-corruption policy disclosed (scored 0).");
  }

  const transparency = pickValue("transparencyScore_0to100");
  normalizedMetrics.transparency =
    transparency !== null ? clamp(transparency, 0, 100) : null;

  const computePillarScore = (
    metrics: Array<[number | null, number]>
  ): number => {
    const valid = metrics.filter(([value]) => value !== null) as Array<[
      number,
      number
    ]>;
    if (!valid.length) return 0;
    const weightedSum = valid.reduce(
      (sum, [value, weight]) => sum + value * weight,
      0
    );
    const totalWeight = valid.reduce((sum, [, weight]) => sum + weight, 0);
    return (weightedSum / totalWeight) * 100;
  };

  const environmentalScore = computePillarScore([
    [normalizedMetrics.emissionIntensity, ENVIRONMENTAL_METRIC_WEIGHTS.emissionsIntensity],
    [normalizedMetrics.renewableShare, ENVIRONMENTAL_METRIC_WEIGHTS.renewableShare],
    [normalizedMetrics.waterIntensity, ENVIRONMENTAL_METRIC_WEIGHTS.waterIntensity],
    [normalizedMetrics.wasteIntensity, ENVIRONMENTAL_METRIC_WEIGHTS.wasteIntensity],
  ]);

  const socialScore = computePillarScore([
    [normalizedMetrics.injuryRate, SOCIAL_METRIC_WEIGHTS.injuryRate],
    [normalizedMetrics.trainingHours, SOCIAL_METRIC_WEIGHTS.trainingHours],
    [normalizedMetrics.wageRatio, SOCIAL_METRIC_WEIGHTS.wageRatio],
    [normalizedMetrics.diversity, SOCIAL_METRIC_WEIGHTS.diversity],
  ]);

  const governanceScore = computePillarScore([
    [normalizedMetrics.boardDiversity, GOVERNANCE_METRIC_WEIGHTS.boardDiversity],
    [normalizedMetrics.boardIndependence, GOVERNANCE_METRIC_WEIGHTS.boardIndependence],
    [normalizedMetrics.antiCorruption, GOVERNANCE_METRIC_WEIGHTS.antiCorruption],
    [normalizedMetrics.transparency, GOVERNANCE_METRIC_WEIGHTS.transparency],
  ]);

  const compositeNoRisk =
    environmentalScore * PILLAR_WEIGHTS.environmental +
    socialScore * PILLAR_WEIGHTS.social +
    governanceScore * PILLAR_WEIGHTS.governance;

  const risks = [
    input.climateRisk_0to1,
    input.geopoliticalRisk_0to1,
    input.laborRisk_0to1,
  ].filter((value): value is number => value !== null && value !== undefined);

  let riskFactor = risks.length ? average(risks) : DEFAULT_RISK_FACTOR;
  if (!risks.length) {
    notes.push("Risk data missing; applied default risk factor of 0.15.");
  }
  riskFactor = clamp(riskFactor, 0, 1);

  let finalScore = compositeNoRisk * (1 - riskFactor);

  const completenessPct = countNonNull(input) / expectedMetricCount;
  if (completenessPct < DISCLOSURE_CAP_THRESHOLD) {
    notes.push(
      `Disclosure completeness ${Math.round(
        completenessPct * 100
      )}% < ${DISCLOSURE_CAP_THRESHOLD * 100}%; capped at ${DISCLOSURE_CAP_SCORE}.`
    );
    finalScore = Math.min(finalScore, DISCLOSURE_CAP_SCORE);
  }

  return {
    metrics: normalizedMetrics,
    environment: environmentalScore,
    social: socialScore,
    governance: governanceScore,
    compositeNoRisk,
    riskFactor,
    finalScore,
    completenessPct,
    notes,
  };
};

export default normalizeAndScore;
