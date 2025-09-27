import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getSuppliers, Supplier } from "../services/api"; // Corrected path
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
  ClockIcon as ClockIconSolid,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon as CheckBadgeSolid } from "@heroicons/react/24/solid";
import { useThemeColors } from "../theme/useThemeColors";

const LoadingIndicator = () => {
  const colors = useThemeColors();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]" style={{ backgroundColor: colors.background }}>
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
    <div className="flex items-center justify-center min-h-[60vh]" style={{ backgroundColor: colors.background }}>
      <div className="bg-red-900/50 border border-red-500 p-6 rounded-lg text-center max-w-md">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4" style={{ color: colors.error }} />
        <h3 className="text-xl font-semibold mb-2" style={{ color: colors.error }}>
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
      return "🟢"; // Green circle
    case "medium":
      return "🟡"; // Yellow circle
    case "high":
      return "🔶"; // Orange diamond
    case "critical":
      return "🔴"; // Red circle
    default:
      return "⚪"; // White circle
  }
};

const getScoreColor = (colors: any, score: number | null | undefined) => {
  if (score === null || score === undefined) return colors.textMuted;
  const normalizedScore = score > 0 && score <= 1 ? score * 100 : score;
  if (normalizedScore >= 80) return colors.success;
  if (normalizedScore >= 60) return colors.primary;
  if (normalizedScore >= 40) return colors.warning;
  return colors.error;
};

const normalizeScoreTo100 = (score: number | null | undefined) => {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return null;
  }
  return score > 0 && score <= 1 ? score * 100 : score;
};

const formatScoreValue = (score: number | null | undefined, digits = 1) => {
  const normalized = normalizeScoreTo100(score);
  return normalized === null ? "N/A" : normalized.toFixed(digits);
};

const formatNumericValue = (
  value: number | null | undefined,
  digits = 2
) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return value.toFixed(digits);
};

const formatPercent = (
  value: number | null | undefined,
  digits = 0
) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return `${(value * 100).toFixed(digits)}%`;
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
  header:
    "Supplier identity and profile basics: name, country, and industry.",
  statusBar:
    "Operational status, risk penalty from risk factor, and data completeness. High risk penalty lowers final score.",
  esgRiskAdjusted:
    "Final ESG score after risk adjustment and completeness cap. Range 0–100 (higher is better).",
  esgComposite:
    "Composite ESG score before risk penalties. Weighted by E(40%), S(30%), G(30%).",
  riskExposure:
    "Overall risk level estimated from controversies, region, compliance, and sector profile.",
  pillarEnv:
    "Environmental performance including emissions intensity, waste, water, and energy efficiency.",
  pillarSoc:
    "Social performance including safety, wages, human rights, and DEI.",
  pillarGov:
    "Governance performance including anti-corruption, transparency, and board practices.",
  lastUpdated:
    "Timestamp of the latest data sync or assessment captured for this supplier.",
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
        bgColor: colors.panel,
        icon: <InformationCircleIcon className="h-4 w-4 mr-1" />,
        border: `1px solid ${colors.accent}30`,
      };
  }
};

