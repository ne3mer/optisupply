/**
 * Shared ESG score / risk exposure colour bands for list + profile views.
 * Scores: higher is better. Risk sub-metrics: higher exposure = worse.
 *
 * Score bands (0–100 after normalizing fractions): green ≥ greenMin,
 * amber ≥ amberMin, else red. Tuned so neighbouring pillars (e.g. 63 vs 69)
 * are not inverted vs each other.
 */
export const SCORE_THRESHOLDS = {
  /** ≥ this → green (strong pillar / headline score) */
  greenMin: 65,
  /** ≥ this and < greenMin → amber */
  amberMin: 45,
  /** ≥ this label tier → “Excellent” on cards (optional fourth copy tier) */
  excellentMin: 80,
} as const;

/**
 * Risk exposure on 0–100 display scale: low is good (green), high is bad (red).
 * ≤ lowMax → green, ≤ moderateMax → amber, else red.
 */
export const RISK_THRESHOLDS = {
  lowMax: 30,
  moderateMax: 60,
} as const;

export function normalizeDisplay0to100(
  value: number | null | undefined,
): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  if (value > 0 && value <= 1) return value * 100;
  return value;
}

/** Pillar / headline scores: higher is better. */
export function scoreBandColor(
  colors: Record<string, string>,
  score: number | null | undefined,
): string {
  const n = normalizeDisplay0to100(score);
  if (n === null) return colors.textMuted;
  if (n >= SCORE_THRESHOLDS.greenMin) return colors.success;
  if (n >= SCORE_THRESHOLDS.amberMin) return colors.warning;
  return colors.error;
}

/** Short label for supplier cards; thresholds match scoreBandColor + excellent tier. */
export function scorePerformanceLabel(
  score: number | null | undefined,
): "Excellent" | "Strong" | "Average" | "At Risk" {
  const n = normalizeDisplay0to100(score);
  if (n === null) return "At Risk";
  if (n >= SCORE_THRESHOLDS.excellentMin) return "Excellent";
  if (n >= SCORE_THRESHOLDS.greenMin) return "Strong";
  if (n >= SCORE_THRESHOLDS.amberMin) return "Average";
  return "At Risk";
}

/** Risk exposure sub-metrics: higher value = more risk (red), lower = better (green). */
export function riskMetricColor(
  colors: Record<string, string>,
  riskValue: number | null | undefined,
): string {
  const n = normalizeDisplay0to100(riskValue);
  if (n === null) return colors.textMuted;
  if (n <= RISK_THRESHOLDS.lowMax) return colors.success;
  if (n <= RISK_THRESHOLDS.moderateMax) return colors.warning;
  return colors.error;
}
