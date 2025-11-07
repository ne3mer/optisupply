import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSuppliers, Supplier } from "../services/api";
import { motion } from "framer-motion";
import CalculationTraceDrawer from "../components/CalculationTraceDrawer";
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  ScaleIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  BeakerIcon, // Environment
  UserGroupIcon, // Social
  ShieldCheckIcon, // Governance
  TruckIcon, // Supply Chain
  DocumentTextIcon, // Compliance
  FireIcon, // Risk
  PencilIcon, // Edit
  PlayIcon, // Run Assessment
  ChartBarIcon, // View Analytics
  SparklesIcon, // AI Analytics
  GlobeAltIcon, // Added for Geopolitical Risk
  CloudIcon, // Added for Climate Risk
  UsersIcon, // Added for Labor Dispute Risk
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useThemeColors } from "../theme/useThemeColors";

// --- Reusing Dashboard Colors & Helpers ---
// Theme-aware colors provided via hook

const LoadingIndicator = () => {
  const colors = useThemeColors();
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]" style={{ backgroundColor: colors.background }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-t-4 border-b-4 rounded-full mb-4"
        style={{ borderColor: colors.primary }}
      ></motion.div>
      <p style={{ color: colors.textMuted }}>Accessing Supplier Dossier...</p>
    </div>
  );
};

const ErrorDisplay = ({ message }) => {
  const colors = useThemeColors();
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]" style={{ backgroundColor: colors.background }}>
      <div className="bg-red-900/50 border border-red-500 p-8 rounded-lg text-center max-w-lg">
        <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-5" style={{ color: colors.error }} />
        <h3 className="text-2xl font-semibold mb-3" style={{ color: colors.error }}>
          Data Corruption Detected
        </h3>
        <p className="text-lg" style={{ color: colors.textMuted }}>
          {message}
        </p>
        <Link to="/suppliers" className="mt-6 inline-block px-4 py-2 rounded border border-accent hover:bg-accent/20 transition-colors" style={{ color: colors.accent }}>
          Return to Registry
        </Link>
      </div>
    </div>
  );
};

