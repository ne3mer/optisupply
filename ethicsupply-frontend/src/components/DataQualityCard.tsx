import React, { useMemo, useState } from "react";
import { Supplier, BandsMap } from "../services/api";

type Props = {
  suppliers: Supplier[] | null;
  bands: BandsMap | null;
  colors: { panel: string; accent: string; text: string; textMuted: string; success: string; warning: string; error: string };
};

const DataQualityCard: React.FC<Props> = ({ suppliers, bands, colors }) => {
  const groups = useMemo(() => {
    if (!suppliers || suppliers.length === 0 || !bands) return {} as Record<string, any[]>;
    const byIndustry: Record<string, Supplier[]> = {};
    suppliers.forEach((s) => {
      const key = s.industry || "Unknown";
      if (!byIndustry[key]) byIndustry[key] = [];
      byIndustry[key].push(s);
    });

    const nearEdge = (mean: number, min: number, max: number) => {
      const range = max - min;
      if (range <= 0) return false;
      const lower = (mean - min) / range;
      const upper = (max - mean) / range;
      return lower < 0.05 || upper < 0.05;
    };

    const result: Record<string, Array<{ metric: string; mean: number | null; band?: { min: number; max: number }; status: "PASS" | "WARN" | "FAIL" | "NA" }>> = {};

    Object.entries(byIndustry).forEach(([industry, arr]) => {
      const rows: Array<{ metric: string; mean: number | null; band?: { min: number; max: number }; status: "PASS" | "WARN" | "FAIL" | "NA" }> = [];

      // emission_intensity
      const intensities = arr
        .map((s) => {
          const revenue = Number(s.revenue || 0);
          const emissions = Number(s.total_emissions ?? s.co2_emissions ?? 0);
          if (!revenue || !isFinite(revenue) || !isFinite(emissions)) return null;
          return emissions / revenue;
        })
        .filter((v): v is number => v !== null && isFinite(v));
      const eiMean = intensities.length ? intensities.reduce((a, b) => a + b, 0) / intensities.length : null;
      const eiBand = bands[industry]?.emission_intensity;
      let eiStatus: "PASS" | "WARN" | "FAIL" | "NA" = "NA";
      if (eiMean != null && eiBand?.min != null && eiBand?.max != null) {
        if (eiMean < eiBand.min || eiMean > eiBand.max) eiStatus = "FAIL";
        else eiStatus = nearEdge(eiMean, eiBand.min, eiBand.max) ? "WARN" : "PASS";
      }
      rows.push({ metric: "emission_intensity", mean: eiMean, band: eiBand ? { min: eiBand.min, max: eiBand.max } : undefined, status: eiStatus });

      // renewable_pct
      const rpct = arr
        .map((s) => (s.renewable_energy_percent != null ? Number(s.renewable_energy_percent) : null))
        .filter((v): v is number => v !== null && isFinite(v));
      const rMean = rpct.length ? rpct.reduce((a, b) => a + b, 0) / rpct.length : null;
      const rBand = bands[industry]?.renewable_pct;
      let rStatus: "PASS" | "WARN" | "FAIL" | "NA" = "NA";
      if (rMean != null && rBand?.min != null && rBand?.max != null) {
        if (rMean < rBand.min || rMean > rBand.max) rStatus = "FAIL";
        else rStatus = nearEdge(rMean, rBand.min, rBand.max) ? "WARN" : "PASS";
      }
      rows.push({ metric: "renewable_pct", mean: rMean, band: rBand ? { min: rBand.min, max: rBand.max } : undefined, status: rStatus });

      result[industry] = rows;
    });

    return result;
  }, [suppliers, bands]);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (ind: string) => setOpen((prev) => ({ ...prev, [ind]: !prev[ind] }));

  const Chip = ({ status }: { status: "PASS" | "WARN" | "FAIL" | "NA" }) => {
    const map: Record<string, { bg: string; fg: string; label: string }> = {
      PASS: { bg: colors.success + "30", fg: colors.success, label: "PASS" },
      WARN: { bg: colors.warning + "30", fg: colors.warning, label: "WARN" },
      FAIL: { bg: colors.error + "30", fg: colors.error, label: "FAIL" },
      NA: { bg: colors.accent + "30", fg: colors.textMuted, label: "N/A" },
    };
    const s = map[status];
    return (
      <span className="px-2 py-0.5 rounded text-xs border" style={{ backgroundColor: s.bg, color: s.fg, borderColor: s.fg + "40" }}>
        {s.label}
      </span>
    );
  };

  const overallStatus = (items: Array<{ status: "PASS" | "WARN" | "FAIL" | "NA" }>) => {
    // Worst status wins: FAIL > WARN > PASS > NA
    const has = (s: string) => items.some((i) => i.status === s);
    if (has("FAIL")) return "FAIL" as const;
    if (has("WARN")) return "WARN" as const;
    if (has("PASS")) return "PASS" as const;
    return "NA" as const;
  };

  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.accent + "20" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold" style={{ color: colors.text }}>Data Quality</h3>
      </div>
      {!suppliers || suppliers.length === 0 ? (
        <p style={{ color: colors.textMuted }}>No supplier data available yet.</p>
      ) : !bands ? (
        <p style={{ color: colors.textMuted }}>Bands unavailable. Generate data or upload bands_v1.json.</p>
      ) : Object.keys(groups).length === 0 ? (
        <p style={{ color: colors.textMuted }}>No metrics could be computed.</p>
      ) : (
        <div className="space-y-2">
          {Object.keys(groups)
            .sort((a, b) => a.localeCompare(b))
            .map((industry) => {
              const items = groups[industry];
              const status = overallStatus(items);
              const counts = {
                PASS: items.filter((i) => i.status === "PASS").length,
                WARN: items.filter((i) => i.status === "WARN").length,
                FAIL: items.filter((i) => i.status === "FAIL").length,
              };
              return (
                <div key={industry} className="rounded border" style={{ borderColor: colors.accent + "20", backgroundColor: colors.panel }}>
                  <button
                    className="w-full flex items-center justify-between p-3 focus:outline-none"
                    aria-expanded={!!open[industry]}
                    onClick={() => toggle(industry)}
                    style={{ outline: "none", color: colors.text }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{industry}</span>
                      <Chip status={status} />
                      <span className="text-xs" style={{ color: colors.textMuted }}>
                        PASS {counts.PASS} • WARN {counts.WARN} • FAIL {counts.FAIL}
                      </span>
                    </div>
                    <span className="text-sm" style={{ color: colors.textMuted }}>{open[industry] ? "Hide" : "Show"}</span>
                  </button>
                  {open[industry] && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="text-left p-2" style={{ color: colors.textMuted }}>Metric</th>
                            <th className="text-left p-2" style={{ color: colors.textMuted }}>Mean</th>
                            <th className="text-left p-2" style={{ color: colors.textMuted }}>Band</th>
                            <th className="text-left p-2" style={{ color: colors.textMuted }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((r, i) => (
                            <tr key={`${industry}-${r.metric}-${i}`} className="border-t" style={{ borderColor: colors.accent + "20" }}>
                              <td className="p-2" style={{ color: colors.text }}>{r.metric}</td>
                              <td className="p-2" style={{ color: colors.text }}>{r.mean != null ? r.mean.toFixed(4) : "N/A"}</td>
                              <td className="p-2" style={{ color: colors.text }}>{r.band ? `${r.band.min.toFixed(4)} – ${r.band.max.toFixed(4)}` : "N/A"}</td>
                              <td className="p-2"><Chip status={r.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default DataQualityCard;
