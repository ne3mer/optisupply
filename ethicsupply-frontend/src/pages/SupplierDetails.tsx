import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSupplier, getSuppliers, Supplier } from "../services/api";
import { motion } from "framer-motion";
import CalculationTraceDrawer from "../components/CalculationTraceDrawer";
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  ScaleIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  TruckIcon,
  DocumentTextIcon,
  PencilIcon,
  PlayIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useThemeColors } from "../theme/useThemeColors";
import {
  fmtRiskFactor,
  fmtPenalty,
  fmtScore,
  fmtRawMetric,
} from "../lib/formatters";
import { scoreBandColor, riskMetricColor } from "../lib/scoreThresholds";

const LoadingIndicator = () => {
  const colors = useThemeColors();
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-t-2 border-b-2 rounded-full mb-4"
        style={{ borderColor: colors.primary }}
      />
      <p
        className="text-sm font-mono uppercase tracking-widest"
        style={{ color: colors.textMuted }}
      >
        Loading Dossier
      </p>
    </div>
  );
};

const ErrorDisplay = ({ message }: { message: string }) => {
  const colors = useThemeColors();
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-8"
      style={{ backgroundColor: colors.background }}
    >
      <div
        className="max-w-md w-full rounded-md p-8 text-center"
        style={{
          backgroundColor: colors.panel,
          border: `1px solid ${colors.error}30`,
        }}
      >
        <ExclamationTriangleIcon
          className="h-10 w-10 mx-auto mb-4"
          style={{ color: colors.error }}
        />
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: colors.text }}
        >
          Supplier Not Found
        </h3>
        <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
          {message}
        </p>
        <Link
          to="/suppliers"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-md transition-opacity hover:opacity-80"
          style={{ background: colors.primary, color: "#0A0A0A" }}
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to Suppliers
        </Link>
      </div>
    </div>
  );
};

const getRiskColor = (colors: any, level: string | undefined) => {
  switch (level?.toLowerCase()) {
    case "low":
      return colors.success;
    case "medium":
      return colors.warning;
    case "high":
      return colors.error;
    case "critical":
      return colors.secondary;
    default:
      return colors.textMuted;
  }
};

const normalizeScore = (v: number | null | undefined) => {
  if (v === null || v === undefined) return null;
  return v > 0 && v <= 1 ? v * 100 : v;
};

const fmt = (v: number | null | undefined, d = 1) => {
  const n = normalizeScore(v);
  return n === null ? "N/A" : n.toFixed(d);
};

// Pill badge
const Pill = ({
  children,
  color,
  bg,
  border,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase font-mono"
    style={{
      color,
      backgroundColor: bg,
      border,
      borderRadius: "4px",
      letterSpacing: "0.06em",
    }}
  >
    {children}
  </span>
);

// Stat row
const StatRow = ({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
  icon?: React.ElementType;
}) => {
  const colors = useThemeColors() as any;
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: `1px solid ${colors.accent}12` }}
    >
      <span
        className="flex items-center gap-2 text-sm"
        style={{ color: colors.textMuted }}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {label}
      </span>
      <span
        className="text-sm font-mono font-semibold"
        style={{ color: color || colors.text }}
      >
        {value}
      </span>
    </div>
  );
};

