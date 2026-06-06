import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import {
  getSuppliers,
  Supplier,
  exportRankings,
  exportIndustryMap,
} from "../services/api"; // Corrected path
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  ScaleIcon,
  ShieldExclamationIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ChevronUpIcon,
  ArrowsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  BellAlertIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon,
  DocumentIcon,
  TableCellsIcon,
  Square2StackIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  NoSymbolIcon,
  SparklesIcon,
  ArrowPathIcon,
  ClockIcon as ClockIconSolid,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon as CheckBadgeSolid } from "@heroicons/react/24/solid";
import { useThemeColors } from "../theme/useThemeColors";
import {
  fmtRiskFactor,
  fmtPenalty,
  fmtScore,
  fmtRawMetric,
  fmtDate,
} from "../lib/formatters";
import { scoreBandColor, scorePerformanceLabel } from "../lib/scoreThresholds";
import { usePageTitle } from "../hooks/usePageTitle";

const LoadingIndicator = () => {
  const colors = useThemeColors();
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh]"
      style={{ backgroundColor: colors.background }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-t-4 border-b-4 rounded-full mb-4"
        style={{ borderColor: colors.primary }}
      ></motion.div>
      <p style={{ color: colors.textMuted }}>Loading Supplier Intel...</p>
    </div>
  );
};

const ErrorDisplay = ({ message }) => {
  const colors = useThemeColors();
  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      style={{ backgroundColor: colors.background }}
    >
      <div className="bg-red-900/50 border border-red-500 p-6 rounded-lg text-center max-w-md">
        <ExclamationTriangleIcon
          className="h-12 w-12 mx-auto mb-4"
          style={{ color: colors.error }}
        />
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: colors.error }}
        >
          Access Denied
        </h3>
        <p style={{ color: colors.textMuted }}>{message}</p>
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

// Helper to get risk icon
const getRiskIcon = (riskLevel: string | undefined) => {
  switch (riskLevel?.toLowerCase()) {
    case "low":
      return "🟢";
    case "medium":
      return "🟡";
    case "high":
      return "🔶";
    case "critical":
      return "🔴";
    default:
      return null;
  }
};

const normalizeScoreTo100 = (score: number | null | undefined) => {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return null;
  }
  return score > 0 && score <= 1 ? score * 100 : score;
};

/** Final / risk-adjusted headline score for the donut (matches tooltip copy). */
const pickPostPenaltyDisplayScore = (supplier: Supplier): number | null => {
  const fs = (supplier as any).finalScore;
  if (typeof fs === "number" && Number.isFinite(fs)) {
    return fs;
  }
  const es = supplier.ethical_score;
  if (es !== null && es !== undefined && Number.isFinite(es)) {
    return es;
  }
  return null;
};

const formatScoreValue = (score: number | null | undefined, digits = 1) => {
  const normalized = normalizeScoreTo100(score);
  return normalized === null ? "N/A" : normalized.toFixed(digits);
};

const formatNumericValue = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return value.toFixed(digits);
};

const formatPercent = (value: number | null | undefined, digits = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return `${(value * 100).toFixed(digits)}%`;
};

// Compute canonical risk factor `r` (0-1) for display
const computeRiskFactor = (supplier: Supplier): number | null => {
  // If an explicit risk_factor (0-1) is present, use it
  if (
    typeof supplier.risk_factor === "number" &&
    Number.isFinite(supplier.risk_factor)
  ) {
    return Math.max(0, Math.min(1, supplier.risk_factor));
  }

  // If only a risk_penalty (points) is present, invert the thesis formula:
  // penalty = 15 * max(0, r - 0.3) * 100  => r = penalty/1500 + 0.3
  if (
    typeof supplier.risk_penalty === "number" &&
    Number.isFinite(supplier.risk_penalty)
  ) {
    const r = supplier.risk_penalty / 1500 + 0.3;
    return Math.max(0, Math.min(1, r));
  }

  return null;
};

// Score explanation descriptions
const scoreExplanations = {
  ethical_score:
    "The overall ethical score is a weighted average of Environmental (30%), Social (30%), and Governance (40%) dimensions. Scores range from 0-100, with higher scores representing better performance.",
  environmental_score:
    "Environmental scores reflect a supplier's impact on natural resources, carbon emissions, waste management, and compliance with environmental regulations. Factors include CO2 emissions, energy efficiency, waste reduction, and sustainable sourcing.",
  social_score:
    "Social scores evaluate a supplier's treatment of workers, community engagement, and human rights practices. Key metrics include labor conditions, diversity and inclusion, community development initiatives, and health and safety standards.",
  governance_score:
    "Governance scores assess a supplier's ethical business practices, transparency, and management structure. Factors include anti-corruption measures, executive compensation, board independence, and regulatory compliance.",
  risk_levels: {
    low: "Minimal regulatory, reputational, or operational risks identified. Regular monitoring recommended.",
    medium:
      "Moderate potential for disruption or compliance issues. Periodic reviews and engagement suggested.",
    high: "Significant concerns requiring immediate attention and risk mitigation strategies. Close monitoring essential.",
    critical:
      "Severe compliance violations or ethical concerns that may require relationship reassessment or immediate intervention.",
  },
};

// Section-level helper texts for supplier cards
const sectionHelp = {
  header: "Supplier identity and profile basics: name, country, and industry.",
  statusBar:
    "Operational status set during onboarding. 'Active' = verified and in use. 'Under Review' = pending assessment. 'Blacklisted' = disqualified. 'Unverified' = not yet confirmed.",
  riskBadge:
    "Risk tier derived from the composite ESG score, country risk index, and disclosure completeness. Low < Medium < High < Critical.",
  esgRiskAdjusted:
    "Final ESG score after applying risk penalty and data-completeness cap. Ranges 0–100 — higher is better. This is the headline number used for ranking and reporting.",
  esgComposite:
    "Pre-penalty ESG composite. Weighted average of Environmental (40%), Social (30%), Governance (30%). Subtract risk penalty to get the final score.",
  coverage:
    "Data completeness ratio — the share of required ESG fields that have been filled in. Below 50% triggers an automatic risk-penalty on the final score.",
  riskExposure:
    "Implied external risk factor r (0–1), shown as 0–100%. Higher means heavier exposure in the thesis penalty model (not the same as penalty points).",
  pillarEnv:
    "Environmental score (E): CO₂ / emissions intensity, water usage, waste management, energy efficiency, and environmental-compliance history.",
  pillarSoc:
    "Social score (S): worker safety rates, wage fairness, human-rights audits, community engagement, and DEI metrics.",
  pillarGov:
    "Governance score (G): anti-corruption measures, board independence, executive-pay transparency, regulatory compliance, and whistleblower policies.",
  rating:
    "Performance tier based on the risk-adjusted ESG score (same bands as profile pillars). Excellent ≥ 80 · Strong ≥ 65 · Average ≥ 45 · At Risk < 45.",
  lastUpdated:
    "When this supplier's data was last synced or reassessed. Stale data (> 90 days) may affect score reliability.",
  quickView:
    "Open a side-panel summary of this supplier's scores, risk flags, and key metrics without leaving the list.",
  openProfile:
    "Navigate to the full supplier profile page for deep-dive analytics, audit trail, and ESG breakdown.",
  select:
    "Select this supplier to compare side-by-side with others. Select 2 or more to unlock the Compare panel.",
  riskAccent:
    "The colour strip indicates risk tier at a glance: green = Low, amber = Medium, orange = High, red = Critical.",
};

// Helper to get supplier status style
const getStatusStyles = (colors: any, status: string | undefined) => {
  switch (status?.toLowerCase()) {
    case "active":
      return {
        color: colors.success,
        bgColor: colors.success + "15",
        icon: <CheckCircleIcon className="h-4 w-4 mr-1" />,
        border: `1px solid ${colors.success}30`,
      };
    case "under review":
      return {
        color: colors.warning,
        bgColor: colors.warning + "15",
        icon: <ClockIcon className="h-4 w-4 mr-1" />,
        border: `1px solid ${colors.warning}30`,
      };
    case "blacklisted":
      return {
        color: colors.error,
        bgColor: colors.error + "15",
        icon: <NoSymbolIcon className="h-4 w-4 mr-1" />,
        border: `1px solid ${colors.error}30`,
      };
    default:
      return {
        color: colors.textMuted,
        bgColor: "transparent",
        icon: null,
        border: `1px dashed ${colors.textMuted}40`,
      };
  }
};

// Helper to determine AI recommendation
const getRecommendation = (colors: any, supplier: Supplier) => {
  const rawScore = supplier.ethical_score;
  const score =
    typeof rawScore === "number"
      ? rawScore > 0 && rawScore <= 1
        ? rawScore * 100
        : rawScore
      : null;

  const riskLevel = supplier.risk_level?.toLowerCase() || "";
  const completeness =
    typeof supplier.completeness_ratio === "number"
      ? Math.round(supplier.completeness_ratio * 100)
      : null;

  const lastUpdatedRaw = (supplier as any).updated_at || (supplier as any).updatedAt || (supplier as any).last_updated;
  const lastUpdatedMs = lastUpdatedRaw
    ? new Date(lastUpdatedRaw).getTime()
    : null;
  const ageDays =
    lastUpdatedMs !== null
      ? Math.floor((Date.now() - lastUpdatedMs) / (1000 * 60 * 60 * 24))
      : null;

  // 1) Missing/low disclosure is the highest-priority fix (you can't trust scores)
  if (completeness !== null && completeness < 60) {
    return {
      type: "data",
      icon: <DocumentIcon className="h-4 w-4 mr-1" />,
      label: "Request ESG Data",
      color: colors.warning,
      bgColor: colors.warning + "15",
      description: `Disclosure is ${completeness}%. Scores are less reliable until core ESG fields are submitted and verified.`,
    };
  }

  // 2) Critical/high risk should be surfaced even if score looks ok
  if (riskLevel === "critical" || riskLevel === "high") {
    return {
      type: "risk",
      icon: <ShieldExclamationIcon className="h-4 w-4 mr-1" />,
      label: riskLevel === "critical" ? "Immediate Review" : "Risk Watch",
      color: riskLevel === "critical" ? colors.secondary : colors.error,
      bgColor:
        (riskLevel === "critical" ? colors.secondary : colors.error) + "15",
      description:
        riskLevel === "critical"
          ? "This supplier is flagged Critical risk. Prioritize reassessment and mitigation actions."
          : "This supplier is flagged High risk. Monitor closely and schedule a reassessment.",
    };
  }

  // 3) Stale data
  if (ageDays !== null && ageDays > 120) {
    return {
      type: "stale",
      icon: <ArrowPathIcon className="h-4 w-4 mr-1" />,
      label: "Refresh Assessment",
      color: colors.textMuted,
      bgColor: colors.panel,
      description: `Last update was ${ageDays} days ago. Refresh the assessment before using this supplier in reporting decisions.`,
    };
  }

  // 4) Strong / recommended
  if (score !== null && score >= 80) {
    return {
      type: "recommended",
      icon: <CheckBadgeSolid className="h-4 w-4 mr-1" />,
      label: "Recommended",
      color: colors.success,
      bgColor: colors.success + "15",
      description:
        "Strong risk-adjusted ESG performance. Suitable for preferred supplier lists and long-term contracts.",
    };
  }

  // 5) At-risk by score even if risk_level isn't set
  if (score !== null && score < 45) {
    return {
      type: "warning",
      icon: <ExclamationCircleIcon className="h-4 w-4 mr-1" />,
      label: "Improve Plan",
      color: colors.error,
      bgColor: colors.error + "15",
      description:
        "Low ESG score. Build an improvement plan and set 30/60/90-day targets before expanding spend.",
    };
  }

  // 6) Default: monitor
  return {
    type: "monitor",
    icon: <InformationCircleIcon className="h-4 w-4 mr-1" />,
    label: "Monitor",
    color: colors.primary,
    bgColor: colors.primary + "10",
    description:
      "No critical flags detected. Keep monitoring and re-run assessment quarterly or when risk signals change.",
  };
};

// Format date for display
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "Not yet recorded";

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

// Calculate time elapsed since update
const getTimeElapsed = (dateString: string | undefined) => {
  if (!dateString) return "N/A";

  try {
    const updateTime = new Date(dateString).getTime();
    const currentTime = new Date().getTime();
    const diffMs = currentTime - updateTime;

    // Convert to different time units
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
    }
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    return `${diffSecs} second${diffSecs !== 1 ? "s" : ""} ago`;
  } catch (e) {
    return "N/A";
  }
};

