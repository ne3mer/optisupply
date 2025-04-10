import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSuppliers,
  getSupplier,
  evaluateSupplier,
  Supplier,
  SupplierEvaluation,
  EvaluationResult,
} from "../../services/api"; // Correct path?
import {
  // ... keep existing icons ...
  InformationCircleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  UserCircleIcon, // Basic
  GlobeEuropeAfricaIcon, // Environmental
  UsersIcon, // Social
  BuildingLibraryIcon, // Governance
  TruckIcon, // Supply Chain
  ShieldExclamationIcon, // Risk
  ClipboardDocumentListIcon, // Results
  ArrowLeftIcon, // Navigation
  ArrowRightIcon, // Navigation
  ExclamationTriangleIcon, // Error display
  ChevronDownIcon, // Select dropdown
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

// --- Reusing Theme Colors & Helpers ---
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

// Helper for coloring score values
const getScoreColor = (score: number): string => {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.primary;
  if (score >= 40) return colors.warning;
  return colors.error;
};

// Helper to safely format numeric values
const safeFormat = (
  value: number | undefined | null,
  decimals: number = 1
): string => {
  if (value === undefined || value === null) return "N/A";
  return value.toFixed(decimals);
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

// --- Main Component ---
const SupplierAssessment = () => {
  const { id: supplierId } = useParams();
  const navigate = useNavigate();

  const countries = [
    "United States",
    "China",
    /* ... other countries ... */ "Other",
  ];
  const industries = [
    "Manufacturing",
    "Technology",
    /* ... other industries ... */ "Other",
  ];

  // Sections definition
  const sections = {
    basic: { name: "Basic Information", icon: UserCircleIcon },
    environmental: {
      name: "Environmental Impact",
      icon: GlobeEuropeAfricaIcon,
    },
    social: { name: "Social Responsibility", icon: UsersIcon },
    governance: { name: "Governance & Ethics", icon: BuildingLibraryIcon },
    supply_chain: { name: "Supply Chain Practices", icon: TruckIcon },
    risk: { name: "Risk Factors", icon: ShieldExclamationIcon },
    results: { name: "Assessment Results", icon: ClipboardDocumentListIcon },
  };
  const sectionKeys = Object.keys(sections).filter((key) => key !== "results");

  // State
  const [formData, setFormData] = useState<SupplierEvaluation>({
    name: "",
    country: "",
    industry: "",
    co2_emissions: 50,
    water_usage: 50,
    energy_efficiency: 0.5,
    waste_management_score: 0.5,
    renewable_energy_percent: 20,
    pollution_control: 0.5,
    wage_fairness: 0.5,
    human_rights_index: 0.5,
    diversity_inclusion_score: 0.5,
    community_engagement: 0.5,
    worker_safety: 0.5,
    transparency_score: 0.5,
    corruption_risk: 0.5,
    board_diversity: 0.5,
    ethics_program: 0.5,
    compliance_systems: 0.5,
    delivery_efficiency: 0.5,
    quality_control_score: 0.5,
    supplier_diversity: 0.5,
    traceability: 0.5,
    geopolitical_risk: 0.5,
    climate_risk: 0.5,
    labor_dispute_risk: 0.5,
    // Add supplier_id if needed by API
    supplier_id: supplierId ?? undefined,
  });
  const [loadingSupplier, setLoadingSupplier] = useState(!!supplierId);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("basic"); // Changed from activeSection
  const [usingMockData, setUsingMockData] = useState(false); // Keep this for demo mode indication

  // --- Fetch Initial Data ---
  useEffect(() => {
    const loadSupplierData = async () => {
      if (!supplierId) return;
      try {
        setLoadingSupplier(true);
        setError(null);

        // Use direct getSupplier call for better performance
        console.log(`Loading supplier ${supplierId} for assessment...`);
        try {
          const supplier = await getSupplier(supplierId);
          console.log("Found supplier for assessment:", supplier);

          if (supplier) {
            // Pre-fill form data with supplier information
            setFormData((prev) => ({
              ...prev,
              name: supplier.name || "",
              country: supplier.country || "",
              industry: supplier.industry || "",
              co2_emissions: supplier.co2_emissions ?? prev.co2_emissions,
              water_usage: supplier.water_usage ?? prev.water_usage,
              energy_efficiency:
                supplier.energy_efficiency ?? prev.energy_efficiency,
              waste_management_score:
                supplier.waste_management_score ?? prev.waste_management_score,
              renewable_energy_percent:
                supplier.renewable_energy_percent ??
                prev.renewable_energy_percent,
              pollution_control:
                supplier.pollution_control ?? prev.pollution_control,
              wage_fairness: supplier.wage_fairness ?? prev.wage_fairness,
              human_rights_index:
                supplier.human_rights_index ?? prev.human_rights_index,
              diversity_inclusion_score:
                supplier.diversity_inclusion_score ??
                prev.diversity_inclusion_score,
              community_engagement:
                supplier.community_engagement ?? prev.community_engagement,
              worker_safety: supplier.worker_safety ?? prev.worker_safety,
              transparency_score:
                supplier.transparency_score ?? prev.transparency_score,
              corruption_risk: supplier.corruption_risk ?? prev.corruption_risk,
              board_diversity: supplier.board_diversity ?? prev.board_diversity,
              ethics_program: supplier.ethics_program ?? prev.ethics_program,
              compliance_systems:
                supplier.compliance_systems ?? prev.compliance_systems,
              delivery_efficiency:
                supplier.delivery_efficiency ?? prev.delivery_efficiency,
              quality_control_score:
                supplier.quality_control_score ?? prev.quality_control_score,
              supplier_diversity:
                supplier.supplier_diversity ?? prev.supplier_diversity,
              traceability: supplier.traceability ?? prev.traceability,
              geopolitical_risk:
                supplier.geopolitical_risk ?? prev.geopolitical_risk,
              climate_risk: supplier.climate_risk ?? prev.climate_risk,
              labor_dispute_risk:
                supplier.labor_dispute_risk ?? prev.labor_dispute_risk,
              supplier_id: supplier._id || supplier.id, // Ensure ID is passed if needed
            }));
            setUsingMockData(supplier.isMockData === true);
          }
        } catch (directFetchError) {
          console.warn(
            "Direct fetch failed, trying list lookup:",
            directFetchError
          );

          // Fallback: Try to find the supplier in the list
          const suppliersList = await getSuppliers();
          const supplier = suppliersList.find(
            (s) => s._id === supplierId || s.id === supplierId
          );

          if (supplier) {
            // Same data setting as above
            setFormData((prev) => ({
              ...prev,
              name: supplier.name || "",
              country: supplier.country || "",
              industry: supplier.industry || "",
              co2_emissions: supplier.co2_emissions ?? prev.co2_emissions,
              water_usage: supplier.water_usage ?? prev.water_usage,
              energy_efficiency:
                supplier.energy_efficiency ?? prev.energy_efficiency,
              waste_management_score:
                supplier.waste_management_score ?? prev.waste_management_score,
              renewable_energy_percent:
                supplier.renewable_energy_percent ??
                prev.renewable_energy_percent,
              pollution_control:
                supplier.pollution_control ?? prev.pollution_control,
              wage_fairness: supplier.wage_fairness ?? prev.wage_fairness,
              human_rights_index:
                supplier.human_rights_index ?? prev.human_rights_index,
              diversity_inclusion_score:
                supplier.diversity_inclusion_score ??
                prev.diversity_inclusion_score,
              community_engagement:
                supplier.community_engagement ?? prev.community_engagement,
              worker_safety: supplier.worker_safety ?? prev.worker_safety,
              transparency_score:
                supplier.transparency_score ?? prev.transparency_score,
              corruption_risk: supplier.corruption_risk ?? prev.corruption_risk,
              board_diversity: supplier.board_diversity ?? prev.board_diversity,
              ethics_program: supplier.ethics_program ?? prev.ethics_program,
              compliance_systems:
                supplier.compliance_systems ?? prev.compliance_systems,
              delivery_efficiency:
                supplier.delivery_efficiency ?? prev.delivery_efficiency,
              quality_control_score:
                supplier.quality_control_score ?? prev.quality_control_score,
              supplier_diversity:
                supplier.supplier_diversity ?? prev.supplier_diversity,
              traceability: supplier.traceability ?? prev.traceability,
              geopolitical_risk:
                supplier.geopolitical_risk ?? prev.geopolitical_risk,
              climate_risk: supplier.climate_risk ?? prev.climate_risk,
              labor_dispute_risk:
                supplier.labor_dispute_risk ?? prev.labor_dispute_risk,
              supplier_id: supplier._id || supplier.id,
            }));
            setUsingMockData(supplier.isMockData === true);
          } else {
            setError(`Supplier with ID ${supplierId} not found.`);
          }
        }
      } catch (err) {
        setError(
          `Failed to load supplier data: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoadingSupplier(false);
      }
    };
    loadSupplierData();
  }, [supplierId]);

  // --- Form Handling ---
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value, type } = e.target;
      let processedValue: string | number = value;

      if (
        type === "range" ||
        (e.target instanceof HTMLInputElement &&
          e.target.dataset.type === "number")
      ) {
        processedValue = parseFloat(value) || 0;
        // Apply constraints if needed (e.g., min/max for sliders)
        if (
          name === "energy_efficiency" ||
          name.includes("score") ||
          name.includes("risk") ||
          name === "traceability"
        ) {
          processedValue = Math.max(0, Math.min(1, processedValue));
        }
        if (name === "renewable_energy_percent") {
          processedValue = Math.max(0, Math.min(100, processedValue));
        }
      }

      setFormData((prev) => ({
        ...prev,
        [name]: processedValue,
      }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    console.log("Submitting Form Data:", formData);
    try {
      const evaluation = await evaluateSupplier(formData);
      console.log("Evaluation Result:", evaluation);

      // Validate that we have the required data to display results
      if (!evaluation || typeof evaluation !== "object") {
        throw new Error("Invalid evaluation result received");
      }

      // Check critical fields needed for display
      if (
        evaluation.ethical_score === undefined ||
        !evaluation.assessment ||
        !evaluation.assessment.strengths
      ) {
        console.warn(
          "Evaluation result is missing critical fields, may display incorrectly"
        );
      }

      setResult(evaluation);
      setActiveTab("results");
      setUsingMockData(evaluation.isMockData === true);

      // If using mock data, show a user-friendly notification
      if (evaluation.isMockData) {
        console.info(
          "Note: Displaying mock assessment data - backend API may be unavailable"
        );
      }
    } catch (error) {
      console.error("Error during assessment:", error);
      setError(
        `Assessment failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      // Attempt to show partial results if available
      if (result) {
        console.warn("Showing previous assessment results despite error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Section Navigation ---
  const currentSectionIndex = sectionKeys.indexOf(activeTab);
  const nextSection = () => {
    if (currentSectionIndex < sectionKeys.length - 1) {
      setActiveTab(sectionKeys[currentSectionIndex + 1]);
    }
  };
  const prevSection = () => {
    if (currentSectionIndex > 0) {
      setActiveTab(sectionKeys[currentSectionIndex - 1]);
    }
  };

  // --- Input Component Abstraction ---
  const InputField = ({
    name,
    label,
    type = "text",
    value,
    onChange,
    placeholder = "",
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
        className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2"
        style={{
          backgroundColor: colors.inputBg,
          borderColor: colors.accent + "50",
          color: colors.text,
          "--tw-ring-color": colors.primary,
        }}
      />
    </div>
  );

  const SelectField = ({ name, label, value, onChange, options }) => (
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
        className="w-full appearance-none pl-3 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2"
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
  }) => (
    <div
      className="flex flex-col mb-4 border p-4 rounded"
      style={{ borderColor: colors.accent + "30" }}
    >
      <label
        htmlFor={name}
        className="block text-sm mb-1"
        style={{ color: colors.text }}
      >
        {label}
      </label>
      <div className="flex items-center gap-4">
        <input
          type="range"
          id={name}
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="w-full"
        />
        <span
          className="text-sm font-mono min-w-[60px] text-right"
          style={{ color: colors.accent }}
        >
          {value !== undefined && value !== null
            ? safeFormat(value, unit === "%" ? 0 : 2) + unit
            : "N/A" + unit}
        </span>
      </div>
    </div>
  );

  // --- Render Logic ---
  if (loadingSupplier && supplierId) {
    return (
      <div
        className="min-h-screen p-8 flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <LoadingIndicator message="Loading Supplier Dossier for Assessment..." />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          Supplier{" "}
          <span style={{ color: colors.primary }}>Assessment Protocol</span>
        </h1>
        <p style={{ color: colors.textMuted }}>
          {supplierId
            ? `Evaluating Supplier ID: ${supplierId}`
            : "Conducting New Supplier Assessment"}
        </p>
        {usingMockData && (
          <div
            className="mt-2 flex items-center p-2 rounded border text-xs"
            style={{
              borderColor: colors.warning + "50",
              backgroundColor: colors.warning + "10",
              color: colors.warning,
            }}
          >
            <InformationCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            Demo Mode: Using sample data. Submission will use mock results.
          </div>
        )}
      </motion.div>

      {/* Main Form Area */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Tabs/Progress Indicator */}
        <div className="mb-6 border-b border-gray-700">
          <nav
            className="-mb-px flex space-x-6 overflow-x-auto"
            aria-label="Tabs"
          >
            {Object.entries(sections).map(([key, { name, icon: Icon }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium flex items-center transition-colors duration-200
                                ${
                                  activeTab === key
                                    ? "border-primary text-primary"
                                    : "border-transparent text-textMuted hover:text-text hover:border-gray-500"
                                }`}
                style={{
                  color: activeTab === key ? colors.primary : colors.textMuted,
                  borderColor:
                    activeTab === key ? colors.primary : "transparent",
                }}
              >
                <Icon
                  className={`mr-2 h-5 w-5 ${
                    activeTab === key ? "text-primary" : "text-textMuted"
                  }`}
                />
                {name}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content Panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6 rounded-lg border backdrop-blur-sm"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            {error && <ErrorDisplay message={error} />}{" "}
            {/* Display errors within the panel */}
            {/* Render current section form */}
            {activeTab === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <InputField
                  name="name"
                  label="Supplier Name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Acme Corporation"
                />
                <SelectField
                  name="country"
                  label="Country"
                  value={formData.country}
                  onChange={handleChange}
                  options={countries}
                />
                <SelectField
                  name="industry"
                  label="Industry"
                  value={formData.industry}
                  onChange={handleChange}
                  options={industries}
                />
                {/* Add other basic fields if needed */}
              </div>
            )}
            {activeTab === "environmental" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <SliderField
                  name="co2_emissions"
                  label="CO₂ Emissions (Tons/Year)"
                  value={formData.co2_emissions}
                  min={0}
                  max={100000}
                  step={100}
                  onChange={handleChange}
                />
                <SliderField
                  name="water_usage"
                  label="Water Usage (m³/Year)"
                  value={formData.water_usage}
                  min={0}
                  max={1000000}
                  step={1000}
                  onChange={handleChange}
                />
                <SliderField
                  name="energy_efficiency"
                  label="Energy Efficiency Score"
                  value={formData.energy_efficiency}
                  onChange={handleChange}
                />
                <SliderField
                  name="waste_management_score"
                  label="Waste Management Score"
                  value={formData.waste_management_score}
                  onChange={handleChange}
                />
                <SliderField
                  name="renewable_energy_percent"
                  label="Renewable Energy %"
                  value={formData.renewable_energy_percent}
                  min={0}
                  max={100}
                  step={1}
                  onChange={handleChange}
                  unit="%"
                />
                <SliderField
                  name="pollution_control"
                  label="Pollution Control Score"
                  value={formData.pollution_control}
                  onChange={handleChange}
                />
              </div>
            )}
            {activeTab === "social" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <SliderField
                  name="wage_fairness"
                  label="Wage Fairness Score"
                  value={formData.wage_fairness}
                  onChange={handleChange}
                />
                <SliderField
                  name="human_rights_index"
                  label="Human Rights Index"
                  value={formData.human_rights_index}
                  onChange={handleChange}
                />
                <SliderField
                  name="diversity_inclusion_score"
                  label="Diversity & Inclusion Score"
                  value={formData.diversity_inclusion_score}
                  onChange={handleChange}
                />
                <SliderField
                  name="community_engagement"
                  label="Community Engagement Score"
                  value={formData.community_engagement}
                  onChange={handleChange}
                />
                <SliderField
                  name="worker_safety"
                  label="Worker Safety Score"
                  value={formData.worker_safety}
                  onChange={handleChange}
                />
              </div>
            )}
            {activeTab === "governance" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <SliderField
                  name="transparency_score"
                  label="Transparency Score"
                  value={formData.transparency_score}
                  onChange={handleChange}
                />
                <SliderField
                  name="corruption_risk"
                  label="Corruption Risk Score"
                  value={formData.corruption_risk}
                  onChange={handleChange}
                />
                <SliderField
                  name="board_diversity"
                  label="Board Diversity Score"
                  value={formData.board_diversity}
                  onChange={handleChange}
                />
                <SliderField
                  name="ethics_program"
                  label="Ethics Program Strength"
                  value={formData.ethics_program}
                  onChange={handleChange}
                />
                <SliderField
                  name="compliance_systems"
                  label="Compliance Systems Score"
                  value={formData.compliance_systems}
                  onChange={handleChange}
                />
              </div>
            )}
            {activeTab === "supply_chain" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <SliderField
                  name="delivery_efficiency"
                  label="Delivery Efficiency Score"
                  value={formData.delivery_efficiency}
                  onChange={handleChange}
                />
                <SliderField
                  name="quality_control_score"
                  label="Quality Control Score"
                  value={formData.quality_control_score}
                  onChange={handleChange}
                />
                <SliderField
                  name="supplier_diversity"
                  label="Supplier Diversity Score"
                  value={formData.supplier_diversity}
                  onChange={handleChange}
                />
                <SliderField
                  name="traceability"
                  label="Traceability Score"
                  value={formData.traceability}
                  onChange={handleChange}
                />
              </div>
            )}
            {activeTab === "risk" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <SliderField
                  name="geopolitical_risk"
                  label="Geopolitical Risk Exposure"
                  value={formData.geopolitical_risk}
                  onChange={handleChange}
                />
                <SliderField
                  name="climate_risk"
                  label="Climate Risk Exposure"
                  value={formData.climate_risk}
                  onChange={handleChange}
                />
                <SliderField
                  name="labor_dispute_risk"
                  label="Labor Dispute Risk"
                  value={formData.labor_dispute_risk}
                  onChange={handleChange}
                />
              </div>
            )}
            {/* Results Display */}
            {activeTab === "results" && (
              <div>
                {isSubmitting && (
                  <LoadingIndicator message="Evaluating Supplier..." />
                )}
                {!isSubmitting && result && (
                  <div className="space-y-4">
                    <h3
                      className="text-xl font-semibold border-b pb-2 mb-4"
                      style={{
                        color: colors.primary,
                        borderColor: colors.accent + "30",
                      }}
                    >
                      Assessment Complete
                    </h3>
                    {usingMockData && (
                      <p
                        className="text-xs p-2 rounded border"
                        style={{
                          borderColor: colors.warning + "50",
                          backgroundColor: colors.warning + "10",
                          color: colors.warning,
                        }}
                      >
                        Note: Displaying mock results as Demo Mode is active.
                      </p>
                    )}
                    {/* Display Key Scores */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div
                        className="p-3 rounded border text-center"
                        style={{
                          borderColor: colors.accent + "30",
                          backgroundColor: colors.background,
                        }}
                      >
                        <p
                          className="text-xs uppercase"
                          style={{ color: colors.textMuted }}
                        >
                          Ethical
                        </p>
                        <p
                          className="text-2xl font-bold font-mono"
                          style={{ color: getScoreColor(result.ethical_score) }}
                        >
                          {safeFormat(result.ethical_score)}
                        </p>
                      </div>
                      <div
                        className="p-3 rounded border text-center"
                        style={{
                          borderColor: colors.accent + "30",
                          backgroundColor: colors.background,
                        }}
                      >
                        <p
                          className="text-xs uppercase"
                          style={{ color: colors.textMuted }}
                        >
                          Environmental
                        </p>
                        <p
                          className="text-2xl font-bold font-mono"
                          style={{
                            color: getScoreColor(result.environmental_score),
                          }}
                        >
                          {safeFormat(result.environmental_score)}
                        </p>
                      </div>
                      <div
                        className="p-3 rounded border text-center"
                        style={{
                          borderColor: colors.accent + "30",
                          backgroundColor: colors.background,
                        }}
                      >
                        <p
                          className="text-xs uppercase"
                          style={{ color: colors.textMuted }}
                        >
                          Social
                        </p>
                        <p
                          className="text-2xl font-bold font-mono"
                          style={{ color: getScoreColor(result.social_score) }}
                        >
                          {safeFormat(result.social_score)}
                        </p>
                      </div>
                      <div
                        className="p-3 rounded border text-center"
                        style={{
                          borderColor: colors.accent + "30",
                          backgroundColor: colors.background,
                        }}
                      >
                        <p
                          className="text-xs uppercase"
                          style={{ color: colors.textMuted }}
                        >
                          Governance
                        </p>
                        <p
                          className="text-2xl font-bold font-mono"
                          style={{
                            color: getScoreColor(result.governance_score),
                          }}
                        >
                          {safeFormat(result.governance_score)}
                        </p>
                      </div>
                    </div>

                    {/* Display SWOT/Recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {result.assessment && (
                        <div className="space-y-3">
                          <h4
                            className="font-semibold"
                            style={{ color: colors.secondary }}
                          >
                            SWOT Analysis
                          </h4>
                          <ul
                            className="list-disc list-inside text-sm space-y-1 pl-2"
                            style={{ color: colors.textMuted }}
                          >
                            {result.assessment.strengths?.map((s, i) => (
                              <li key={i}>
                                <span className="font-medium text-green-400">
                                  Strength:
                                </span>{" "}
                                {s}
                              </li>
                            ))}
                            {result.assessment.weaknesses?.map((w, i) => (
                              <li key={i}>
                                <span className="font-medium text-red-400">
                                  Weakness:
                                </span>{" "}
                                {w}
                              </li>
                            ))}
                            {result.assessment.opportunities?.map((o, i) => (
                              <li key={i}>
                                <span className="font-medium text-blue-400">
                                  Opportunity:
                                </span>{" "}
                                {o}
                              </li>
                            ))}
                            {result.assessment.threats?.map((t, i) => (
                              <li key={i}>
                                <span className="font-medium text-yellow-400">
                                  Threat:
                                </span>{" "}
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="space-y-3">
                        <h4
                          className="font-semibold"
                          style={{ color: colors.secondary }}
                        >
                          Recommendation & Suggestions
                        </h4>
                        <p
                          className="text-sm italic p-3 rounded border"
                          style={{
                            borderColor: colors.accent + "30",
                            backgroundColor: colors.background,
                          }}
                        >
                          {result.recommendation ||
                            "No specific recommendation provided."}
                        </p>
                        {result.suggestions &&
                          result.suggestions.length > 0 && (
                            <ul
                              className="list-decimal list-inside text-sm space-y-1 pl-2"
                              style={{ color: colors.textMuted }}
                            >
                              {result.suggestions.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          )}
                      </div>
                    </div>
                    {/* Add other result details: risk factors, compliance, industry comparison */}
                  </div>
                )}
                {!isSubmitting && !result && (
                  <p
                    className="text-center py-10"
                    style={{ color: colors.textMuted }}
                  >
                    Submit the form to view assessment results.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation & Submit Buttons */}
        {activeTab !== "results" && (
          <div
            className="flex justify-between items-center pt-6 border-t"
            style={{ borderColor: colors.accent + "30" }}
          >
            <button
              type="button"
              onClick={prevSection}
              disabled={currentSectionIndex === 0}
              className="px-4 py-2 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
              style={{
                borderColor: colors.accent,
                color: colors.accent,
              }}
              hover={{ backgroundColor: colors.accent + "10" }}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" /> Previous
            </button>

            {currentSectionIndex === sectionKeys.length - 1 ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded border text-sm font-semibold flex items-center justify-center transition-opacity disabled:opacity-60"
                style={{
                  backgroundColor: colors.success,
                  color: colors.background,
                  borderColor: colors.success,
                }}
              >
                {isSubmitting ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />{" "}
                    Submitting...
                  </>
                ) : (
                  "Submit Assessment"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextSection}
                className="px-4 py-2 rounded border text-sm flex items-center transition-colors"
                style={{
                  borderColor: colors.accent,
                  color: colors.accent,
                }}
                hover={{ backgroundColor: colors.accent + "10" }}
              >
                Next <ArrowRightIcon className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        )}
        {activeTab === "results" && (
          <div
            className="flex justify-end pt-6 border-t"
            style={{ borderColor: colors.accent + "30" }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("basic")} // Go back to start
              className="px-4 py-2 rounded border text-sm flex items-center transition-colors"
              style={{
                borderColor: colors.accent,
                color: colors.accent,
              }}
              hover={{ backgroundColor: colors.accent + "10" }}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" /> Start New Assessment
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SupplierAssessment;
