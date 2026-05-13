/**
 * Varied list titles + helpers for recommendations (thesis / demo UX).
 * Mirrors backend logic in recommendationApiPayload.js where possible.
 */

export type RecommendationPillar =
  | "environmental"
  | "social"
  | "governance";

export const TITLE_TEMPLATES: Record<RecommendationPillar, string[]> = {
  environmental: [
    "Tighten emission controls for {supplier}",
    "Address pollution compliance gaps at {supplier}",
    "Strengthen renewable energy targets for {supplier}",
    "Reduce carbon intensity at {supplier}",
    "Improve waste management practices at {supplier}",
  ],
  social: [
    "Review labour practices at {supplier}",
    "Strengthen worker safety protocols for {supplier}",
    "Close wage fairness gap at {supplier}",
    "Improve human rights compliance for {supplier}",
    "Increase gender diversity targets at {supplier}",
  ],
  governance: [
    "Strengthen board oversight at {supplier}",
    "Address ethics and compliance gaps for {supplier}",
    "Improve transparency reporting at {supplier}",
    "Review anti-corruption controls at {supplier}",
    "Close board independence gap at {supplier}",
  ],
};

/** Strip trailing "(Batch N)" for title line only; full name stays in subtitle. */
export function shortSupplierDisplayName(name: string): string {
  return name.replace(/\s*\(Batch\s*\d+\)\s*$/i, "").trim();
}

export function stripFocusSuffixFromTitle(title: string): {
  title: string;
  focusRound?: number;
} {
  const m = /\s*\(Focus\s*(\d+)\)\s*$/i.exec(title);
  if (!m) return { title: title.trim() };
  return {
    title: title.slice(0, m.index).trim(),
    focusRound: Number(m[1]),
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** 0 = primary pillar row, 1 = secondary / follow-up row when id ends with -2. */
export function recPickIndexFromStableId(stableId: string): number {
  const m = /-(environmental|social|governance)-(\d+)$/.exec(stableId);
  if (m && Number(m[2]) > 1) return 1;
  return 0;
}

export function buildVariedListTitle(
  pillar: RecommendationPillar,
  stableId: string,
  supplierShortName: string,
): string {
  const templates = TITLE_TEMPLATES[pillar] ?? TITLE_TEMPLATES.environmental;
  const pickIdx = recPickIndexFromStableId(stableId);
  const idx = (hashString(stableId) + pickIdx) % templates.length;
  return templates[idx].replace(/\{supplier\}/g, supplierShortName);
}

/** Titles that should be replaced with the varied template bank. */
export function looksLikeTemplateLoopTitle(title: string): boolean {
  const t = title.trim();
  if (!t) return true;
  if (/\(Focus\s*\d+\)\s*$/i.test(t)) return true;
  if (/^Improve\s+.+\s+performance\s+for\s+/i.test(t)) return true;
  if (
    /^Improve\s+(Environmental|Social|Governance|Supply\s+Chain)\s+for\s+/i.test(
      t,
    )
  )
    return true;
  return false;
}

export function focusRoundBadgeLabel(focus: number): string | null {
  if (focus < 2) return null;
  if (focus === 2) return "Follow-up";
  if (focus === 3) return "Third review";
  return `Cycle ${focus}`;
}