const getLastUpdatedBadge = (colors: any, dateString: string | undefined) => {
  if (!dateString) {
    return {
      label: "Awaiting first sync",
      tooltip:
        "This supplier hasn’t reported any timeline updates yet. Initiate a refresh to activate live tracking.",
      icon: <SparklesIcon className="h-3.5 w-3.5 mr-1" />,
      style: {
        color: colors.secondary,
        backgroundColor: colors.secondary + "15",
        border: `1px dashed ${colors.secondary}50`,
        boxShadow: `0 0 18px -12px ${colors.secondary}`,
      },
    };
  }

  const relative = getTimeElapsed(dateString);
  const absolute = formatDate(dateString);
  const hasReadableRelative = relative !== "N/A" && relative !== "";

  return {
    label: hasReadableRelative ? `Updated ${relative}` : "Update captured",
    tooltip: `Last confirmed sync: ${absolute}`,
    icon: <ClockIconSolid className="h-3.5 w-3.5 mr-1" />,
    style: {
      color: colors.primary,
      backgroundColor: colors.primary + "12",
      border: `1px solid ${colors.primary}30`,
      boxShadow: `0 0 0 1px ${colors.primary}10`,
    },
  };
};

// Enhanced Tooltip component with robust positioning and overflow prevention
const Tooltip = ({
  children,
  content,
  wrapperClassName = "inline-flex items-center",
}: {
  children: React.ReactNode;
  content: string;
  wrapperClassName?: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 260,
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors() as any;

  const recalc = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const pad = 12;
    const w = Math.min(280, window.innerWidth - pad * 2);
    const tipH = 90;
    const above = r.top > tipH + pad + 20;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
    const top = above ? r.top - tipH - 8 : r.bottom + 8;
    setPos({ top, left, width: w });
  };

  useEffect(() => {
    if (!isVisible) return;
    recalc();
    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [isVisible, content]);

  const tooltipEl = isVisible ? (
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 99999,
        pointerEvents: "none",
      }}
    >
      <div
        className="rounded-md border p-3 text-xs leading-relaxed shadow-2xl"
        style={{
          backgroundColor: colors.tooltipBg || colors.panel,
          borderColor: colors.accent + "55",
          color: colors.text,
          boxShadow: "0 16px 32px rgba(0,0,0,0.6)",
          wordBreak: "break-word",
        }}
      >
        {content}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className={wrapperClassName}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {tooltipEl && createPortal(tooltipEl, document.body)}
    </>
  );
};

// --- SuppliersList Component ---

