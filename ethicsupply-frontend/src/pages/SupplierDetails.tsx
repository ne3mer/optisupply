import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSuppliers, Supplier } from "../services/api";
import { motion } from "framer-motion";
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
  GlobeAltIcon, // Added for Geopolitical Risk
  CloudIcon, // Added for Climate Risk
  UsersIcon, // Added for Labor Dispute Risk
} from "@heroicons/react/24/outline";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

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
};

const LoadingIndicator = () => (
  <div
    className="flex flex-col items-center justify-center min-h-[80vh]"
    style={{ backgroundColor: colors.background }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-t-4 border-b-4 rounded-full mb-4"
      style={{ borderColor: colors.primary }}
    ></motion.div>
    <p style={{ color: colors.textMuted }}>Accessing Supplier Dossier...</p>
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div
    className="flex flex-col items-center justify-center min-h-[80vh]"
    style={{ backgroundColor: colors.background }}
  >
    <div className="bg-red-900/50 border border-red-500 p-8 rounded-lg text-center max-w-lg">
      <ExclamationTriangleIcon
        className="h-16 w-16 mx-auto mb-5"
        style={{ color: colors.error }}
      />
      <h3
        className="text-2xl font-semibold mb-3"
        style={{ color: colors.error }}
      >
        Data Corruption Detected
      </h3>
      <p className="text-lg" style={{ color: colors.textMuted }}>
        {message}
      </p>
      <Link
        to="/suppliers"
        className="mt-6 inline-block px-4 py-2 rounded border border-accent hover:bg-accent/20 transition-colors"
        style={{ color: colors.accent }}
      >
        Return to Registry
      </Link>
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

  useEffect(() => {
    const fetchAndSetSupplier = async () => {
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

        // Find the specific supplier from the list
        const foundSupplier = suppliersList.find(
          (s) => s._id === id || s.id === id // Check both _id (MongoDB) and id (potential fallback)
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
    fetchAndSetSupplier();
  }, [id]);

  // --- Memoized Values ---
  const overallScore = useMemo(() => {
    const score = supplier?.ethical_score ?? 0;
    // Normalize to 0-100 scale if it's in 0-1 range
    return score > 0 && score <= 1 ? score * 100 : score;
  }, [supplier]);

  const scoreColor = useMemo(() => getScoreColor(overallScore), [overallScore]);
  const riskColor = useMemo(
    () => getRiskColor(supplier?.risk_level),
    [supplier?.risk_level]
  );

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
  const supplierId = supplier._id || supplier.id;

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
                <ScaleIcon className="h-4 w-4 mr-2" /> Overall Score
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
                onClick={() => navigate(`/suppliers/${supplierId}/assessment`)}
                className="w-full flex items-center justify-center text-sm py-2 px-4 rounded hover:opacity-90 transition-opacity duration-200"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.background,
                }}
              >
                <PlayIcon className="h-5 w-5 mr-2" /> Run/View Assessment
              </button>
              <button
                onClick={() => navigate(`/supplier-analytics/${supplierId}`)} // Assuming analytics route
                className="w-full flex items-center justify-center text-sm py-2 px-4 rounded hover:opacity-90 transition-opacity duration-200"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.background,
                }}
              >
                <ChartBarIcon className="h-5 w-5 mr-2" /> View AI Analytics
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
                color={getScoreColor(supplier.environmental_score)}
                isScore
              />
              <DetailItem
                label="Social"
                value={supplier.social_score}
                icon={UserGroupIcon}
                color={getScoreColor(supplier.social_score)}
                isScore
              />
              <DetailItem
                label="Governance"
                value={supplier.governance_score}
                icon={ShieldCheckIcon}
                color={getScoreColor(supplier.governance_score)}
                isScore
              />
              {/* Add Supply Chain Score if available */}
              {supplier.supply_chain_score !== undefined && (
                <DetailItem
                  label="Supply Chain"
                  value={supplier.supply_chain_score}
                  icon={TruckIcon}
                  color={getScoreColor(supplier.supply_chain_score)}
                  isScore
                />
              )}
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
              <DetailItem
                label="Water Usage"
                value={supplier.water_usage}
                unit=" m³"
                icon={BeakerIcon}
              />
              <DetailItem
                label="Energy Efficiency"
                value={supplier.energy_efficiency}
                icon={BeakerIcon}
              />
              <DetailItem
                label="Waste Mgmt Score"
                value={supplier.waste_management_score}
                icon={BeakerIcon}
              />
              <DetailItem
                label="Renewable Energy"
                value={supplier.renewable_energy_percent}
                unit="%"
                icon={BeakerIcon}
              />
              <DetailItem
                label="Pollution Control"
                value={supplier.pollution_control}
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
              <DetailItem
                label="Diversity & Inclusion"
                value={supplier.diversity_inclusion_score}
                icon={UserGroupIcon}
              />
              <DetailItem
                label="Community Engagement"
                value={supplier.community_engagement}
                icon={UserGroupIcon}
              />
              <DetailItem
                label="Worker Safety"
                value={supplier.worker_safety}
                icon={UserGroupIcon}
              />
              {/* Governance */}
              <DetailItem
                label="Transparency Score"
                value={supplier.transparency_score}
                icon={ShieldCheckIcon}
              />
              <DetailItem
                label="Corruption Risk"
                value={supplier.corruption_risk}
                icon={ShieldCheckIcon}
              />
              <DetailItem
                label="Board Diversity"
                value={supplier.board_diversity}
                icon={ShieldCheckIcon}
              />
              <DetailItem
                label="Ethics Program"
                value={supplier.ethics_program}
                icon={ShieldCheckIcon}
              />
              <DetailItem
                label="Compliance Systems"
                value={supplier.compliance_systems}
                icon={ShieldCheckIcon}
              />
              {/* Supply Chain */}
              {supplier.delivery_efficiency !== undefined && (
                <DetailItem
                  label="Delivery Efficiency"
                  value={supplier.delivery_efficiency}
                  icon={TruckIcon}
                />
              )}
              {supplier.quality_control_score !== undefined && (
                <DetailItem
                  label="Quality Control"
                  value={supplier.quality_control_score}
                  icon={TruckIcon}
                />
              )}
              {supplier.supplier_diversity !== undefined && (
                <DetailItem
                  label="Supplier Diversity"
                  value={supplier.supplier_diversity}
                  icon={TruckIcon}
                />
              )}
              {supplier.traceability !== undefined && (
                <DetailItem
                  label="Traceability"
                  value={supplier.traceability}
                  icon={TruckIcon}
                />
              )}
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
              <DetailItem
                label="Compliance Systems"
                value={supplier.compliance_systems}
                icon={ShieldCheckIcon}
              />
              <DetailItem
                label="Ethics Program Strength"
                value={supplier.ethics_program}
                icon={ShieldCheckIcon}
              />
              {/* Add more compliance-related fields if available in Supplier model */}

              {/* Risk related */}
              <DetailItem
                label="Overall Risk Level"
                value={supplier.risk_level || "Unknown"}
                icon={ShieldExclamationIcon}
                color={getRiskColor(supplier.risk_level)} // Use color helper
              />
              <DetailItem
                label="Corruption Risk"
                value={supplier.corruption_risk}
                icon={ShieldExclamationIcon}
                color={getScoreColor(supplier.corruption_risk)} // Color based on score (lower is better)
              />
              <DetailItem
                label="Geopolitical Risk"
                value={supplier.geopolitical_risk}
                icon={GlobeAltIcon} // Example icon
                color={getScoreColor(supplier.geopolitical_risk)}
              />
              <DetailItem
                label="Climate Risk"
                value={supplier.climate_risk}
                icon={CloudIcon} // Example icon
                color={getScoreColor(supplier.climate_risk)}
              />
              <DetailItem
                label="Labor Dispute Risk"
                value={supplier.labor_dispute_risk}
                icon={UsersIcon} // Example icon
                color={getScoreColor(supplier.labor_dispute_risk)}
              />
            </div>
          </div>

          {/* Add ESG Reports, Media Sentiment, Controversies Sections Here Later */}
          {/* Placeholder for future sections */}
          {/* 
          <div className="p-4 rounded-lg border backdrop-blur-sm" style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>ESG Reports</h3>
            <p className="text-sm italic" style={{ color: colors.textMuted }}>(ESG report listing to be implemented)</p>
          </div>
          <div className="p-4 rounded-lg border backdrop-blur-sm" style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>Media Sentiment</h3>
            <p className="text-sm italic" style={{ color: colors.textMuted }}>(Media sentiment analysis to be implemented)</p>
          </div>
          <div className="p-4 rounded-lg border backdrop-blur-sm" style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>Controversies</h3>
            <p className="text-sm italic" style={{ color: colors.textMuted }}>(Controversy tracking to be implemented)</p>
          </div>
          */}
        </motion.div>
      </div>
    </div>
  );
};

export default SupplierDetails;
