function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Match list/dashboard convention: (0,1] fractions → 0–100 scale */
function normalizeScoreTo100(score: number): number {
  return score > 0 && score <= 1 ? score * 100 : score;
}

export function fmtScore(score: number | null | undefined): string {
  const v = toFiniteNumber(score);
  if (v === null) return "N/A";
  return normalizeScoreTo100(v).toFixed(1);
}

export function fmtRiskFactor(factor: number | null | undefined): string {
  const v = toFiniteNumber(factor);
  if (v === null) return "N/A";
  const clamped = Math.min(1, Math.max(0, v));
  return clamped.toFixed(3);
}

export function fmtPenalty(penalty: number | null | undefined): string {
  const v = toFiniteNumber(penalty);
  if (v === null) return "N/A";
  return v.toFixed(1);
}

export function fmtRawMetric(
  value: number | null | undefined,
  unit: string,
): string {
  const v = toFiniteNumber(value);
  if (v === null) return "N/A";
  const formatted = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(v);
  return `${formatted} ${unit}`;
}

export function fmtDate(
  input: string | number | Date | null | undefined,
): string {
  if (input === null || input === undefined || input === "") return "N/A";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