// Helper to determine AI recommendation
const getRecommendation = (colors: any, supplier: Supplier) => {
  const ethicalScore = supplier.ethical_score || 0;
  const riskLevel = supplier.risk_level?.toLowerCase() || "";

  if (
    ethicalScore > 75 ||
    (ethicalScore > 0 && ethicalScore <= 1 && ethicalScore > 0.75)
  ) {
    return {
      type: "recommended",
      icon: <CheckBadgeSolid className="h-4 w-4 mr-1" />,
      label: "Recommended",
      color: colors.success,
      bgColor: colors.success + "15",
      description: "This supplier meets OptiSupply's high ethical standards",
    };
  } else if (
    riskLevel === "high" ||
    riskLevel === "critical" ||
    ethicalScore < 40 ||
    (ethicalScore > 0 && ethicalScore <= 1 && ethicalScore < 0.4)
  ) {
    return {
      type: "warning",
      icon: <ExclamationCircleIcon className="h-4 w-4 mr-1" />,
      label: "High ESG Risk",
      color: colors.error,
      bgColor: colors.error + "15",
      description:
        "This supplier has significant ESG concerns that require attention",
    };
  }

  return null;
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

// Tooltip component
const Tooltip = ({ children, content, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  const colors = useThemeColors() as any;

  // Define positions - offset tooltips to prevent overlaps
  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  // Adjust position if tooltip would go off-screen
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();

      // Check if tooltip is going off-screen
      const isOffScreenRight = rect.right > window.innerWidth;
      const isOffScreenLeft = rect.left < 0;
      const isOffScreenTop = rect.top < 0;
      const isOffScreenBottom = rect.bottom > window.innerHeight;

      // Apply adjustments as needed
      if (isOffScreenRight) {
        tooltip.style.left = "auto";
        tooltip.style.right = "0";
        tooltip.style.transform = "translateY(-50%)";
      }

      if (isOffScreenLeft) {
        tooltip.style.left = "0";
        tooltip.style.right = "auto";
        tooltip.style.transform = "translateY(-50%)";
      }

      if (isOffScreenTop) {
        tooltip.style.top = "100%";
        tooltip.style.bottom = "auto";
        tooltip.style.marginTop = "8px";
        tooltip.style.marginBottom = "0";
      }

      if (isOffScreenBottom) {
        tooltip.style.bottom = "100%";
        tooltip.style.top = "auto";
        tooltip.style.marginBottom = "8px";
        tooltip.style.marginTop = "0";
      }
    }
  }, [isVisible]);

  return (
    <div className="relative inline-flex z-0">
      <div
        ref={triggerRef}
        className="cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-60 p-3 rounded-md shadow-lg pointer-events-none ${positionClasses[position]}`}
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "50",
              maxWidth: "90vw",
              boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.5)`,
            }}
          >
            <div
              className="text-xs leading-tight"
              style={{ color: colors.text }}
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SuppliersList Component ---

const SuppliersList = () => {
  const colors = useThemeColors() as any;
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
    null
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
          }`
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
    [suppliers]
  );
  const industries = useMemo(
    () => [...new Set(suppliers.map((s) => s.industry).filter(Boolean))],
    [suppliers]
  );
  const riskLevels = useMemo(
    () => [
      ...new Set(
        suppliers
          .map((s) => s.risk_level)
          .filter(Boolean)
          .map((r) => r.toLowerCase())
      ),
    ],
    [suppliers]
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
    onChange: (value: [number, number]) => void
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

  // Mock data for the modal
  const mockScoreHistory = [
    { date: "2023-04-15", score: 68.4, change: +2.3 },
    { date: "2023-07-22", score: 72.9, change: +4.5 },
    { date: "2023-10-10", score: 69.8, change: -3.1 },
    { date: "2024-01-05", score: 74.2, change: +4.4 },
    { date: "2024-04-01", score: 76.5, change: +2.3 },
  ];

  const mockControversies = [
    {
      date: "2023-09-18",
      title: "Supply Chain Labor Concerns",
      severity: "medium",
      resolved: true,
      description:
        "Reports of labor standard violations at tier 2 supplier factories.",
    },
    {
      date: "2024-02-14",
      title: "Environmental Compliance Issue",
      severity: "high",
      resolved: false,
      description:
        "Regulatory non-compliance with wastewater treatment requirements discovered during audit.",
    },
  ];

  const mockActions = [
    {
      action: "Schedule Compliance Review",
      priority: "high",
      timeframe: "1-2 weeks",
    },
    {
      action: "Request Updated ESG Documentation",
      priority: "medium",
      timeframe: "1 month",
    },
    { action: "Monitor News Coverage", priority: "low", timeframe: "Ongoing" },
  ];

  // Format supplier data for export
  const formatSuppliersForExport = (suppliers: Supplier[]) => {
    return suppliers.map((supplier) => ({
      "Supplier Name": supplier.name || "N/A",
      Country: supplier.country || "N/A",
      Industry: supplier.industry || "N/A",
      "Risk Level": supplier.risk_level || "N/A",
      "Ethical Score":
        supplier.ethical_score !== null && supplier.ethical_score !== undefined
          ? supplier.ethical_score > 0 && supplier.ethical_score <= 1
            ? (supplier.ethical_score * 100).toFixed(1)
            : supplier.ethical_score.toFixed(1)
          : "N/A",
      "Environmental Score":
        supplier.environmental_score !== null &&
        supplier.environmental_score !== undefined
          ? supplier.environmental_score > 0 &&
            supplier.environmental_score <= 1
            ? (supplier.environmental_score * 100).toFixed(1)
            : supplier.environmental_score.toFixed(1)
          : "N/A",
      "Social Score":
        supplier.social_score !== null && supplier.social_score !== undefined
          ? supplier.social_score > 0 && supplier.social_score <= 1
            ? (supplier.social_score * 100).toFixed(1)
            : supplier.social_score.toFixed(1)
          : "N/A",
      "Governance Score":
        supplier.governance_score !== null &&
        supplier.governance_score !== undefined
          ? supplier.governance_score > 0 && supplier.governance_score <= 1
            ? (supplier.governance_score * 100).toFixed(1)
            : supplier.governance_score.toFixed(1)
          : "N/A",
      "CO2 Emissions":
        supplier.co2_emissions !== null && supplier.co2_emissions !== undefined
          ? supplier.co2_emissions.toFixed(2)
          : "N/A",
      "Delivery Efficiency":
        supplier.delivery_efficiency !== null &&
        supplier.delivery_efficiency !== undefined
          ? supplier.delivery_efficiency.toFixed(2)
          : "N/A",
      Status: supplier.status || "N/A",
      "Last Updated": supplier.last_updated || "N/A",
    }));
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
        `suppliers_export_${new Date().toISOString().split("T")[0]}.csv`
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
        `suppliers_export_${new Date().toISOString().split("T")[0]}.xlsx`
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
        headers.map((header) => row[header])
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
        `suppliers_export_${new Date().toISOString().split("T")[0]}.pdf`
      );

      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export to PDF. Please try again.");
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
        ["Metric", ...selectedSuppliers.map((s) => s.name || "Unnamed Supplier")],
        [
          "Country",
          ...selectedSuppliers.map((s) => s.country || "N/A"),
        ],
        [
          "Industry",
          ...selectedSuppliers.map((s) => s.industry || "N/A"),
        ],
        [
          "Ethical Score",
          ...selectedSuppliers.map((s) => formatScoreValue(s.ethical_score)),
        ],
        [
          "Environmental Score",
          ...selectedSuppliers.map((s) =>
            formatScoreValue(s.environmental_score)
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
          ...selectedSuppliers.map((s) => formatScoreValue(s.delivery_efficiency)),
        ],
        [
          "Wage Fairness",
          ...selectedSuppliers.map((s) => formatScoreValue(s.wage_fairness)),
        ],
        [
          "Human Rights Index",
          ...selectedSuppliers.map((s) => formatScoreValue(s.human_rights_index)),
        ],
        [
          "Waste Management",
          ...selectedSuppliers.map((s) => formatScoreValue(s.waste_management_score)),
        ],
        [
          "CO₂ Emissions (t)",
          ...selectedSuppliers.map((s) => formatNumericValue(s.co2_emissions)),
        ],
        [
          "Risk Level",
          ...selectedSuppliers.map((s) => s.risk_level || "N/A"),
        ],
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
        `supplier_comparison_${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      console.error("Error exporting comparison:", error);
      alert("Failed to export the comparison. Please try again.");
    }
  };

  const comparisonMetrics = useMemo(
    () =>
      [
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
    []
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
          (s._id && s._id === supplier._id) || (s.id && s.id === supplier.id)
      );

      if (isSelected) {
        // Remove from selection
        return prev.filter(
          (s) =>
            !(
              (s._id && s._id === supplier._id) ||
              (s.id && s.id === supplier.id)
            )
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
      (s) => (s._id && s._id === supplier._id) || (s.id && s.id === supplier.id)
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
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* Header and Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Supplier <span style={{ color: colors.primary }}>Registry</span>
          </h1>
          <div className="flex space-x-2">
            {/* Export Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                style={{
                  backgroundColor: showExportMenu
                    ? colors.primary
                    : colors.panel,
                  color: showExportMenu ? colors.background : colors.textMuted,
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
                    className="absolute right-0 mt-2 z-10 w-48 rounded-md shadow-lg"
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
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
              {getFilterButtonLabel()}
            </motion.button>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/suppliers/add"
                className="flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                style={{
                  backgroundColor: colors.accent,
                  color: colors.background,
                }}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Register New Supplier
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
              className="p-4 rounded-md mb-4"
              style={{ backgroundColor: colors.panel }}
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
                setEnvironmentalFilter
              )}
              {renderScoreSlider("Social Score", socialFilter, setSocialFilter)}
              {renderScoreSlider(
                "Governance Score",
                governanceFilter,
                setGovernanceFilter
              )}

              <div className="mt-2 text-xs" style={{ color: colors.textMuted }}>
                Showing {filteredSuppliers.length} of {suppliers.length}{" "}
                suppliers
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Sorting Controls */}
      <div
        className="mb-6 p-4 rounded-md"
        style={{ backgroundColor: colors.panel }}
      >
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm mr-2" style={{ color: colors.textMuted }}>
            Sort by:
          </span>

          <button
            onClick={() => handleSort("name")}
            className={`flex items-center px-3 py-1.5 text-xs rounded-md ${
              sortField === "name" ? "font-medium" : ""
            }`}
            style={{
              backgroundColor:
                sortField === "name"
                  ? colors.accent + "30"
                  : colors.background + "50",
              color: sortField === "name" ? colors.text : colors.textMuted,
            }}
          >
            Name <SortIcon field="name" />
          </button>

          <button
            onClick={() => handleSort("ethical_score")}
            className={`flex items-center px-3 py-1.5 text-xs rounded-md ${
              sortField === "ethical_score" ? "font-medium" : ""
            }`}
            style={{
              backgroundColor:
                sortField === "ethical_score"
                  ? colors.accent + "30"
                  : colors.background + "50",
              color:
                sortField === "ethical_score" ? colors.text : colors.textMuted,
            }}
          >
            Ethical Score <SortIcon field="ethical_score" />
          </button>

          <button
            onClick={() => handleSort("environmental_score")}
            className={`flex items-center px-3 py-1.5 text-xs rounded-md ${
              sortField === "environmental_score" ? "font-medium" : ""
            }`}
            style={{
              backgroundColor:
                sortField === "environmental_score"
                  ? colors.accent + "30"
                  : colors.background + "50",
              color:
                sortField === "environmental_score"
                  ? colors.text
                  : colors.textMuted,
            }}
          >
            Environmental <SortIcon field="environmental_score" />
          </button>

          <button
            onClick={() => handleSort("social_score")}
            className={`flex items-center px-3 py-1.5 text-xs rounded-md ${
              sortField === "social_score" ? "font-medium" : ""
            }`}
            style={{
              backgroundColor:
                sortField === "social_score"
                  ? colors.accent + "30"
                  : colors.background + "50",
              color:
                sortField === "social_score" ? colors.text : colors.textMuted,
            }}
          >
            Social <SortIcon field="social_score" />
          </button>

          <button
            onClick={() => handleSort("governance_score")}
            className={`flex items-center px-3 py-1.5 text-xs rounded-md ${
              sortField === "governance_score" ? "font-medium" : ""
            }`}
            style={{
              backgroundColor:
                sortField === "governance_score"
                  ? colors.accent + "30"
                  : colors.background + "50",
              color:
                sortField === "governance_score"
                  ? colors.text
                  : colors.textMuted,
            }}
          >
            Governance <SortIcon field="governance_score" />
          </button>

          <button
            onClick={() => handleSort("risk_level")}
            className={`flex items-center px-3 py-1.5 text-xs rounded-md ${
              sortField === "risk_level" ? "font-medium" : ""
            }`}
            style={{
              backgroundColor:
                sortField === "risk_level"
                  ? colors.accent + "30"
                  : colors.background + "50",
              color:
                sortField === "risk_level" ? colors.text : colors.textMuted,
            }}
          >
            Risk Level <SortIcon field="risk_level" />
          </button>
        </div>
      </div>

      {/* Supplier List/Grid */}
      {loading && <LoadingIndicator />}
      {error && !loading && <ErrorDisplay message={error} />}
      {!loading && !error && (
        <>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {sortedAndPaginatedSuppliers.length > 0 ? (
              sortedAndPaginatedSuppliers.map((supplier) => {
                const riskColor = getRiskColor(colors, supplier.risk_level);
                const riskIcon = getRiskIcon(supplier.risk_level);
                const scoreColor = getScoreColor(colors, supplier.ethical_score);
                const riskAdjustedScore =
                  supplier.ethical_score !== null &&
                  supplier.ethical_score !== undefined
                    ? supplier.ethical_score
                    : null;
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
                const lastUpdatedBadge = getLastUpdatedBadge(colors, supplier.last_updated);

                return (
                  <motion.div
                    key={supplierId}
                    variants={itemVariants}
                    className={`rounded-lg border backdrop-blur-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 relative ${
                      isSelected ? "ring-2 ring-offset-2" : ""
                    }`}
                    style={{
                      backgroundColor: colors.panel,
                      borderColor: colors.accent + "40",
                      ...(isSelected && { ringColor: colors.primary }),
                    }}
                    whileHover={{ y: -5, borderColor: colors.primary }}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => toggleSupplierSelection(supplier)}
                        className="p-1 rounded-full transition-colors"
                        style={{
                          backgroundColor: isSelected
                            ? colors.primary + "20"
                            : "transparent",
                        }}
                      >
                        {isSelected ? (
                          <CheckCircleIcon
                            className="h-6 w-6"
                            style={{ color: colors.primary }}
                          />
                        ) : (
                          <Square2StackIcon
                            className="h-5 w-5"
                            style={{ color: colors.textMuted }}
                          />
                        )}
                      </button>
                    </div>

                    {/* Card Header */}
                    <div
                      className="p-4 border-b"
                      style={{ borderColor: colors.accent + "30" }}
                    >
                      <Tooltip content={sectionHelp.header}>
                        <div>
                          <h2
                            className="text-lg font-semibold truncate pr-6"
                            style={{ color: colors.text }}
                          >
                            {supplier.name}
                          </h2>
                          <div
                            className="flex items-center text-xs mt-1"
                            style={{ color: colors.textMuted }}
                          >
                            <MapPinIcon className="h-3 w-3 mr-1" />{" "}
                            {supplier.country || "N/A"}
                            <span className="mx-2">|</span>
                            <BuildingOfficeIcon className="h-3 w-3 mr-1" />{" "}
                            {supplier.industry || "N/A"}
                          </div>
                        </div>
                      </Tooltip>

                      {/* Status and Recommendation Row */}
                      <Tooltip content={sectionHelp.statusBar}>
                        <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Status Indicator */}
                          <span
                            className="px-2 py-0.5 rounded-full flex items-center text-xs"
                            style={{
                              color: statusStyles.color,
                              backgroundColor: statusStyles.bgColor,
                              border: statusStyles.border,
                            }}
                          >
                            {statusStyles.icon}
                            {supplier.status || "Status Unknown"}
                          </span>

                          {typeof supplier.risk_factor === "number" && (
                            <span
                              className="px-2 py-0.5 rounded-full flex items-center text-xs"
                              style={{
                                color: riskColor,
                                backgroundColor: riskColor + "20",
                                border: `1px solid ${riskColor}40`,
                              }}
                            >
                              {riskIcon}
                              Risk Penalty {formatPercent(supplier.risk_factor, 0)}
                            </span>
                          )}

                          {typeof supplier.completeness_ratio === "number" && (
                            <span
                              className="px-2 py-0.5 rounded-full flex items-center text-xs"
                              style={{
                                color: colors.primary,
                                backgroundColor: colors.primary + "20",
                                border: `1px solid ${colors.primary}40`,
                              }}
                            >
                              <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                              Data Complete {formatPercent(supplier.completeness_ratio, 0)}
                            </span>
                          )}
                        </div>

                        {/* AI Recommendation Tag (if applicable) */}
                        {recommendation && (
                          <Tooltip content={recommendation.description}>
                            <div
                              className="flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: recommendation.bgColor,
                                color: recommendation.color,
                                border: `1px solid ${recommendation.color}40`,
                              }}
                            >
                              {recommendation.icon}
                              {recommendation.label}
                            </div>
                          </Tooltip>
                        )}
                        </div>
                      </Tooltip>
                    </div>

                    {/* Card Body - Key Metrics */}
                    <div className="p-4 flex-grow space-y-3">
                      <Tooltip content={sectionHelp.esgRiskAdjusted}>
                        <div className="flex items-center justify-between">
                          <span
                            className="text-sm flex items-center"
                            style={{ color: colors.textMuted }}
                          >
                            <ScaleIcon className="h-4 w-4 mr-2" /> ESG Score (Risk-Adjusted)
                            <QuestionMarkCircleIcon className="h-3.5 w-3.5 ml-1 opacity-70" />
                          </span>
                          <span
                            className="text-lg font-bold font-mono"
                            style={{ color: scoreColor }}
                          >
                            {riskAdjustedScore !== null
                              ? riskAdjustedScore.toFixed(1)
                              : "N/A"}
                          </span>
                        </div>
                      </Tooltip>
                      <Tooltip content={sectionHelp.esgComposite}>
                        <div className="flex items-center justify-between text-xs" style={{ color: colors.textMuted }}>
                          <span>Composite ESG Score (pre-risk)</span>
                          <span style={{ color: colors.text }}>
                            {compositeScore !== null
                              ? compositeScore.toFixed(1)
                              : "N/A"}
                          </span>
                        </div>
                      </Tooltip>
                      <div className="flex items-center justify-between text-xs" style={{ color: colors.textMuted }}>
                        <span>Risk Penalty Applied</span>
                        <span style={{ color: colors.text }}>
                          {typeof supplier.risk_factor === "number"
                            ? formatPercent(supplier.risk_factor, 0)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ color: colors.textMuted }}>
                        <span>Disclosure Completeness</span>
                        <span style={{ color: colors.text }}>
                          {completenessRatio !== null
                            ? formatPercent(completenessRatio, 0)
                            : "N/A"}
                        </span>
                      </div>
                      <Tooltip content={sectionHelp.riskExposure}>
                        <div className="flex items-center justify-between">
                          <span
                            className="text-sm flex items-center"
                            style={{ color: colors.textMuted }}
                          >
                            <ShieldExclamationIcon className="h-4 w-4 mr-2" />{" "}
                            Risk Level
                            <QuestionMarkCircleIcon className="h-3.5 w-3.5 ml-1 opacity-70" />
                          </span>
                          <div className="flex items-center">
                            <span className="mr-1.5">{riskIcon}</span>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-medium capitalize flex items-center"
                              style={{
                                backgroundColor: riskColor + "20",
                                color: riskColor,
                                border: `1px solid ${riskColor}40`,
                              }}
                            >
                              {supplier.risk_level || "Unknown"}
                            </span>
                          </div>
                        </div>
                      </Tooltip>

                      {/* ESG Scores Row */}
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {/* Environmental Score with Tooltip */}
                        <Tooltip content={sectionHelp.pillarEnv}>
                          <div className="flex flex-col items-center">
                            <span
                              className="text-xs flex items-center mb-1"
                              style={{ color: colors.textMuted }}
                            >
                              Env
                              <QuestionMarkCircleIcon className="h-3 w-3 ml-0.5 opacity-70" />
                            </span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: colors.primary }}
                            >
                              {supplier.environmental_score !== null &&
                              supplier.environmental_score !== undefined
                                ? supplier.environmental_score > 0 &&
                                  supplier.environmental_score <= 1
                                  ? (supplier.environmental_score * 100).toFixed(
                                      1
                                    )
                                  : supplier.environmental_score.toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                        </Tooltip>

                        {/* Social Score with Tooltip */}
                        <Tooltip content={sectionHelp.pillarSoc}>
                          <div className="flex flex-col items-center">
                            <span
                              className="text-xs flex items-center mb-1"
                              style={{ color: colors.textMuted }}
                            >
                              Soc
                              <QuestionMarkCircleIcon className="h-3 w-3 ml-0.5 opacity-70" />
                            </span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: colors.accent }}
                            >
                              {supplier.social_score !== null &&
                              supplier.social_score !== undefined
                                ? supplier.social_score > 0 &&
                                  supplier.social_score <= 1
                                  ? (supplier.social_score * 100).toFixed(1)
                                  : supplier.social_score.toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                        </Tooltip>

                        {/* Governance Score with Tooltip */}
                        <Tooltip content={sectionHelp.pillarGov}>
                          <div className="flex flex-col items-center">
                            <span
                              className="text-xs flex items-center mb-1"
                              style={{ color: colors.textMuted }}
                            >
                              Gov
                              <QuestionMarkCircleIcon className="h-3 w-3 ml-0.5 opacity-70" />
                            </span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: colors.secondary }}
                            >
                              {supplier.governance_score !== null &&
                              supplier.governance_score !== undefined
                                ? supplier.governance_score > 0 &&
                                  supplier.governance_score <= 1
                                  ? (supplier.governance_score * 100).toFixed(1)
                                  : supplier.governance_score.toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                        </Tooltip>
                      </div>

                      {/* Last Updated */}
                      <Tooltip content={sectionHelp.lastUpdated}>
                        <div
                          className="flex items-center justify-end border-t mt-3 pt-2"
                          style={{ borderColor: colors.accent + "20" }}
                        >
                          <span
                            className="text-xs flex items-center px-2 py-1 rounded-full"
                            style={lastUpdatedBadge.style}
                          >
                            {lastUpdatedBadge.icon}
                            {lastUpdatedBadge.label}
                          </span>
                        </div>
                      </Tooltip>
                    </div>

                    {/* Card Footer - Actions */}
                    <div
                      className="p-3 border-t"
                      style={{
                        borderColor: colors.accent + "30",
                        backgroundColor: colors.accent + "10",
                      }}
                    >
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleQuickView(supplier)}
                          className="flex-1 flex items-center justify-center text-sm py-1.5 rounded hover:opacity-80 transition-opacity duration-200"
                          style={{
                            backgroundColor: colors.panel,
                            color: colors.primary,
                            border: `1px solid ${colors.primary}30`,
                          }}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" /> Quick View
                        </button>
                        <button
                          onClick={() => handleViewDetails(supplierId)}
                          className="flex-1 flex items-center justify-center text-sm py-1.5 rounded hover:opacity-80 transition-opacity duration-200"
                          style={{
                            backgroundColor: colors.accent,
                            color: colors.background,
                          }}
                        >
                          Dossier <ArrowRightIcon className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-16">
                <p style={{ color: colors.textMuted }}>
                  No suppliers match the current filters.
                </p>
              </div>
            )}
          </motion.div>

          {/* Pagination Controls */}
          {filteredSuppliers.length > 0 && (
            <div className="mt-8 flex justify-between items-center">
              <div style={{ color: colors.textMuted }}>
                Showing {Math.min(itemsPerPage, filteredSuppliers.length)} of{" "}
                {filteredSuppliers.length} suppliers
              </div>

              <div className="flex items-center gap-2">
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
                      currentPage === totalPages ? "transparent" : colors.panel,
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
                  className="ml-4 py-1.5 pl-3 pr-8 rounded-md appearance-none"
                  style={{
                    backgroundColor: colors.panel,
                    color: colors.text,
                    border: `1px solid ${colors.accent}30`,
                  }}
                >
                  <option value={9}>9 per page</option>
                  <option value={18}>18 per page</option>
                  <option value={27}>27 per page</option>
                  <option value={36}>36 per page</option>
                </select>
              </div>
            </div>
          )}

          {/* Comparison Floating Panel */}
          <AnimatePresence>
            {selectedSuppliers.length > 0 && (
              <motion.div
                className="fixed bottom-4 right-4 z-30 p-4 rounded-lg shadow-lg"
                style={{
                  backgroundColor: colors.panel,
                  borderLeft: `4px solid ${colors.primary}`,
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
                        <p className="text-xs" style={{ color: colors.primary }}>
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
                        const supplierId = supplier._id || supplier.id || supplier.name;
                        const statusStyles = getStatusStyles(supplier.status);
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
                                    getRiskColor(colors, supplier.risk_level) + "20",
                                  color: getRiskColor(colors, supplier.risk_level),
                                  border: `1px solid ${getRiskColor(
                                    colors,
                                    supplier.risk_level
                                  )}40`,
                                }}
                              >
                                <span className="mr-1">
                                  {getRiskIcon(supplier.risk_level)}
                                </span>
                                {supplier.risk_level || "Risk N/A"}
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
                                {supplier.status || "Status Unknown"}
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
                            const normalizedValues = selectedSuppliers.map((supplier) =>
                              metric.normalize(metric.getValue(supplier))
                            );

                            const numericEntries = normalizedValues
                              .map((value, index) =>
                                typeof value === "number" && !Number.isNaN(value)
                                  ? { value, index }
                                  : null
                              )
                              .filter(Boolean) as Array<{ value: number; index: number }>;

                            let highlightIndex = -1;
                            if (numericEntries.length > 0) {
                              highlightIndex = metric.higherIsBetter
                                ? numericEntries.reduce((best, current) =>
                                    current.value > best.value ? current : best
                                  ).index
                                : numericEntries.reduce((best, current) =>
                                    current.value < best.value ? current : best
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
                                  const isHighlighted = index === highlightIndex;
                                  return (
                                    <td
                                      key={`${metric.key}-${
                                        supplier._id || supplier.id || supplier.name
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
                        {getRecommendation(colors, selectedSupplier) && (
                          <span
                            className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor:
                                getRecommendation(colors, selectedSupplier)!.bgColor,
                              color: getRecommendation(colors, selectedSupplier)!.color,
                              border: `1px solid ${
                                getRecommendation(colors, selectedSupplier)!.color
                              }40`,
                            }}
                          >
                            {getRecommendation(colors, selectedSupplier)!.icon}
                            {getRecommendation(colors, selectedSupplier)!.label}
                          </span>
                        )}
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
                            color: getStatusStyles(colors, selectedSupplier.status)
                              .color,
                            backgroundColor: getStatusStyles(
                              colors,
                              selectedSupplier.status
                            ).bgColor,
                            border: getStatusStyles(colors, selectedSupplier.status)
                              .border,
                          }}
                        >
                          {getStatusStyles(colors, selectedSupplier.status).icon}
                          {selectedSupplier.status || "Status Unknown"}
                        </span>

                        {/* Last Updated in Modal */}
                        {(() => {
                          const badge = getLastUpdatedBadge(
                            colors,
                            selectedSupplier.last_updated
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
                        <p className="text-xs uppercase" style={{ color: colors.textMuted }}>
                          ESG Score (Risk-Adjusted)
                        </p>
                        <p className="text-2xl font-semibold" style={{ color: colors.text }}>
                          {formatScoreValue(selectedSupplier.ethical_score)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
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
                        <p className="text-xs uppercase" style={{ color: colors.textMuted }}>
                          Composite ESG Score (Pre-Risk)
                        </p>
                        <p className="text-2xl font-semibold" style={{ color: colors.text }}>
                          {formatScoreValue(selectedSupplier.composite_score)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                          Weighted blend of Environmental, Social, Governance pillars.
                        </p>
                      </div>
                      <div
                        className="rounded-lg p-3"
                        style={{
                          backgroundColor: colors.panel,
                          border: `1px solid ${colors.secondary}30`,
                        }}
                      >
                        <p className="text-xs uppercase" style={{ color: colors.textMuted }}>
                          Data Completeness
                        </p>
                        <p className="text-2xl font-semibold" style={{ color: colors.text }}>
                          {formatPercent(selectedSupplier.completeness_ratio, 0)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
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
                                  color: getScoreColor(
                                    colors,
                                    selectedSupplier.ethical_score
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
                                    : selectedSupplier.ethical_score.toFixed(1)
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
                                  backgroundColor: getScoreColor(
                                    colors,
                                    selectedSupplier.ethical_score
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
                                  ? selectedSupplier.environmental_score > 0 &&
                                    selectedSupplier.environmental_score <= 1
                                    ? (
                                        selectedSupplier.environmental_score *
                                        100
                                      ).toFixed(1)
                                    : selectedSupplier.environmental_score.toFixed(
                                        1
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
                                selectedSupplier.governance_score !== undefined
                                  ? selectedSupplier.governance_score > 0 &&
                                    selectedSupplier.governance_score <= 1
                                    ? (
                                        selectedSupplier.governance_score * 100
                                      ).toFixed(1)
                                    : selectedSupplier.governance_score.toFixed(
                                        1
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
                                      ? selectedSupplier.governance_score * 100
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
                                    getRiskColor(colors, selectedSupplier.risk_level) +
                                    "20",
                                  color: getRiskColor(
                                    colors,
                                    selectedSupplier.risk_level
                                  ),
                                  border: `1px solid ${getRiskColor(
                                    colors,
                                    selectedSupplier.risk_level
                                  )}40`,
                                }}
                              >
                                {selectedSupplier.risk_level || "Unknown"}
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

                        {mockControversies.length > 0 ? (
                          <div className="space-y-3">
                            {mockControversies.map((controversy, index) => (
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

                        <div className="space-y-2">
                          {mockScoreHistory.map((entry, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 rounded-md"
                              style={{
                                backgroundColor:
                                  index === mockScoreHistory.length - 1
                                    ? colors.accent + "20"
                                    : "transparent",
                              }}
                            >
                              <div className="flex items-center">
                                <div
                                  className="mr-3"
                                  style={{
                                    color:
                                      entry.change >= 0
                                        ? colors.success
                                        : colors.error,
                                  }}
                                >
                                  {entry.change >= 0 ? (
                                    <ArrowTrendingUpIcon className="h-5 w-5" />
                                  ) : (
                                    <ArrowTrendingDownIcon className="h-5 w-5" />
                                  )}
                                </div>
                                <div>
                                  <div
                                    className="text-sm font-medium"
                                    style={{ color: colors.text }}
                                  >
                                    {entry.score.toFixed(1)}
                                  </div>
                                  <div
                                    className="text-xs"
                                    style={{ color: colors.textMuted }}
                                  >
                                    {entry.date}
                                  </div>
                                </div>
                              </div>
                              <div
                                className="text-sm font-mono"
                                style={{
                                  color:
                                    entry.change >= 0
                                      ? colors.success
                                      : colors.error,
                                }}
                              >
                                {entry.change >= 0 ? "+" : ""}
                                {entry.change.toFixed(1)}
                              </div>
                            </div>
                          ))}
                        </div>
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
                          {mockActions.map((action, index) => (
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
                    className="p-4 border-t flex justify-end items-center gap-3 sticky bottom-0"
                    style={{
                      borderColor: colors.accent + "30",
                      backgroundColor: colors.background,
                    }}
                  >
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 rounded"
                      style={{
                        backgroundColor: colors.panel,
                        color: colors.textMuted,
                      }}
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default SuppliersList;
