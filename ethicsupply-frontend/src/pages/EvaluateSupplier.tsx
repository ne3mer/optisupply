import { useState, useEffect, useRef } from "react";
import { evaluateSupplier, getSupplier } from "../services/api";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BuildingOfficeIcon,
  GlobeAltIcon,
  UserGroupIcon,
  LightBulbIcon,
  TruckIcon,
  SparklesIcon,
  InformationCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  CloudIcon,
  ScaleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";

// Define theme colors
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

// Define types for the form data
interface FormData {
  name: string;
  country: string;
  industry: string;
  co2_emissions: string;
  water_usage: string;
  energy_efficiency: string;
  waste_management_score: string;
  renewable_energy_percent: string;
  pollution_control: string;

  wage_fairness: string;
  human_rights_index: string;
  diversity_inclusion_score: string;
  community_engagement: string;
  worker_safety: string;

  transparency_score: string;
  corruption_risk: string;
  board_diversity: string;
  ethics_program: string;
  compliance_systems: string;

  delivery_efficiency: string;
  quality_control_score: string;
  supplier_diversity: string;
  traceability: string;

  geopolitical_risk: string;
  climate_risk: string;
  labor_dispute_risk: string;

  [key: string]: string; // Index signature to allow field.name access
}

// Define the evaluation result type with enhanced fields
interface EvaluationResult {
  name: string;
  ethical_score: number;
  environmental_score: number;
  social_score: number;
  governance_score: number;
  supply_chain_score: number;
  risk_score: number;

  assessment?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };

  recommendation?: string;
  suggestions?: string[];

  risk_factors?: {
    factor: string;
    severity: string;
    probability: string;
    mitigation: string;
  }[];

  compliance?: {
    status: string;
    standards_met: string[];
    certifications: string[];
    gaps: string[];
  };

  industry_comparison?: {
    percentile: number;
    average_score: number;
    top_performer_score: number;
  };

  isMockData?: boolean;
}

