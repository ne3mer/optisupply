import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getSuppliers,
  getSupplier,
  updateSupplier, // Need an update function in API service
  Supplier,
  SupplierEvaluation,
} from "../services/api";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  UserCircleIcon,
  GlobeEuropeAfricaIcon,
  UsersIcon,
  BuildingLibraryIcon,
  TruckIcon,
  ShieldExclamationIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  GlobeAmericasIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";

// --- Reusing Theme Colors & Helpers from Assessment ---
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
  inputBg: "rgba(40, 44, 66, 0.9)",
};

// Helper function to get color based on risk level
const getRiskColor = (riskLevel?: string) => {
  if (!riskLevel) return colors.textMuted;

  const risk = riskLevel.toLowerCase();
  if (risk.includes("low")) return colors.success;
  if (risk.includes("medium")) return colors.warning;
  if (risk.includes("high")) return colors.error;
  if (risk.includes("critical")) return colors.secondary;

  return colors.textMuted;
};

const LoadingIndicator = ({ message = "Loading Data..." }) => (
  <div className="flex flex-col items-center justify-center p-10 min-h-[200px]">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-10 h-10 border-t-2 border-b-2 rounded-full mb-3"
      style={{ borderColor: colors.primary }}
    ></motion.div>
    <p style={{ color: colors.textMuted }}>{message}</p>
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div className="bg-red-900/30 border border-red-600 p-4 rounded-lg text-center my-6">
    <ExclamationTriangleIcon
      className="h-8 w-8 mx-auto mb-2"
      style={{ color: colors.error }}
    />
    <p style={{ color: colors.textMuted }}>{message}</p>
  </div>
);

// --- Input Components (Copied from Assessment) ---
const InputField = ({
  name,
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  disabled = false,
}) => (
  <div className="mb-4">
    <label
      htmlFor={name}
      className="block text-sm font-medium mb-1"
      style={{ color: colors.textMuted }}
    >
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
      style={{
        backgroundColor: colors.inputBg,
        borderColor: colors.accent + "50",
        color: colors.text,
        "--tw-ring-color": colors.primary,
      }}
    />
  </div>
);

const SelectField = ({
  name,
  label,
  value,
  onChange,
  options,
  disabled = false,
}) => (
  <div className="mb-4 relative">
    <label
      htmlFor={name}
      className="block text-sm font-medium mb-1"
      style={{ color: colors.textMuted }}
    >
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full appearance-none pl-3 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2 ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
      style={{
        backgroundColor: colors.inputBg,
        borderColor: colors.accent + "50",
        color: colors.text,
        "--tw-ring-color": colors.primary,
      }}
    >
      <option value="" style={{ color: colors.textMuted }}>
        Select...
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    <ChevronDownIcon
      className="absolute right-3 top-9 h-5 w-5 pointer-events-none"
      style={{ color: colors.textMuted }}
    />
  </div>
);

const SliderField = ({
  name,
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  unit = "",
  disabled = false,
}) => {
  // Calculate the percentage for visual elements
  const percentage =
    typeof value === "number" ? ((value - min) / (max - min)) * 100 : 50;

  // Get dynamic color based on value
  const getValueColor = () => {
    if (name.includes("risk")) {
      // For risk metrics, lower is better
      if (percentage < 30) return colors.success;
      if (percentage < 70) return colors.warning;
      return colors.error;
    } else {
      // For most metrics, higher is better
      if (percentage > 70) return colors.success;
      if (percentage > 30) return colors.warning;
      return colors.error;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <label
          htmlFor={name}
          className="block text-sm font-medium"
          style={{ color: colors.textMuted }}
        >
          {label}
        </label>
        <motion.span
          key={value}
          initial={{ scale: 0.9, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-sm font-mono font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: getValueColor() + "20",
            color: getValueColor(),
            border: `1px solid ${getValueColor()}40`,
          }}
        >
          {typeof value === "number"
            ? value.toFixed(unit === "%" ? 0 : 2)
            : "N/A"}
          {unit}
        </motion.span>
      </div>

      <div className="relative h-2 mt-2">
        {/* Track background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: colors.inputBg }}
        />

        {/* Filled portion */}
        <motion.div
          layout
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: getValueColor() }}
        />

        {/* Thumb */}
        <motion.div
          layout
          className="absolute top-1/2 w-4 h-4 -mt-2 -ml-2 rounded-full shadow-md z-10 border-2"
          style={{
            left: `${percentage}%`,
            backgroundColor: colors.background,
            borderColor: getValueColor(),
          }}
          whileHover={{ scale: 1.2 }}
          transition={{ type: "spring", stiffness: 300 }}
        />

        {/* Invisible input (for interaction) */}
        <input
          type="range"
          id={name}
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          disabled={disabled}
          data-type="number"
          className="absolute inset-0 opacity-0 cursor-pointer z-20"
        />
      </div>

      {/* Range markers */}
      <div
        className="flex justify-between mt-1 text-[10px]"
        style={{ color: colors.textMuted }}
      >
        <span>
          {min}
          {unit}
        </span>
        {min !== max && (
          <span>
            {((max - min) / 2 + min).toFixed(unit === "%" ? 0 : 1)}
            {unit}
          </span>
        )}
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
};