// Helper to get risk color
const getRiskColor = (colors: any, riskLevel: string | undefined) => {
  switch (riskLevel?.toLowerCase()) {
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
const getScoreColor = (colors: any, score: number | null | undefined) => {
  if (score === null || score === undefined) return colors.textMuted;
  const normalizedScore = score > 0 && score <= 1 ? score * 100 : score;
  if (normalizedScore >= 80) return colors.success;
  if (normalizedScore >= 60) return colors.primary;
  if (normalizedScore >= 40) return colors.warning;
  if (normalizedScore >= 20) return colors.accent;
  return colors.error;
};

// --- Detail Item Component ---
type DetailItemProps = {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  icon?: React.ElementType;
  color?: string;
  isScore?: boolean; // Indicates if it should be formatted as score/100
};

const DetailItem: React.FC<DetailItemProps> = ({
  label,
  value,
  unit = "",
  icon: Icon,
  color,
  isScore = false,
}) => {
  const colors = useThemeColors() as any;
  const displayValue = value ?? "N/A";
  const textColor = color || colors.text;
  const scoreSuffix = isScore ? (
    <span style={{ color: colors.textMuted }}> / 100</span>
  ) : null;

  // Convert values from 0-1 to 0-100 for display
  let processedValue = value;
  if (typeof value === "number") {
    // Check if the value is between 0-1 and should be displayed as a percentage
    if (
      value >= 0 &&
      value <= 1 &&
      (isScore ||
        label.toLowerCase().includes("score") ||
        label.toLowerCase().includes("index") ||
        label.toLowerCase().includes("efficiency") ||
        label.toLowerCase().includes("fairness") ||
        label.toLowerCase().includes("inclusion") ||
        label.toLowerCase().includes("engagement") ||
        label.toLowerCase().includes("safety") ||
        label.toLowerCase().includes("control") ||
        label.toLowerCase().includes("risk"))
    ) {
      processedValue = value * 100;
    }
  }

  const finalValue =
    typeof processedValue === "number"
      ? processedValue.toFixed(isScore ? 1 : 2)
      : displayValue;

  return (
    <div
      className="flex items-center justify-between py-2 border-b border-dashed"
      style={{ borderColor: colors.accent + "20" }}
    >
      <span
        className="text-sm flex items-center"
        style={{ color: colors.textMuted }}
      >
        {Icon && <Icon className="h-4 w-4 mr-2" />}
        {label}
      </span>
      <span
        className="text-sm font-mono font-semibold tracking-wide"
        style={{ color: textColor }}
      >
        {finalValue}
        {unit}
        {scoreSuffix}
      </span>
    </div>
  );
};

// --- SupplierDetails Component ---

const SupplierDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      console.log(`Fetching suppliers list to find ID: ${id}`);
      const suppliersList = await getSuppliers(); // Fetch the entire list
      console.log("Full supplier list received:", suppliersList);

      // Store all suppliers for similar suggestions
      setAllSuppliers(suppliersList);

      // Find the specific supplier from the list
      const foundSupplier = suppliersList.find(
        (s) => s.id.toString() === id.toString()
      );

      if (foundSupplier) {
        console.log("Supplier found in list:", foundSupplier);
        setSupplier(foundSupplier);
      } else {
        console.error(
          `Supplier with ID ${id} not found in the fetched list.`
        );
        throw new Error(`Supplier with ID ${id} not found.`);
      }
    } catch (err) {
      console.error("Error fetching or finding supplier details:", err);
      setError(
        `Failed to retrieve dossier for Supplier ID ${id}. ${
          err instanceof Error
            ? err.message
            : "Data stream interrupted or supplier not found."
        }`
      );
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  // Listen for refresh events (e.g., after assessment)
  useEffect(() => {
    const handleRefresh = () => {
      fetchSupplier();
    };
    
    // Listen for custom refresh event
    window.addEventListener('supplier-refresh', handleRefresh);
    
    // Also refresh when page becomes visible (user returns from assessment)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSupplier();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('supplier-refresh', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  // Function to find similar suppliers based on industry and ESG scores
  const similarSuppliers = useMemo(() => {
    if (!supplier || allSuppliers.length === 0) return [];

    // Get suppliers with same industry first
    const sameIndustry = allSuppliers.filter(
      (s) => s.industry === supplier.industry && s.id !== supplier.id
    );

    // Calculate ESG similarity score
    const withSimilarityScore = sameIndustry.map((s) => {
      const ethicalDiff = Math.abs(
        (s.ethical_score || 0) - (supplier.ethical_score || 0)
      );
      const environmentalDiff = Math.abs(
        (s.environmental_score || 0) - (supplier.environmental_score || 0)
      );
      const socialDiff = Math.abs(
        (s.social_score || 0) - (supplier.social_score || 0)
      );
      const governanceDiff = Math.abs(
        (s.governance_score || 0) - (supplier.governance_score || 0)
      );

      // Lower score means more similar
      const similarityScore =
        ethicalDiff + environmentalDiff + socialDiff + governanceDiff;

      return { ...s, similarityScore };
    });

    // Sort by similarity (lowest score first) and take top 3
    return withSimilarityScore
      .sort((a, b) => a.similarityScore - b.similarityScore)
      .slice(0, 3);
  }, [supplier, allSuppliers]);

  // --- Memoized Values ---
  // Overall Score: Use finalScore (post-penalty) if available, otherwise ethical_score
  const overallScore = useMemo(() => {
    // Prefer finalScore (post-penalty) or composite_score, fallback to ethical_score
    const score = supplier?.finalScore ?? supplier?.composite_score ?? supplier?.ethical_score ?? 0;
    // Normalize to 0-100 scale if it's in 0-1 range
    return score > 0 && score <= 1 ? score * 100 : score;
  }, [supplier]);

  const themeColors = useThemeColors() as any;
  const colors = themeColors as any;
  const scoreColor = useMemo(() => getScoreColor(themeColors, overallScore), [themeColors, overallScore]);
  const riskColor = useMemo(
    () => getRiskColor(themeColors, supplier?.risk_level),
    [supplier?.risk_level]
  );
  const completenessPct = useMemo(() => {
    const r = supplier?.completeness_ratio;
    return typeof r === 'number' ? Math.round(r * 100) : null;
  }, [supplier?.completeness_ratio]);
  // Risk penalty: use risk_penalty field if available (0-100 or null), otherwise fallback to risk_factor
  const riskPenaltyPct = useMemo(() => {
    // New spec: risk_penalty is 0-100 or null (null = disabled, shows "N/A")
    if (supplier?.risk_penalty !== undefined) {
      return supplier.risk_penalty === null ? null : supplier.risk_penalty;
    }
    // Fallback to legacy risk_factor (0-1) for backward compatibility
    const rf = supplier?.risk_factor;
    return typeof rf === 'number' ? Math.round(rf * 100) : null;
  }, [supplier?.risk_penalty, supplier?.risk_factor]);

  // --- Render Logic ---
  if (loading) {
    return <LoadingIndicator />;
  }

  if (error || !supplier) {
    return (
      <ErrorDisplay
        message={error || "Supplier dossier not found or corrupted."}
      />
    );
  }

  // Ensure supplier ID for navigation
  const supplierId = supplier.id;

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* Back Button & Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex items-center justify-between"
      >
        <button
          onClick={() => navigate(-1)} // Go back to previous page
          className="flex items-center px-3 py-1.5 rounded border border-transparent hover:border-accent transition-colors text-sm"
          style={{ color: colors.accent }}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Return to Registry
        </button>
        {/* Maybe add quick actions here later */}
      </motion.div>

      {/* Main Dossier Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Core Info & Actions */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Supplier Header Card */}
          <div
            className="p-6 rounded-lg border backdrop-blur-sm"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            <h1
              className="text-2xl font-bold tracking-tight mb-2"
              style={{ color: colors.primary }}
            >
              {supplier.name}
            </h1>
            <div
              className="flex items-center text-sm mb-4"
              style={{ color: colors.textMuted }}
            >
              <MapPinIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />{" "}
              {supplier.country || "N/A"}
              <span className="mx-2">•</span>
              <BuildingOfficeIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />{" "}
              {supplier.industry || "N/A"}
            </div>
            <div
              className="flex items-center justify-between border-t pt-4"
              style={{ borderColor: colors.accent + "20" }}
            >
              <span
                className="text-sm flex items-center"
                style={{ color: colors.textMuted }}
              >
                <ScaleIcon className="h-4 w-4 mr-2" /> Overall Score (post-penalty)
              </span>
              <span
                className="text-xl font-bold font-mono"
                style={{ color: scoreColor }}
              >
                {overallScore.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span
                className="text-sm flex items-center"
                style={{ color: colors.textMuted }}
              >
                <ShieldExclamationIcon className="h-4 w-4 mr-2" /> Risk Level
              </span>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium capitalize"
                style={{ backgroundColor: riskColor + "20", color: riskColor }}
              >
                {supplier.risk_level || "Unknown"}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm" style={{ color: colors.textMuted }}>Risk Penalty</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium" style={{
                color: riskColor,
                backgroundColor: riskColor + '15',
                border: `1px solid ${riskColor}40`,
              }}>
                {riskPenaltyPct !== null ? `${riskPenaltyPct.toFixed(1)}` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm" style={{ color: colors.textMuted }}>Disclosure</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium" style={{
                color: (completenessPct ?? 100) >= 85 ? colors.success : (completenessPct ?? 100) >= 70 ? colors.warning : colors.error,
                backgroundColor: ((completenessPct ?? 100) >= 85 ? colors.success : (completenessPct ?? 100) >= 70 ? colors.warning : colors.error) + '15',
                border: `1px solid ${((completenessPct ?? 100) >= 85 ? colors.success : (completenessPct ?? 100) >= 70 ? colors.warning : colors.error)}40`,
              }}>
                {completenessPct !== null ? `${completenessPct}%` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Actions Card */}
          <div
            className="p-4 rounded-lg border backdrop-blur-sm"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            <h3
              className="text-lg font-semibold mb-4 border-b pb-2"
              style={{ color: colors.text, borderColor: colors.accent + "30" }}
            >
              Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    // Trigger recompute before navigation
                    const { recomputeSupplierScores } = await import("../services/api");
                    await recomputeSupplierScores(supplierId);
                    // Refresh supplier data
                    await fetchSupplier();
                    // Navigate to assessment
                    navigate(`/suppliers/${supplierId}/assessment`);
                  } catch (error) {
                    console.error("Error recomputing scores:", error);
                    // Still navigate even if recompute fails
                    navigate(`/suppliers/${supplierId}/assessment`);
                  }
                }}
                className="w-full flex items-center justify-center text-sm py-2 px-4 rounded hover:opacity-90 transition-opacity duration-200"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.background,
                }}
              >
                <PlayIcon className="h-5 w-5 mr-2" /> Run/View Assessment
              </button>
              <button
                onClick={() => setShowTraceDrawer(true)}
                className="w-full flex items-center justify-center text-sm py-2 px-4 rounded hover:opacity-90 transition-opacity duration-200"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.background,
                }}
              >
                <ChartBarIcon className="h-5 w-5 mr-2" /> View Calculation Trace
              </button>
              <button
                onClick={() => navigate(`/suppliers/${supplierId}/analytics`)}
                className="w-full flex items-center justify-center text-sm py-2 px-4 rounded hover:opacity-90 transition-opacity duration-200"
                style={{
                  backgroundColor: colors.accent,
                  color: colors.background,
                }}
              >
                <SparklesIcon className="h-5 w-5 mr-2" /> View AI Analytics
              </button>
              <button
                onClick={() => navigate(`/suppliers/${supplierId}/edit`)} // Fixed edit route path
                className="w-full flex items-center justify-center text-sm py-2 px-4 rounded border hover:bg-accent/10 transition-colors duration-200"
                style={{ borderColor: colors.accent, color: colors.accent }}
              >
                <PencilIcon className="h-5 w-5 mr-2" /> Edit Supplier Data
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Detailed Metrics & Info */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Pillar Breakdown */}
          <div
            className="p-4 rounded-lg border backdrop-blur-sm"
            style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
          >
            <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
              Pillar Breakdown
            </h3>
            <div className="space-y-3">
              {([
                { label: "Environmental", value: supplier.environmental_score, color: "#10b981" },
                { label: "Social", value: supplier.social_score, color: "#3b82f6" },
                { label: "Governance", value: supplier.governance_score, color: "#8b5cf6" },
              ] as { label: string; value: number | undefined | null; color: string }[]).map((p) => {
                const val = p.value ?? null;
                const shown = val !== null ? (val > 0 && val <= 1 ? val * 100 : val) : null;
                const width = Math.max(0, Math.min(100, shown || 0));
                return (
                  <div key={p.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span style={{ color: colors.textMuted }}>{p.label}</span>
                      <span className="font-mono" style={{ color: colors.text }}>
                        {shown !== null ? shown.toFixed(1) : "N/A"}
                      </span>
                    </div>
                    <div className="h-2 rounded bg-black/30 overflow-hidden">
                      <div className="h-2 rounded" style={{ width: `${width}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Scores Breakdown Card */}
          <div
            className="p-4 rounded-lg border backdrop-blur-sm"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: colors.text }}
            >
              Score Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <DetailItem
                label="Environmental"
                value={supplier.environmental_score}
                icon={BeakerIcon}
                color={getScoreColor(themeColors, supplier.environmental_score)}
                isScore
              />
              <DetailItem
                label="Social"
                value={supplier.social_score}
                icon={UserGroupIcon}
                color={getScoreColor(themeColors, supplier.social_score)}
                isScore
              />
              <DetailItem
                label="Governance"
                value={supplier.governance_score}
                icon={ShieldCheckIcon}
                color={getScoreColor(themeColors, supplier.governance_score)}
                isScore
              />
              {/* Note: Supply Chain Score is not in the Supplier interface, so we'll conditionally render it only if it becomes available */}
            </div>
          </div>

          {/* Detailed Metrics Card */}
          <div
            className="p-4 rounded-lg border backdrop-blur-sm"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: colors.text }}
            >
              Detailed Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {/* Environmental */}
              <DetailItem
                label="CO₂ Emissions"
                value={supplier.co2_emissions}
                unit=" t"
                icon={BeakerIcon}
              />
              {/* Only show fields that exist in the Supplier interface */}
              <DetailItem
                label="Waste Mgmt Score"
                value={supplier.waste_management_score}
                icon={BeakerIcon}
              />
              {/* Social */}
              <DetailItem
                label="Wage Fairness"
                value={supplier.wage_fairness}
                icon={UserGroupIcon}
              />
              <DetailItem
                label="Human Rights Index"
                value={supplier.human_rights_index}
                icon={UserGroupIcon}
              />
              {/* Delivery Efficiency is in the Supplier interface */}
              <DetailItem
                label="Delivery Efficiency"
                value={supplier.delivery_efficiency}
                icon={TruckIcon}
              />
            </div>
          </div>

          {/* Compliance & Risk Factors Card */}
          <div
            className="p-4 rounded-lg border backdrop-blur-sm"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            <h3
              className="text-lg font-semibold mb-3 flex items-center"
              style={{ color: colors.text }}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2 text-accent" />{" "}
              Compliance & <FireIcon className="h-5 w-5 ml-2 mr-2 text-error" />{" "}
              Risk Factors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {/* Compliance related */}
              <DetailItem
                label="Human Rights Index"
                value={supplier.human_rights_index}
                icon={UserGroupIcon}
              />

              {/* Risk related */}
              <DetailItem
                label="Overall Risk Level"
                value={supplier.risk_level || "Unknown"}
                icon={ShieldExclamationIcon}
                color={getRiskColor(themeColors, supplier.risk_level)} // Use color helper
              />
              {/* Other risk metrics are not in the Supplier interface, so we'll exclude them */}
            </div>
          </div>

          {/* Similar Suppliers Card */}
          <div
            className="p-4 rounded-lg border backdrop-blur-sm"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            <h3
              className="text-lg font-semibold mb-3 flex items-center"
              style={{ color: colors.text }}
            >
              <UsersIcon
                className="h-5 w-5 mr-2"
                style={{ color: colors.primary }}
              />
              Similar Suppliers
              <span
                className="ml-2 text-sm font-normal"
                style={{ color: colors.textMuted }}
              >
                (Same industry, similar ESG profile)
              </span>
            </h3>

            {similarSuppliers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {similarSuppliers.map((similar) => {
                  const similarId = similar.id;
                  const similarScore =
                    similar.ethical_score > 0 && similar.ethical_score <= 1
                      ? (similar.ethical_score * 100).toFixed(1)
                      : similar.ethical_score?.toFixed(1) || "N/A";

                  return (
                    <div
                      key={similarId}
                      className="rounded-md p-3 border transition-all hover:shadow-md"
                      style={{
                        backgroundColor: colors.panel + "80",
                        borderColor: colors.accent + "30",
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4
                          className="font-medium text-base truncate max-w-[70%]"
                          style={{ color: colors.text }}
                        >
                          {similar.name}
                        </h4>
                        <span
                          className="text-sm font-mono font-semibold"
                          style={{
                            color: getScoreColor(themeColors, similar.ethical_score),
                          }}
                        >
                          {similarScore}
                        </span>
                      </div>
                      <div
                        className="flex items-center text-xs mb-2"
                        style={{ color: colors.textMuted }}
                      >
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        {similar.country || "N/A"}
                        <span className="mx-2">•</span>
                        <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                        {similar.industry || "N/A"}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => navigate(`/suppliers/${similarId}`)}
                          className="text-xs flex items-center"
                          style={{ color: colors.primary }}
                        >
                          View Supplier{" "}
                          <ArrowRightIcon className="h-3 w-3 ml-1" />
                        </button>
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
          </div>
        </motion.div>
      </div>

      {/* Calculation Trace Drawer */}
      {supplier && (
        <CalculationTraceDrawer
          isOpen={showTraceDrawer}
          onClose={() => setShowTraceDrawer(false)}
          supplierId={supplier.id || id || ""}
          supplierName={supplier.name}
        />
      )}
    </div>
  );
};

export default SupplierDetails;