const EvaluateSupplier = () => {
  const [searchParams] = useSearchParams();
  const supplierId = searchParams.get("id");
  const formRef = useRef<HTMLDivElement>(null);

  // Add list of countries
  const countries = [
    "United States",
    "China",
    "India",
    "Germany",
    "United Kingdom",
    "France",
    "Brazil",
    "Italy",
    "Canada",
    "Japan",
    "South Korea",
    "Australia",
    "Spain",
    "Mexico",
    "Indonesia",
    "Netherlands",
    "Saudi Arabia",
    "Turkey",
    "Switzerland",
    "Poland",
    "Thailand",
    "Sweden",
    "Belgium",
    "Nigeria",
    "Austria",
    "Norway",
    "United Arab Emirates",
    "Israel",
    "Ireland",
    "Singapore",
    "Vietnam",
    "Malaysia",
    "Denmark",
    "Philippines",
    "Pakistan",
    "Colombia",
    "Chile",
    "Finland",
    "Bangladesh",
    "Egypt",
    "South Africa",
    "New Zealand",
    "Argentina",
    "Other",
  ];

  // Industry options
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

  // Extended initial form data
  const [formData, setFormData] = useState<FormData>({
    name: "",
    country: "",
    industry: "",
    co2_emissions: "50",
    water_usage: "50",
    energy_efficiency: "0.5",
    waste_management_score: "0.5",
    renewable_energy_percent: "30",
    pollution_control: "0.5",

    wage_fairness: "0.5",
    human_rights_index: "0.5",
    diversity_inclusion_score: "0.5",
    community_engagement: "0.5",
    worker_safety: "0.5",

    transparency_score: "0.5",
    corruption_risk: "0.5",
    board_diversity: "0.5",
    ethics_program: "0.5",
    compliance_systems: "0.5",

    delivery_efficiency: "0.5",
    quality_control_score: "0.5",
    supplier_diversity: "0.5",
    traceability: "0.5",

    geopolitical_risk: "0.5",
    climate_risk: "0.5",
    labor_dispute_risk: "0.5",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [activeSection, setActiveSection] = useState("basic");
  const [usingMockData, setUsingMockData] = useState(false);

  // Load supplier data if an ID is provided
  useEffect(() => {
    const loadSupplierData = async () => {
      if (!supplierId) return;

      try {
        setIsLoading(true);
        setError(null);

        console.log(`Loading supplier ${supplierId} for assessment...`);

        // Use getSupplier to directly fetch supplier by ID
        const supplier = await getSupplier(supplierId);

        if (supplier) {
          console.log("Found supplier for assessment:", supplier);
          // Create form data with all fields from supplier
          const newFormData = { ...formData };

          // Map basic fields
          newFormData.name = supplier.name || "";
          newFormData.country = supplier.country || "";
          newFormData.industry = supplier.industry || "";

          // Map numeric fields - convert to strings for form inputs
          if (supplier.co2_emissions !== undefined)
            newFormData.co2_emissions = supplier.co2_emissions.toString();

          if (supplier.delivery_efficiency !== undefined)
            newFormData.delivery_efficiency =
              supplier.delivery_efficiency.toString();

          if (supplier.wage_fairness !== undefined)
            newFormData.wage_fairness = supplier.wage_fairness.toString();

          if (supplier.human_rights_index !== undefined)
            newFormData.human_rights_index =
              supplier.human_rights_index.toString();

          if (supplier.waste_management_score !== undefined)
            newFormData.waste_management_score =
              supplier.waste_management_score.toString();

          // Add any other fields that might be available
          Object.keys(supplier).forEach((key) => {
            if (
              key in newFormData &&
              supplier[key] !== undefined &&
              supplier[key] !== null
            ) {
              newFormData[key] = supplier[key].toString();
            }
          });

          setFormData(newFormData);

          // Check explicitly for the mock data flag
          const isMock = supplier.isMockData === true;
          console.log("Using mock data for assessment:", isMock);
          setUsingMockData(isMock);
        } else {
          console.error(`Supplier with ID ${supplierId} not found`);
          setError(`Supplier with ID ${supplierId} not found.`);
        }
      } catch (err) {
        console.error("Error loading supplier for assessment:", err);
        setError(
          `Failed to load supplier data: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSupplierData();
  }, [supplierId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    let processedValue = value;

    // Handle range inputs for specific types of metrics
    if (type === "range") {
      // For percentage fields (0-100)
      if (
        name === "renewable_energy_percent" ||
        name === "co2_emissions" ||
        name === "water_usage"
      ) {
        processedValue = value;
      }
      // For score/index fields (0-1)
      else {
        processedValue = value;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert string values to numbers for submission
      const dataToSubmit = {
        ...formData,
        // Basic info remains as strings

        // Convert environmental metrics
        co2_emissions: parseFloat(formData.co2_emissions) || 0,
        water_usage: parseFloat(formData.water_usage) || 0,
        energy_efficiency: parseFloat(formData.energy_efficiency) || 0,
        waste_management_score:
          parseFloat(formData.waste_management_score) || 0,
        renewable_energy_percent:
          parseFloat(formData.renewable_energy_percent) || 0,
        pollution_control: parseFloat(formData.pollution_control) || 0,

        // Convert social metrics
        wage_fairness: parseFloat(formData.wage_fairness) || 0,
        human_rights_index: parseFloat(formData.human_rights_index) || 0,
        diversity_inclusion_score:
          parseFloat(formData.diversity_inclusion_score) || 0,
        community_engagement: parseFloat(formData.community_engagement) || 0,
        worker_safety: parseFloat(formData.worker_safety) || 0,

        // Convert governance metrics
        transparency_score: parseFloat(formData.transparency_score) || 0,
        corruption_risk: parseFloat(formData.corruption_risk) || 0,
        board_diversity: parseFloat(formData.board_diversity) || 0,
        ethics_program: parseFloat(formData.ethics_program) || 0,
        compliance_systems: parseFloat(formData.compliance_systems) || 0,

        // Convert supply chain metrics
        delivery_efficiency: parseFloat(formData.delivery_efficiency) || 0,
        quality_control_score: parseFloat(formData.quality_control_score) || 0,
        supplier_diversity: parseFloat(formData.supplier_diversity) || 0,
        traceability: parseFloat(formData.traceability) || 0,

        // Convert risk factors
        geopolitical_risk: parseFloat(formData.geopolitical_risk) || 0,
        climate_risk: parseFloat(formData.climate_risk) || 0,
        labor_dispute_risk: parseFloat(formData.labor_dispute_risk) || 0,
      };

      console.log("Submitting assessment data:", dataToSubmit);
      const evaluation = await evaluateSupplier(dataToSubmit);
      console.log("Assessment result:", evaluation);
      setResult(evaluation);
      setActiveTab("results");

      // Check if using mock data based on flag from API service
      const isMock = evaluation.isMockData === true;
      console.log("Using mock data for assessment result:", isMock);
      setUsingMockData(isMock);

      // Scroll to top so user can see results
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error during assessment:", err);
      setError("Failed to evaluate supplier. Please try again.");
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to compare string values that represent numbers
  const getValueColor = (
    value: string,
    isRiskMetric: boolean = false,
    min: number = 0,
    max: number = isRiskMetric ? 1 : 100
  ): string => {
    const numberValue = parseFloat(value);
    const percentage = ((numberValue - min) / (max - min)) * 100;

    if (isRiskMetric) {
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

  // Define interfaces for field types
  interface Field {
    id: string;
    name: string;
    label: string;
    icon: React.ElementType;
    section: string;
    description?: string;
  }

  interface TextField extends Field {
    type: "text" | "select" | "textarea";
    options?: string[];
    required?: boolean;
  }

  interface SliderField extends Field {
    type: "range";
    min: number;
    max: number;
    step: number;
    unit?: string;
    isRiskMetric?: boolean;
  }

  // Group all form fields by section
  const textFields: TextField[] = [
    {
      id: "name",
      name: "name",
      label: "Supplier Name",
      icon: BuildingOfficeIcon,
      type: "text",
      section: "basic",
      required: true,
    },
    {
      id: "country",
      name: "country",
      label: "Country",
      icon: GlobeAltIcon,
      type: "select",
      options: countries,
      section: "basic",
      required: true,
    },
    {
      id: "industry",
      name: "industry",
      label: "Industry",
      icon: DocumentChartBarIcon,
      type: "select",
      options: industries,
      section: "basic",
      required: true,
    },
  ];

  const sliderFields: SliderField[] = [
    // Environmental metrics
    {
      id: "co2_emissions",
      name: "co2_emissions",
      label: "CO₂ Emissions (tons)",
      icon: CloudIcon,
      type: "range",
      min: 0,
      max: 100,
      step: 1,
      section: "environmental",
      description: "Annual carbon emissions in tons",
      isRiskMetric: true, // Lower is better
    },
    {
      id: "water_usage",
      name: "water_usage",
      label: "Water Usage (m³)",
      icon: CloudIcon,
      type: "range",
      min: 0,
      max: 100,
      step: 1,
      section: "environmental",
      description: "Water consumption in cubic meters",
      isRiskMetric: true, // Lower is better
    },
    {
      id: "energy_efficiency",
      name: "energy_efficiency",
      label: "Energy Efficiency",
      icon: LightBulbIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "environmental",
      description: "Efficiency of energy usage (higher is better)",
    },
    {
      id: "waste_management_score",
      name: "waste_management_score",
      label: "Waste Management",
      icon: LightBulbIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "environmental",
      description: "Quality of waste management practices",
    },
    {
      id: "renewable_energy_percent",
      name: "renewable_energy_percent",
      label: "Renewable Energy",
      icon: LightBulbIcon,
      type: "range",
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      section: "environmental",
      description: "Percentage of energy from renewable sources",
    },
    {
      id: "pollution_control",
      name: "pollution_control",
      label: "Pollution Control",
      icon: CloudIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "environmental",
      description: "Effectiveness of pollution control measures",
    },

    // Social metrics
    {
      id: "wage_fairness",
      name: "wage_fairness",
      label: "Wage Fairness",
      icon: UserGroupIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "social",
      description: "Fair and equitable wage practices",
    },
    {
      id: "human_rights_index",
      name: "human_rights_index",
      label: "Human Rights Index",
      icon: UserGroupIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "social",
      description: "Adherence to human rights standards",
    },
    {
      id: "diversity_inclusion_score",
      name: "diversity_inclusion_score",
      label: "Diversity & Inclusion",
      icon: UserGroupIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "social",
      description: "Commitment to workplace diversity",
    },
    {
      id: "community_engagement",
      name: "community_engagement",
      label: "Community Engagement",
      icon: UserGroupIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "social",
      description: "Level of positive community involvement",
    },
    {
      id: "worker_safety",
      name: "worker_safety",
      label: "Worker Safety",
      icon: UserGroupIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "social",
      description: "Safety standards for workers",
    },

    // Governance metrics
    {
      id: "transparency_score",
      name: "transparency_score",
      label: "Transparency",
      icon: DocumentChartBarIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "governance",
      description: "Level of corporate transparency",
    },
    {
      id: "corruption_risk",
      name: "corruption_risk",
      label: "Corruption Risk",
      icon: DocumentChartBarIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "governance",
      description: "Risk of corruption (lower is better)",
      isRiskMetric: true,
    },
    {
      id: "board_diversity",
      name: "board_diversity",
      label: "Board Diversity",
      icon: DocumentChartBarIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "governance",
      description: "Diversity in board composition",
    },
    {
      id: "ethics_program",
      name: "ethics_program",
      label: "Ethics Program",
      icon: DocumentChartBarIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "governance",
      description: "Strength of ethics program",
    },
    {
      id: "compliance_systems",
      name: "compliance_systems",
      label: "Compliance Systems",
      icon: DocumentChartBarIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "governance",
      description: "Effectiveness of compliance systems",
    },

    // Supply chain metrics
    {
      id: "delivery_efficiency",
      name: "delivery_efficiency",
      label: "Delivery Efficiency",
      icon: TruckIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "supply",
      description: "Efficiency of delivery systems",
    },
    {
      id: "quality_control_score",
      name: "quality_control_score",
      label: "Quality Control",
      icon: TruckIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "supply",
      description: "Effectiveness of quality control measures",
    },
    {
      id: "supplier_diversity",
      name: "supplier_diversity",
      label: "Supplier Diversity",
      icon: TruckIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "supply",
      description: "Diversity among suppliers",
    },
    {
      id: "traceability",
      name: "traceability",
      label: "Traceability",
      icon: TruckIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "supply",
      description: "Ability to trace supply chain components",
    },

    // Risk factors
    {
      id: "geopolitical_risk",
      name: "geopolitical_risk",
      label: "Geopolitical Risk",
      icon: ShieldExclamationIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "risk",
      description: "Exposure to geopolitical instability",
      isRiskMetric: true,
    },
    {
      id: "climate_risk",
      name: "climate_risk",
      label: "Climate Risk",
      icon: ShieldExclamationIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "risk",
      description: "Vulnerability to climate change impacts",
      isRiskMetric: true,
    },
    {
      id: "labor_dispute_risk",
      name: "labor_dispute_risk",
      label: "Labor Dispute Risk",
      icon: ShieldExclamationIcon,
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      section: "risk",
      description: "Risk of labor disputes or strikes",
      isRiskMetric: true,
    },
  ];

  // Define form sections to help organize the form
  const sections = [
    {
      id: "basic",
      label: "Basic Info",
      icon: BuildingOfficeIcon,
      color: colors.primary,
    },
    {
      id: "environmental",
      label: "Environmental",
      icon: CloudIcon,
      color: colors.success,
    },
    {
      id: "social",
      label: "Social",
      icon: UserGroupIcon,
      color: colors.accent,
    },
    {
      id: "governance",
      label: "Governance",
      icon: DocumentChartBarIcon,
      color: colors.secondary,
    },
    {
      id: "supply",
      label: "Supply Chain",
      icon: TruckIcon,
      color: colors.blue,
    },
    {
      id: "risk",
      label: "Risk Factors",
      icon: ShieldExclamationIcon,
      color: colors.warning,
    },
  ];

  // UI components
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
    <div
      className="relative overflow-hidden border p-5 rounded-lg my-4"
      style={{
        borderColor: colors.error,
        backgroundColor: `${colors.error}15`,
      }}
    >
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
        style={{ backgroundColor: colors.error }}
      />

      <div className="flex items-center relative z-10">
        <div className="bg-black/20 p-2 rounded-full mr-4 flex-shrink-0">
          <ExclamationTriangleIcon
            className="h-6 w-6"
            style={{ color: colors.error }}
          />
        </div>
        <div>
          <h4
            className="text-lg font-medium mb-1"
            style={{ color: colors.error }}
          >
            Error
          </h4>
          <p style={{ color: colors.text }}>{message}</p>
        </div>
      </div>
    </div>
  );

  const MockDataIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden border p-4 rounded-lg my-4"
      style={{
        borderColor: colors.accent,
        backgroundColor: `${colors.accent}15`,
      }}
    >
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
        style={{ backgroundColor: colors.accent }}
      />

      <div className="flex items-center relative z-10">
        <div className="bg-black/20 p-2 rounded-full mr-4 flex-shrink-0">
          <InformationCircleIcon
            className="h-5 w-5"
            style={{ color: colors.accent }}
          />
        </div>
        <div>
          <h4
            className="text-base font-medium mb-1"
            style={{ color: colors.accent }}
          >
            Demo Mode
          </h4>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Using simulated data for demonstration purposes. API endpoint is not
            available.
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 bg-neutral-50">
      <div className="px-4 py-6 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-lg shadow-md text-white">
        <h1 className="text-3xl font-bold">Supplier Evaluation</h1>
        <p className="mt-2 text-emerald-100">
          Assess suppliers based on ethical and environmental criteria
        </p>
      </div>

      {usingMockData && <MockDataIndicator />}

      {error && <ErrorDisplay message={error} />}

      <div
        className="bg-opacity-80 backdrop-blur-sm rounded-xl border overflow-hidden transition-shadow duration-300 hover:shadow-lg mb-8"
        style={{
          backgroundColor: colors.panel,
          borderColor: colors.accent + "40",
        }}
      >
        <div className="border-b" style={{ borderColor: colors.accent + "30" }}>
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("form")}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm sm:text-base transition-colors duration-200`}
              style={{
                borderColor:
                  activeTab === "form" ? colors.primary : "transparent",
                color: activeTab === "form" ? colors.primary : colors.textMuted,
              }}
            >
              Assessment Form
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm sm:text-base transition-colors duration-200`}
              style={{
                borderColor:
                  activeTab === "results" ? colors.primary : "transparent",
                color:
                  activeTab === "results" ? colors.primary : colors.textMuted,
              }}
              disabled={!result}
            >
              Results & Analysis
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "form" && (
            <div>
              {isLoading ? (
                <LoadingIndicator message="Loading supplier data..." />
              ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:w-64 flex-shrink-0 bg-opacity-80 backdrop-blur-sm p-4 rounded-lg border sticky top-4 self-start"
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
                      Assessment Sections
                    </h3>
                    <div className="space-y-1 overflow-y-auto">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => {
                            setActiveSection(section.id);
                            document
                              .getElementById(section.id)
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }}
                          className="w-full flex items-center p-2 rounded-md transition-colors hover:bg-accent/10"
                          style={{
                            color:
                              activeSection === section.id
                                ? section.color
                                : colors.text,
                            backgroundColor:
                              activeSection === section.id
                                ? `${section.color}15`
                                : "transparent",
                          }}
                        >
                          <section.icon
                            className="h-4 w-4 mr-2"
                            style={{ color: section.color }}
                          />
                          {section.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  <div className="flex-1" ref={formRef}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        id="basic"
                        className="p-6 rounded-lg border backdrop-blur-sm space-y-6 mb-6"
                        style={{
                          backgroundColor: `${colors.primary}10`,
                          borderColor: `${colors.primary}40`,
                        }}
                      >
                        <h2
                          className="text-xl font-bold mb-6 pb-2 relative"
                          style={{
                            borderBottom: `2px solid ${colors.primary}40`,
                            display: "inline-block",
                            paddingRight: "50px",
                          }}
                        >
                          <div className="flex items-center">
                            <BuildingOfficeIcon
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {textFields.map((field) => (
                            <div key={field.id} className="col-span-1">
                              <label
                                htmlFor={field.name}
                                className="block text-sm font-medium mb-2"
                                style={{ color: colors.textMuted }}
                              >
                                <div className="flex items-center">
                                  <field.icon
                                    className="h-4 w-4 mr-2"
                                    style={{ color: colors.primary }}
                                  />
                                  {field.label}{" "}
                                  {field.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </div>
                              </label>

                              {field.type === "text" && (
                                <input
                                  type="text"
                                  name={field.name}
                                  id={field.name}
                                  value={formData[field.name]}
                                  onChange={handleChange}
                                  required={field.required}
                                  className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2"
                                  style={{
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.accent + "50",
                                    color: colors.text,
                                  }}
                                />
                              )}

                              {field.type === "select" && field.options && (
                                <select
                                  name={field.name}
                                  id={field.name}
                                  value={formData[field.name]}
                                  onChange={handleChange}
                                  required={field.required}
                                  className="w-full appearance-none px-3 py-2 rounded-md border focus:outline-none focus:ring-2"
                                  style={{
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.accent + "50",
                                    color: colors.text,
                                  }}
                                >
                                  <option value="">Select {field.label}</option>
                                  {field.options.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {field.type === "textarea" && (
                                <textarea
                                  name={field.name}
                                  id={field.name}
                                  value={formData[field.name]}
                                  onChange={handleChange}
                                  required={field.required}
                                  rows={3}
                                  className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2"
                                  style={{
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.accent + "50",
                                    color: colors.text,
                                  }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {sections.slice(1).map((section) => {
                        const sectionFields = sliderFields.filter(
                          (field) => field.section === section.id
                        );

                        if (sectionFields.length === 0) return null;

                        return (
                          <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            id={section.id}
                            className="p-6 rounded-lg border backdrop-blur-sm space-y-6 mb-6"
                            style={{
                              backgroundColor: `${section.color}10`,
                              borderColor: `${section.color}40`,
                            }}
                          >
                            <h2
                              className="text-xl font-bold mb-6 pb-2 relative"
                              style={{
                                borderBottom: `2px solid ${section.color}40`,
                                display: "inline-block",
                                paddingRight: "50px",
                              }}
                            >
                              <div className="flex items-center">
                                <section.icon
                                  className="w-5 h-5 mr-2"
                                  style={{ color: section.color }}
                                />
                                <span>{section.label} Metrics</span>
                                <div
                                  className="absolute bottom-0 left-0 h-[2px] w-20"
                                  style={{
                                    background: `linear-gradient(90deg, ${section.color}, transparent)`,
                                  }}
                                />
                              </div>
                            </h2>

                            <div className="grid grid-cols-1 gap-6">
                              {sectionFields.map((field) => (
                                <div key={field.id} className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <label
                                      htmlFor={field.name}
                                      className="text-sm font-medium flex items-center"
                                      style={{ color: colors.textMuted }}
                                    >
                                      <field.icon
                                        className="h-4 w-4 mr-2"
                                        style={{ color: section.color }}
                                      />
                                      {field.label}
                                    </label>
                                    <motion.span
                                      key={formData[field.name]}
                                      initial={{ scale: 0.9, opacity: 0.7 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      className="text-sm font-mono font-semibold px-2 py-0.5 rounded-full"
                                      style={{
                                        backgroundColor:
                                          getValueColor(
                                            formData[field.name],
                                            field.isRiskMetric,
                                            field.min,
                                            field.max
                                          ) + "20",
                                        color: getValueColor(
                                          formData[field.name],
                                          field.isRiskMetric,
                                          field.min,
                                          field.max
                                        ),
                                        border: `1px solid ${getValueColor(
                                          formData[field.name],
                                          field.isRiskMetric,
                                          field.min,
                                          field.max
                                        )}40`,
                                      }}
                                    >
                                      {formData[field.name]}
                                      {field.unit || ""}
                                    </motion.span>
                                  </div>

                                  <div className="relative h-2 mt-2">
                                    <div
                                      className="absolute inset-0 rounded-full"
                                      style={{
                                        backgroundColor: colors.inputBg,
                                      }}
                                    />

                                    <motion.div
                                      layout
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${
                                          ((parseFloat(formData[field.name]) -
                                            field.min) /
                                            (field.max - field.min)) *
                                          100
                                        }%`,
                                      }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 120,
                                        damping: 15,
                                      }}
                                      className="absolute inset-y-0 left-0 rounded-full"
                                      style={{
                                        backgroundColor: getValueColor(
                                          formData[field.name],
                                          field.isRiskMetric,
                                          field.min,
                                          field.max
                                        ),
                                      }}
                                    />

                                    <input
                                      type="range"
                                      name={field.name}
                                      id={field.id}
                                      min={field.min}
                                      max={field.max}
                                      step={field.step}
                                      value={formData[field.name]}
                                      onChange={handleChange}
                                      className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer z-10"
                                      style={{ opacity: 0 }}
                                    />
                                  </div>

                                  <p
                                    className="text-xs mt-1"
                                    style={{ color: colors.textMuted }}
                                  >
                                    {field.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Submit Buttons */}
                      <div
                        className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t"
                        style={{ borderColor: colors.accent + "30" }}
                      >
                        <button
                          type="button"
                          onClick={() => window.location.reload()}
                          className="px-5 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center transition-all hover:scale-105"
                          style={{
                            borderColor: colors.accent + "40",
                            color: colors.accent,
                            background: "rgba(0,0,0,0.3)",
                          }}
                          disabled={isSubmitting}
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-2" />
                          Reset Form
                        </button>

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
                              <SparklesIcon className="h-5 w-5 mr-2" />
                              <span className="relative">
                                Evaluate Supplier
                              </span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "results" && result && (
            <div className="px-4 py-5 sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h3
                  className="text-2xl font-medium mb-2"
                  style={{ color: colors.primary }}
                >
                  Assessment Results: {result.name}
                </h3>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Based on the provided metrics, our AI has analyzed this
                  supplier's sustainability performance
                </p>
              </motion.div>

              {/* Overall Score */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8 relative overflow-hidden rounded-lg border backdrop-blur-sm"
                style={{
                  backgroundColor: colors.panel + "80",
                  borderColor: colors.accent + "40",
                }}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                    {/* Score Display */}
                    <div className="text-center lg:text-left">
                      <h4
                        className="text-sm font-medium mb-1"
                        style={{ color: colors.textMuted }}
                      >
                        Overall Ethical Score
                      </h4>
                      <div className="flex items-baseline justify-center lg:justify-start">
                        <span
                          className="text-6xl font-extrabold"
                          style={{
                            color:
                              result.ethical_score >= 80
                                ? colors.success
                                : result.ethical_score >= 60
                                ? colors.warning
                                : colors.error,
                          }}
                        >
                          {result.ethical_score?.toFixed(1) || 0}
                        </span>
                        <span
                          className="ml-2 text-base font-medium"
                          style={{ color: colors.textMuted }}
                        >
                          / 100
                        </span>
                      </div>

                      <div
                        className="mt-2 text-sm"
                        style={{ color: colors.textMuted }}
                      >
                        {result.ethical_score >= 80
                          ? "Excellent sustainability performance"
                          : result.ethical_score >= 60
                          ? "Good sustainability performance"
                          : "Needs improvement"}
                      </div>
                    </div>

                    {/* Category Scores */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {result.environmental_score !== undefined && (
                        <ScoreCard
                          label="Environmental"
                          score={result.environmental_score}
                          icon={CloudIcon}
                          color={colors.success}
                        />
                      )}
                      {result.social_score !== undefined && (
                        <ScoreCard
                          label="Social"
                          score={result.social_score}
                          icon={UserGroupIcon}
                          color={colors.accent}
                        />
                      )}
                      {result.governance_score !== undefined && (
                        <ScoreCard
                          label="Governance"
                          score={result.governance_score}
                          icon={DocumentChartBarIcon}
                          color={colors.secondary}
                        />
                      )}
                      {result.supply_chain_score !== undefined && (
                        <ScoreCard
                          label="Supply Chain"
                          score={result.supply_chain_score}
                          icon={TruckIcon}
                          color={colors.blue}
                        />
                      )}
                      {result.risk_score !== undefined && (
                        <ScoreCard
                          label="Risk Assessment"
                          score={100 - result.risk_score} // Invert risk score for display
                          icon={ShieldExclamationIcon}
                          color={colors.warning}
                          isRiskMetric
                        />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* SWOT Analysis */}
              {result.assessment && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <h4
                    className="text-xl font-medium mb-4"
                    style={{ color: colors.primary }}
                  >
                    Detailed Assessment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: `${colors.success}15`,
                        borderColor: `${colors.success}40`,
                      }}
                    >
                      <h5
                        className="text-base font-medium mb-3 flex items-center"
                        style={{ color: colors.success }}
                      >
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Strengths
                      </h5>
                      <ul className="space-y-2">
                        {result.assessment.strengths?.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-xs mr-2 mt-1">•</span>
                            <span
                              className="text-sm"
                              style={{ color: colors.textMuted }}
                            >
                              {item}
                            </span>
                          </li>
                        ))}
                        {(!result.assessment.strengths ||
                          result.assessment.strengths.length === 0) && (
                          <li
                            className="text-sm italic"
                            style={{ color: colors.textMuted }}
                          >
                            No specific strengths identified
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: `${colors.error}15`,
                        borderColor: `${colors.error}40`,
                      }}
                    >
                      <h5
                        className="text-base font-medium mb-3 flex items-center"
                        style={{ color: colors.error }}
                      >
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        Weaknesses
                      </h5>
                      <ul className="space-y-2">
                        {result.assessment.weaknesses?.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-xs mr-2 mt-1">•</span>
                            <span
                              className="text-sm"
                              style={{ color: colors.textMuted }}
                            >
                              {item}
                            </span>
                          </li>
                        ))}
                        {(!result.assessment.weaknesses ||
                          result.assessment.weaknesses.length === 0) && (
                          <li
                            className="text-sm italic"
                            style={{ color: colors.textMuted }}
                          >
                            No specific weaknesses identified
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Opportunities */}
                    <div
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: `${colors.primary}15`,
                        borderColor: `${colors.primary}40`,
                      }}
                    >
                      <h5
                        className="text-base font-medium mb-3 flex items-center"
                        style={{ color: colors.primary }}
                      >
                        <LightBulbIcon className="h-5 w-5 mr-2" />
                        Opportunities
                      </h5>
                      <ul className="space-y-2">
                        {result.assessment.opportunities?.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-xs mr-2 mt-1">•</span>
                            <span
                              className="text-sm"
                              style={{ color: colors.textMuted }}
                            >
                              {item}
                            </span>
                          </li>
                        ))}
                        {(!result.assessment.opportunities ||
                          result.assessment.opportunities.length === 0) && (
                          <li
                            className="text-sm italic"
                            style={{ color: colors.textMuted }}
                          >
                            No specific opportunities identified
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Threats */}
                    <div
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: `${colors.warning}15`,
                        borderColor: `${colors.warning}40`,
                      }}
                    >
                      <h5
                        className="text-base font-medium mb-3 flex items-center"
                        style={{ color: colors.warning }}
                      >
                        <ShieldExclamationIcon className="h-5 w-5 mr-2" />
                        Threats
                      </h5>
                      <ul className="space-y-2">
                        {result.assessment.threats?.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-xs mr-2 mt-1">•</span>
                            <span
                              className="text-sm"
                              style={{ color: colors.textMuted }}
                            >
                              {item}
                            </span>
                          </li>
                        ))}
                        {(!result.assessment.threats ||
                          result.assessment.threats.length === 0) && (
                          <li
                            className="text-sm italic"
                            style={{ color: colors.textMuted }}
                          >
                            No specific threats identified
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Recommendation */}
              {result.recommendation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-8"
                >
                  <h4
                    className="text-xl font-medium mb-4"
                    style={{ color: colors.primary }}
                  >
                    Recommendation
                  </h4>
                  <div
                    className="p-5 rounded-lg border backdrop-blur-sm"
                    style={{
                      backgroundColor: `${colors.success}10`,
                      borderColor: `${colors.success}30`,
                    }}
                  >
                    <p style={{ color: colors.text }}>
                      {result.recommendation}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Improvement Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <h4
                    className="text-xl font-medium mb-4"
                    style={{ color: colors.primary }}
                  >
                    Improvement Suggestions
                  </h4>
                  <div className="space-y-3">
                    {result.suggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-4 rounded-lg border backdrop-blur-sm flex items-start"
                        style={{
                          backgroundColor: colors.panel + "80",
                          borderColor: `${colors.accent}30`,
                        }}
                      >
                        <div
                          className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mr-3 mt-0.5"
                          style={{
                            backgroundColor: `${colors.accent}30`,
                            color: colors.accent,
                          }}
                        >
                          <span className="text-sm font-medium">
                            {index + 1}
                          </span>
                        </div>
                        <span style={{ color: colors.text }}>{suggestion}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Call to Action Button */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setActiveTab("form")}
                  className="px-6 py-3 rounded-lg font-medium flex items-center transition-all hover:scale-105"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.background,
                  }}
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Return to Assessment Form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add keyframe animation */}
      <style>
        {`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
    </div>
  );
};

// Score Card Component
const ScoreCard = ({
  label,
  score,
  icon: Icon,
  color,
  isRiskMetric = false,
}) => {
  // Determine score rating
  const getRating = () => {
    if (isRiskMetric) {
      if (score >= 80) return "Low Risk";
      if (score >= 60) return "Moderate Risk";
      return "High Risk";
    } else {
      if (score >= 80) return "Excellent";
      if (score >= 60) return "Good";
      return "Needs Improvement";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg border"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
      }}
    >
      <div className="flex items-center mb-2">
        <Icon className="h-4 w-4 mr-2" style={{ color }} />
        <span className="text-sm font-medium" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold" style={{ color }}>
          {score.toFixed(1)}
        </span>
        <span
          className="text-xs px-2 py-1 rounded"
          style={{
            backgroundColor: `${color}30`,
            color,
          }}
        >
          {getRating()}
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-black/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            backgroundColor: color,
          }}
        ></div>
      </div>
    </motion.div>
  );
};

export default EvaluateSupplier;