// Pillar progress bar
const PillarBar = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null | undefined;
  color: string;
}) => {
  const colors = useThemeColors() as any;
  const shown = normalizeScore(value);
  const width = Math.max(0, Math.min(100, shown ?? 0));
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span style={{ color: colors.textMuted }}>{label}</span>
        <span
          className="font-mono font-semibold"
          style={{ color: shown !== null ? color : colors.textMuted }}
        >
          {shown !== null ? shown.toFixed(1) : "N/A"}
        </span>
      </div>
      <div
        className="h-[3px] rounded-full overflow-hidden"
        style={{ backgroundColor: color + "22" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// Section card wrapper
const SectionCard = ({
  title,
  icon: Icon,
  children,
  accent,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  accent?: string;
}) => {
  const colors = useThemeColors() as any;
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        backgroundColor: colors.panel,
        border: `1px solid ${colors.accent}18`,
      }}
    >
      <div
        className="px-5 py-3.5 flex items-center gap-2"
        style={{
          borderBottom: `1px solid ${colors.accent}12`,
          borderLeft: `3px solid ${accent || colors.primary}`,
        }}
      >
        {Icon && (
          <Icon
            className="h-4 w-4 shrink-0"
            style={{ color: accent || colors.primary }}
          />
        )}
        <span
          className="text-sm font-semibold uppercase tracking-wider font-mono"
          style={{ color: colors.text, letterSpacing: "0.08em" }}
        >
          {title}
        </span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
};

// --- Main component ---
const SupplierDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const colors = useThemeColors() as any;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [showTraceDrawer, setShowTraceDrawer] = useState(false);

  const fetchSupplier = async () => {
    if (!id) {
      setError("No supplier ID provided.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Prefer direct single-supplier fetch for efficiency
      try {
        const s = await getSupplier(id);
        setSupplier(s);
        // Also load list for similar-suppliers sidebar (non-blocking)
        getSuppliers()
          .then(setAllSuppliers)
          .catch(() => {});
      } catch {
        // Fallback: search full list
        const list = await getSuppliers();
        setAllSuppliers(list);
        const found = list.find(
          (s) => s.id?.toString() === id || (s as any)._id?.toString() === id,
        );
        if (!found) throw new Error(`Supplier ID ${id} not found.`);
        setSupplier(found);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load supplier dossier.",
      );
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  useEffect(() => {
    const onRefresh = () => fetchSupplier();
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchSupplier();
    };
    window.addEventListener("supplier-refresh", onRefresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("supplier-refresh", onRefresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [id]);

  const similarSuppliers = useMemo(() => {
    if (!supplier || allSuppliers.length === 0) return [];
    const suppId = (supplier as any)._id || supplier.id;
    return allSuppliers
      .filter(
        (s) =>
          s.industry === supplier.industry &&
          ((s as any)._id || s.id)?.toString() !== suppId?.toString(),
      )
      .map((s) => ({
        ...s,
        _sim:
          Math.abs((s.ethical_score || 0) - (supplier.ethical_score || 0)) +
          Math.abs(
            (s.environmental_score || 0) - (supplier.environmental_score || 0),
          ) +
          Math.abs((s.social_score || 0) - (supplier.social_score || 0)) +
          Math.abs(
            (s.governance_score || 0) - (supplier.governance_score || 0),
          ),
      }))
      .sort((a, b) => a._sim - b._sim)
      .slice(0, 3);
  }, [supplier, allSuppliers]);

  const overallScore = useMemo(() => {
    const s =
      (supplier as any)?.finalScore ??
      supplier?.composite_score ??
      supplier?.ethical_score ??
      0;
    return s > 0 && s <= 1 ? s * 100 : s;
  }, [supplier]);

  const scoreColor = useMemo(
    () => scoreBandColor(colors, overallScore),
    [colors, overallScore],
  );
  const riskColor = useMemo(
    () => getRiskColor(colors, supplier?.risk_level),
    [colors, supplier?.risk_level],
  );

  const completenessPct = useMemo(() => {
    const r = supplier?.completeness_ratio;
    return typeof r === "number" ? Math.round(r * 100) : null;
  }, [supplier?.completeness_ratio]);

  const riskFactor = useMemo(() => {
    // Prefer explicit 0-1 risk_factor
    if (
      typeof supplier?.risk_factor === "number" &&
      Number.isFinite(supplier.risk_factor)
    ) {
      return Math.max(0, Math.min(1, supplier.risk_factor));
    }
    // If we only have a risk_penalty (pts), invert the thesis formula:
    // penalty = 15 * max(0, r - 0.3) * 100  => r = penalty/1500 + 0.3
    const rpRaw = (supplier as any)?.risk_penalty;
    if (typeof rpRaw === "number" && Number.isFinite(rpRaw)) {
      const r = rpRaw / 1500 + 0.3;
      return Math.max(0, Math.min(1, r));
    }
    return null;
  }, [supplier]);

  const riskPenaltyPts = useMemo(() => {
    // If API provides explicit penalty points, use them
    const rpRaw = (supplier as any)?.risk_penalty;
    if (rpRaw !== undefined) {
      return rpRaw === null ? null : Number(rpRaw);
    }
    // Otherwise compute from risk_factor if available
    if (
      typeof supplier?.risk_factor === "number" &&
      Number.isFinite(supplier.risk_factor)
    ) {
      return 15 * Math.max(0, supplier.risk_factor - 0.3) * 100;
    }
    return null;
  }, [supplier]);

  const supplierId = (supplier as any)?._id || supplier?.id;

  if (loading) return <LoadingIndicator />;
  if (error || !supplier)
    return <ErrorDisplay message={error || "Supplier not found."} />;

  const initials = supplier.name?.slice(0, 2).toUpperCase() || "??";
  const pillarColors = {
    environmental: colors.success,
    social: colors.primary,
    governance: colors.secondary,
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div
        className="px-4 md:px-8 pt-6 pb-5"
        style={{ borderBottom: `1px solid ${colors.accent}15` }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest mb-5 hover:opacity-70 transition-opacity"
          style={{ color: colors.textMuted }}
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Supplier Registry
        </button>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="shrink-0 h-14 w-14 rounded-md flex items-center justify-center text-lg font-bold font-mono"
            style={{
              background: scoreColor + "18",
              color: scoreColor,
              border: `1px solid ${scoreColor}30`,
            }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: colors.textMuted }}
              >
                Supplier Profile
              </span>
              <Pill
                color={riskColor}
                bg={riskColor + "18"}
                border={`1px solid ${riskColor}35`}
              >
                {supplier.risk_level || "No Risk Data"}
              </Pill>
              {completenessPct !== null && (
                <Pill
                  color={
                    completenessPct >= 85
                      ? colors.success
                      : completenessPct >= 70
                        ? colors.warning
                        : colors.error
                  }
                  bg={
                    (completenessPct >= 85
                      ? colors.success
                      : completenessPct >= 70
                        ? colors.warning
                        : colors.error) + "15"
                  }
                  border={`1px solid ${completenessPct >= 85 ? colors.success : completenessPct >= 70 ? colors.warning : colors.error}30`}
                >
                  {completenessPct}% Disclosure
                </Pill>
              )}
            </div>
            <h1
              className="text-2xl md:text-3xl font-display font-bold leading-tight truncate"
              style={{ color: colors.text, letterSpacing: "-0.025em" }}
            >
              {supplier.name}
            </h1>
            <div
              className="flex items-center gap-3 mt-1 text-sm flex-wrap"
              style={{ color: colors.textMuted }}
            >
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />{" "}
                {supplier.country || "N/A"}
              </span>
              <span className="opacity-30">·</span>
              <span className="flex items-center gap-1">
                <BuildingOfficeIcon className="h-3.5 w-3.5" />{" "}
                {supplier.industry || "N/A"}
              </span>
            </div>
          </div>

          {/* Overall score chip — desktop only */}
          <div className="hidden md:flex flex-col items-end shrink-0">
            <span
              className="text-[10px] font-mono uppercase tracking-widest mb-1"
              style={{ color: colors.textMuted }}
            >
              ESG Score
            </span>
            <span
              className="text-4xl font-bold font-mono leading-none"
              style={{ color: scoreColor }}
            >
              {overallScore.toFixed(1)}
            </span>
            <span
              className="text-xs font-mono mt-0.5"
              style={{ color: colors.textMuted }}
            >
              /100
            </span>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────── */}
      <div className="px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT SIDEBAR ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          {/* Score summary */}
          <SectionCard
            title="Score Summary"
            icon={ScaleIcon}
            accent={scoreColor}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div
                  className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
                  style={{ color: colors.textMuted }}
                >
                  Post-Penalty Score
                </div>
                <span
                  className="text-4xl font-bold font-mono leading-none"
                  style={{ color: scoreColor }}
                >
                  {overallScore.toFixed(1)}
                </span>
                <span
                  className="text-sm font-mono ml-1"
                  style={{ color: colors.textMuted }}
                >
                  /100
                </span>
              </div>
              <div
                className="h-14 w-14 rounded-md flex items-center justify-center text-xs font-bold uppercase"
                style={{
                  background: scoreColor + "15",
                  color: scoreColor,
                  border: `1px solid ${scoreColor}25`,
                }}
              >
                {overallScore >= 80
                  ? "Excellent"
                  : overallScore >= 60
                    ? "Strong"
                    : overallScore >= 40
                      ? "Average"
                      : "At Risk"}
              </div>
            </div>
            <StatRow
              label="Risk Level"
              icon={ShieldExclamationIcon}
              value={
                <Pill
                  color={riskColor}
                  bg={riskColor + "18"}
                  border={`1px solid ${riskColor}30`}
                >
                  {supplier.risk_level || "No Data"}
                </Pill>
              }
            />
            <StatRow
              label="Risk Factor"
              icon={ExclamationTriangleIcon}
              value={riskFactor !== null ? fmtRiskFactor(riskFactor) : "N/A"}
              color={riskColor}
            />
            <StatRow
              label="Risk Penalty"
              icon={ExclamationTriangleIcon}
              value={
                riskPenaltyPts !== null ? fmtPenalty(riskPenaltyPts) : "N/A"
              }
              color={riskColor}
            />
            <StatRow
              label="Disclosure"
              icon={DocumentTextIcon}
              value={completenessPct !== null ? `${completenessPct}%` : "N/A"}
              color={
                completenessPct !== null
                  ? completenessPct >= 85
                    ? colors.success
                    : completenessPct >= 70
                      ? colors.warning
                      : colors.error
                  : undefined
              }
            />
          </SectionCard>

          {/* Actions */}
          <SectionCard title="Actions" icon={PlayIcon}>
            <div className="space-y-2.5">
              <button
                onClick={async () => {
                  try {
                    const { recomputeSupplierScores } =
                      await import("../services/api");
                    await recomputeSupplierScores(supplierId);
                    await fetchSupplier();
                  } catch {}
                  navigate(`/suppliers/${supplierId}/assessment`);
                }}
                className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-md font-semibold transition-opacity hover:opacity-85"
                style={{ background: colors.primary, color: "#0A0A0A" }}
              >
                <PlayIcon className="h-4 w-4" /> Run / View Assessment
              </button>
              <button
                onClick={() => setShowTraceDrawer(true)}
                className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-md font-medium transition-opacity hover:opacity-85"
                style={{
                  background: colors.secondary + "18",
                  color: colors.secondary,
                  border: `1px solid ${colors.secondary}30`,
                }}
              >
                <ChartBarIcon className="h-4 w-4" /> Calculation Trace
              </button>
              <button
                onClick={() => navigate(`/suppliers/${supplierId}/analytics`)}
                className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-md font-medium transition-opacity hover:opacity-85"
                style={{
                  background: colors.primary + "12",
                  color: colors.primary,
                  border: `1px solid ${colors.primary}25`,
                }}
              >
                <SparklesIcon className="h-4 w-4" /> AI Analytics
              </button>
              <button
                onClick={() => navigate(`/suppliers/${supplierId}/edit`)}
                className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-md font-medium transition-opacity hover:opacity-85"
                style={{
                  background: "transparent",
                  color: colors.textMuted,
                  border: `1px solid ${colors.accent}25`,
                }}
              >
                <PencilIcon className="h-4 w-4" /> Edit Supplier Data
              </button>
            </div>
          </SectionCard>

          {/* Similar suppliers */}
          <SectionCard
            title="Similar Suppliers"
            icon={ArrowTrendingUpIcon}
            accent={colors.warning}
          >
            {similarSuppliers.length > 0 ? (
              <div className="space-y-2">
                {similarSuppliers.map((s) => {
                  const sid = (s as any)._id || s.id;
                  const sc = normalizeScore(s.ethical_score);
                  const scColor = scoreBandColor(colors, s.ethical_score);
                  return (
                    <div
                      key={sid}
                      className="flex items-center justify-between p-3 rounded-md cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: colors.background,
                        border: `1px solid ${colors.accent}15`,
                      }}
                      onClick={() => navigate(`/suppliers/${sid}`)}
                    >
                      <div className="min-w-0">
                        <div
                          className="text-sm font-medium truncate"
                          style={{ color: colors.text }}
                        >
                          {s.name}
                        </div>
                        <div
                          className="text-[11px] mt-0.5 truncate"
                          style={{ color: colors.textMuted }}
                        >
                          {s.country} · {s.industry}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className="text-sm font-mono font-semibold"
                          style={{ color: scColor }}
                        >
                          {sc !== null ? sc.toFixed(0) : "N/A"}
                        </span>
                        <ArrowRightIcon
                          className="h-3.5 w-3.5"
                          style={{ color: colors.textMuted }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm" style={{ color: colors.textMuted }}>
                No similar suppliers found in the same industry.
              </p>
            )}
          </SectionCard>
        </motion.div>

        {/* ── RIGHT CONTENT ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Pillar Breakdown */}
          <SectionCard title="ESG Pillar Breakdown" icon={BeakerIcon}>
            <div className="space-y-4">
              <PillarBar
                label="Environmental"
                value={supplier.environmental_score}
                color={pillarColors.environmental}
              />
              <PillarBar
                label="Social"
                value={supplier.social_score}
                color={pillarColors.social}
              />
              <PillarBar
                label="Governance"
                value={supplier.governance_score}
                color={pillarColors.governance}
              />
            </div>
          </SectionCard>

          {/* Score Breakdown */}
          <SectionCard
            title="Score Breakdown"
            icon={ScaleIcon}
            accent={colors.primary}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Environmental",
                  value: supplier.environmental_score,
                  color: pillarColors.environmental,
                  icon: BeakerIcon,
                },
                {
                  label: "Social",
                  value: supplier.social_score,
                  color: pillarColors.social,
                  icon: UserGroupIcon,
                },
                {
                  label: "Governance",
                  value: supplier.governance_score,
                  color: pillarColors.governance,
                  icon: ShieldCheckIcon,
                },
              ].map((p) => {
                const shown = normalizeScore(p.value);
                return (
                  <div
                    key={p.label}
                    className="flex flex-col items-center p-4 rounded-md"
                    style={{
                      backgroundColor: p.color + "08",
                      border: `1px solid ${p.color}20`,
                    }}
                  >
                    <p.icon
                      className="h-5 w-5 mb-2"
                      style={{ color: p.color, opacity: 0.8 }}
                    />
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider mb-1.5"
                      style={{ color: colors.textMuted }}
                    >
                      {p.label}
                    </span>
                    <span
                      className="text-2xl font-bold font-mono"
                      style={{
                        color: shown !== null ? p.color : colors.textMuted,
                      }}
                    >
                      {shown !== null ? shown.toFixed(1) : "N/A"}
                    </span>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: colors.textMuted }}
                    >
                      /100
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Detailed Metrics */}
          <SectionCard
            title="Detailed Metrics"
            icon={DocumentTextIcon}
            accent={colors.warning}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <StatRow
                label="CO₂ Emissions"
                icon={BeakerIcon}
                value={
                  supplier.co2_emissions !== undefined &&
                  supplier.co2_emissions !== null
                    ? fmtRawMetric(Number(supplier.co2_emissions), "t")
                    : "N/A"
                }
              />
              <StatRow
                label="Waste Management"
                icon={BeakerIcon}
                value={fmt(supplier.waste_management_score)}
                color={scoreBandColor(colors, supplier.waste_management_score)}
              />
              <StatRow
                label="Wage Fairness"
                icon={UserGroupIcon}
                value={fmt(supplier.wage_fairness)}
                color={scoreBandColor(colors, supplier.wage_fairness)}
              />
              <StatRow
                label="Human Rights Index"
                icon={UserGroupIcon}
                value={fmt(supplier.human_rights_index)}
                color={scoreBandColor(colors, supplier.human_rights_index)}
              />
              <StatRow
                label="Delivery Efficiency"
                icon={TruckIcon}
                value={fmt(supplier.delivery_efficiency)}
                color={scoreBandColor(colors, supplier.delivery_efficiency)}
              />
              {(supplier as any).worker_safety !== undefined && (
                <StatRow
                  label="Worker Safety"
                  icon={ShieldCheckIcon}
                  value={fmt((supplier as any).worker_safety)}
                  color={scoreBandColor(colors, (supplier as any).worker_safety)}
                />
              )}
              {(supplier as any).transparency_score !== undefined && (
                <StatRow
                  label="Transparency"
                  icon={InformationCircleIcon}
                  value={fmt((supplier as any).transparency_score)}
                  color={scoreBandColor(
                    colors,
                    (supplier as any).transparency_score,
                  )}
                />
              )}
              {(supplier as any).energy_efficiency !== undefined && (
                <StatRow
                  label="Energy Efficiency"
                  icon={SparklesIcon}
                  value={fmt((supplier as any).energy_efficiency)}
                  color={scoreBandColor(
                    colors,
                    (supplier as any).energy_efficiency,
                  )}
                />
              )}
            </div>
          </SectionCard>

          {/* Compliance & Risk */}
          <SectionCard
            title="Compliance & Risk"
            icon={ShieldExclamationIcon}
            accent={colors.secondary}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <StatRow
                label="Human Rights Index"
                icon={ShieldCheckIcon}
                value={fmt(supplier.human_rights_index)}
                color={scoreBandColor(colors, supplier.human_rights_index)}
              />
              <StatRow
                label="Overall Risk Level"
                icon={ShieldExclamationIcon}
                value={
                  <Pill
                    color={riskColor}
                    bg={riskColor + "18"}
                    border={`1px solid ${riskColor}30`}
                  >
                    {supplier.risk_level || "No Data"}
                  </Pill>
                }
              />
              {(supplier as any).corruption_risk !== undefined && (
                <StatRow
                  label="Corruption Risk"
                  icon={ExclamationTriangleIcon}
                  value={fmt((supplier as any).corruption_risk)}
                  color={riskMetricColor(
                    colors,
                    (supplier as any).corruption_risk,
                  )}
                />
              )}
              {(supplier as any).geopolitical_risk !== undefined && (
                <StatRow
                  label="Geopolitical Risk"
                  icon={ExclamationTriangleIcon}
                  value={fmt((supplier as any).geopolitical_risk)}
                  color={riskMetricColor(
                    colors,
                    (supplier as any).geopolitical_risk,
                  )}
                />
              )}
              {(supplier as any).climate_risk !== undefined && (
                <StatRow
                  label="Climate Risk"
                  icon={ExclamationTriangleIcon}
                  value={fmt((supplier as any).climate_risk)}
                  color={riskMetricColor(colors, (supplier as any).climate_risk)}
                />
              )}
            </div>
          </SectionCard>

          {/* Last updated footer */}
          {(supplier as any).last_updated && (
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: colors.textMuted }}
            >
              <ClockIcon className="h-3.5 w-3.5" />
              Last updated:{" "}
              {new Date((supplier as any).last_updated).toLocaleDateString(
                "en-US",
                { year: "numeric", month: "short", day: "numeric" },
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Calculation Trace Drawer */}
      {supplier && (
        <CalculationTraceDrawer
          isOpen={showTraceDrawer}
          onClose={() => setShowTraceDrawer(false)}
          supplierId={supplierId || ""}
          supplierName={supplier.name}
        />
      )}
    </div>
  );
};

export default SupplierDetails;
