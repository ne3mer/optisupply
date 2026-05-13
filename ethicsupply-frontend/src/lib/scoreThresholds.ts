/**
 * Shared ESG score / risk exposure colour bands for list + profile views.
 * Scores: higher is better. Raw risk metrics (climate, corruption, …): higher is worse.
 */

export const SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
  pass: 40,
} as const;

/** On 0–100 “exposure” scale after normalizing raw values. */
export const RISK_THRESHOLDS = {
  lowMax: 33,
  moderateMax: 66,
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

/** Pillar / headline scores: higher is better (matches supplier card rating bands). */
export function scoreBandColor(
  colors: Record<string, string>,
  score: number | null | undefined,
): string {
  const n = normalizeDisplay0to100(score);
  if (n === null) return colors.textMuted;
  if (n >= SCORE_THRESHOLDS.excellent) return colors.success;
  if (n >= SCORE_THRESHOLDS.good) return colors.primary;
  if (n >= SCORE_THRESHOLDS.pass) return colors.warning;
  return colors.error;
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
