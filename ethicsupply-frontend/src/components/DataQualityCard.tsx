import React, { useMemo, useState } from "react";
import { Supplier, BandsMap } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

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
  const [showDetails, setShowDetails] = useState(false);
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
      <span className="px-1.5 py-0.5 rounded text-xs border" style={{ backgroundColor: s.bg, color: s.fg, borderColor: s.fg + "40" }}>
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

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!suppliers || suppliers.length === 0 || !bands || Object.keys(groups).length === 0) {
      return null;
    }
    
    let totalPass = 0;
    let totalWarn = 0;
    let totalFail = 0;
    let totalNA = 0;
    
    Object.values(groups).forEach((items) => {
      items.forEach((item) => {
        if (item.status === "PASS") totalPass++;
        else if (item.status === "WARN") totalWarn++;
        else if (item.status === "FAIL") totalFail++;
        else totalNA++;
      });
    });
    
    const total = totalPass + totalWarn + totalFail + totalNA;
    const passRate = total > 0 ? ((totalPass / total) * 100).toFixed(1) : "0";
    
    return { totalPass, totalWarn, totalFail, totalNA, total, passRate };
  }, [suppliers, bands, groups]);

  const getStatusIcon = (status: "PASS" | "WARN" | "FAIL" | "NA") => {
    switch (status) {
      case "PASS":
        return <CheckCircleIcon className="h-4 w-4" style={{ color: colors.success }} />;
      case "WARN":
        return <ExclamationTriangleIcon className="h-4 w-4" style={{ color: colors.warning }} />;
      case "FAIL":
        return <XCircleIcon className="h-4 w-4" style={{ color: colors.error }} />;
      default:
        return <InformationCircleIcon className="h-4 w-4" style={{ color: colors.textMuted }} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-3" 
      style={{ backgroundColor: colors.panel, borderColor: colors.accent + "20" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold" style={{ color: colors.text }}>Data Quality</h3>
          {summary && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
              backgroundColor: summary.totalFail > 0 ? colors.error + "20" : colors.success + "20",
              color: summary.totalFail > 0 ? colors.error : colors.success 
            }}>
              {summary.passRate}% Pass
            </span>
          )}
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:opacity-80"
          style={{ 
            color: colors.textMuted,
            backgroundColor: showDetails ? colors.accent + "20" : "transparent"
          }}
        >
          <span>{showDetails ? "Hide" : "Details"}</span>
          <ChevronDownIcon 
            className={`h-3 w-3 transition-transform ${showDetails ? "rotate-180" : ""}`} 
          />
        </button>
      </div>

      {!suppliers || suppliers.length === 0 ? (
        <p className="text-xs" style={{ color: colors.textMuted }}>No supplier data available yet.</p>
      ) : !bands ? (
        <p className="text-xs" style={{ color: colors.textMuted }}>Bands unavailable.</p>
      ) : Object.keys(groups).length === 0 ? (
        <p className="text-xs" style={{ color: colors.textMuted }}>No metrics could be computed.</p>
      ) : (
        <>
          {/* Compact Summary View */}
          <div className="flex items-center gap-4 mb-2">
            {summary && (
              <>
                <div className="flex items-center gap-1">
                  <CheckCircleIcon className="h-3.5 w-3.5" style={{ color: colors.success }} />
                  <span className="text-xs font-medium" style={{ color: colors.text }}>{summary.totalPass}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5" style={{ color: colors.warning }} />
                  <span className="text-xs font-medium" style={{ color: colors.text }}>{summary.totalWarn}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircleIcon className="h-3.5 w-3.5" style={{ color: colors.error }} />
                  <span className="text-xs font-medium" style={{ color: colors.text }}>{summary.totalFail}</span>
                </div>
              </>
            )}
          </div>

          {/* Compact Industry List */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {Object.keys(groups)
              .sort((a, b) => a.localeCompare(b))
              .slice(0, 5)
              .map((industry) => {
                const items = groups[industry];
                const status = overallStatus(items);
                return (
                  <div
                    key={industry}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs border"
                    style={{
                      backgroundColor: status === "FAIL" ? colors.error + "15" : 
                                     status === "WARN" ? colors.warning + "15" : 
                                     colors.success + "15",
                      borderColor: status === "FAIL" ? colors.error + "40" : 
                                  status === "WARN" ? colors.warning + "40" : 
                                  colors.success + "40",
                    }}
                  >
                    {getStatusIcon(status)}
                    <span style={{ color: colors.text }} className="truncate max-w-[80px]">
                      {industry}
                    </span>
                  </div>
                );
              })}
            {Object.keys(groups).length > 5 && (
              <span className="text-xs px-2 py-0.5" style={{ color: colors.textMuted }}>
                +{Object.keys(groups).length - 5} more
              </span>
            )}
          </div>

          {/* Expandable Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: colors.accent + "20" }}>
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
                        <div key={industry} className="rounded border text-xs" style={{ borderColor: colors.accent + "20", backgroundColor: colors.panel }}>
                          <button
                            className="w-full flex items-center justify-between p-2 focus:outline-none"
                            aria-expanded={!!open[industry]}
                            onClick={() => toggle(industry)}
                            style={{ outline: "none", color: colors.text }}
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(status)}
                              <span className="font-medium">{industry}</span>
                              <Chip status={status} />
                              <span className="text-xs" style={{ color: colors.textMuted }}>
                                {counts.PASS}/{counts.PASS + counts.WARN + counts.FAIL}
                              </span>
                            </div>
                            <ChevronDownIcon 
                              className={`h-3 w-3 transition-transform ${open[industry] ? "rotate-180" : ""}`}
                              style={{ color: colors.textMuted }}
                            />
                          </button>
                          <AnimatePresence>
                            {open[industry] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="overflow-x-auto p-2">
                                  <table className="min-w-full text-xs">
                                    <thead>
                                      <tr>
                                        <th className="text-left p-1" style={{ color: colors.textMuted }}>Metric</th>
                                        <th className="text-left p-1" style={{ color: colors.textMuted }}>Mean</th>
                                        <th className="text-left p-1" style={{ color: colors.textMuted }}>Band</th>
                                        <th className="text-left p-1" style={{ color: colors.textMuted }}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {items.map((r, i) => (
                                        <tr key={`${industry}-${r.metric}-${i}`} className="border-t" style={{ borderColor: colors.accent + "20" }}>
                                          <td className="p-1" style={{ color: colors.text }}>{r.metric}</td>
                                          <td className="p-1" style={{ color: colors.text }}>{r.mean != null ? r.mean.toFixed(3) : "N/A"}</td>
                                          <td className="p-1" style={{ color: colors.text }}>{r.band ? `${r.band.min.toFixed(2)}–${r.band.max.toFixed(2)}` : "N/A"}</td>
                                          <td className="p-1"><Chip status={r.status} /></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default DataQualityCard;