const SuppliersList = () => {
  usePageTitle("Suppliers");
  const themeColors = useThemeColors() as any;
  const colors = themeColors || {
    background: "#ffffff",
    panel: "#ffffff",
    primary: "#2563eb",
    secondary: "#8B5CF6",
    accent: "#4D5BFF",
    text: "#111827",
    textMuted: "#6B7280",
    success: "#16A34A",
    warning: "#D97706",
    error: "#DC2626",
    inputBg: "#F3F4F6",
  };
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [environmentalFilter, setEnvironmentalFilter] = useState<
    [number, number]
  >([0, 100]);
  const [socialFilter, setSocialFilter] = useState<[number, number]>([0, 100]);
  const [governanceFilter, setGovernanceFilter] = useState<[number, number]>([
    0, 100,
  ]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const navigate = useNavigate();

  // Modal state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Comparison state
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSuppliers();
        setSuppliers(data || []); // Ensure it's always an array
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        setError(
          `Failed to retrieve supplier list. ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        );
        setSuppliers([]); // Reset on error
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Memoized filtering
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      // Basic search across multiple fields
      const searchTermLower = searchTerm.toLowerCase();
      const nameMatch =
        supplier.name?.toLowerCase().includes(searchTermLower) || false;
      const idMatch =
        (supplier.id?.toString() || "").includes(searchTermLower) ||
        (supplier._id?.toString() || "").includes(searchTermLower);
      const countryMatch = (supplier.country || "")
        .toLowerCase()
        .includes(searchTermLower);
      const searchMatches =
        searchTerm === "" || nameMatch || idMatch || countryMatch;

      // Basic filters
      const countryFilterMatch =
        !filterCountry || supplier.country === filterCountry;
      const industryFilterMatch =
        !filterIndustry || supplier.industry === filterIndustry;
      const riskFilterMatch =
        !filterRisk ||
        supplier.risk_level?.toLowerCase() === filterRisk.toLowerCase();

      // If advanced filters are not shown, only apply basic filters
      if (!showAdvancedFilters) {
        return (
          searchMatches &&
          countryFilterMatch &&
          industryFilterMatch &&
          riskFilterMatch
        );
      }

      // Get normalized scores (0-100 scale)
      const normalizeScore = (score) => {
        if (score === null || score === undefined) return 0;
        return score > 0 && score <= 1 ? score * 100 : score;
      };

      const envScore = normalizeScore(supplier.environmental_score);
      const socScore = normalizeScore(supplier.social_score);
      const govScore = normalizeScore(supplier.governance_score);

      // Apply range filters
      const envFilterMatch =
        envScore >= environmentalFilter[0] &&
        envScore <= environmentalFilter[1];
      const socFilterMatch =
        socScore >= socialFilter[0] && socScore <= socialFilter[1];
      const govFilterMatch =
        govScore >= governanceFilter[0] && govScore <= governanceFilter[1];

      return (
        searchMatches &&
        countryFilterMatch &&
        industryFilterMatch &&
        riskFilterMatch &&
        envFilterMatch &&
        socFilterMatch &&
        govFilterMatch
      );
    });
  }, [
    suppliers,
    searchTerm,
    filterCountry,
    filterIndustry,
    filterRisk,
    environmentalFilter,
    socialFilter,
    governanceFilter,
    showAdvancedFilters,
  ]);

  // Extract unique options for filters
  const countries = useMemo(
    () => [...new Set(suppliers.map((s) => s.country).filter(Boolean))],
    [suppliers],
  );
  const industries = useMemo(
    () => [...new Set(suppliers.map((s) => s.industry).filter(Boolean))],
    [suppliers],
  );
  const riskLevels = useMemo(
    () => [
      ...new Set(
        suppliers
          .map((s) => s.risk_level)
          .filter(Boolean)
          .map((r) => r.toLowerCase()),
      ),
    ],
    [suppliers],
  );

  const resetFilters = () => {
    setSearchTerm("");
    setFilterCountry("");
    setFilterIndustry("");
    setFilterRisk("");
    setEnvironmentalFilter([0, 100]);
    setSocialFilter([0, 100]);
    setGovernanceFilter([0, 100]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  const handleViewDetails = (id: string | number) => {
    navigate(`/suppliers/${id}`);
  };

  const renderScoreSlider = (
    label: string,
    value: [number, number],
    onChange: (value: [number, number]) => void,
  ) => {
    return (
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <label
            className="block text-sm font-medium"
            style={{ color: colors.text }}
          >
            {label}
          </label>
          <span className="text-sm font-mono" style={{ color: colors.primary }}>
            {value[0]} - {value[1]}
          </span>
        </div>
        <div className="relative pt-1">
          {/* Track background */}
          <div
            className="absolute w-full h-1 rounded-md"
            style={{ backgroundColor: colors.panel }}
          ></div>

          {/* Selected range */}
          <div
            className="absolute h-1 rounded-md"
            style={{
              backgroundColor: colors.primary,
              left: `${value[0]}%`,
              width: `${value[1] - value[0]}%`,
            }}
          ></div>

          {/* Handles */}
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={value[0]}
            onChange={(e) => {
              const newMin = Number(e.target.value);
              const newMax = Math.max(value[1], newMin + 5);
              onChange([newMin, newMax]);
            }}
            className="absolute w-full appearance-none h-1 rounded-sm bg-transparent pointer-events-none z-10"
            style={{
              outline: "none",
              WebkitAppearance: "none",
              "&::-webkit-slider-thumb": {
                WebkitAppearance: "none",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: colors.primary,
                border: `2px solid ${colors.background}`,
                cursor: "pointer",
                pointerEvents: "all",
              },
              "&::-moz-range-thumb": {
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: colors.primary,
                border: `2px solid ${colors.background}`,
                cursor: "pointer",
                pointerEvents: "all",
              },
            }}
          />
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={value[1]}
            onChange={(e) => {
              const newMax = Number(e.target.value);
              const newMin = Math.min(value[0], newMax - 5);
              onChange([newMin, newMax]);
            }}
            className="absolute w-full appearance-none h-1 rounded-sm bg-transparent pointer-events-none z-10"
            style={{
              outline: "none",
              WebkitAppearance: "none",
              "&::-webkit-slider-thumb": {
                WebkitAppearance: "none",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: colors.primary,
                border: `2px solid ${colors.background}`,
                cursor: "pointer",
                pointerEvents: "all",
              },
              "&::-moz-range-thumb": {
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: colors.primary,
                border: `2px solid ${colors.background}`,
                cursor: "pointer",
                pointerEvents: "all",
              },
            }}
          />

          {/* CSS for slider handles */}
          <style jsx>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background-color: ${colors.primary};
              border: 2px solid ${colors.background};
              cursor: pointer;
              pointer-events: all;
              margin-top: -7px;
            }
            input[type="range"]::-moz-range-thumb {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background-color: ${colors.primary};
              border: 2px solid ${colors.background};
              cursor: pointer;
              pointer-events: all;
              margin-top: -7px;
            }
          `}</style>

          <div
            className="flex justify-between mt-4 text-xs"
            style={{ color: colors.textMuted }}
          >
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </div>
    );
  };

  // Function to get label for button
  const getFilterButtonLabel = () => {
    return showAdvancedFilters ? "Hide ESG Filters" : "Show ESG Filters";
  };

  // Function to handle sort changes
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="h-4 w-4 ml-1 opacity-50" />;
    }

    return sortDirection === "asc" ? (
      <ChevronUpIcon
        className="h-4 w-4 ml-1"
        style={{ color: colors.primary }}
      />
    ) : (
      <ChevronDownIcon
        className="h-4 w-4 ml-1"
        style={{ color: colors.primary }}
      />
    );
  };

  // Apply sorting and pagination to filtered suppliers
  const sortedAndPaginatedSuppliers = useMemo(() => {
    // First sort the filtered suppliers
    const sorted = [...filteredSuppliers].sort((a, b) => {
      let aValue, bValue;

      // Get values based on sort field
      switch (sortField) {
        case "ethical_score":
          aValue = a.ethical_score || 0;
          bValue = b.ethical_score || 0;
          // Normalize scores to 0-100 scale if they're in 0-1 range
          if (aValue > 0 && aValue <= 1) aValue *= 100;
          if (bValue > 0 && bValue <= 1) bValue *= 100;
          break;
        case "environmental_score":
          aValue = a.environmental_score || 0;
          bValue = b.environmental_score || 0;
          if (aValue > 0 && aValue <= 1) aValue *= 100;
          if (bValue > 0 && bValue <= 1) bValue *= 100;
          break;
        case "social_score":
          aValue = a.social_score || 0;
          bValue = b.social_score || 0;
          if (aValue > 0 && aValue <= 1) aValue *= 100;
          if (bValue > 0 && bValue <= 1) bValue *= 100;
          break;
        case "governance_score":
          aValue = a.governance_score || 0;
          bValue = b.governance_score || 0;
          if (aValue > 0 && aValue <= 1) aValue *= 100;
          if (bValue > 0 && bValue <= 1) bValue *= 100;
          break;
        case "risk_level":
          // Map risk levels to numerical values for sorting
          const riskMap = { low: 1, medium: 2, high: 3, critical: 4 };
          aValue = riskMap[a.risk_level?.toLowerCase()] || 0;
          bValue = riskMap[b.risk_level?.toLowerCase()] || 0;
          break;
        case "name":
        default:
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
      }

      // Apply sort direction
      const sortVal = sortDirection === "asc" ? 1 : -1;

      // Compare values (handles both numeric and string values)
      if (aValue < bValue) return -1 * sortVal;
      if (aValue > bValue) return 1 * sortVal;
      return 0;
    });

    // Then apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [filteredSuppliers, sortField, sortDirection, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  // Portfolio-level KPIs computed from filtered suppliers (live)
  const portfolioStats = useMemo(() => {
    const total = filteredSuppliers.length;
    const scores: number[] = [];
    const coverages: number[] = [];
    let highRisk = 0;

    filteredSuppliers.forEach((s) => {
      const raw = s.ethical_score;
      if (raw !== null && raw !== undefined && !Number.isNaN(raw)) {
        scores.push(raw > 0 && raw <= 1 ? raw * 100 : raw);
      }
      if (
        s.completeness_ratio !== null &&
        s.completeness_ratio !== undefined &&
        !Number.isNaN(s.completeness_ratio)
      ) {
        coverages.push(s.completeness_ratio);
      }
      const lvl = s.risk_level?.toLowerCase();
      if (lvl === "high" || lvl === "critical") highRisk += 1;
    });

    const avgEsg = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;
    const avgCoverage = coverages.length
      ? coverages.reduce((a, b) => a + b, 0) / coverages.length
      : null;

    const topPerformer = filteredSuppliers
      .filter((s) => s.ethical_score !== null && s.ethical_score !== undefined)
      .reduce<{ name: string; score: number } | null>((best, s) => {
        const v =
          s.ethical_score && s.ethical_score <= 1
            ? s.ethical_score * 100
            : (s.ethical_score as number);
        if (!best || v > best.score) return { name: s.name || "—", score: v };
        return best;
      }, null);

    return { total, avgEsg, avgCoverage, highRisk, topPerformer };
  }, [filteredSuppliers]);

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Function to open the quick view modal
  const handleQuickView = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowModal(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setShowModal(false);
    // Reset the selected supplier after the animation completes
    setTimeout(() => setSelectedSupplier(null), 300);
  };

  // Derive suggested actions from real supplier data
  const getSupplierActions = (s: Supplier | null) => {
    if (!s) return [];
    const actions: { action: string; priority: string; timeframe: string }[] = [];
    const score = (s as any).finalScore ?? s.composite_score ?? s.ethical_score ?? null;
    const risk = s.risk_level?.toLowerCase() ?? "";
    const completeness = s.completeness_ratio ?? null;

    if (completeness !== null && completeness < 0.6)
      actions.push({ action: "Request Updated ESG Documentation", priority: "high", timeframe: "1-2 weeks" });
    if (risk === "high" || risk === "critical")
      actions.push({ action: "Schedule Compliance Review", priority: "high", timeframe: "1-2 weeks" });
    if (score !== null && (score <= 1 ? score * 100 : score) < 50)
      actions.push({ action: "Initiate Supplier Improvement Plan", priority: "high", timeframe: "1 month" });
    if (risk === "medium")
      actions.push({ action: "Request Audit Report", priority: "medium", timeframe: "1 month" });
    if (!risk || risk === "low")
      actions.push({ action: "Monitor ESG Performance", priority: "low", timeframe: "Ongoing" });
    if (actions.length === 0)
      actions.push({ action: "Conduct Annual ESG Review", priority: "low", timeframe: "Ongoing" });
    return actions;
  };

  // Helper to format value for export
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") {
      // If it's a score between 0-1, show as percentage
      if (value > 0 && value <= 1 && value !== 0 && value !== 1) {
        return (value * 100).toFixed(2);
      }
      return value.toFixed(2);
    }
    if (typeof value === "string") return value;
    return String(value);
  };

  // Format supplier data for export - includes ALL fields
  const formatSuppliersForExport = (suppliers: Supplier[]) => {
    return suppliers.map((supplier) => {
      const formatted: Record<string, string> = {};

      // Basic Information
      formatted["ID"] =
        supplier.id?.toString() || supplier._id?.toString() || "N/A";
      formatted["Supplier Name"] = supplier.name || "N/A";
      formatted["Country"] = supplier.country || "N/A";
      formatted["Industry"] = supplier.industry || "N/A";
      formatted["Description"] = (supplier as any).description || "N/A";
      formatted["Website"] = (supplier as any).website || "N/A";
      formatted["Revenue (millions USD)"] = formatValue(
        (supplier as any).revenue,
      );
      formatted["Employee Count"] = formatValue(
        (supplier as any).employee_count,
      );

      // Overall Scores
      formatted["Ethical Score"] = formatValue(supplier.ethical_score);
      formatted["Environmental Score"] = formatValue(
        supplier.environmental_score,
      );
      formatted["Social Score"] = formatValue(supplier.social_score);
      formatted["Governance Score"] = formatValue(supplier.governance_score);
      formatted["Composite Score"] = formatValue(supplier.composite_score);
      formatted["Final Score (post-penalty)"] = formatValue(
        (supplier as any).finalScore,
      );

      // Risk Information
      formatted["Risk Level"] = supplier.risk_level || "N/A";
      formatted["Risk Factor"] =
        supplier.risk_factor !== undefined && supplier.risk_factor !== null
          ? fmtRiskFactor(supplier.risk_factor)
          : supplier.risk_penalty !== undefined &&
              supplier.risk_penalty !== null
            ? fmtPenalty(supplier.risk_penalty)
            : "N/A";
      formatted["Risk Penalty"] =
        supplier.risk_penalty !== undefined && supplier.risk_penalty !== null
          ? fmtPenalty(supplier.risk_penalty)
          : "N/A";
      formatted["Completeness Ratio"] = formatValue(
        supplier.completeness_ratio,
      );

      // Environmental Metrics
      formatted["CO2 Emissions (tons)"] =
        typeof supplier.co2_emissions === "number"
          ? fmtRawMetric(supplier.co2_emissions, "t")
          : formatValue(supplier.co2_emissions);
      formatted["Total Emissions"] =
        typeof (supplier as any).total_emissions === "number"
          ? fmtRawMetric((supplier as any).total_emissions, "t")
          : formatValue((supplier as any).total_emissions);
      formatted["Water Usage (cubic meters)"] =
        typeof supplier.water_usage === "number"
          ? fmtRawMetric(supplier.water_usage, "m³")
          : formatValue(supplier.water_usage);
      formatted["Waste Generated"] =
        typeof (supplier as any).waste_generated === "number"
          ? fmtRawMetric((supplier as any).waste_generated, "t")
          : formatValue((supplier as any).waste_generated);
      formatted["Energy Efficiency"] = formatValue(
        (supplier as any).energy_efficiency,
      );
      formatted["Waste Management Score"] = formatValue(
        supplier.waste_management_score,
      );
      formatted["Renewable Energy Percent"] =
        supplier.renewable_energy_percent !== undefined &&
        supplier.renewable_energy_percent !== null
          ? `${Number(supplier.renewable_energy_percent).toFixed(1)}%`
          : formatValue(supplier.renewable_energy_percent);
      formatted["Pollution Control"] = formatValue(
        (supplier as any).pollution_control,
      );

      // Social Metrics
      formatted["Wage Fairness"] = formatValue(supplier.wage_fairness);
      formatted["Human Rights Index"] = formatValue(
        supplier.human_rights_index,
      );
      formatted["Diversity Inclusion Score"] = formatValue(
        (supplier as any).diversity_inclusion_score,
      );
      formatted["Community Engagement"] = formatValue(
        (supplier as any).community_engagement,
      );
      formatted["Worker Safety"] = formatValue((supplier as any).worker_safety);
      formatted["Injury Rate"] = formatValue((supplier as any).injury_rate);
      formatted["Training Hours"] = formatValue(
        (supplier as any).training_hours,
      );
      formatted["Living Wage Ratio"] = formatValue(
        (supplier as any).living_wage_ratio,
      );
      formatted["Gender Diversity Percent"] = formatValue(
        (supplier as any).gender_diversity_percent,
      );

      // Governance Metrics
      formatted["Transparency Score"] = formatValue(
        supplier.transparency_score,
      );
      formatted["Corruption Risk"] = formatValue(
        (supplier as any).corruption_risk,
      );
      formatted["Board Diversity"] = formatValue(supplier.board_diversity);
      formatted["Board Independence"] = formatValue(
        (supplier as any).board_independence,
      );
      formatted["Ethics Program"] = formatValue(
        (supplier as any).ethics_program,
      );
      formatted["Compliance Systems"] = formatValue(
        (supplier as any).compliance_systems,
      );
      formatted["Anti-Corruption Policy"] = formatValue(
        (supplier as any).anti_corruption_policy,
      );

      // Supply Chain Metrics
      formatted["Delivery Efficiency"] = formatValue(
        supplier.delivery_efficiency,
      );
      formatted["Quality Control Score"] = formatValue(
        (supplier as any).quality_control_score,
      );
      formatted["Supplier Diversity"] = formatValue(
        (supplier as any).supplier_diversity,
      );
      formatted["Traceability"] = formatValue((supplier as any).traceability);

      // Risk Factors
      formatted["Geopolitical Risk"] = formatValue(supplier.geopolitical_risk);
      formatted["Climate Risk"] = formatValue(supplier.climate_risk);
      formatted["Labor Dispute Risk"] = formatValue(
        supplier.labor_dispute_risk,
      );

      // Timestamps
      formatted["Created At"] =
        supplier.created_at || (supplier as any).createdAt || "N/A";
      formatted["Updated At"] =
        (supplier as any).updated_at || (supplier as any).updatedAt
          ? fmtDate((supplier as any).updated_at || (supplier as any).updatedAt)
          : "N/A";

      return formatted;
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const exportData = formatSuppliersForExport(filteredSuppliers);
      const headers = Object.keys(exportData[0]);

      // Create CSV content
      let csvContent = headers.join(",") + "\n";

      exportData.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header];
          // Wrap values with commas in quotes
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        });
        csvContent += values.join(",") + "\n";
      });

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      saveAs(
        blob,
        `suppliers_export_${new Date().toISOString().split("T")[0]}.csv`,
      );

      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      alert("Failed to export to CSV. Please try again.");
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const exportData = formatSuppliersForExport(filteredSuppliers);
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");

      // Create and download the file
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });
      saveAs(
        blob,
        `suppliers_export_${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel. Please try again.");
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const exportData = formatSuppliersForExport(filteredSuppliers);
      const headers = Object.keys(exportData[0]);
      const rows = exportData.map((row) =>
        headers.map((header) => row[header]),
      );

      // Create PDF document
      const doc = new jsPDF("landscape");

      // Add title
      doc.setFontSize(18);
      doc.text("Suppliers Data Export", 14, 22);

      // Add date
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

      // Add table
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 35,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Save the PDF
      doc.save(
        `suppliers_export_${new Date().toISOString().split("T")[0]}.pdf`,
      );

      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export to PDF. Please try again.");
    }
  };

  // Export Rankings CSV from server (with rate limiting)
  const handleExportRankings = async (scenario: string = "baseline") => {
    try {
      await exportRankings(scenario);
      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting rankings:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to export rankings. Please try again.",
      );
    }
  };

  // Export Industry Map CSV from server (with rate limiting)
  const handleExportIndustryMap = async () => {
    try {
      await exportIndustryMap();
      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting industry map:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to export industry map. Please try again.",
      );
    }
  };

  const exportComparison = () => {
    if (selectedSuppliers.length < 2) {
      alert("Select at least two suppliers before exporting a comparison.");
      return;
    }

    try {
      const doc = new jsPDF("landscape");
      doc.setFontSize(18);
      doc.text("Supplier Comparison", 14, 22);

      const tableData = [
        [
          "Metric",
          ...selectedSuppliers.map((s) => s.name || "Unnamed Supplier"),
        ],
        ["Country", ...selectedSuppliers.map((s) => s.country || "N/A")],
        ["Industry", ...selectedSuppliers.map((s) => s.industry || "N/A")],
        [
          "Ethical Score",
          ...selectedSuppliers.map((s) => formatScoreValue(s.ethical_score)),
        ],
        [
          "Environmental Score",
          ...selectedSuppliers.map((s) =>
            formatScoreValue(s.environmental_score),
          ),
        ],
        [
          "Social Score",
          ...selectedSuppliers.map((s) => formatScoreValue(s.social_score)),
        ],
        [
          "Governance Score",
          ...selectedSuppliers.map((s) => formatScoreValue(s.governance_score)),
        ],
        [
          "Delivery Efficiency",
          ...selectedSuppliers.map((s) =>
            formatScoreValue(s.delivery_efficiency),
          ),
        ],
        [
          "Wage Fairness",
          ...selectedSuppliers.map((s) => formatScoreValue(s.wage_fairness)),
        ],
        [
          "Human Rights Index",
          ...selectedSuppliers.map((s) =>
            formatScoreValue(s.human_rights_index),
          ),
        ],
        [
          "Waste Management",
          ...selectedSuppliers.map((s) =>
            formatScoreValue(s.waste_management_score),
          ),
        ],
        [
          "CO₂ Emissions (t)",
          ...selectedSuppliers.map((s) => formatNumericValue(s.co2_emissions)),
        ],
        ["Risk Level", ...selectedSuppliers.map((s) => s.risk_level || "N/A")],
      ];

      doc.autoTable({
        body: tableData,
        startY: 35,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
        },
      });

      doc.save(
        `supplier_comparison_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error exporting comparison:", error);
      alert("Failed to export the comparison. Please try again.");
    }
  };

  const comparisonMetrics = useMemo(
    () => [
      {
        key: "ethical_score",
        label: "Ethical Score",
        getValue: (s: Supplier) => s.ethical_score,
        format: formatScoreValue,
        normalize: normalizeScoreTo100,
        higherIsBetter: true,
      },
      {
        key: "environmental_score",
        label: "Environmental Score",
        getValue: (s: Supplier) => s.environmental_score,
        format: formatScoreValue,
        normalize: normalizeScoreTo100,
        higherIsBetter: true,
      },
      {
        key: "social_score",
        label: "Social Score",
        getValue: (s: Supplier) => s.social_score,
        format: formatScoreValue,
        normalize: normalizeScoreTo100,
        higherIsBetter: true,
      },
      {
        key: "governance_score",
        label: "Governance Score",
        getValue: (s: Supplier) => s.governance_score,
        format: formatScoreValue,
        normalize: normalizeScoreTo100,
        higherIsBetter: true,
      },
      {
        key: "delivery_efficiency",
        label: "Delivery Efficiency",
        getValue: (s: Supplier) => s.delivery_efficiency,
        format: formatScoreValue,
        normalize: normalizeScoreTo100,
        higherIsBetter: true,
      },
      {
        key: "wage_fairness",
        label: "Wage Fairness",
        getValue: (s: Supplier) => s.wage_fairness,
        format: formatScoreValue,
        normalize: normalizeScoreTo100,
        higherIsBetter: true,
      },
      {
        key: "human_rights_index",
        label: "Human Rights Index",
        getValue: (s: Supplier) => s.human_rights_index,
        format: formatScoreValue,
        normalize: normalizeScoreTo100,
        higherIsBetter: true,
      },
      {
        key: "waste_management_score",
        label: "Waste Management",
        getValue: (s: Supplier) => s.waste_management_score,
        format: formatScoreValue,
        normalize: normalizeScoreTo100,
        higherIsBetter: true,
      },
      {
        key: "co2_emissions",
        label: "CO₂ Emissions (t)",
        getValue: (s: Supplier) => s.co2_emissions,
        format: (value: number | null | undefined) =>
          formatNumericValue(value, 2),
        normalize: (value: number | null | undefined) =>
          value === null || value === undefined || Number.isNaN(value)
            ? null
            : value,
        higherIsBetter: false,
      },
    ],
    [],
  );

  const topPerformer = useMemo(() => {
    const ranked = selectedSuppliers
      .map((supplier) => ({
        supplier,
        score: normalizeScoreTo100(supplier.ethical_score),
      }))
      .filter((entry) => entry.score !== null) as Array<{
      supplier: Supplier;
      score: number;
    }>;

    if (ranked.length === 0) {
      return null;
    }

    ranked.sort((a, b) => b.score - a.score);
    return ranked[0];
  }, [selectedSuppliers]);

  // Add/remove supplier from comparison
  const toggleSupplierSelection = (supplier: Supplier) => {
    setSelectedSuppliers((prev) => {
      const isSelected = prev.some(
        (s) =>
          (s._id && s._id === supplier._id) || (s.id && s.id === supplier.id),
      );

      if (isSelected) {
        // Remove from selection
        return prev.filter(
          (s) =>
            !(
              (s._id && s._id === supplier._id) ||
              (s.id && s.id === supplier.id)
            ),
        );
      } else {
        // Add to selection (max 4)
        if (prev.length >= 4) {
          alert("You can compare up to 4 suppliers at a time");
          return prev;
        }
        return [...prev, supplier];
      }
    });
  };

  // Check if a supplier is selected
  const isSupplierSelected = (supplier: Supplier) => {
    return selectedSuppliers.some(
      (s) =>
        (s._id && s._id === supplier._id) || (s.id && s.id === supplier.id),
    );
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedSuppliers([]);
  };

  // Open comparison modal
  const openComparison = () => {
    if (selectedSuppliers.length < 2) {
      alert("Please select at least 2 suppliers to compare");
      return;
    }
    setShowComparisonModal(true);
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        {/* Header and Controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:mb-8"
        >
          {/* Hero header */}
          <div
            className="relative mb-5 md:mb-6 rounded-3xl border overflow-hidden"
            style={{
              borderColor: colors.accent + "30",
              background: `radial-gradient(circle at 0% 0%, ${colors.primary}1f 0%, transparent 55%), radial-gradient(circle at 100% 0%, ${colors.accent}24 0%, transparent 55%), linear-gradient(180deg, ${colors.panel} 0%, ${colors.background}cc 100%)`,
            }}
          >
            {/* subtle grid pattern */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `linear-gradient(${colors.text} 1px, transparent 1px), linear-gradient(90deg, ${colors.text} 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
              }}
            />

            <div className="relative p-5 sm:p-6 lg:p-7">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase"
                    style={{
                      color: colors.primary,
                      backgroundColor: colors.primary + "15",
                      border: `1px solid ${colors.primary}30`,
                    }}
                  >
                    <SparklesIcon className="h-3.5 w-3.5" />
                    Supplier Intelligence
                  </span>
                  <h1
                    className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight"
                    style={{
                      background: `linear-gradient(120deg, ${colors.text} 0%, ${colors.primary} 60%, ${colors.accent} 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Supplier Registry
                  </h1>
                  <p
                    className="mt-2 text-sm max-w-xl"
                    style={{ color: colors.textMuted }}
                  >
                    Track, evaluate and act on every supplier in your network —
                    risk-adjusted ESG scores, live coverage and AI-driven
                    recommendations in one command center.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 w-full lg:w-auto">
                  {/* Export Menu */}
                  <div className="relative w-full sm:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center w-full sm:w-auto px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                      style={{
                        backgroundColor: showExportMenu
                          ? colors.primary
                          : colors.panel,
                        color: showExportMenu
                          ? colors.background
                          : colors.textMuted,
                      }}
                      onClick={() => setShowExportMenu(!showExportMenu)}
                    >
                      <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                      Export Data
                    </motion.button>

                    {/* Export Dropdown Menu */}
                    <AnimatePresence>
                      {showExportMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute left-0 right-0 sm:left-auto sm:right-0 mt-2 z-10 w-full sm:w-48 max-h-[min(70vh,480px)] overflow-y-auto rounded-md shadow-lg"
                          style={{ backgroundColor: colors.panel }}
                        >
                          <div className="py-1 rounded-md">
                            <button
                              onClick={exportToCSV}
                              className="w-full px-4 py-2 text-sm flex items-center hover:bg-black/20"
                              style={{ color: colors.text }}
                            >
                              <DocumentIcon className="h-4 w-4 mr-3" />
                              Export as CSV
                            </button>
                            <button
                              onClick={exportToExcel}
                              className="w-full px-4 py-2 text-sm flex items-center hover:bg-black/20"
                              style={{ color: colors.text }}
                            >
                              <TableCellsIcon className="h-4 w-4 mr-3" />
                              Export as Excel
                            </button>
                            <button
                              onClick={exportToPDF}
                              className="w-full px-4 py-2 text-sm flex items-center hover:bg-black/20"
                              style={{ color: colors.text }}
                            >
                              <DocumentIcon className="h-4 w-4 mr-3" />
                              Export as PDF
                            </button>

                            {/* Divider */}
                            <div
                              className="border-t my-1"
                              style={{ borderColor: colors.border }}
                            />

                            {/* Server-side exports with rate limiting */}
                            <div
                              className="px-4 py-2 text-xs font-semibold"
                              style={{ color: colors.textMuted }}
                            >
                              Rankings & Analysis
                            </div>
                            <button
                              onClick={() => handleExportRankings("baseline")}
                              className="w-full px-4 py-2 text-sm flex items-center hover:bg-black/20"
                              style={{ color: colors.text }}
                            >
                              <ArrowTrendingUpIcon className="h-4 w-4 mr-3" />
                              Rankings (Baseline)
                            </button>
                            <button
                              onClick={handleExportIndustryMap}
                              className="w-full px-4 py-2 text-sm flex items-center hover:bg-black/20"
                              style={{ color: colors.text }}
                            >
                              <MapPinIcon className="h-4 w-4 mr-3" />
                              Industry Map
                            </button>

                            {/* Scenario exports */}
                            <div
                              className="px-4 py-2 text-xs font-semibold"
                              style={{ color: colors.textMuted }}
                            >
                              Scenario Analysis
                            </div>
                            <button
                              onClick={() => handleExportRankings("s1")}
                              className="w-full px-4 py-2 text-sm flex items-center hover:bg-black/20"
                              style={{ color: colors.text }}
                            >
                              <SparklesIcon className="h-4 w-4 mr-3" />
                              S1: Utility
                            </button>
                            <button
                              onClick={() => handleExportRankings("s2")}
                              className="w-full px-4 py-2 text-sm flex items-center hover:bg-black/20"
                              style={{ color: colors.text }}
                            >
                              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-3" />
                              S2: Sensitivity
                            </button>
                            <button
                              onClick={() => handleExportRankings("s3")}
                              className="w-full px-4 py-2 text-sm flex items-center hover:bg-black/20"
                              style={{ color: colors.text }}
                            >
                              <ExclamationCircleIcon className="h-4 w-4 mr-3" />
                              S3: Missingness
                            </button>
                            <button
                              onClick={() => handleExportRankings("s4")}
                              className="w-full px-4 py-2 text-sm flex items-center hover:bg-black/20"
                              style={{ color: colors.text }}
                            >
                              <ScaleIcon className="h-4 w-4 mr-3" />
                              S4: Ablation
                            </button>

                            <div
                              className="px-4 py-2 text-xs italic"
                              style={{ color: colors.textMuted }}
                            >
                              Rate limit: 10 exports/hour
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center w-full sm:w-auto px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    style={{
                      backgroundColor: showAdvancedFilters
                        ? colors.primary
                        : colors.panel,
                      color: showAdvancedFilters
                        ? colors.background
                        : colors.textMuted,
                    }}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <AdjustmentsHorizontalIcon className="h-5 w-5 mr-1" />
                    <span className="truncate">{getFilterButtonLabel()}</span>
                  </motion.button>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="col-span-2 sm:col-span-1"
                  >
                    <Link
                      to="/suppliers/add"
                      className="flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                      style={{
                        backgroundColor: colors.accent,
                        color: colors.background,
                      }}
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      <span className="hidden sm:inline">
                        Register New Supplier
                      </span>
                      <span className="sm:hidden">New Supplier</span>
                    </Link>
                  </motion.div>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    label: "Suppliers in View",
                    value: portfolioStats.total.toLocaleString(),
                    hint:
                      portfolioStats.total === suppliers.length
                        ? "Full network"
                        : `of ${suppliers.length} total`,
                    icon: <BuildingOfficeIcon className="h-4 w-4" />,
                    color: colors.primary,
                  },
                  {
                    label: "Avg ESG (Risk-adj.)",
                    value:
                      portfolioStats.avgEsg !== null
                        ? portfolioStats.avgEsg.toFixed(1)
                        : "—",
                    hint:
                      portfolioStats.avgEsg !== null
                        ? portfolioStats.avgEsg >= 70
                          ? "Strong portfolio"
                          : portfolioStats.avgEsg >= 50
                            ? "Mixed performance"
                            : "Needs attention"
                        : "No data",
                    icon: <ScaleIcon className="h-4 w-4" />,
                    color: colors.success,
                  },
                  {
                    label: "High / Critical Risk",
                    value: portfolioStats.highRisk.toLocaleString(),
                    hint:
                      portfolioStats.total > 0
                        ? `${(
                            (portfolioStats.highRisk / portfolioStats.total) *
                            100
                          ).toFixed(0)}% of view`
                        : "—",
                    icon: <ShieldExclamationIcon className="h-4 w-4" />,
                    color: colors.error,
                  },
                  {
                    label: "Avg Data Coverage",
                    value:
                      portfolioStats.avgCoverage !== null
                        ? `${(portfolioStats.avgCoverage * 100).toFixed(0)}%`
                        : "—",
                    hint: portfolioStats.topPerformer
                      ? `Top: ${portfolioStats.topPerformer.name}`
                      : "Disclosure quality",
                    icon: <SparklesIcon className="h-4 w-4" />,
                    color: colors.accent,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border px-4 py-3 backdrop-blur-sm flex items-start justify-between gap-3"
                    style={{
                      borderColor: colors.accent + "25",
                      backgroundColor: colors.panel + "cc",
                    }}
                  >
                    <div className="min-w-0">
                      <div
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: colors.textMuted }}
                      >
                        {stat.label}
                      </div>
                      <div
                        className="mt-1 text-lg sm:text-2xl font-bold font-mono leading-none tabular-nums truncate w-full"
                        style={{ color: colors.text }}
                      >
                        {stat.value}
                      </div>
                      <div
                        className="mt-1 text-[11px] truncate"
                        style={{ color: colors.textMuted }}
                      >
                        {stat.hint}
                      </div>
                    </div>
                    <div
                      className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{
                        color: stat.color,
                        backgroundColor: stat.color + "18",
                        border: `1px solid ${stat.color}30`,
                      }}
                    >
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div
            className="mb-5 md:mb-6 rounded-2xl border p-3 sm:p-4 md:p-5"
            style={{
              backgroundColor: colors.panel + "99",
              borderColor: colors.accent + "25",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5 mb-3 sm:mb-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                  style={{ color: colors.textMuted }}
                />
                <input
                  type="text"
                  placeholder="Search by name, ID, or country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.accent + "50",
                    color: colors.text,
                    "--tw-ring-color": colors.primary, // For focus ring
                  }}
                />
              </div>

              {/* Country Filter */}
              <div className="relative">
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full appearance-none pl-3 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.accent + "50",
                    color: colors.text,
                    "--tw-ring-color": colors.primary,
                  }}
                >
                  <option value="" style={{ color: colors.textMuted }}>
                    All Countries
                  </option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none"
                  style={{ color: colors.textMuted }}
                />
              </div>
              {/* Industry Filter */}
              <div className="relative">
                <select
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  className="w-full appearance-none pl-3 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.accent + "50",
                    color: colors.text,
                    "--tw-ring-color": colors.primary,
                  }}
                >
                  <option value="" style={{ color: colors.textMuted }}>
                    All Industries
                  </option>
                  {industries.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none"
                  style={{ color: colors.textMuted }}
                />
              </div>
              {/* Risk Filter */}
              <div className="relative">
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="w-full appearance-none pl-3 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.accent + "50",
                    color: colors.text,
                    "--tw-ring-color": colors.primary,
                  }}
                >
                  <option value="" style={{ color: colors.textMuted }}>
                    All Risk Levels
                  </option>
                  {riskLevels.map((r) => (
                    <option key={r} value={r} className="capitalize">
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none"
                  style={{ color: colors.textMuted }}
                />
              </div>
            </div>

            {/* Advanced Filters Accordion */}
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl mb-1 border"
                style={{
                  backgroundColor: colors.background + "66",
                  borderColor: colors.accent + "25",
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">
                    ESG Score Range Filters (0-100%)
                  </h3>
                  <button
                    onClick={resetFilters}
                    className="text-xs py-1 px-3 rounded flex items-center"
                    style={{
                      backgroundColor: colors.accent + "30",
                      color: colors.text,
                    }}
                  >
                    <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                    Reset All Filters
                  </button>
                </div>

                {renderScoreSlider(
                  "Environmental Score",
                  environmentalFilter,
                  setEnvironmentalFilter,
                )}
                {renderScoreSlider(
                  "Social Score",
                  socialFilter,
                  setSocialFilter,
                )}
                {renderScoreSlider(
                  "Governance Score",
                  governanceFilter,
                  setGovernanceFilter,
                )}

                <div
                  className="mt-2 text-xs"
                  style={{ color: colors.textMuted }}
                >
                  Showing {filteredSuppliers.length} of {suppliers.length}{" "}
                  suppliers
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Sorting Controls */}
        <div
          className="mb-5 md:mb-6 px-3 sm:px-4 py-2.5 rounded-xl border flex items-center gap-2"
          style={{
            backgroundColor: colors.panel + "cc",
            borderColor: colors.accent + "25",
          }}
        >
          <span
            className="text-[11px] font-mono uppercase tracking-widest shrink-0 mr-1"
            style={{ color: colors.textMuted }}
          >
            Sort
          </span>
          <div
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap"
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
            {(
              [
                { key: "name", label: "Name" },
                { key: "ethical_score", label: "ESG Score" },
                { key: "environmental_score", label: "Env" },
                { key: "social_score", label: "Social" },
                { key: "governance_score", label: "Gov" },
                { key: "risk_level", label: "Risk" },
              ] as { key: string; label: string }[]
            ).map(({ key, label }) => {
              const active = sortField === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: active ? colors.primary : "transparent",
                    color: active ? "#0A0A0A" : colors.textMuted,
                    border: `1px solid ${active ? colors.primary : colors.accent + "25"}`,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label} <SortIcon field={key} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Supplier List/Grid */}
        {loading && <LoadingIndicator />}
        {error && !loading && <ErrorDisplay message={error} />}
        {!loading && !error && (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 xl:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {sortedAndPaginatedSuppliers.length > 0 ? (
                sortedAndPaginatedSuppliers.map((supplier, idx) => {
                  const absoluteRank =
                    (currentPage - 1) * itemsPerPage + idx + 1;
                  const riskColor = getRiskColor(colors, supplier.risk_level);
                  const riskIcon = getRiskIcon(supplier.risk_level);
                  const riskAdjustedScore = pickPostPenaltyDisplayScore(supplier);
                  const scorePercent = Math.max(
                    0,
                    Math.min(100, normalizeScoreTo100(riskAdjustedScore) ?? 0),
                  );
                  const compositeScore =
                    supplier.composite_score !== undefined
                      ? supplier.composite_score
                      : null;
                  const completenessRatio =
                    supplier.completeness_ratio !== undefined
                      ? supplier.completeness_ratio
                      : null;
                  const supplierId = supplier._id || supplier.id; // Handle both ID types
                  const isSelected = isSupplierSelected(supplier);
                  const statusStyles = getStatusStyles(colors, supplier.status);
                  const recommendation = getRecommendation(colors, supplier);
                  const lastUpdatedBadge = getLastUpdatedBadge(
                    colors,
                    (supplier as any).updated_at || (supplier as any).updatedAt || (supplier as any).last_updated,
                  );

                  const formatPillar = (val: number | null | undefined) => {
                    if (val === null || val === undefined || Number.isNaN(val))
                      return "N/A";
                    return (val > 0 && val <= 1 ? val * 100 : val).toFixed(0);
                  };

                  const scoreColor = scoreBandColor(colors, riskAdjustedScore);

                  return (
                    <motion.div
                      key={supplierId}
                      variants={itemVariants}
                      className="flex flex-col overflow-hidden transition-shadow duration-200 min-w-0"
                      style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${isSelected ? colors.primary + "50" : "rgba(128,128,128,0.10)"}`,
                        borderRadius: "8px",
                        outline: isSelected
                          ? `2px solid ${colors.primary}30`
                          : "none",
                        outlineOffset: "2px",
                      }}
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    >
                      {/* Risk-coded accent line */}
                      <Tooltip content={sectionHelp.riskAccent}>
                        <div
                          className="h-[3px] shrink-0 cursor-help"
                          style={{ background: riskColor }}
                        />
                      </Tooltip>

                      {/* ── HEADER ─────────────────────────────────────── */}
                      <div
                        className="px-3 sm:px-4 pt-3 pb-3"
                        style={{
                          borderBottom: "1px solid rgba(128,128,128,0.08)",
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Rank badge */}
                          <Tooltip
                            content={`Rank #${absoluteRank} — sorted by ${sortField}`}
                          >
                            <div
                              className="shrink-0 h-7 w-7 rounded flex items-center justify-center text-[11px] font-bold font-mono leading-none"
                              style={{
                                backgroundColor:
                                  absoluteRank <= 3
                                    ? colors.primary + "22"
                                    : "rgba(128,128,128,0.08)",
                                color:
                                  absoluteRank <= 3
                                    ? colors.primary
                                    : colors.textMuted,
                                border: `1px solid ${absoluteRank <= 3 ? colors.primary + "40" : "rgba(128,128,128,0.14)"}`,
                              }}
                            >
                              {absoluteRank}
                            </div>
                          </Tooltip>

                          {/* Name + location */}
                          <div className="min-w-0 flex-1">
                            <h2
                              className="text-[14px] sm:text-[15px] font-semibold leading-snug break-words"
                              style={{
                                color: colors.text,
                                letterSpacing: "-0.01em",
                              }}
                              title={supplier.name || undefined}
                            >
                              {supplier.name}
                            </h2>
                            <div
                              className="mt-0.5 text-[11px] break-words line-clamp-2 sm:truncate"
                              style={{ color: colors.textMuted }}
                            >
                              {supplier.country || "N/A"}
                              <span className="mx-1 opacity-40">·</span>
                              {supplier.industry || "N/A"}
                            </div>
                          </div>

                          {/* Select toggle */}
                          <Tooltip content={sectionHelp.select}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSupplierSelection(supplier);
                              }}
                              className="shrink-0 p-0.5 rounded transition-colors"
                              aria-label={isSelected ? "Deselect" : "Select"}
                            >
                              {isSelected ? (
                                <CheckCircleIcon
                                  className="h-4 w-4"
                                  style={{ color: colors.primary }}
                                />
                              ) : (
                                <Square2StackIcon
                                  className="h-4 w-4"
                                  style={{
                                    color: colors.textMuted,
                                    opacity: 0.5,
                                  }}
                                />
                              )}
                            </button>
                          </Tooltip>
                        </div>

                        {/* 2 badges max: status + risk */}
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <Tooltip content={sectionHelp.statusBar}>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase"
                              style={{
                                borderRadius: "4px",
                                color: statusStyles.color,
                                backgroundColor: statusStyles.bgColor,
                                border: statusStyles.border,
                                letterSpacing: "0.05em",
                              }}
                            >
                              {statusStyles.icon}
                              {supplier.status || "Unverified"}
                            </span>
                          </Tooltip>
                          <Tooltip
                            content={
                              supplier.risk_level
                                ? (
                                    scoreExplanations.risk_levels as Record<
                                      string,
                                      string
                                    >
                                  )[supplier.risk_level.toLowerCase()] ||
                                  sectionHelp.riskBadge
                                : sectionHelp.riskBadge
                            }
                          >
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase cursor-help"
                              style={{
                                borderRadius: "4px",
                                color: supplier.risk_level
                                  ? riskColor
                                  : colors.textMuted,
                                backgroundColor: supplier.risk_level
                                  ? riskColor + "15"
                                  : "transparent",
                                border: supplier.risk_level
                                  ? `1px solid ${riskColor}30`
                                  : `1px dashed ${colors.textMuted}40`,
                                letterSpacing: "0.05em",
                              }}
                            >
                              {supplier.risk_level ? (
                                <>
                                  {getRiskIcon(supplier.risk_level)}{" "}
                                  {supplier.risk_level} risk
                                </>
                              ) : (
                                "No Risk Data"
                              )}
                            </span>
                          </Tooltip>
                          <Tooltip content={recommendation.description}>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase cursor-help"
                              style={{
                                borderRadius: "4px",
                                color: recommendation.color,
                                backgroundColor: recommendation.bgColor,
                                border: `1px solid ${recommendation.color}25`,
                                letterSpacing: "0.05em",
                              }}
                            >
                              {recommendation.icon}
                              {recommendation.label}
                            </span>
                          </Tooltip>
                        </div>
                      </div>

                      {/* ── SCORE BODY ─────────────────────────────────── */}
                      <div className="px-3 sm:px-4 py-4 flex-grow flex flex-col items-center gap-4 min-[420px]:flex-row min-[420px]:items-start">
                        {/* Left: gauge ring + E/S/G below */}
                        <div className="shrink-0 flex flex-col items-center gap-2 w-full min-[420px]:w-auto">
                          <Tooltip content={sectionHelp.esgRiskAdjusted}>
                            <div className="relative h-[76px] w-[76px]">
                              <svg
                                viewBox="0 0 100 100"
                                className="absolute inset-0 -rotate-90"
                              >
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="42"
                                  fill="none"
                                  stroke="rgba(128,128,128,0.12)"
                                  strokeWidth="9"
                                />
                                <motion.circle
                                  cx="50"
                                  cy="50"
                                  r="42"
                                  fill="none"
                                  stroke={`url(#g-${supplierId})`}
                                  strokeWidth="9"
                                  strokeLinecap="round"
                                  strokeDasharray={2 * Math.PI * 42}
                                  initial={{
                                    strokeDashoffset: 2 * Math.PI * 42,
                                  }}
                                  animate={{
                                    strokeDashoffset:
                                      2 *
                                      Math.PI *
                                      42 *
                                      (1 - scorePercent / 100),
                                  }}
                                  transition={{
                                    duration: 0.9,
                                    ease: "easeOut",
                                  }}
                                />
                                <defs>
                                  <linearGradient
                                    id={`g-${supplierId}`}
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="0%"
                                  >
                                    <stop offset="0%" stopColor={scoreColor} />
                                    <stop
                                      offset="100%"
                                      stopColor={colors.primary}
                                    />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span
                                  className="text-[18px] font-bold font-mono leading-none"
                                  style={{
                                    color: scoreColor,
                                    letterSpacing: "-0.03em",
                                  }}
                                >
                                  {riskAdjustedScore !== null
                                    ? riskAdjustedScore.toFixed(0)
                                    : "—"}
                                </span>
                                <span
                                  className="text-[8px] font-semibold uppercase mt-0.5"
                                  style={{
                                    color: colors.textMuted,
                                    letterSpacing: "0.06em",
                                  }}
                                >
                                  /100
                                </span>
                              </div>
                            </div>
                          </Tooltip>

                          {/* E · S · G mini */}
                          <div className="flex items-center gap-3">
                            {[
                              {
                                key: "E",
                                val: supplier.environmental_score,
                                color: colors.primary,
                                tip: sectionHelp.pillarEnv,
                              },
                              {
                                key: "S",
                                val: supplier.social_score,
                                color: colors.accent,
                                tip: sectionHelp.pillarSoc,
                              },
                              {
                                key: "G",
                                val: supplier.governance_score,
                                color: colors.secondary,
                                tip: sectionHelp.pillarGov,
                              },
                            ].map((p) => (
                              <Tooltip key={p.key} content={p.tip}>
                                <div className="flex flex-col items-center cursor-help">
                                  <span
                                    className="text-[9px] font-bold uppercase leading-none"
                                    style={{
                                      color: colors.textMuted,
                                      letterSpacing: "0.07em",
                                    }}
                                  >
                                    {p.key}
                                  </span>
                                  <span
                                    className="text-[13px] font-bold font-mono leading-tight"
                                    style={{ color: p.color }}
                                  >
                                    {formatPillar(p.val)}
                                  </span>
                                </div>
                              </Tooltip>
                            ))}
                          </div>
                        </div>

                        {/* Right: rating + key stats */}
                        <div className="flex-1 min-w-0 w-full flex flex-col justify-center gap-2.5">
                          {/* Rating chip */}
                          <div className="flex items-center gap-2">
                            <Tooltip content={sectionHelp.rating}>
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase cursor-help"
                                style={{
                                  borderRadius: "4px",
                                  backgroundColor: scoreColor + "18",
                                  color: scoreColor,
                                  letterSpacing: "0.06em",
                                }}
                              >
                                <ScaleIcon className="h-3 w-3" />
                                {scorePerformanceLabel(riskAdjustedScore)}
                              </span>
                            </Tooltip>
                          </div>

                          {/* Stat rows */}
                          <div className="flex flex-col gap-1.5">
                            {[
                              {
                                label: "Composite (pre-risk)",
                                value:
                                  compositeScore !== null
                                    ? compositeScore.toFixed(1)
                                    : "N/A",
                                tooltip: sectionHelp.esgComposite,
                                color: colors.text,
                              },
                              {
                                label: "Coverage",
                                value:
                                  completenessRatio !== null
                                    ? formatPercent(completenessRatio, 0)
                                    : "N/A",
                                tooltip: sectionHelp.coverage,
                                color: colors.text,
                              },
                              {
                                label: "Risk Factor",
                                value: (() => {
                                  const r = computeRiskFactor(supplier);
                                  return r !== null ? fmtRiskFactor(r) : "N/A";
                                })(),
                                tooltip: sectionHelp.riskExposure,
                                color: riskColor,
                              },
                            ].map((stat) => (
                              <Tooltip key={stat.label} content={stat.tooltip}>
                                <div className="flex items-center justify-between gap-1 cursor-help">
                                  <span
                                    className="text-[10px] font-medium uppercase shrink-0"
                                    style={{
                                      color: colors.textMuted,
                                      letterSpacing: "0.07em",
                                    }}
                                  >
                                    {stat.label}
                                  </span>
                                  <span
                                    className="text-[13px] font-bold font-mono"
                                    style={{ color: stat.color }}
                                  >
                                    {stat.value}
                                  </span>
                                </div>
                              </Tooltip>
                            ))}
                          </div>

                          {/* Action Brief — premium recommendation block */}
                          <Tooltip content={recommendation.description}>
                            <div
                              className="mt-2 overflow-hidden rounded-md cursor-help"
                              style={{
                                border: `1px solid ${recommendation.color}25`,
                                background: `linear-gradient(135deg, ${recommendation.bgColor} 0%, rgba(0,0,0,0) 65%)`,
                              }}
                            >
                              <div className="flex items-stretch">
                                {/* Accent rail */}
                                <div
                                  className="w-[3px] shrink-0"
                                  style={{
                                    backgroundColor: recommendation.color,
                                  }}
                                />

                                <div className="px-3 py-2.5 flex-1 min-w-0">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2 min-w-0">
                                    <div className="min-w-0 flex-1">
                                      <div
                                        className="text-[10px] font-mono uppercase tracking-widest"
                                        style={{ color: colors.textMuted }}
                                      >
                                        Action brief
                                      </div>
                                      <div className="mt-0.5 flex items-center gap-2">
                                        <span
                                          className="inline-flex items-center justify-center h-6 w-6 rounded"
                                          style={{
                                            backgroundColor:
                                              recommendation.color + "18",
                                            border: `1px solid ${recommendation.color}30`,
                                            color: recommendation.color,
                                          }}
                                        >
                                          {recommendation.icon}
                                        </span>
                                        <div className="min-w-0">
                                          <div
                                            className="text-[12px] font-semibold leading-snug truncate"
                                            style={{ color: colors.text }}
                                          >
                                            {recommendation.label}
                                          </div>
                                          <div
                                            className="text-[11px] leading-snug line-clamp-2 sm:truncate break-words"
                                            style={{ color: colors.textMuted }}
                                          >
                                            {recommendation.description}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Micro CTA chips */}
                                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 w-full sm:w-auto sm:justify-end pt-1 sm:pt-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(
                                            `/suppliers/${supplierId}/assessment`,
                                          );
                                        }}
                                        className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest transition-opacity hover:opacity-80"
                                        style={{
                                          backgroundColor: colors.primary,
                                          color: "#0A0A0A",
                                        }}
                                      >
                                        Assess
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewDetails(supplierId);
                                        }}
                                        className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest transition-opacity hover:opacity-80"
                                        style={{
                                          backgroundColor: "transparent",
                                          border: `1px solid ${colors.accent}30`,
                                          color: colors.textMuted,
                                        }}
                                      >
                                        Profile
                                      </button>
                                    </div>
                                  </div>

                                  {/* Context line */}
                                  <div className="mt-2 flex flex-col gap-1 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between min-[400px]:gap-2">
                                    <span
                                      className="text-[10px] font-mono uppercase tracking-widest"
                                      style={{ color: colors.textMuted }}
                                    >
                                      {recommendation.type === "data"
                                        ? "Priority: unlock reliable scoring"
                                        : recommendation.type === "risk"
                                          ? "Priority: reduce disruption exposure"
                                          : recommendation.type === "stale"
                                            ? "Priority: refresh signal quality"
                                            : recommendation.type ===
                                                "recommended"
                                              ? "Priority: expand with confidence"
                                              : recommendation.type ===
                                                  "warning"
                                                ? "Priority: improvement plan"
                                                : "Priority: ongoing monitoring"}
                                    </span>
                                    <span
                                      className="text-[10px] font-mono"
                                      style={{ color: recommendation.color }}
                                    >
                                      {supplier.risk_level
                                        ? `${supplier.risk_level.toUpperCase()} RISK`
                                        : "RISK N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Tooltip>

                          {/* Last updated — small, at bottom */}
                          <Tooltip content={sectionHelp.lastUpdated}>
                            <div
                              className="flex items-center gap-1 cursor-help"
                              style={{ color: colors.textMuted }}
                            >
                              <ClockIcon className="h-3 w-3" />
                              <span className="text-[10px]">
                                {lastUpdatedBadge.label}
                              </span>
                            </div>
                          </Tooltip>
                        </div>
                      </div>

                      {/* ── FOOTER ACTIONS ─────────────────────────────── */}
                      <div
                        className="px-3 sm:px-4 py-3 flex flex-col sm:flex-row gap-2"
                        style={{
                          borderTop: "1px solid rgba(128,128,128,0.08)",
                        }}
                      >
                        <Tooltip
                          content={sectionHelp.quickView}
                          wrapperClassName="flex flex-1"
                        >
                          <button
                            onClick={() => handleQuickView(supplier)}
                            className="w-full flex items-center justify-center gap-1.5 text-[12px] py-2 font-medium transition-opacity hover:opacity-75"
                            style={{
                              borderRadius: "6px",
                              color: colors.primary,
                              border: `1px solid ${colors.primary}30`,
                              backgroundColor: colors.primary + "08",
                            }}
                          >
                            <EyeIcon className="h-3.5 w-3.5" /> Quick View
                          </button>
                        </Tooltip>
                        <Tooltip
                          content={sectionHelp.openProfile}
                          wrapperClassName="flex flex-[1.4]"
                        >
                          <button
                            onClick={() => handleViewDetails(supplierId)}
                            className="w-full flex items-center justify-center gap-1.5 text-[12px] py-2 font-semibold transition-opacity hover:opacity-88"
                            style={{
                              borderRadius: "6px",
                              background: "#C8F05A",
                              color: "#0A0A0A",
                            }}
                          >
                            Open Profile{" "}
                            <ArrowRightIcon className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                  <div
                    className="h-16 w-16 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(128,128,128,0.08)",
                      border: "1px solid rgba(128,128,128,0.12)",
                    }}
                  >
                    <MagnifyingGlassIcon
                      className="h-8 w-8"
                      style={{ color: colors.textMuted, opacity: 0.5 }}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: colors.text }}
                    >
                      No suppliers found
                    </p>
                    <p
                      className="text-[12px] mt-1"
                      style={{ color: colors.textMuted }}
                    >
                      Try adjusting your filters or search query
                    </p>
                  </div>
                  <button
                    onClick={resetFilters}
                    className="text-[12px] font-semibold px-4 py-2 rounded-md transition-opacity hover:opacity-80"
                    style={{
                      background: colors.primary + "18",
                      color: colors.primary,
                      border: `1px solid ${colors.primary}25`,
                    }}
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </motion.div>

            {/* Pagination Controls */}
            {filteredSuppliers.length > 0 && (
              <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                <div className="text-sm" style={{ color: colors.textMuted }}>
                  Showing {Math.min(itemsPerPage, filteredSuppliers.length)} of{" "}
                  {filteredSuppliers.length} suppliers
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md"
                    style={{
                      backgroundColor:
                        currentPage === 1 ? "transparent" : colors.panel,
                      color: currentPage === 1 ? colors.textMuted : colors.text,
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>

                  <div
                    className="px-4 py-1.5 rounded-md"
                    style={{ backgroundColor: colors.panel }}
                  >
                    <span style={{ color: colors.text }}>{currentPage}</span>
                    <span style={{ color: colors.textMuted }}>{" of "}</span>
                    <span style={{ color: colors.text }}>{totalPages}</span>
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md"
                    style={{
                      backgroundColor:
                        currentPage === totalPages
                          ? "transparent"
                          : colors.panel,
                      color:
                        currentPage === totalPages
                          ? colors.textMuted
                          : colors.text,
                      cursor:
                        currentPage === totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>

                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page when changing items per page
                    }}
                    className="sm:ml-4 py-1.5 pl-3 pr-8 rounded-md appearance-none text-sm"
                    style={{
                      backgroundColor: colors.panel,
                      color: colors.text,
                      border: `1px solid ${colors.accent}30`,
                    }}
                  >
                    <option value={9}>9 / page</option>
                    <option value={18}>18 / page</option>
                    <option value={27}>27 / page</option>
                    <option value={36}>36 / page</option>
                  </select>
                </div>
              </div>
            )}

            {/* Comparison Floating Panel */}
            <AnimatePresence>
              {selectedSuppliers.length > 0 && (
                <motion.div
                  className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-30 p-3 sm:p-4 rounded-xl shadow-xl border"
                  style={{
                    backgroundColor: colors.panel,
                    borderLeft: `4px solid ${colors.primary}`,
                    borderColor: colors.accent + "30",
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold flex items-center">
                      <Square2StackIcon
                        className="h-5 w-5 mr-2"
                        style={{ color: colors.primary }}
                      />
                      {selectedSuppliers.length}
                      <span className="ml-1">
                        {selectedSuppliers.length === 1
                          ? "supplier"
                          : "suppliers"}{" "}
                        selected
                      </span>
                    </h3>
                    <button
                      onClick={clearSelections}
                      className="p-1 rounded-full hover:bg-black/20"
                      title="Clear all"
                    >
                      <XMarkIcon
                        className="h-4 w-4"
                        style={{ color: colors.textMuted }}
                      />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={clearSelections}
                      className="flex-1 py-1.5 px-3 rounded text-sm"
                      style={{
                        backgroundColor: colors.panel,
                        border: `1px solid ${colors.accent}40`,
                        color: colors.textMuted,
                      }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={openComparison}
                      className="flex-1 py-1.5 px-3 rounded text-sm font-medium flex items-center justify-center"
                      style={{
                        backgroundColor:
                          selectedSuppliers.length >= 2
                            ? colors.primary
                            : colors.panel,
                        color:
                          selectedSuppliers.length >= 2
                            ? colors.background
                            : colors.textMuted,
                        opacity: selectedSuppliers.length >= 2 ? 1 : 0.5,
                      }}
                      disabled={selectedSuppliers.length < 2}
                    >
                      <Square2StackIcon className="h-4 w-4 mr-1.5" />
                      Compare
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comparison Modal */}
            <AnimatePresence>
              {showComparisonModal && selectedSuppliers.length >= 2 && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowComparisonModal(false)}
                >
                  <motion.div
                    className="relative w-full max-w-6xl rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.accent}30`,
                    }}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className="p-5 border-b flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
                      style={{ borderColor: colors.accent + "30" }}
                    >
                      <div>
                        <h2
                          className="text-2xl font-bold"
                          style={{ color: colors.text }}
                        >
                          Supplier Comparison
                        </h2>
                        <p
                          className="text-sm mt-1"
                          style={{ color: colors.textMuted }}
                        >
                          Comparing {selectedSuppliers.length} suppliers across
                          key ESG and operational metrics.
                        </p>
                        {topPerformer && (
                          <p
                            className="text-xs"
                            style={{ color: colors.primary }}
                          >
                            Top performer: {topPerformer.supplier.name} (
                            {topPerformer.score.toFixed(1)})
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={exportComparison}
                          className="px-3 py-2 rounded text-sm font-medium flex items-center"
                          style={{
                            backgroundColor: colors.accent,
                            color: colors.background,
                          }}
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          Export
                        </button>
                        <button
                          onClick={() => setShowComparisonModal(false)}
                          className="p-2 rounded-full hover:bg-white/10"
                          style={{ color: colors.textMuted }}
                          aria-label="Close comparison"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {selectedSuppliers.map((supplier) => {
                          const supplierId =
                            supplier._id || supplier.id || supplier.name;
                          const statusStyles = getStatusStyles(
                            colors,
                            supplier.status,
                          );
                          return (
                            <div
                              key={`summary-${supplierId}`}
                              className="p-4 rounded-lg border"
                              style={{
                                backgroundColor: colors.panel,
                                borderColor: colors.accent + "30",
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3
                                    className="text-lg font-semibold"
                                    style={{ color: colors.text }}
                                  >
                                    {supplier.name}
                                  </h3>
                                  <div
                                    className="text-xs flex flex-wrap gap-2 mt-2"
                                    style={{ color: colors.textMuted }}
                                  >
                                    {supplier.country && (
                                      <span className="flex items-center gap-1">
                                        <MapPinIcon className="h-3.5 w-3.5" />
                                        {supplier.country}
                                      </span>
                                    )}
                                    {supplier.industry && (
                                      <span className="flex items-center gap-1">
                                        <BuildingOfficeIcon className="h-3.5 w-3.5" />
                                        {supplier.industry}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span
                                  className="text-sm font-semibold"
                                  style={{ color: colors.primary }}
                                >
                                  {formatScoreValue(supplier.ethical_score)}
                                </span>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span
                                  className="px-2 py-1 rounded-full flex items-center"
                                  style={{
                                    backgroundColor:
                                      getRiskColor(
                                        colors,
                                        supplier.risk_level,
                                      ) + "20",
                                    color: getRiskColor(
                                      colors,
                                      supplier.risk_level,
                                    ),
                                    border: `1px solid ${getRiskColor(
                                      colors,
                                      supplier.risk_level,
                                    )}40`,
                                  }}
                                >
                                  {getRiskIcon(supplier.risk_level) && (
                                    <span className="mr-1">
                                      {getRiskIcon(supplier.risk_level)}
                                    </span>
                                  )}
                                  {supplier.risk_level || "No Risk Data"}
                                </span>
                                <span
                                  className="px-2 py-1 rounded-full flex items-center"
                                  style={{
                                    color: statusStyles.color,
                                    backgroundColor: statusStyles.bgColor,
                                    border: statusStyles.border,
                                  }}
                                >
                                  {statusStyles.icon}
                                  {supplier.status || "Unverified"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div
                        className="overflow-x-auto rounded-lg border"
                        style={{ borderColor: colors.accent + "30" }}
                      >
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr>
                              <th
                                className="px-4 py-3 text-left font-semibold"
                                style={{
                                  color: colors.textMuted,
                                  backgroundColor: colors.panel,
                                }}
                              >
                                Metric
                              </th>
                              {selectedSuppliers.map((supplier) => (
                                <th
                                  key={`metric-header-${
                                    supplier._id || supplier.id || supplier.name
                                  }`}
                                  className="px-4 py-3 text-left font-semibold"
                                  style={{
                                    color: colors.textMuted,
                                    backgroundColor: colors.panel,
                                  }}
                                >
                                  {supplier.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonMetrics.map((metric) => {
                              const normalizedValues = selectedSuppliers.map(
                                (supplier) =>
                                  metric.normalize(metric.getValue(supplier)),
                              );

                              const numericEntries = normalizedValues
                                .map((value, index) =>
                                  typeof value === "number" &&
                                  !Number.isNaN(value)
                                    ? { value, index }
                                    : null,
                                )
                                .filter(Boolean) as Array<{
                                value: number;
                                index: number;
                              }>;

                              let highlightIndex = -1;
                              if (numericEntries.length > 0) {
                                highlightIndex = metric.higherIsBetter
                                  ? numericEntries.reduce((best, current) =>
                                      current.value > best.value
                                        ? current
                                        : best,
                                    ).index
                                  : numericEntries.reduce((best, current) =>
                                      current.value < best.value
                                        ? current
                                        : best,
                                    ).index;
                              }

                              return (
                                <tr
                                  key={metric.key}
                                  className="border-t"
                                  style={{ borderColor: colors.accent + "20" }}
                                >
                                  <td
                                    className="px-4 py-3 font-medium"
                                    style={{ color: colors.text }}
                                  >
                                    {metric.label}
                                  </td>
                                  {selectedSuppliers.map((supplier, index) => {
                                    const value = metric.getValue(supplier);
                                    const isHighlighted =
                                      index === highlightIndex;
                                    return (
                                      <td
                                        key={`${metric.key}-${
                                          supplier._id ||
                                          supplier.id ||
                                          supplier.name
                                        }`}
                                        className="px-4 py-3"
                                        style={{
                                          color: isHighlighted
                                            ? colors.primary
                                            : colors.textMuted,
                                        }}
                                      >
                                        {metric.format(value)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedSuppliers.map((supplier) => (
                            <span
                              key={`tag-${supplier._id || supplier.id || supplier.name}`}
                              className="px-3 py-1 rounded-full text-xs"
                              style={{
                                backgroundColor: colors.panel,
                                color: colors.textMuted,
                                border: `1px solid ${colors.accent}30`,
                              }}
                            >
                              {supplier.name}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={clearSelections}
                            className="px-4 py-2 rounded text-sm"
                            style={{
                              backgroundColor: colors.panel,
                              color: colors.textMuted,
                              border: `1px solid ${colors.accent}30`,
                            }}
                          >
                            Clear Selection
                          </button>
                          <button
                            onClick={() => setShowComparisonModal(false)}
                            className="px-4 py-2 rounded text-sm font-medium"
                            style={{
                              backgroundColor: colors.primary,
                              color: colors.background,
                            }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Detailed View Modal */}
            <AnimatePresence>
              {showModal && selectedSupplier && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeModal}
                >
                  <motion.div
                    className="relative w-full max-w-4xl rounded-lg overflow-hidden"
                    style={{ backgroundColor: colors.background }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div
                      className="p-4 border-b flex justify-between items-center"
                      style={{ borderColor: colors.accent + "30" }}
                    >
                      <div>
                        <h2
                          className="text-xl font-bold"
                          style={{ color: colors.text }}
                        >
                          {selectedSupplier.name}

                          {/* AI Recommendation Tag in Modal */}
                          {(() => {
                            const rec = getRecommendation(
                              colors,
                              selectedSupplier,
                            );
                            return (
                              <Tooltip
                                content={rec.description}
                                wrapperClassName="ml-3 inline-flex"
                              >
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-help"
                                  style={{
                                    backgroundColor: rec.bgColor,
                                    color: rec.color,
                                    border: `1px solid ${rec.color}40`,
                                  }}
                                >
                                  {rec.icon}
                                  {rec.label}
                                </span>
                              </Tooltip>
                            );
                          })()}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span
                            className="text-sm flex items-center"
                            style={{ color: colors.textMuted }}
                          >
                            <MapPinIcon className="h-4 w-4 mr-1" />{" "}
                            {selectedSupplier.country || "N/A"}
                          </span>
                          <span
                            className="text-sm flex items-center"
                            style={{ color: colors.textMuted }}
                          >
                            <BuildingOfficeIcon className="h-4 w-4 mr-1" />{" "}
                            {selectedSupplier.industry || "N/A"}
                          </span>

                          {/* Status Indicator in Modal */}
                          <span
                            className="px-2 py-0.5 rounded-full flex items-center text-xs"
                            style={{
                              color: getStatusStyles(
                                colors,
                                selectedSupplier.status,
                              ).color,
                              backgroundColor: getStatusStyles(
                                colors,
                                selectedSupplier.status,
                              ).bgColor,
                              border: getStatusStyles(
                                colors,
                                selectedSupplier.status,
                              ).border,
                            }}
                          >
                            {
                              getStatusStyles(colors, selectedSupplier.status)
                                .icon
                            }
                            {selectedSupplier.status || "Unverified"}
                          </span>

                          {/* Last Updated in Modal */}
                          {(() => {
                            const badge = getLastUpdatedBadge(
                              colors,
                              (selectedSupplier as any).updated_at || (selectedSupplier as any).updatedAt || (selectedSupplier as any).last_updated,
                            );
                            return (
                              <Tooltip content={badge.tooltip}>
                                <span
                                  className="text-xs flex items-center px-2 py-1 rounded-full"
                                  style={badge.style}
                                >
                                  {badge.icon}
                                  {badge.label}
                                </span>
                              </Tooltip>
                            );
                          })()}
                        </div>
                      </div>
                      <button
                        onClick={closeModal}
                        className="p-1 rounded-full hover:bg-white/10"
                        style={{ color: colors.textMuted }}
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-4 max-h-[70vh] overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div
                          className="rounded-lg p-3"
                          style={{
                            backgroundColor: colors.panel,
                            border: `1px solid ${colors.primary}30`,
                          }}
                        >
                          <p
                            className="text-xs uppercase"
                            style={{ color: colors.textMuted }}
                          >
                            ESG Score (Risk-Adjusted)
                          </p>
                          <p
                            className="text-2xl font-semibold"
                            style={{ color: colors.text }}
                          >
                            {formatScoreValue(selectedSupplier.ethical_score)}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: colors.textMuted }}
                          >
                            Includes average risk penalty.
                          </p>
                        </div>
                        <div
                          className="rounded-lg p-3"
                          style={{
                            backgroundColor: colors.panel,
                            border: `1px solid ${colors.accent}30`,
                          }}
                        >
                          <p
                            className="text-xs uppercase"
                            style={{ color: colors.textMuted }}
                          >
                            Composite ESG Score (Pre-Risk)
                          </p>
                          <p
                            className="text-2xl font-semibold"
                            style={{ color: colors.text }}
                          >
                            {formatScoreValue(selectedSupplier.composite_score)}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: colors.textMuted }}
                          >
                            Weighted blend of Environmental, Social, Governance
                            pillars.
                          </p>
                        </div>
                        <div
                          className="rounded-lg p-3"
                          style={{
                            backgroundColor: colors.panel,
                            border: `1px solid ${colors.secondary}30`,
                          }}
                        >
                          <p
                            className="text-xs uppercase"
                            style={{ color: colors.textMuted }}
                          >
                            Data Completeness
                          </p>
                          <p
                            className="text-2xl font-semibold"
                            style={{ color: colors.text }}
                          >
                            {formatPercent(
                              selectedSupplier.completeness_ratio,
                              0,
                            )}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: colors.textMuted }}
                          >
                            Scores capped at 50 when disclosure &lt; 70%.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ESG Breakdown */}
                        <div
                          className="rounded-lg p-4"
                          style={{ backgroundColor: colors.panel }}
                        >
                          <h3
                            className="text-lg font-semibold mb-4 flex items-center justify-between"
                            style={{ color: colors.text }}
                          >
                            <span>ESG Breakdown</span>
                            <Tooltip content="Environmental, Social, and Governance (ESG) scores evaluate a supplier's sustainability and ethical business practices across three key dimensions.">
                              <InformationCircleIcon
                                className="h-5 w-5 opacity-70"
                                style={{ color: colors.primary }}
                              />
                            </Tooltip>
                          </h3>

                          <div className="space-y-4">
                            {/* Ethical Score with Tooltip */}
                            <div>
                              <div className="flex justify-between mb-1 items-center">
                                <span
                                  className="flex items-center"
                                  style={{ color: colors.textMuted }}
                                >
                                  Overall Ethical Score
                                  <Tooltip
                                    content={scoreExplanations.ethical_score}
                                  >
                                    <QuestionMarkCircleIcon className="h-3.5 w-3.5 ml-1 opacity-70" />
                                  </Tooltip>
                                </span>
                                <span
                                  className="font-bold"
                                  style={{
                                    color: scoreBandColor(
                                      colors,
                                      selectedSupplier.ethical_score,
                                    ),
                                  }}
                                >
                                  {selectedSupplier.ethical_score !== null &&
                                  selectedSupplier.ethical_score !== undefined
                                    ? selectedSupplier.ethical_score > 0 &&
                                      selectedSupplier.ethical_score <= 1
                                      ? (
                                          selectedSupplier.ethical_score * 100
                                        ).toFixed(1)
                                      : selectedSupplier.ethical_score.toFixed(
                                          1,
                                        )
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${
                                      selectedSupplier.ethical_score &&
                                      selectedSupplier.ethical_score <= 1
                                        ? selectedSupplier.ethical_score * 100
                                        : selectedSupplier.ethical_score || 0
                                    }%`,
                                    backgroundColor: scoreBandColor(
                                      colors,
                                      selectedSupplier.ethical_score,
                                    ),
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Environmental Score with Tooltip */}
                            <div>
                              <div className="flex justify-between mb-1 items-center">
                                <span
                                  className="flex items-center"
                                  style={{ color: colors.textMuted }}
                                >
                                  Environmental
                                  <Tooltip
                                    content={
                                      scoreExplanations.environmental_score
                                    }
                                  >
                                    <QuestionMarkCircleIcon className="h-3.5 w-3.5 ml-1 opacity-70" />
                                  </Tooltip>
                                </span>
                                <span
                                  className="font-bold"
                                  style={{ color: colors.primary }}
                                >
                                  {selectedSupplier.environmental_score !==
                                    null &&
                                  selectedSupplier.environmental_score !==
                                    undefined
                                    ? selectedSupplier.environmental_score >
                                        0 &&
                                      selectedSupplier.environmental_score <= 1
                                      ? (
                                          selectedSupplier.environmental_score *
                                          100
                                        ).toFixed(1)
                                      : selectedSupplier.environmental_score.toFixed(
                                          1,
                                        )
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${
                                      selectedSupplier.environmental_score &&
                                      selectedSupplier.environmental_score <= 1
                                        ? selectedSupplier.environmental_score *
                                          100
                                        : selectedSupplier.environmental_score ||
                                          0
                                    }%`,
                                    backgroundColor: colors.primary,
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Social Score with Tooltip */}
                            <div>
                              <div className="flex justify-between mb-1 items-center">
                                <span
                                  className="flex items-center"
                                  style={{ color: colors.textMuted }}
                                >
                                  Social
                                  <Tooltip
                                    content={scoreExplanations.social_score}
                                  >
                                    <QuestionMarkCircleIcon className="h-3.5 w-3.5 ml-1 opacity-70" />
                                  </Tooltip>
                                </span>
                                <span
                                  className="font-bold"
                                  style={{ color: colors.accent }}
                                >
                                  {selectedSupplier.social_score !== null &&
                                  selectedSupplier.social_score !== undefined
                                    ? selectedSupplier.social_score > 0 &&
                                      selectedSupplier.social_score <= 1
                                      ? (
                                          selectedSupplier.social_score * 100
                                        ).toFixed(1)
                                      : selectedSupplier.social_score.toFixed(1)
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${
                                      selectedSupplier.social_score &&
                                      selectedSupplier.social_score <= 1
                                        ? selectedSupplier.social_score * 100
                                        : selectedSupplier.social_score || 0
                                    }%`,
                                    backgroundColor: colors.accent,
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Governance Score with Tooltip */}
                            <div>
                              <div className="flex justify-between mb-1 items-center">
                                <span
                                  className="flex items-center"
                                  style={{ color: colors.textMuted }}
                                >
                                  Governance
                                  <Tooltip
                                    content={scoreExplanations.governance_score}
                                  >
                                    <QuestionMarkCircleIcon className="h-3.5 w-3.5 ml-1 opacity-70" />
                                  </Tooltip>
                                </span>
                                <span
                                  className="font-bold"
                                  style={{ color: colors.secondary }}
                                >
                                  {selectedSupplier.governance_score !== null &&
                                  selectedSupplier.governance_score !==
                                    undefined
                                    ? selectedSupplier.governance_score > 0 &&
                                      selectedSupplier.governance_score <= 1
                                      ? (
                                          selectedSupplier.governance_score *
                                          100
                                        ).toFixed(1)
                                      : selectedSupplier.governance_score.toFixed(
                                          1,
                                        )
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${
                                      selectedSupplier.governance_score &&
                                      selectedSupplier.governance_score <= 1
                                        ? selectedSupplier.governance_score *
                                          100
                                        : selectedSupplier.governance_score || 0
                                    }%`,
                                    backgroundColor: colors.secondary,
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Risk Level with Tooltip */}
                            <div className="flex justify-between mt-6 items-center">
                              <span
                                className="flex items-center"
                                style={{ color: colors.textMuted }}
                              >
                                Risk Level
                                <Tooltip
                                  content={
                                    selectedSupplier.risk_level
                                      ? scoreExplanations.risk_levels[
                                          selectedSupplier.risk_level.toLowerCase()
                                        ]
                                      : "Risk level not available"
                                  }
                                >
                                  <QuestionMarkCircleIcon className="h-3.5 w-3.5 ml-1 opacity-70" />
                                </Tooltip>
                              </span>
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {getRiskIcon(selectedSupplier.risk_level)}
                                </span>
                                <span
                                  className="px-3 py-1 rounded text-xs font-medium capitalize flex items-center"
                                  style={{
                                    backgroundColor:
                                      getRiskColor(
                                        colors,
                                        selectedSupplier.risk_level,
                                      ) + "20",
                                    color: getRiskColor(
                                      colors,
                                      selectedSupplier.risk_level,
                                    ),
                                    border: `1px solid ${getRiskColor(
                                      colors,
                                      selectedSupplier.risk_level,
                                    )}40`,
                                  }}
                                >
                                  {selectedSupplier.risk_level || "No Data"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Controversies */}
                        <div
                          className="rounded-lg p-4"
                          style={{ backgroundColor: colors.panel }}
                        >
                          <h3
                            className="text-lg font-semibold mb-4"
                            style={{ color: colors.text }}
                          >
                            <BellAlertIcon
                              className="h-5 w-5 inline mr-2"
                              style={{ color: colors.error }}
                            />
                            Controversies
                          </h3>

                          {((selectedSupplier as any).controversies?.length > 0) ? (
                            <div className="space-y-3">
                              {((selectedSupplier as any).controversies as any[]).map((controversy: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-3 rounded-md border"
                                  style={{
                                    borderColor:
                                      controversy.severity === "high"
                                        ? colors.error + "40"
                                        : controversy.severity === "medium"
                                          ? colors.warning + "40"
                                          : colors.accent + "40",
                                    backgroundColor:
                                      controversy.severity === "high"
                                        ? colors.error + "10"
                                        : controversy.severity === "medium"
                                          ? colors.warning + "10"
                                          : colors.accent + "10",
                                  }}
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <h4
                                      className="font-medium"
                                      style={{ color: colors.text }}
                                    >
                                      {controversy.title}
                                    </h4>
                                    <div
                                      className="px-2 py-0.5 rounded text-xs font-medium capitalize"
                                      style={{
                                        backgroundColor:
                                          controversy.severity === "high"
                                            ? colors.error
                                            : controversy.severity === "medium"
                                              ? colors.warning
                                              : colors.accent,
                                        color: colors.background,
                                      }}
                                    >
                                      {controversy.severity}
                                    </div>
                                  </div>
                                  <p
                                    className="text-sm mb-2"
                                    style={{ color: colors.textMuted }}
                                  >
                                    {controversy.description}
                                  </p>
                                  <div className="flex justify-between text-xs">
                                    <span style={{ color: colors.textMuted }}>
                                      <ClockIcon className="h-3.5 w-3.5 inline mr-1" />
                                      {controversy.date}
                                    </span>
                                    <span
                                      style={{
                                        color: controversy.resolved
                                          ? colors.success
                                          : colors.warning,
                                      }}
                                    >
                                      {controversy.resolved
                                        ? "Resolved"
                                        : "Active"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div
                              className="text-center py-4"
                              style={{ color: colors.textMuted }}
                            >
                              No controversies reported
                            </div>
                          )}
                        </div>

                        {/* Score History */}
                        <div
                          className="rounded-lg p-4"
                          style={{ backgroundColor: colors.panel }}
                        >
                          <h3
                            className="text-lg font-semibold mb-4"
                            style={{ color: colors.text }}
                          >
                            <ClockIcon
                              className="h-5 w-5 inline mr-2"
                              style={{ color: colors.text }}
                            />
                            Score History
                          </h3>

                          {(() => {
                            const score = (selectedSupplier as any).finalScore ?? selectedSupplier.composite_score ?? selectedSupplier.ethical_score;
                            const displayScore = score != null ? (score > 0 && score <= 1 ? score * 100 : score) : null;
                            const updatedAt = (selectedSupplier as any).updated_at || (selectedSupplier as any).updatedAt;
                            if (displayScore == null) {
                              return (
                                <div className="text-center py-4" style={{ color: colors.textMuted }}>
                                  <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                  <p className="text-sm">No score history available yet.</p>
                                  <p className="text-xs mt-1">Run an assessment to start tracking.</p>
                                </div>
                              );
                            }
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: colors.accent + "20" }}>
                                  <div className="flex items-center gap-3">
                                    <ArrowTrendingUpIcon className="h-5 w-5" style={{ color: colors.success }} />
                                    <div>
                                      <div className="text-sm font-medium" style={{ color: colors.text }}>{displayScore.toFixed(1)}</div>
                                      <div className="text-xs" style={{ color: colors.textMuted }}>
                                        {updatedAt ? new Date(updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Latest score"}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: colors.accent + "30", color: colors.accent }}>Current</span>
                                </div>
                                <p className="text-xs text-center pt-1" style={{ color: colors.textMuted }}>
                                  Historical tracking available after multiple assessments.
                                </p>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Suggested Actions */}
                        <div
                          className="rounded-lg p-4"
                          style={{ backgroundColor: colors.panel }}
                        >
                          <h3
                            className="text-lg font-semibold mb-4"
                            style={{ color: colors.text }}
                          >
                            Suggested Actions
                          </h3>

                          <div className="space-y-3">
                            {getSupplierActions(selectedSupplier).map((action, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-md border"
                                style={{
                                  borderColor:
                                    action.priority === "high"
                                      ? colors.error + "40"
                                      : action.priority === "medium"
                                        ? colors.warning + "40"
                                        : colors.accent + "40",
                                  backgroundColor: colors.background + "50",
                                }}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <h4
                                    className="font-medium"
                                    style={{ color: colors.text }}
                                  >
                                    {action.action}
                                  </h4>
                                  <div
                                    className="px-2 py-0.5 rounded text-xs font-medium capitalize"
                                    style={{
                                      backgroundColor:
                                        action.priority === "high"
                                          ? colors.error
                                          : action.priority === "medium"
                                            ? colors.warning
                                            : colors.accent,
                                      color: colors.background,
                                    }}
                                  >
                                    {action.priority} priority
                                  </div>
                                </div>
                                <div
                                  className="text-xs"
                                  style={{ color: colors.textMuted }}
                                >
                                  <ClockIcon className="h-3.5 w-3.5 inline mr-1" />
                                  Timeframe: {action.timeframe}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div
                      className="p-4 border-t flex justify-between items-center gap-3 sticky bottom-0"
                      style={{
                        borderColor: colors.accent + "30",
                        backgroundColor: colors.background,
                      }}
                    >
                      <button
                        onClick={closeModal}
                        className="px-4 py-2 rounded text-sm"
                        style={{
                          backgroundColor: colors.panel,
                          color: colors.textMuted,
                        }}
                      >
                        Close
                      </button>
                      <Link
                        to={`/suppliers/${(selectedSupplier as any)._id || (selectedSupplier as any).id}`}
                        onClick={closeModal}
                        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-85"
                        style={{ backgroundColor: colors.primary, color: "#0A0A0A" }}
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        View Full Profile
                      </Link>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default SuppliersList;