// --- Main Edit Form Component ---
const SupplierEditForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const countries = [
    "United States",
    "China",
    "India",
    "United Kingdom",
    "Germany",
    "France",
    "Japan",
    "South Korea",
    "Taiwan",
    "Singapore",
    "Canada",
    "Mexico",
    "Brazil",
    "Australia",
    "Russia",
    "Italy",
    "Spain",
    "Netherlands",
    "Switzerland",
    "Sweden",
    "Norway",
    "Denmark",
    "Thailand",
    "Vietnam",
    "Malaysia",
    "Indonesia",
    "Philippines",
    "South Africa",
    "Nigeria",
    "Kenya",
    "United Arab Emirates",
    "Saudi Arabia",
    "Hong Kong",
    "Other",
  ];

  const industries = [
    "Manufacturing",
    "Technology",
    "Electronics",
    "Automotive",
    "Aerospace",
    "Consumer Goods",
    "Food & Beverage",
    "Pharmaceuticals",
    "Healthcare",
    "Telecommunications",
    "Energy",
    "Oil & Gas",
    "Renewable Energy",
    "Mining & Metals",
    "Chemicals",
    "Textiles & Apparel",
    "Agriculture",
    "Construction",
    "Transportation",
    "Logistics & Supply Chain",
    "Retail",
    "Financial Services",
    "Software",
    "Hardware",
    "Biotechnology",
    "Medical Devices",
    "Home Appliances",
    "Furniture",
    "Packaging",
    "Professional Services",
    "Other",
  ];

  // State - Initialize with Supplier type fields expected by the backend update endpoint
  // Might be slightly different from SupplierEvaluation
  const [formData, setFormData] = useState<Partial<Supplier>>({}); // Use Partial<Supplier>
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch existing supplier data by ID
  useEffect(() => {
    const loadSupplier = async () => {
      if (!id) {
        setError("Supplier ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        // First, try to fetch supplier directly by ID using the new getSupplier function
        try {
          const supplierData = await getSupplier(id);
          console.log("Loaded supplier data directly:", supplierData);
          setFormData(supplierData);
          setLoading(false);
          return;
        } catch (getError) {
          console.warn(
            "Could not fetch directly by ID, trying list lookup:",
            getError
          );
          // Fall back to the list approach if direct fetch fails
        }

        // If direct fetch failed, try to find in the full list
        const suppliersList = await getSuppliers();

        // Look for matches on both MongoDB _id and numeric id fields
        const supplierData = suppliersList.find(
          (s) => s._id === id || s.id === Number(id) || s.id?.toString() === id
        );

        if (supplierData) {
          console.log("Loaded supplier data from list:", supplierData);
          setFormData(supplierData);
        } else {
          throw new Error("Supplier not found with ID: " + id);
        }
      } catch (err) {
        setError(
          `Failed to load supplier data: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    loadSupplier();
  }, [id]);

  // Handle form changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      let processedValue: string | number | null = value;

      // Handle numeric types (range sliders or explicit number inputs)
      if (
        type === "range" ||
        (e.target instanceof HTMLInputElement &&
          e.target.dataset.type === "number")
      ) {
        processedValue = value === "" ? null : parseFloat(value) || 0; // Allow null for optional numerics?
        // Apply constraints if needed
        if (
          name === "energy_efficiency" ||
          name.includes("_score") ||
          name.includes("_risk") ||
          name === "traceability"
        ) {
          processedValue = Math.max(0, Math.min(1, processedValue as number));
        }
        if (name === "renewable_energy_percent") {
          processedValue = Math.max(0, Math.min(100, processedValue as number));
        }
      }

      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    },
    []
  );

  // Handle form submission (Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!id) {
      setError("Cannot update supplier without an ID.");
      return;
    }

    if (!formData.name || !formData.country) {
      setError("Supplier name and country are required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    // Prepare data for submission - ensure proper types
    const dataToSubmit = {
      ...formData,
      // Convert string numeric values to actual numbers if needed
      co2_emissions:
        typeof formData.co2_emissions === "string"
          ? parseFloat(formData.co2_emissions)
          : formData.co2_emissions,
      water_usage:
        typeof formData.water_usage === "string"
          ? parseFloat(formData.water_usage)
          : formData.water_usage,
      renewable_energy_percent:
        typeof formData.renewable_energy_percent === "string"
          ? parseFloat(formData.renewable_energy_percent)
          : formData.renewable_energy_percent,
    };

    console.log("Updating Supplier Data:", dataToSubmit);

    try {
      // Send the update to the API
      const updatedData = await updateSupplier(id, dataToSubmit as Supplier);

      // Handle success
      setSuccessMessage(`Supplier "${updatedData.name}" updated successfully!`);
      setFormData(updatedData); // Update form with potentially recalculated scores from backend

      // Scroll to top to ensure user sees the success message
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Optionally navigate back after a delay
      setTimeout(() => {
        if (confirm("Would you like to return to the supplier details page?")) {
          navigate(`/suppliers/${id}`);
        }
      }, 1500);
    } catch (error) {
      console.error("Error updating supplier:", error);

      // Handle error
      setError(
        `Update failed: ${
          error instanceof Error
            ? error.message
            : "Unknown error occurred. Please try again."
        }`
      );

      // Scroll to top to ensure user sees the error
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div
        className="min-h-screen p-8 flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <LoadingIndicator message="Loading Supplier Data for Editing..." />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* Enhanced Header with Glowing Background Effect */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 relative overflow-hidden"
      >
        {/* Animated Glow Effect */}
        <motion.div
          className="absolute -inset-10 rounded-full opacity-20 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
            zIndex: 0,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />

        {/* Header Content */}
        <div
          className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-xl backdrop-blur-sm border"
          style={{
            borderColor: colors.accent + "40",
            backgroundColor: colors.panel + "80",
          }}
        >
          <div>
            <div className="flex items-center">
              <UserCircleIcon
                className="w-10 h-10 mr-4"
                style={{ color: colors.secondary }}
              />
              <h1 className="text-4xl font-bold tracking-tight">
                Edit <span style={{ color: colors.primary }}>Supplier</span>
              </h1>
            </div>
            <div className="flex items-center ml-14 mt-2">
              <p style={{ color: colors.textMuted }} className="text-lg">
                Updating:{" "}
                <span
                  className="font-semibold text-xl"
                  style={{ color: colors.accent }}
                >
                  {formData.name || `ID: ${id}`}
                </span>
              </p>
              {formData.ethical_score && (
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="ml-4 px-4 py-1 rounded-full text-sm font-medium flex items-center"
                  style={{
                    backgroundColor: getRiskColor(formData.risk_level) + "30",
                    color: getRiskColor(formData.risk_level),
                    border: `1px solid ${
                      getRiskColor(formData.risk_level) + "60"
                    }`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full mr-2 animate-pulse"
                    style={{
                      backgroundColor: getRiskColor(formData.risk_level),
                    }}
                  ></span>
                  {formData.risk_level || "Unknown"} Risk Level
                </motion.div>
              )}
            </div>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            <Link
              to={`/suppliers/${id}`}
              className="flex items-center px-4 py-2 rounded-lg border transition-all hover:scale-105"
              style={{
                color: colors.accent,
                borderColor: colors.accent + "50",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Cancel & View Details
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Intro Text with Animated Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8 p-6 rounded-xl border relative overflow-hidden"
        style={{
          backgroundColor: colors.panel + "90",
          borderColor: colors.accent + "40",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Animated Accent Line */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: colors.primary }}
          initial={{ height: 0 }}
          animate={{ height: "100%" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
        />

        <div className="flex items-start pl-3">
          <InformationCircleIcon
            className="h-6 w-6 mt-0.5 mr-4 flex-shrink-0"
            style={{ color: colors.primary }}
          />
          <div>
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: colors.primary }}
            >
              Supplier Assessment Form
            </h3>
            <p style={{ color: colors.text }} className="mb-3 leading-relaxed">
              Update the supplier's data to recalculate their ethical score and
              risk assessment. Your changes directly influence the supplier's
              rating in our system and affect their sustainability metrics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div
                className="p-3 rounded-lg border"
                style={{
                  borderColor: colors.success + "50",
                  backgroundColor: "rgba(0,255,143,0.05)",
                }}
              >
                <h4
                  className="text-sm font-medium mb-1"
                  style={{ color: colors.success }}
                >
                  Environmental Impact
                </h4>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Measure carbon footprint, waste management, and resource
                  efficiency.
                </p>
              </div>
              <div
                className="p-3 rounded-lg border"
                style={{
                  borderColor: colors.primary + "50",
                  backgroundColor: "rgba(0,240,255,0.05)",
                }}
              >
                <h4
                  className="text-sm font-medium mb-1"
                  style={{ color: colors.primary }}
                >
                  Social Responsibility
                </h4>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Evaluate labor practices, community impact, and human rights
                  standards.
                </p>
              </div>
              <div
                className="p-3 rounded-lg border"
                style={{
                  borderColor: colors.secondary + "50",
                  backgroundColor: "rgba(255,0,255,0.05)",
                }}
              >
                <h4
                  className="text-sm font-medium mb-1"
                  style={{ color: colors.secondary }}
                >
                  Governance & Risk
                </h4>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Assess transparency, ethical practices, and supply chain
                  stability.
                </p>
              </div>
            </div>
            <p
              className="mt-2 text-sm flex items-center"
              style={{ color: colors.accent }}
            >
              <span className="animate-pulse mr-2">→</span>
              Use the navigation sidebar to quickly jump between form sections.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Two Column Layout with Navigation */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:w-64 shrink-0"
        >
          <div
            className="sticky top-4 p-4 rounded-lg border backdrop-blur-sm space-y-1"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            <h3
              className="text-sm font-medium mb-3"
              style={{ color: colors.primary }}
            >
              Form Sections
            </h3>

            <a
              href="#core-info"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <UserCircleIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.accent }}
              />
              Core Information
            </a>

            <a
              href="#environmental"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <GlobeEuropeAfricaIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.primary }}
              />
              Environmental Metrics
            </a>

            <a
              href="#social"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <UsersIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.primary }}
              />
              Social Metrics
            </a>

            <a
              href="#governance"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <BuildingLibraryIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.primary }}
              />
              Governance Metrics
            </a>

            <a
              href="#supply-chain"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <TruckIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.primary }}
              />
              Supply Chain Metrics
            </a>

            <a
              href="#risk-factors"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <ShieldExclamationIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.error }}
              />
              Risk Factors
            </a>

            <a
              href="#calculated-scores"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <CheckCircleIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.success }}
              />
              Calculated Scores
            </a>

            <a
              href="#metadata"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <InformationCircleIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.textMuted }}
              />
              Metadata
            </a>
          </div>
        </motion.div>

        {/* Main Form */}
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 rounded-lg border backdrop-blur-sm space-y-6"
              style={{
                backgroundColor: colors.panel,
                borderColor: colors.accent + "40",
              }}
            >
              {/* Display Success/Error Messages */}
              {error && <ErrorDisplay message={error} />}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative overflow-hidden border p-5 rounded-lg my-4"
                  style={{
                    borderColor: colors.success,
                    backgroundColor: `${colors.success}15`,
                  }}
                >
                  {/* Pulsing background effect */}
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "easeInOut",
                    }}
                    style={{ backgroundColor: colors.success }}
                  />

                  <div className="flex items-center relative z-10">
                    <div className="bg-black/20 p-2 rounded-full mr-4 flex-shrink-0">
                      <motion.div
                        animate={{ rotate: [0, 10, 0, -10, 0] }}
                        transition={{ duration: 1.5, repeat: 1 }}
                      >
                        <CheckCircleIcon
                          className="h-7 w-7"
                          style={{ color: colors.success }}
                        />
                      </motion.div>
                    </div>
                    <div className="text-left">
                      <h4
                        className="text-lg font-medium mb-1"
                        style={{ color: colors.success }}
                      >
                        Update Successful!
                      </h4>
                      <p style={{ color: colors.text }}>{successMessage}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Form Sections (Simplified for Editing - adjust as needed) */}
              <h2
                className="text-xl font-bold mb-6 pb-2 relative"
                id="core-info"
                style={{
                  borderBottom: `2px solid ${colors.primary}40`,
                  display: "inline-block",
                  paddingRight: "50px",
                }}
              >
                <div className="flex items-center">
                  <ClipboardDocumentListIcon
                    className="w-5 h-5 mr-2"
                    style={{ color: colors.primary }}
                  />
                  <span>Core Information</span>
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-20"
                    style={{
                      background: `linear-gradient(90deg, ${colors.primary}, transparent)`,
                    }}
                  />
                </div>
              </h2>
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                  <InputField
                    name="name"
                    label="Supplier Name *"
                    value={formData.name || ""}
                    onChange={handleChange}
                  />
                  <SelectField
                    name="country"
                    label="Country *"
                    value={formData.country || ""}
                    onChange={handleChange}
                    options={countries}
                  />
                  <SelectField
                    name="industry"
                    label="Industry *"
                    value={formData.industry || ""}
                    onChange={handleChange}
                    options={industries}
                  />
                </div>
              </div>

              {/* Add other editable fields using InputField/SelectField/SliderField */}
              {/* Example: Environmental Section (Make sliders if desired) */}
              <h2
                className="text-xl font-bold mb-6 pb-2 relative"
                id="environmental"
                style={{
                  borderBottom: `2px solid ${colors.success}40`,
                  display: "inline-block",
                  paddingRight: "50px",
                }}
              >
                <div className="flex items-center">
                  <GlobeAmericasIcon
                    className="w-5 h-5 mr-2"
                    style={{ color: colors.success }}
                  />
                  <span>Environmental Metrics</span>
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-20"
                    style={{
                      background: `linear-gradient(90deg, ${colors.success}, transparent)`,
                    }}
                  />
                </div>
              </h2>
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                  <InputField
                    name="co2_emissions"
                    label="CO₂ Emissions (Tons)"
                    type="number"
                    value={formData.co2_emissions ?? ""}
                    onChange={handleChange}
                    placeholder="e.g., 1500.5"
                  />
                  <InputField
                    name="water_usage"
                    label="Water Usage (m³)"
                    type="number"
                    value={formData.water_usage ?? ""}
                    onChange={handleChange}
                    placeholder="e.g., 50000"
                  />
                  <SliderField
                    name="waste_management_score"
                    label="Waste Management Score"
                    value={formData.waste_management_score ?? 0.5}
                    onChange={handleChange}
                  />
                  <SliderField
                    name="energy_efficiency"
                    label="Energy Efficiency Score"
                    value={formData.energy_efficiency ?? 0.5}
                    onChange={handleChange}
                  />
                  <InputField
                    name="renewable_energy_percent"
                    label="Renewable Energy (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.renewable_energy_percent ?? ""}
                    onChange={handleChange}
                    placeholder="0-100"
                  />
                  <SliderField
                    name="pollution_control"
                    label="Pollution Control Score"
                    value={formData.pollution_control ?? 0.5}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <h2
                className="text-xl font-bold mb-6 pb-2 relative"
                id="social"
                style={{
                  borderBottom: `2px solid ${colors.accent}40`,
                  display: "inline-block",
                  paddingRight: "50px",
                }}
              >
                <div className="flex items-center">
                  <UserGroupIcon
                    className="w-5 h-5 mr-2"
                    style={{ color: colors.accent }}
                  />
                  <span>Social Responsibility</span>
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-20"
                    style={{
                      background: `linear-gradient(90deg, ${colors.accent}, transparent)`,
                    }}
                  />
                </div>
              </h2>
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                  <SliderField
                    name="wage_fairness"
                    label="Wage Fairness Score"
                    value={formData.wage_fairness ?? 0.5}
                    onChange={handleChange}
                  />
                  <SliderField
                    name="human_rights_index"
                    label="Human Rights Index"
                    value={formData.human_rights_index ?? 0.5}
                    onChange={handleChange}
                  />
                  <SliderField
                    name="diversity_inclusion_score"
                    label="Diversity & Inclusion Score"
                    value={formData.diversity_inclusion_score ?? 0.5}
                    onChange={handleChange}
                  />
                  <SliderField
                    name="community_engagement"
                    label="Community Engagement"
                    value={formData.community_engagement ?? 0.5}
                    onChange={handleChange}
                  />
                  <SliderField
                    name="worker_safety"
                    label="Worker Safety Score"
                    value={formData.worker_safety ?? 0.5}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <h2
                className="text-xl font-bold mb-6 pb-2 relative"
                id="governance"
                style={{
                  borderBottom: `2px solid ${colors.secondary}40`,
                  display: "inline-block",
                  paddingRight: "50px",
                }}
              >
                <div className="flex items-center">
                  <DocumentChartBarIcon
                    className="w-5 h-5 mr-2"
                    style={{ color: colors.secondary }}
                  />
                  <span>Governance Structure</span>
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-20"
                    style={{
                      background: `linear-gradient(90deg, ${colors.secondary}, transparent)`,
                    }}
                  />
                </div>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <SliderField
                  name="transparency_score"
                  label="Transparency Score"
                  value={formData.transparency_score ?? 0.5}
                  onChange={handleChange}
                />
                <SliderField
                  name="corruption_risk"
                  label="Corruption Risk"
                  value={formData.corruption_risk ?? 0.5}
                  onChange={handleChange}
                />
                <SliderField
                  name="board_diversity"
                  label="Board Diversity Score"
                  value={formData.board_diversity ?? 0.5}
                  onChange={handleChange}
                />
                <SliderField
                  name="ethics_program"
                  label="Ethics Program Strength"
                  value={formData.ethics_program ?? 0.5}
                  onChange={handleChange}
                />
                <SliderField
                  name="compliance_systems"
                  label="Compliance Systems Score"
                  value={formData.compliance_systems ?? 0.5}
                  onChange={handleChange}
                />
              </div>

              <h2
                className="text-xl font-bold mb-6 pb-2 relative"
                id="supply-chain"
                style={{
                  borderBottom: `2px solid ${colors.blue}40`,
                  display: "inline-block",
                  paddingRight: "50px",
                }}
              >
                <div className="flex items-center">
                  <TruckIcon
                    className="w-5 h-5 mr-2"
                    style={{ color: colors.blue }}
                  />
                  <span>Supply Chain Metrics</span>
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-20"
                    style={{
                      background: `linear-gradient(90deg, ${colors.blue}, transparent)`,
                    }}
                  />
                </div>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <SliderField
                  name="delivery_efficiency"
                  label="Delivery Efficiency"
                  value={formData.delivery_efficiency ?? 0.5}
                  onChange={handleChange}
                />
                <SliderField
                  name="quality_control_score"
                  label="Quality Control Score"
                  value={formData.quality_control_score ?? 0.5}
                  onChange={handleChange}
                />
                <SliderField
                  name="supplier_diversity"
                  label="Supplier Diversity"
                  value={formData.supplier_diversity ?? 0.5}
                  onChange={handleChange}
                />
                <SliderField
                  name="traceability"
                  label="Supply Chain Traceability"
                  value={formData.traceability ?? 0.5}
                  onChange={handleChange}
                />
              </div>

              <h2
                className="text-xl font-bold mb-6 pb-2 relative"
                id="risk-factors"
                style={{
                  borderBottom: `2px solid ${colors.warning}40`,
                  display: "inline-block",
                  paddingRight: "50px",
                }}
              >
                <div className="flex items-center">
                  <ExclamationTriangleIcon
                    className="w-5 h-5 mr-2"
                    style={{ color: colors.warning }}
                  />
                  <span>Risk Factors</span>
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-20"
                    style={{
                      background: `linear-gradient(90deg, ${colors.warning}, transparent)`,
                    }}
                  />
                </div>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <SliderField
                  name="geopolitical_risk"
                  label="Geopolitical Risk"
                  value={formData.geopolitical_risk ?? 0.5}
                  onChange={handleChange}
                />
                <SliderField
                  name="climate_risk"
                  label="Climate Risk"
                  value={formData.climate_risk ?? 0.5}
                  onChange={handleChange}
                />
                <SliderField
                  name="labor_dispute_risk"
                  label="Labor Dispute Risk"
                  value={formData.labor_dispute_risk ?? 0.5}
                  onChange={handleChange}
                />
              </div>

              <h2
                className="text-xl font-bold mb-6 pb-2 relative"
                id="calculated-scores"
                style={{
                  borderBottom: `2px solid ${colors.success}40`,
                  display: "inline-block",
                  paddingRight: "50px",
                }}
              >
                <div className="flex items-center">
                  <CheckCircleIcon
                    className="w-5 h-5 mr-2"
                    style={{ color: colors.success }}
                  />
                  <span>Calculated Scores</span>
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-20"
                    style={{
                      background: `linear-gradient(90deg, ${colors.success}, transparent)`,
                    }}
                  />
                </div>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <InputField
                  name="ethical_score"
                  label="Ethical Score"
                  type="number"
                  value={formData.ethical_score ?? ""}
                  onChange={handleChange}
                  placeholder="Overall score (0-100)"
                  disabled={true}
                />
                <InputField
                  name="environmental_score"
                  label="Environmental Score"
                  type="number"
                  value={formData.environmental_score ?? ""}
                  onChange={handleChange}
                  placeholder="Environmental score (0-100)"
                  disabled={true}
                />
                <InputField
                  name="social_score"
                  label="Social Score"
                  type="number"
                  value={formData.social_score ?? ""}
                  onChange={handleChange}
                  placeholder="Social score (0-100)"
                  disabled={true}
                />
                <InputField
                  name="governance_score"
                  label="Governance Score"
                  type="number"
                  value={formData.governance_score ?? ""}
                  onChange={handleChange}
                  placeholder="Governance score (0-100)"
                  disabled={true}
                />
                <SelectField
                  name="risk_level"
                  label="Risk Level"
                  value={formData.risk_level || ""}
                  onChange={handleChange}
                  options={["Low", "Medium", "High", "Critical"]}
                  disabled={true}
                />
              </div>

              <h2
                className="text-xl font-bold mb-6 pb-2 relative"
                id="metadata"
                style={{
                  borderBottom: `2px solid ${colors.textMuted}40`,
                  display: "inline-block",
                  paddingRight: "50px",
                }}
              >
                <div className="flex items-center">
                  <InformationCircleIcon
                    className="w-5 h-5 mr-2"
                    style={{ color: colors.textMuted }}
                  />
                  <span>Metadata</span>
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-20"
                    style={{
                      background: `linear-gradient(90deg, ${colors.textMuted}, transparent)`,
                    }}
                  />
                </div>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <InputField
                  name="created_at"
                  label="Created At"
                  type="text"
                  value={formData.created_at || ""}
                  onChange={handleChange}
                  disabled={true}
                />
                <InputField
                  name="updated_at"
                  label="Last Updated At"
                  type="text"
                  value={formData.updated_at || ""}
                  onChange={handleChange}
                  disabled={true}
                />
              </div>

              {/* Enhanced Submit Button Area */}
              <div
                className="pt-8 mt-10 border-t flex flex-col sm:flex-row items-center justify-between gap-6"
                style={{ borderColor: colors.accent + "40" }}
              >
                <div
                  className="flex items-center bg-black/20 px-4 py-3 rounded-lg border"
                  style={{ borderColor: colors.warning + "30" }}
                >
                  <InformationCircleIcon
                    className="h-6 w-6 mr-3 flex-shrink-0"
                    style={{ color: colors.warning }}
                  />
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    Fields marked with an{" "}
                    <span className="text-yellow-400 font-medium">
                      asterisk (*)
                    </span>{" "}
                    are required. Scores are automatically calculated upon
                    submission.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Link
                    to={`/suppliers/${id}`}
                    className="px-5 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center transition-all hover:scale-105"
                    style={{
                      borderColor: colors.accent + "40",
                      color: colors.accent,
                      background: "rgba(0,0,0,0.3)",
                    }}
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Discard Changes
                  </Link>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-7 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center disabled:opacity-60 relative overflow-hidden group"
                    style={{
                      backgroundColor: colors.success,
                      color: colors.background,
                      border: `1px solid ${colors.success}`,
                    }}
                  >
                    {/* Animated gradient overlay on hover */}
                    <span
                      className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-20 transition-opacity"
                      style={{
                        background: `linear-gradient(90deg, ${colors.success}, ${colors.primary}, ${colors.success})`,
                        backgroundSize: "200% 100%",
                        animation: "gradientMove 2s linear infinite",
                      }}
                    />

                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                        <span className="relative">Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        <span className="relative">Save Supplier Data</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Add a pulsing style for the gradient animation */}
              <style jsx>{`
                @keyframes gradientMove {
                  0% {
                    background-position: 0% 50%;
                  }
                  50% {
                    background-position: 100% 50%;
                  }
                  100% {
                    background-position: 0% 50%;
                  }
                }
              `}</style>
            </motion.div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupplierEditForm;
