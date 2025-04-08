import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addSupplier } from "../services/api";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  UserCircleIcon,
  GlobeAmericasIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  TruckIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

// --- Reusing Theme Colors from SupplierEditForm ---
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
  blue: "#4D5BFF", // Keep blue separately for some UI elements
};

// --- UI Components ---
const LoadingIndicator = ({ message = "Processing..." }) => (
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
    <p style={{ color: colors.text }}>
      {message || "An error occurred while processing your request."}
    </p>
  </div>
);

// --- Input Components ---
const InputField = ({
  name,
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  min = undefined,
  max = undefined,
}) => (
  <div className="mb-4">
    <label
      htmlFor={name}
      className="block text-sm font-medium mb-1"
      style={{ color: colors.textMuted }}
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
      style={{
        backgroundColor: colors.inputBg,
        borderColor: colors.accent + "50",
        color: colors.text,
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
  required = false,
  disabled = false,
}) => (
  <div className="mb-4 relative">
    <label
      htmlFor={name}
      className="block text-sm font-medium mb-1"
      style={{ color: colors.textMuted }}
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`w-full appearance-none pl-3 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2 ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
      style={{
        backgroundColor: colors.inputBg,
        borderColor: colors.accent + "50",
        color: colors.text,
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
    <div
      className="absolute right-3 top-9 h-5 w-5 pointer-events-none"
      style={{ color: colors.textMuted }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
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

const AddSupplier = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form sections initial state
  const [formData, setFormData] = useState({
    // Basic info
    name: "",
    country: "",
    industry: "Manufacturing",
    description: "",
    website: "",

    // Environmental metrics
    co2_emissions: 50,
    water_usage: 50,
    energy_efficiency: 0.5,
    waste_management_score: 0.5,
    renewable_energy_percent: 30,
    pollution_control: 0.5,

    // Social metrics
    wage_fairness: 0.5,
    human_rights_index: 0.5,
    diversity_inclusion_score: 0.5,
    community_engagement: 0.5,
    worker_safety: 0.5,

    // Governance metrics
    transparency_score: 0.5,
    corruption_risk: 0.5,
    board_diversity: 0.5,
    ethics_program: 0.5,
    compliance_systems: 0.5,

    // Supply chain metrics
    delivery_efficiency: 0.5,
    quality_control_score: 0.5,
    supplier_diversity: 0.5,
    traceability: 0.5,

    // Risk factors
    geopolitical_risk: 0.5,
    climate_risk: 0.5,
    labor_dispute_risk: 0.5,
  });

  // Form field options
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

  // Handle form changes
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value, type } = e.target;
      let processedValue: string | number | null = value;

      // Handle numeric types (range sliders or explicit number inputs)
      if (
        type === "range" ||
        ((e.target as HTMLInputElement).dataset &&
          (e.target as HTMLInputElement).dataset.type === "number")
      ) {
        processedValue = value === "" ? null : parseFloat(value) || 0;

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.country || !formData.industry) {
      setError("Supplier name, country, and industry are required fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      // Send data to API
      const response = await addSupplier(formData);

      if (!response || !response.id) {
        throw new Error("Invalid response from server");
      }

      console.log("Supplier added successfully:", response);

      // Handle success
      setSuccess(true);

      // Scroll to top to ensure user sees the success message
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Navigate to supplier details after a short delay
      setTimeout(() => {
        navigate(`/suppliers/${response.id}`);
      }, 2000);
    } catch (err) {
      console.error("Error adding supplier:", err);

      // Handle error
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add supplier. Please check your input and try again."
      );

      // Scroll to top to ensure user sees the error
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (isSubmitting) {
    return (
      <div
        className="min-h-screen p-8 flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <LoadingIndicator message="Creating New Supplier..." />
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
              <PlusCircleIcon
                className="w-10 h-10 mr-4"
                style={{ color: colors.secondary }}
              />
              <h1 className="text-4xl font-bold tracking-tight">
                Add <span style={{ color: colors.primary }}>Supplier</span>
              </h1>
            </div>
            <p
              className="mt-2 ml-14 text-lg"
              style={{ color: colors.textMuted }}
            >
              Register a new supplier with detailed information for
              comprehensive analysis
            </p>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            <Link
              to="/suppliers"
              className="flex items-center px-4 py-2 rounded-lg border transition-all hover:scale-105"
              style={{
                color: colors.accent,
                borderColor: colors.accent + "50",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Suppliers
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
              Supplier Registration Form
            </h3>
            <p style={{ color: colors.text }} className="mb-3 leading-relaxed">
              Add a new supplier to your sustainability platform. Complete the
              form below to register supplier details for future assessment and
              analysis. Suppliers can be evaluated based on ESG (Environmental,
              Social, Governance) criteria.
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
                  Environmental Metrics
                </h4>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Track carbon footprint, waste management, and resource
                  efficiency
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
                  stability
                </p>
              </div>
            </div>
            <p
              className="mt-2 text-sm flex items-center"
              style={{ color: colors.accent }}
            >
              <span className="animate-pulse mr-2">→</span>
              Fields marked with an asterisk (*) are required
            </p>
          </div>
        </div>
      </motion.div>

      {/* Display Success/Error Messages */}
      {error && <ErrorDisplay message={error} />}
      {success && (
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
                Success!
              </h4>
              <p style={{ color: colors.text }}>
                Supplier added successfully. Redirecting to supplier details...
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Form Layout with Side Navigation */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Side Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:w-64 flex-shrink-0 bg-opacity-80 backdrop-blur-sm p-4 rounded-lg border sticky top-4 self-start"
          style={{
            backgroundColor: colors.panel,
            borderColor: colors.accent + "40",
            maxHeight: "calc(100vh - 40px)",
          }}
        >
          <h3
            className="text-sm uppercase font-semibold mb-4 pl-2"
            style={{ color: colors.textMuted }}
          >
            Form Sections
          </h3>
          <div className="space-y-1 overflow-y-auto">
            <a
              href="#basic-info"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <UserCircleIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.primary }}
              />
              Basic Information
            </a>

            <a
              href="#environmental"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <GlobeAmericasIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.success }}
              />
              Environmental Metrics
            </a>

            <a
              href="#social"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <UserGroupIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.accent }}
              />
              Social Responsibility
            </a>

            <a
              href="#governance"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <DocumentChartBarIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.secondary }}
              />
              Governance Structure
            </a>

            <a
              href="#supply-chain"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <TruckIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.blue }}
              />
              Supply Chain Metrics
            </a>

            <a
              href="#risk-factors"
              className="flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
              style={{ color: colors.text }}
            >
              <ExclamationTriangleIcon
                className="h-4 w-4 mr-2"
                style={{ color: colors.warning }}
              />
              Risk Factors
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
              {/* Form Sections */}
              <h2
                className="text-xl font-bold mb-6 pb-2 relative"
                id="basic-info"
                style={{
                  borderBottom: `2px solid ${colors.primary}40`,
                  display: "inline-block",
                  paddingRight: "50px",
                }}
              >
                <div className="flex items-center">
                  <UserCircleIcon
                    className="w-5 h-5 mr-2"
                    style={{ color: colors.primary }}
                  />
                  <span>Basic Information</span>
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
                    label="Supplier Name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required={true}
                  />
                  <SelectField
                    name="country"
                    label="Country"
                    value={formData.country || ""}
                    onChange={handleChange}
                    options={countries}
                    required={true}
                  />
                  <SelectField
                    name="industry"
                    label="Industry"
                    value={formData.industry || ""}
                    onChange={handleChange}
                    options={industries}
                    required={true}
                  />

                  <div className="md:col-span-3">
                    <InputField
                      name="website"
                      label="Website"
                      type="url"
                      value={formData.website || ""}
                      onChange={handleChange}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium mb-1"
                      style={{ color: colors.textMuted }}
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.accent + "50",
                        color: colors.text,
                      }}
                    />
                    <p
                      className="mt-2 text-xs"
                      style={{ color: colors.textMuted }}
                    >
                      Brief description of the supplier's business and
                      operations
                    </p>
                  </div>
                </div>
              </div>

              {/* Environmental Section */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <InputField
                    name="co2_emissions"
                    label="CO₂ Emissions (tons)"
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
                    name="energy_efficiency"
                    label="Energy Efficiency Score"
                    value={formData.energy_efficiency ?? 0.5}
                    onChange={handleChange}
                  />
                  <SliderField
                    name="waste_management_score"
                    label="Waste Management Score"
                    value={formData.waste_management_score ?? 0.5}
                    onChange={handleChange}
                  />
                  <InputField
                    name="renewable_energy_percent"
                    label="Renewable Energy (%)"
                    type="number"
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

              {/* Social Section */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
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

              {/* Governance Section */}
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
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
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
              </div>

              {/* Supply Chain Section */}
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
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
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
              </div>

              {/* Risk Factors Section */}
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
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
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
                    are required. Scores will be automatically calculated upon
                    submission.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Link
                    to="/suppliers"
                    className="px-5 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center transition-all hover:scale-105"
                    style={{
                      borderColor: colors.accent + "40",
                      color: colors.accent,
                      background: "rgba(0,0,0,0.3)",
                    }}
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Cancel
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
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        <span className="relative">Create Supplier</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Add a style tag without jsx prop */}
              <style>
                {`
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
                `}
              </style>
            </motion.div>
          </form>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-100">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              About this form
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This comprehensive form collects detailed supplier information
                for sustainability and ethical assessment. All fields marked
                with * are required. After submission, the data will be
                processed by our AI to generate ethical scores and
                recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSupplier;
