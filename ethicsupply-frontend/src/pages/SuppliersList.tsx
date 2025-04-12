import React, { useState, useEffect, useMemo } from "react";
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
} from "@heroicons/react/24/outline";

// --- Reusing Dashboard Colors & Helpers ---
const colors = {
  background: "#0D0F1A",
  panel: "rgba(25, 28, 43, 0.8)",
  primary: "#00F0FF", // Teal
  secondary: "#FF00FF", // Magenta
  accent: "#4D5BFF", // Blue
  text: "#E0E0FF",
  textMuted: "#8A94C8",
  success: "#00FF8F", // Green
  warning: "#FFD700", // Yellow
  error: "#FF4D4D", // Red
  inputBg: "rgba(40, 44, 66, 0.9)", // Darker input background
};

const LoadingIndicator = () => (
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

const ErrorDisplay = ({ message }) => (
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

// Helper to get risk color
const getRiskColor = (riskLevel: string | undefined) => {
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

const getScoreColor = (score: number | null | undefined) => {
  if (score === null || score === undefined) return colors.textMuted;

  // Normalize score to 0-100 scale if it's in 0-1 range
  const normalizedScore = score > 0 && score <= 1 ? score * 100 : score;

  if (normalizedScore >= 80) return "#10b981"; // emerald-500
  if (normalizedScore >= 60) return "#14b8a6"; // teal-500
  if (normalizedScore >= 40) return "#f59e0b"; // amber-500
  if (normalizedScore >= 20) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
};

// --- SuppliersList Component ---

const SuppliersList = () => {
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
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const navigate = useNavigate();

  // Modal state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);

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
      Name: supplier.name || "N/A",
      ID: supplier._id || supplier.id || "N/A",
      Country: supplier.country || "N/A",
      Industry: supplier.industry || "N/A",
      "Ethical Score": formatScore(supplier.ethical_score),
      "Environmental Score": formatScore(supplier.environmental_score),
      "Social Score": formatScore(supplier.social_score),
      "Governance Score": formatScore(supplier.governance_score),
      "Risk Level": supplier.risk_level || "N/A",
      "Date Added": new Date(
        supplier.created_at || Date.now()
      ).toLocaleDateString(),
    }));
  };

  // Helper to format scores consistently
  const formatScore = (score: number | null | undefined) => {
    if (score === null || score === undefined) return "N/A";
    return score > 0 && score <= 1
      ? (score * 100).toFixed(1)
      : score.toFixed(1);
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {sortedAndPaginatedSuppliers.length > 0 ? (
              sortedAndPaginatedSuppliers.map((supplier) => {
                const riskColor = getRiskColor(supplier.risk_level);
                const scoreColor = getScoreColor(supplier.ethical_score);
                const supplierId = supplier._id || supplier.id; // Handle both ID types

                return (
                  <motion.div
                    key={supplierId}
                    variants={itemVariants}
                    className="rounded-lg border backdrop-blur-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                    style={{
                      backgroundColor: colors.panel,
                      borderColor: colors.accent + "40",
                    }}
                    whileHover={{ y: -5, borderColor: colors.primary }}
                  >
                    {/* Card Header */}
                    <div
                      className="p-4 border-b"
                      style={{ borderColor: colors.accent + "30" }}
                    >
                      <h2
                        className="text-lg font-semibold truncate"
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

                    {/* Card Body - Key Metrics */}
                    <div className="p-4 flex-grow space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm flex items-center"
                          style={{ color: colors.textMuted }}
                        >
                          <ScaleIcon className="h-4 w-4 mr-2" /> Ethical Score
                        </span>
                        <span
                          className="text-lg font-bold font-mono"
                          style={{ color: scoreColor }}
                        >
                          {supplier.ethical_score !== null &&
                          supplier.ethical_score !== undefined
                            ? supplier.ethical_score > 0 &&
                              supplier.ethical_score <= 1
                              ? (supplier.ethical_score * 100).toFixed(1)
                              : supplier.ethical_score.toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm flex items-center"
                          style={{ color: colors.textMuted }}
                        >
                          <ShieldExclamationIcon className="h-4 w-4 mr-2" />{" "}
                          Risk Level
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium capitalize"
                          style={{
                            backgroundColor: riskColor + "20",
                            color: riskColor,
                          }}
                        >
                          {supplier.risk_level || "Unknown"}
                        </span>
                      </div>
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
                  <option value={8}>8 per page</option>
                  <option value={16}>16 per page</option>
                  <option value={24}>24 per page</option>
                  <option value={32}>32 per page</option>
                </select>
              </div>
            </div>
          )}

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
                    className="p-4 border-b flex justify-between items-start"
                    style={{ borderColor: colors.accent + "30" }}
                  >
                    <div>
                      <h2
                        className="text-xl font-bold"
                        style={{ color: colors.text }}
                      >
                        {selectedSupplier.name}
                      </h2>
                      <div
                        className="flex items-center mt-1"
                        style={{ color: colors.textMuted }}
                      >
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {selectedSupplier.country || "N/A"}
                        </span>
                        <span className="mx-2">•</span>
                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {selectedSupplier.industry || "N/A"}
                        </span>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ESG Breakdown */}
                      <div
                        className="rounded-lg p-4"
                        style={{ backgroundColor: colors.panel }}
                      >
                        <h3
                          className="text-lg font-semibold mb-4"
                          style={{ color: colors.text }}
                        >
                          ESG Breakdown
                        </h3>

                        <div className="space-y-4">
                          {/* Ethical Score */}
                          <div>
                            <div className="flex justify-between mb-1">
                              <span style={{ color: colors.textMuted }}>
                                Overall Ethical Score
                              </span>
                              <span
                                className="font-bold"
                                style={{
                                  color: getScoreColor(
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
                                    selectedSupplier.ethical_score
                                  ),
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Environmental Score */}
                          <div>
                            <div className="flex justify-between mb-1">
                              <span style={{ color: colors.textMuted }}>
                                Environmental
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

                          {/* Social Score */}
                          <div>
                            <div className="flex justify-between mb-1">
                              <span style={{ color: colors.textMuted }}>
                                Social
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

                          {/* Governance Score */}
                          <div>
                            <div className="flex justify-between mb-1">
                              <span style={{ color: colors.textMuted }}>
                                Governance
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

                          {/* Risk Level */}
                          <div className="flex justify-between mt-6">
                            <span style={{ color: colors.textMuted }}>
                              Risk Level
                            </span>
                            <span
                              className="px-3 py-1 rounded text-xs font-medium capitalize"
                              style={{
                                backgroundColor:
                                  getRiskColor(selectedSupplier.risk_level) +
                                  "20",
                                color: getRiskColor(
                                  selectedSupplier.risk_level
                                ),
                              }}
                            >
                              {selectedSupplier.risk_level || "Unknown"}
                            </span>
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
                    className="p-4 border-t flex justify-between"
                    style={{ borderColor: colors.accent + "30" }}
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
                    <button
                      onClick={() => {
                        closeModal();
                        handleViewDetails(
                          selectedSupplier._id || selectedSupplier.id
                        );
                      }}
                      className="px-4 py-2 rounded flex items-center"
                      style={{
                        backgroundColor: colors.accent,
                        color: colors.background,
                      }}
                    >
                      View Full Dossier{" "}
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
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
