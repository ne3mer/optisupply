import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getSuppliers, Supplier } from "../services/api"; // Corrected path
import { motion } from "framer-motion";
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
  const s = score ?? 0;
  return s >= 80 ? colors.success : s >= 60 ? colors.warning : colors.error;
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
  const navigate = useNavigate();

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
      const nameMatch = supplier.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const countryMatch = !filterCountry || supplier.country === filterCountry;
      const industryMatch =
        !filterIndustry || supplier.industry === filterIndustry;
      const riskMatch =
        !filterRisk ||
        supplier.risk_level?.toLowerCase() === filterRisk.toLowerCase();
      return nameMatch && countryMatch && industryMatch && riskMatch;
    });
  }, [suppliers, searchTerm, filterCountry, filterIndustry, filterRisk]);

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
          <Link
            to="/suppliers/add"
            className="flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            style={{ backgroundColor: colors.accent, color: colors.background }}
            hover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Register New Supplier
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: colors.textMuted }}
            />
            <input
              type="text"
              placeholder="Search by supplier name..."
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
      </motion.div>

      {/* Supplier List/Grid */}
      {loading && <LoadingIndicator />}
      {error && !loading && <ErrorDisplay message={error} />}
      {!loading && !error && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((supplier) => {
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
                        {supplier.ethical_score?.toFixed(1) ?? "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm flex items-center"
                        style={{ color: colors.textMuted }}
                      >
                        <ShieldExclamationIcon className="h-4 w-4 mr-2" /> Risk
                        Level
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

                  {/* Card Footer - Action */}
                  <div
                    className="p-3 border-t"
                    style={{
                      borderColor: colors.accent + "30",
                      backgroundColor: colors.accent + "10",
                    }}
                  >
                    <button
                      onClick={() => handleViewDetails(supplierId)}
                      className="w-full flex items-center justify-center text-sm py-1.5 rounded hover:opacity-80 transition-opacity duration-200"
                      style={{
                        backgroundColor: colors.accent,
                        color: colors.background,
                      }}
                    >
                      View Dossier <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </button>
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
      )}
    </div>
  );
};

export default SuppliersList;
