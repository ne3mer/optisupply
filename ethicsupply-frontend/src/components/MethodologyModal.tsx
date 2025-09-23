import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  meta?: { version?: string | null; seed?: string | null; generatedAt?: string | null; bandsVersion?: string | null } | null;
  colors?: { panel: string; accent: string; text: string; textMuted: string };
};

const MethodologyModal: React.FC<Props> = ({ open, onClose, meta, colors }) => {
  if (!open) return null;
  const c = colors || { panel: "#1a2035", accent: "#4D5BFF", text: "#E0E0FF", textMuted: "#8A94C8" };
  const prettyVersion = (v?: string | null) => {
    if (!v) return "Synthetic v1";
    return v.toLowerCase().startsWith("synthetic-") ? `Synthetic ${v.slice("synthetic-".length)}` : v;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div className="relative max-w-2xl w-[95%] rounded-lg border p-6" style={{ backgroundColor: c.panel, borderColor: c.accent + "40" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold" style={{ color: c.text }}>Synthetic Dataset Methodology</h3>
          <button className="text-sm" style={{ color: c.textMuted }} onClick={onClose}>Close</button>
        </div>
        <div className="space-y-3 text-sm" style={{ color: c.textMuted }}>
          <p>
            Synthetic data is generated per-industry with realistic ranges and correlations.
            Bands constrain ranges; optional anchors nudge means with alpha = 0.2. Intensities
            are derived (emissions/revenue, water/revenue, waste/revenue). Approximately 15% missingness
            is introduced on non-critical fields.
          </p>
          <p>
            Scoring normalizes metrics by industry bands, computes E/S/G pillars, applies a risk adjustment,
            and caps the final ethical score at 50 when completeness is below 70%.
          </p>
          <p>
            Source meta: {prettyVersion(meta?.version)}{meta?.seed ? ` (seed: ${meta.seed})` : ""}
            {meta?.generatedAt ? ` • Generated: ${new Date(meta.generatedAt).toLocaleString()}` : ""}
            {meta?.bandsVersion ? ` • Bands: ${meta.bandsVersion}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MethodologyModal;

