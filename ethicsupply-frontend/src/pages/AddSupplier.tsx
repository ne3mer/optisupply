import { useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addSupplier, bulkImportSuppliers } from "../services/api";
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
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ArrowUpTrayIcon,
  TableCellsIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import * as XLSX from "xlsx";
import { useThemeColors } from "../theme/useThemeColors";

// Colors are provided by theme hook

// --- UI Components ---
const LoadingIndicator = ({ message = "Processing..." }) => {
  const colors = useThemeColors();
  return (
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
};

const ErrorDisplay = ({ message }) => {
  const colors = useThemeColors();
  return (
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
};

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
  helper,
}: {
  name: string;
  label: string;
  type?: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  helper?: string;
}) => {
  const colors = useThemeColors() as any;
  return (
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
        data-type={type === "number" ? "number" : undefined}
      />
      {helper && (
        <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
          {helper}
        </p>
      )}
    </div>
  );
};

const SelectField = ({
  name,
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}) => {
  const colors = useThemeColors() as any;
  return (
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
};

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
  const colors = useThemeColors() as any;
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

// --- Helper Components for Real-time ESG Scoring ---
const ScoreGauge = ({ value, label, color, impactWeight = null }) => {
  const colors = useThemeColors() as any;
  const normalizedValue = value > 0 && value <= 1 ? value * 100 : value;

  return (
    <div className="flex flex-col items-center group relative">
      <div className="w-20 h-20 mb-2">
        <CircularProgressbar
          value={normalizedValue || 0}
          maxValue={100}
          text={`${Math.round(normalizedValue || 0)}`}
          styles={buildStyles({
            textSize: "28px",
            pathColor: color,
            textColor: color,
            trailColor: color + "20",
          })}
        />
      </div>
      <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
        {label}
      </span>

      {/* Impact Weight Tooltip */}
      {impactWeight !== null && (
        <div
          className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 bottom-full mb-2 px-2 py-1 rounded text-xs whitespace-nowrap -translate-x-1/2 left-1/2 z-10"
          style={{
            backgroundColor: colors.panel,
            color: color,
            border: `1px solid ${color}`,
          }}
        >
          <span className="font-semibold">
            {(impactWeight * 100).toFixed(0)}% Impact
          </span>{" "}
          on overall score
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2"
            style={{
              backgroundColor: colors.panel,
              border: `1px solid ${color}`,
              borderTop: "none",
              borderLeft: "none",
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

// Component to display metric impact weight
const MetricImpactRow = ({
  label,
  value,
  weight,
  category,
  unit = "",
  isRisk = false,
}) => {
  const colors = useThemeColors() as any;
  const normalizedValue =
    typeof value === "number"
      ? value > 0 && value <= 1
        ? value * 100
        : value
      : 0;

  // Get impact percentage (value × weight)
  const impact = normalizedValue * weight;

  // Determine color based on value and if it's a risk metric (where lower is better)
  const getValueColor = () => {
    if (isRisk) {
      // For risk metrics, lower is better
      if (normalizedValue < 30) return colors.success;
      if (normalizedValue < 70) return colors.warning;
      return colors.error;
    } else {
      // For most metrics, higher is better
      if (normalizedValue > 70) return colors.success;
      if (normalizedValue > 30) return colors.warning;
      return colors.error;
    }
  };

  // Category colors
  const categoryColors = {
    environmental: colors.success,
    social: colors.primary,
    governance: colors.secondary,
  };

  const categoryColor = categoryColors[category] || colors.text;

  return (
    <div
      className="flex items-center justify-between py-1 border-b border-dashed last:border-0"
      style={{ borderColor: `${colors.accent}30` }}
    >
      <div className="flex items-center">
        <div
          className="w-2 h-2 mr-2 rounded-full"
          style={{ backgroundColor: categoryColor }}
        ></div>
        <span style={{ color: colors.text }}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span style={{ color: getValueColor() }}>
          {normalizedValue.toFixed(1)}
          {unit}
        </span>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <div className="h-1 w-12 rounded-full bg-gray-700">
              <div
                className="h-1 rounded-full"
                style={{
                  width: `${weight * 100}%`,
                  backgroundColor: categoryColor,
                }}
              ></div>
            </div>
            <span className="text-xs" style={{ color: colors.textMuted }}>
              {(weight * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Risk Badge Component
const RiskBadge = ({ riskLevel }) => {
  const colors = useThemeColors() as any;
  const getRiskColor = (level) => {
    switch (level.toLowerCase()) {
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

  const color = getRiskColor(riskLevel);

  return (
    <div className="flex flex-col items-center">
      <span
        className="px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wider"
        style={{
          backgroundColor: color + "20",
          color: color,
          border: `1px solid ${color}40`,
        }}
      >
        {riskLevel}
      </span>
      <span className="text-xs mt-1" style={{ color: colors.textMuted }}>
        Risk Level
      </span>
    </div>
  );
};

const ESGScorePreview = ({ formData }) => {
  const colors = useThemeColors() as any;
  // Define category weights for the overall score
  const categoryWeights = {
    environmental: 0.33,
    social: 0.33,
    governance: 0.34,
  };

  // Define metric weights within each category
  const environmentalWeights = {
    energy_efficiency: 0.25,
    waste_management_score: 0.25,
    pollution_control: 0.2,
    renewable_energy_percent: 0.3,
  };

  const socialWeights = {
    wage_fairness: 0.25,
    human_rights_index: 0.3,
    diversity_inclusion_score: 0.15,
    community_engagement: 0.15,
    worker_safety: 0.15,
  };

  const governanceWeights = {
    transparency_score: 0.25,
    corruption_risk: 0.25,
    board_diversity: 0.15,
    ethics_program: 0.2,
    compliance_systems: 0.15,
  };

  // Calculate normalized renewable energy percentage (0-1 scale)
  const normalizedRenewableEnergy =
    (formData.renewable_energy_percent || 0) / 100;

  // Calculate environmental score - weighted average of environmental metrics
  const environmentalScore = useMemo(() => {
    // Weighted average calculation
    const weightedSum =
      (formData.energy_efficiency || 0) *
        environmentalWeights.energy_efficiency +
      (formData.waste_management_score || 0) *
        environmentalWeights.waste_management_score +
      (formData.pollution_control || 0) *
        environmentalWeights.pollution_control +
      normalizedRenewableEnergy * environmentalWeights.renewable_energy_percent;

    // Return the score rounded to 2 decimal places
    return Math.round(weightedSum * 100) / 100;
  }, [formData, normalizedRenewableEnergy]);

  // Calculate social score - weighted average of social metrics
  const socialScore = useMemo(() => {
    // Weighted average calculation
    const weightedSum =
      (formData.wage_fairness || 0) * socialWeights.wage_fairness +
      (formData.human_rights_index || 0) * socialWeights.human_rights_index +
      (formData.diversity_inclusion_score || 0) *
        socialWeights.diversity_inclusion_score +
      (formData.community_engagement || 0) *
        socialWeights.community_engagement +
      (formData.worker_safety || 0) * socialWeights.worker_safety;

    // Return the score rounded to 2 decimal places
    return Math.round(weightedSum * 100) / 100;
  }, [formData]);

  // Invert corruption risk (1 - value) since lower corruption risk is better
  const invertedCorruptionRisk = 1 - (formData.corruption_risk || 0);

  // Calculate governance score - weighted average of governance metrics
  const governanceScore = useMemo(() => {
    // Weighted average calculation
    const weightedSum =
      (formData.transparency_score || 0) *
        governanceWeights.transparency_score +
      invertedCorruptionRisk * governanceWeights.corruption_risk +
      (formData.board_diversity || 0) * governanceWeights.board_diversity +
      (formData.ethics_program || 0) * governanceWeights.ethics_program +
      (formData.compliance_systems || 0) * governanceWeights.compliance_systems;

    // Return the score rounded to 2 decimal places
    return Math.round(weightedSum * 100) / 100;
  }, [formData, invertedCorruptionRisk]);

  // Calculate overall ESG score
  const overallScore = useMemo(() => {
    // Weighted average of the three component scores
    const weightedSum =
      environmentalScore * categoryWeights.environmental +
      socialScore * categoryWeights.social +
      governanceScore * categoryWeights.governance;

    // Return the score rounded to 2 decimal places
    return Math.round(weightedSum * 100) / 100;
  }, [environmentalScore, socialScore, governanceScore]);

  // Determine risk level based on overall score
  const riskLevel = useMemo(() => {
    if (overallScore >= 0.75) return "Low";
    if (overallScore >= 0.5) return "Medium";
    if (overallScore >= 0.25) return "High";
    return "Critical";
  }, [overallScore]);

  // Get top contributing factors (both positive and negative)
  const topContributors = useMemo(() => {
    // Calculate impact of each metric on final score
    const metrics = [
      {
        name: "Energy Efficiency",
        value: formData.energy_efficiency || 0,
        weight:
          environmentalWeights.energy_efficiency *
          categoryWeights.environmental,
        category: "environmental",
        isPositive: (formData.energy_efficiency || 0) > 0.6,
      },
      {
        name: "Waste Management",
        value: formData.waste_management_score || 0,
        weight:
          environmentalWeights.waste_management_score *
          categoryWeights.environmental,
        category: "environmental",
        isPositive: (formData.waste_management_score || 0) > 0.6,
      },
      {
        name: "Pollution Control",
        value: formData.pollution_control || 0,
        weight:
          environmentalWeights.pollution_control *
          categoryWeights.environmental,
        category: "environmental",
        isPositive: (formData.pollution_control || 0) > 0.6,
      },
      {
        name: "Renewable Energy",
        value: normalizedRenewableEnergy,
        weight:
          environmentalWeights.renewable_energy_percent *
          categoryWeights.environmental,
        category: "environmental",
        isPositive: normalizedRenewableEnergy > 0.6,
      },
      {
        name: "Wage Fairness",
        value: formData.wage_fairness || 0,
        weight: socialWeights.wage_fairness * categoryWeights.social,
        category: "social",
        isPositive: (formData.wage_fairness || 0) > 0.6,
      },
      {
        name: "Human Rights Index",
        value: formData.human_rights_index || 0,
        weight: socialWeights.human_rights_index * categoryWeights.social,
        category: "social",
        isPositive: (formData.human_rights_index || 0) > 0.6,
      },
      {
        name: "Diversity & Inclusion",
        value: formData.diversity_inclusion_score || 0,
        weight:
          socialWeights.diversity_inclusion_score * categoryWeights.social,
        category: "social",
        isPositive: (formData.diversity_inclusion_score || 0) > 0.6,
      },
      {
        name: "Community Engagement",
        value: formData.community_engagement || 0,
        weight: socialWeights.community_engagement * categoryWeights.social,
        category: "social",
        isPositive: (formData.community_engagement || 0) > 0.6,
      },
      {
        name: "Worker Safety",
        value: formData.worker_safety || 0,
        weight: socialWeights.worker_safety * categoryWeights.social,
        category: "social",
        isPositive: (formData.worker_safety || 0) > 0.6,
      },
      {
        name: "Transparency",
        value: formData.transparency_score || 0,
        weight:
          governanceWeights.transparency_score * categoryWeights.governance,
        category: "governance",
        isPositive: (formData.transparency_score || 0) > 0.6,
      },
      {
        name: "Corruption Risk",
        value: invertedCorruptionRisk,
        weight: governanceWeights.corruption_risk * categoryWeights.governance,
        category: "governance",
        isRisk: true,
        isPositive: invertedCorruptionRisk > 0.6,
      },
      {
        name: "Board Diversity",
        value: formData.board_diversity || 0,
        weight: governanceWeights.board_diversity * categoryWeights.governance,
        category: "governance",
        isPositive: (formData.board_diversity || 0) > 0.6,
      },
      {
        name: "Ethics Program",
        value: formData.ethics_program || 0,
        weight: governanceWeights.ethics_program * categoryWeights.governance,
        category: "governance",
        isPositive: (formData.ethics_program || 0) > 0.6,
      },
      {
        name: "Compliance Systems",
        value: formData.compliance_systems || 0,
        weight:
          governanceWeights.compliance_systems * categoryWeights.governance,
        category: "governance",
        isPositive: (formData.compliance_systems || 0) > 0.6,
      },
    ];

    // Calculate impact score (value × weight)
    metrics.forEach((metric) => {
      metric.impact = metric.value * metric.weight;
    });

    // Get top 3 positive contributors (highest value * weight)
    const positiveContributors = [...metrics]
      .filter((m) => m.isPositive)
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3);

    // Get top 3 negative contributors (lowest value * weight)
    const negativeContributors = [...metrics]
      .filter((m) => !m.isPositive)
      .sort((a, b) => a.impact - b.impact)
      .slice(0, 3);

    return { positive: positiveContributors, negative: negativeContributors };
  }, [formData, normalizedRenewableEnergy, invertedCorruptionRisk]);

  // Generate explainability text based on top contributors
  const explainabilityText = useMemo(() => {
    // No meaningful explanation if all values are default
    if (overallScore === 0.5) {
      return "This is a preliminary score based on default values. Adjust metric values to see a more accurate assessment.";
    }

    const positiveFactors = topContributors.positive
      .map((factor) => `${factor.name} (${Math.round(factor.value * 100)}%)`)
      .join(", ");

    const negativeFactors = topContributors.negative
      .map((factor) => `${factor.name} (${Math.round(factor.value * 100)}%)`)
      .join(", ");

    let text = `This supplier has an overall ESG score of ${Math.round(
      overallScore * 100
    )}%, placing it in the ${riskLevel.toLowerCase()} risk category. `;

    if (topContributors.positive.length > 0) {
      text += `The score benefits most from strong performance in ${positiveFactors}. `;
    }

    if (topContributors.negative.length > 0) {
      text += `Areas with opportunity for improvement include ${negativeFactors}. `;
    }

    if (
      environmentalScore > socialScore &&
      environmentalScore > governanceScore
    ) {
      text += `The supplier shows particular strength in environmental practices. `;
    } else if (
      socialScore > environmentalScore &&
      socialScore > governanceScore
    ) {
      text += `The supplier demonstrates strong performance in social responsibility. `;
    } else if (
      governanceScore > environmentalScore &&
      governanceScore > socialScore
    ) {
      text += `The supplier excels in governance practices. `;
    }

    return text;
  }, [
    overallScore,
    riskLevel,
    topContributors,
    environmentalScore,
    socialScore,
    governanceScore,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white bg-opacity-10 backdrop-blur-md p-5 rounded-xl border shadow-lg"
      style={{ borderColor: colors.accent + "40" }}
    >
      <h3
        className="text-lg font-semibold mb-4 text-center"
        style={{ color: colors.primary }}
      >
        Real-Time ESG Assessment
      </h3>

      <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
        <ScoreGauge
          value={environmentalScore}
          label="Environmental"
          color={colors.success}
          impactWeight={categoryWeights.environmental}
        />
        <ScoreGauge
          value={socialScore}
          label="Social"
          color={colors.primary}
          impactWeight={categoryWeights.social}
        />
        <ScoreGauge
          value={governanceScore}
          label="Governance"
          color={colors.secondary}
          impactWeight={categoryWeights.governance}
        />
        <div
          className="h-12 w-px mx-2 opacity-30"
          style={{ backgroundColor: colors.accent }}
        ></div>
        <div className="flex flex-col items-center">
          <div className="w-28 h-28">
            <CircularProgressbar
              value={overallScore * 100}
              maxValue={100}
              text={`${Math.round(overallScore * 100)}`}
              styles={buildStyles({
                textSize: "32px",
                pathColor: colors.accent,
                textColor: colors.text,
                trailColor: colors.accent + "20",
              })}
            />
          </div>
          <span
            className="text-sm font-medium mt-1"
            style={{ color: colors.accent }}
          >
            Overall ESG Score
          </span>
        </div>
        <div
          className="h-12 w-px mx-2 opacity-30"
          style={{ backgroundColor: colors.accent }}
        ></div>
        <RiskBadge riskLevel={riskLevel} />
      </div>

      {/* Score Explainability Section */}
      <div
        className="mt-6 border-t pt-4"
        style={{ borderColor: colors.accent + "20" }}
      >
        <div className="flex items-center mb-3">
          <InformationCircleIcon
            className="h-5 w-5 mr-2"
            style={{ color: colors.primary }}
          />
          <h4 className="font-medium" style={{ color: colors.primary }}>
            Score Explanation
          </h4>
        </div>
        <p className="text-sm mb-4" style={{ color: colors.text }}>
          {explainabilityText}
        </p>

        {/* Key Impact Factors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-4">
          {/* Left column: Top positive contributors */}
          <div>
            <h5
              className="text-xs uppercase font-medium mb-2"
              style={{ color: colors.success }}
            >
              Top Positive Contributors
            </h5>
            <div className="bg-black bg-opacity-20 rounded p-2">
              {topContributors.positive.length > 0 ? (
                topContributors.positive.map((factor, index) => (
                  <MetricImpactRow
                    key={index}
                    label={factor.name}
                    value={factor.value}
                    weight={factor.weight}
                    category={factor.category}
                    isRisk={factor.isRisk}
                  />
                ))
              ) : (
                <div
                  className="text-xs italic text-center py-2"
                  style={{ color: colors.textMuted }}
                >
                  Adjust values to see positive contributors
                </div>
              )}
            </div>
          </div>

          {/* Right column: Areas for improvement */}
          <div>
            <h5
              className="text-xs uppercase font-medium mb-2"
              style={{ color: colors.error }}
            >
              Areas for Improvement
            </h5>
            <div className="bg-black bg-opacity-20 rounded p-2">
              {topContributors.negative.length > 0 ? (
                topContributors.negative.map((factor, index) => (
                  <MetricImpactRow
                    key={index}
                    label={factor.name}
                    value={factor.value}
                    weight={factor.weight}
                    category={factor.category}
                    isRisk={factor.isRisk}
                  />
                ))
              ) : (
                <div
                  className="text-xs italic text-center py-2"
                  style={{ color: colors.textMuted }}
                >
                  Adjust values to see areas for improvement
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="text-xs text-center mt-6"
        style={{ color: colors.textMuted }}
      >
        <span className="block mb-1">
          Hover over each category score to see its impact weight on the overall
          score.
        </span>
        This assessment is calculated in real-time as you input data. Scores
        range from 0-100.
      </div>
    </motion.div>
  );
};

// Component for batch upload
const BatchUpload = () => {
  const colors = useThemeColors() as any;
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [parseProgress, setParseProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file type
    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    if (
      fileExtension !== "csv" &&
      fileExtension !== "xlsx" &&
      fileExtension !== "xls"
    ) {
      setUploadError("Invalid file format. Please upload a CSV or Excel file.");
      return;
    }

    setFile(selectedFile);
    setFilename(selectedFile.name);
    setUploadError("");
    setUploadResults(null);
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];

      // Check file type
      const fileExtension = droppedFile.name.split(".").pop().toLowerCase();
      if (
        fileExtension !== "csv" &&
        fileExtension !== "xlsx" &&
        fileExtension !== "xls"
      ) {
        setUploadError(
          "Invalid file format. Please upload a CSV or Excel file."
        );
        return;
      }

      setFile(droppedFile);
      setFilename(droppedFile.name);
      setUploadError("");
      setUploadResults(null);
    }
  };

  // Prevent default behavior for drag events
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Reset file input
  const resetFileInput = () => {
    setFile(null);
    setFilename("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setUploadResults(null);
    setUploadError("");
  };

  // Process the uploaded file
  const processFile = async () => {
    if (!file) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setParseProgress(0);

    try {
      // Read the file
      const reader = new FileReader();

      reader.onload = async (e) => {
        const fileExtension = filename.split(".").pop().toLowerCase();
        let data = [];

        try {
          setParseProgress(30);

          // Parse the file based on its type
          if (fileExtension === "csv") {
            // Parse CSV - read as text first, then parse
            const csvText = e.target.result as string;
            const workbook = XLSX.read(csvText, { type: "string" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            data = XLSX.utils.sheet_to_json(worksheet);
          } else {
            // Parse Excel (xlsx, xls)
            const excel = e.target.result;
            const workbook = XLSX.read(excel, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            data = XLSX.utils.sheet_to_json(worksheet);
          }

          setParseProgress(60);

          // Validate the data structure
          if (data.length === 0) {
            throw new Error("The uploaded file doesn't contain any data.");
          }

          if (!data[0].name || !data[0].country) {
            throw new Error(
              "The uploaded file is missing required columns (name, country)."
            );
          }

          // Normalize data: convert field names and ensure proper types
          const normalizedData = data.map((item) => {
            const normalized: any = {};

            // Comprehensive field name mapping
            const fieldMapping: Record<string, string> = {
              // Basic info
              supplierid: "id",
              "supplier name": "name",
              "company name": "name",
              name: "name",
              country: "country",
              location: "country",
              industry: "industry",
              sector: "industry",
              "revenue (millions usd)": "revenue",
              revenue: "revenue",
              "employee count": "employee_count",
              employees: "employee_count",
              website: "website",
              description: "description",

              // Environmental
              "co2 emissions (tons)": "co2_emissions",
              "co2 emissions": "co2_emissions",
              co2_emissions: "co2_emissions",
              "water usage (m3)": "water_usage",
              "water usage": "water_usage",
              water_usage: "water_usage",
              "waste generated (tons)": "waste_generated",
              "waste generated": "waste_generated",
              "total emissions (tons co2e)": "total_emissions",
              "total emissions": "total_emissions",
              "energy efficiency score (0-1)": "energy_efficiency",
              "energy efficiency": "energy_efficiency",
              "waste management score (0-1)": "waste_management_score",
              "waste management score": "waste_management_score",
              "renewable energy (%)": "renewable_energy_percent",
              "renewable energy": "renewable_energy_percent",
              "pollution control score (0-1)": "pollution_control",
              "pollution control": "pollution_control",

              // Social
              "wage fairness score (0-1)": "wage_fairness",
              "wage fairness": "wage_fairness",
              "human rights index (0-1)": "human_rights_index",
              "human rights index": "human_rights_index",
              "diversity & inclusion score (0-1)": "diversity_inclusion_score",
              "diversity inclusion score": "diversity_inclusion_score",
              diversity_inclusion_score: "diversity_inclusion_score",
              "community engagement (0-1)": "community_engagement",
              "community engagement": "community_engagement",
              "worker safety score (0-1)": "worker_safety",
              "worker safety": "worker_safety",
              "injury rate (per 200k hrs)": "injury_rate",
              "injury rate": "injury_rate",
              "training hours per employee": "training_hours",
              "training hours": "training_hours",
              "living wage ratio": "living_wage_ratio",
              "gender diversity (% women)": "gender_diversity_percent",
              "gender diversity": "gender_diversity_percent",

              // Governance
              "transparency score (0-1)": "transparency_score",
              "transparency score": "transparency_score",
              "corruption risk (0-1)": "corruption_risk",
              "corruption risk": "corruption_risk",
              "board diversity (%)": "board_diversity",
              "board diversity": "board_diversity",
              "board independence (%)": "board_independence",
              "board independence": "board_independence",
              "ethics program strength (0-1)": "ethics_program",
              "ethics program": "ethics_program",
              "compliance systems score (0-1)": "compliance_systems",
              "compliance systems": "compliance_systems",
              "anti-corruption policy in place": "anti_corruption_policy",
              "anti-corruption policy": "anti_corruption_policy",

              // Supply Chain
              "delivery efficiency (0-1)": "delivery_efficiency",
              "delivery efficiency": "delivery_efficiency",
              "quality control score (0-1)": "quality_control_score",
              "quality control score": "quality_control_score",
              "supplier diversity (0-1)": "supplier_diversity",
              "supplier diversity": "supplier_diversity",
              "supply chain traceability (0-1)": "traceability",
              traceability: "traceability",

              // Risk Factors
              "geopolitical risk (0-1)": "geopolitical_risk",
              "geopolitical risk": "geopolitical_risk",
              "climate risk (0-1)": "climate_risk",
              "climate risk": "climate_risk",
              "labor dispute risk (0-1)": "labor_dispute_risk",
              "labor dispute risk": "labor_dispute_risk",
            };

            // Map fields using the mapping table
            Object.keys(item).forEach((key) => {
              const lowerKey = key.toLowerCase().trim();
              const mappedField = fieldMapping[lowerKey];

              if (mappedField) {
                normalized[mappedField] = item[key];
              } else {
                // Fallback: convert to snake_case
                const snakeKey = key
                  .replace(/\s+/g, "_")
                  .replace(/[&()]/g, "")
                  .toLowerCase();
                normalized[snakeKey] = item[key];
              }
            });

            // Ensure required fields
            if (!normalized.name) {
              // Try to find name in any variation
              const nameKey = Object.keys(item).find(
                (k) =>
                  k.toLowerCase().includes("name") ||
                  k.toLowerCase().includes("supplier")
              );
              if (nameKey) normalized.name = item[nameKey];
            }
            if (!normalized.country) {
              const countryKey = Object.keys(item).find(
                (k) =>
                  k.toLowerCase().includes("country") ||
                  k.toLowerCase().includes("location")
              );
              if (countryKey) normalized.country = item[countryKey];
            }
            if (!normalized.industry) {
              normalized.industry =
                item.Industry || item.industry || "Manufacturing";
            }

            // Convert numeric strings to numbers
            const numericFields = [
              "revenue",
              "employee_count",
              "co2_emissions",
              "water_usage",
              "waste_generated",
              "total_emissions",
              "renewable_energy_percent",
              "energy_efficiency",
              "waste_management_score",
              "wage_fairness",
              "human_rights_index",
              "diversity_inclusion_score",
              "community_engagement",
              "worker_safety",
              "injury_rate",
              "training_hours",
              "living_wage_ratio",
              "gender_diversity_percent",
              "transparency_score",
              "corruption_risk",
              "board_diversity",
              "board_independence",
              "ethics_program",
              "compliance_systems",
              "delivery_efficiency",
              "quality_control_score",
              "supplier_diversity",
              "traceability",
              "geopolitical_risk",
              "climate_risk",
              "labor_dispute_risk",
              "pollution_control",
            ];

            numericFields.forEach((field) => {
              if (
                normalized[field] !== undefined &&
                normalized[field] !== null
              ) {
                const num = parseFloat(
                  String(normalized[field]).replace(/,/g, "")
                );
                if (!isNaN(num)) {
                  normalized[field] = num;
                }
              }
            });

            // Handle boolean fields
            if (normalized.anti_corruption_policy !== undefined) {
              const val = String(
                normalized.anti_corruption_policy
              ).toLowerCase();
              normalized.anti_corruption_policy =
                val === "1" || val === "true" || val === "yes" || val === "y";
            }

            return normalized;
          });

          setParseProgress(70);

          // Call the bulk import API
          const processingResults = await bulkImportSuppliers(normalizedData);

          setParseProgress(100);
          setUploadResults(processingResults);
        } catch (err) {
          console.error("Error parsing file:", err);
          setUploadError(
            err.message ||
              "Failed to parse the uploaded file. Please check the file format."
          );
        }

        setUploading(false);
      };

      reader.onerror = () => {
        setUploadError("Failed to read the file. Please try again.");
        setUploading(false);
      };

      // Read the file - use text for CSV, binary for Excel
      const fileExtension = filename.split(".").pop().toLowerCase();
      if (fileExtension === "csv") {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    } catch (err) {
      console.error("Error processing file:", err);
      setUploadError(
        err.message || "An unexpected error occurred while processing the file."
      );
      setUploading(false);
    }
  };

  // Function to download template
  const downloadTemplate = () => {
    // Create a sample data array
    const sampleData = [
      {
        name: "Example Supplier 1",
        country: "United States",
        industry: "Manufacturing",
        website: "https://example.com",
        co2_emissions: 1500,
        water_usage: 50000,
        energy_efficiency: 0.75,
        waste_management_score: 0.65,
        renewable_energy_percent: 45,
        pollution_control: 0.78,
        wage_fairness: 0.82,
        human_rights_index: 0.79,
        diversity_inclusion_score: 0.68,
        community_engagement: 0.72,
        worker_safety: 0.85,
        transparency_score: 0.76,
        corruption_risk: 0.32,
        board_diversity: 0.58,
        ethics_program: 0.73,
        compliance_systems: 0.67,
        delivery_efficiency: 0.81,
        quality_control_score: 0.79,
        supplier_diversity: 0.62,
        traceability: 0.75,
        geopolitical_risk: 0.45,
        climate_risk: 0.52,
        labor_dispute_risk: 0.38,
      },
      {
        name: "Example Supplier 2",
        country: "Germany",
        industry: "Automotive",
        website: "https://example-auto.de",
        co2_emissions: 2100,
        water_usage: 75000,
        energy_efficiency: 0.68,
        waste_management_score: 0.72,
        renewable_energy_percent: 65,
        pollution_control: 0.81,
        // Other fields can be empty in the template
      },
    ];

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");

    // Generate Excel file
    XLSX.writeFile(workbook, "supplier_import_template.xlsx");
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl border shadow-lg">
      <h3
        className="text-lg font-semibold mb-4 flex items-center"
        style={{ color: colors.primary }}
      >
        <TableCellsIcon className="h-5 w-5 mr-2" />
        Batch Supplier Upload
      </h3>

      <div className="text-sm mb-6" style={{ color: colors.textMuted }}>
        Upload multiple suppliers at once using a CSV or Excel file. The file
        should include columns for all supplier attributes.
      </div>

      {/* Template Download Button */}
      <div className="mb-6">
        <button
          onClick={downloadTemplate}
          className="flex items-center px-4 py-2 rounded-md text-sm transition-colors"
          style={{
            backgroundColor: colors.panel,
            color: colors.accent,
            border: `1px solid ${colors.accent}40`,
          }}
        >
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          Download Template
        </button>
        <p className="mt-2 text-xs" style={{ color: colors.textMuted }}>
          Download a template file with all required and optional fields.
        </p>
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          file ? "bg-black/10" : ""
        } transition-colors mb-6`}
        style={{ borderColor: colors.accent + "50" }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {!file ? (
          <div className="flex flex-col items-center">
            <ArrowUpTrayIcon
              className="h-12 w-12 mb-4"
              style={{ color: colors.accent + "80" }}
            />
            <p className="mb-4" style={{ color: colors.text }}>
              Drag and drop your CSV or Excel file here, or
            </p>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              className="px-4 py-2 rounded-md text-sm"
              style={{
                backgroundColor: colors.accent,
                color: colors.panel,
              }}
            >
              Browse Files
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentArrowUpIcon
                className="h-8 w-8 mr-3"
                style={{ color: colors.primary }}
              />
              <div className="text-left">
                <p className="font-medium" style={{ color: colors.text }}>
                  {filename}
                </p>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Ready to process. Click "Upload" to continue.
                </p>
              </div>
            </div>
            <button
              onClick={resetFileInput}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
              title="Remove file"
            >
              <XMarkIcon className="h-5 w-5" style={{ color: colors.error }} />
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="mb-6 p-3 rounded-md bg-red-950/20 border border-red-500/50 text-sm">
          <div className="flex items-start">
            <ExclamationTriangleIcon
              className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5"
              style={{ color: colors.error }}
            />
            <span style={{ color: colors.error }}>{uploadError}</span>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={processFile}
          disabled={!file || uploading}
          className="flex items-center px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: colors.primary,
            color: colors.background,
          }}
        >
          {uploading ? (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Upload and Process
            </>
          )}
        </button>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm" style={{ color: colors.textMuted }}>
              Processing file...
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: colors.primary }}
            >
              {parseProgress}%
            </span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: colors.primary,
                width: `${parseProgress}%`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${parseProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {uploadResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: colors.accent + "40" }}
        >
          <div className="p-4" style={{ backgroundColor: colors.panel }}>
            <h4
              className="text-lg font-medium mb-2"
              style={{ color: colors.text }}
            >
              Upload Results
            </h4>
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <div className="w-12 h-12 mr-3">
                  <CircularProgressbar
                    value={uploadResults.successful}
                    maxValue={uploadResults.total}
                    text={`${Math.round(
                      (uploadResults.successful / uploadResults.total) * 100
                    )}%`}
                    styles={buildStyles({
                      textSize: "26px",
                      pathColor: colors.success,
                      textColor: colors.success,
                      trailColor: colors.panel,
                    })}
                  />
                </div>
                <div>
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    Successful
                  </div>
                  <div
                    className="font-semibold"
                    style={{ color: colors.success }}
                  >
                    {uploadResults.successful} of {uploadResults.total}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-12 h-12 mr-3">
                  <CircularProgressbar
                    value={uploadResults.failed}
                    maxValue={uploadResults.total}
                    text={`${Math.round(
                      (uploadResults.failed / uploadResults.total) * 100
                    )}%`}
                    styles={buildStyles({
                      textSize: "26px",
                      pathColor: colors.error,
                      textColor: colors.error,
                      trailColor: colors.panel,
                    })}
                  />
                </div>
                <div>
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    Failed
                  </div>
                  <div
                    className="font-semibold"
                    style={{ color: colors.error }}
                  >
                    {uploadResults.failed} of {uploadResults.total}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead style={{ backgroundColor: colors.panel + "90" }}>
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium tracking-wider"
                    style={{ color: colors.textMuted }}
                  >
                    Status
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium tracking-wider"
                    style={{ color: colors.textMuted }}
                  >
                    Name
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium tracking-wider"
                    style={{ color: colors.textMuted }}
                  >
                    Country
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium tracking-wider"
                    style={{ color: colors.textMuted }}
                  >
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {uploadResults.records.map((record, index) => (
                  <tr key={index} className="hover:bg-white/5">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {record.success ? (
                        <CheckIcon
                          className="h-5 w-5"
                          style={{ color: colors.success }}
                        />
                      ) : (
                        <XMarkIcon
                          className="h-5 w-5"
                          style={{ color: colors.error }}
                        />
                      )}
                    </td>
                    <td
                      className="px-4 py-2 whitespace-nowrap text-sm"
                      style={{ color: colors.text }}
                    >
                      {record.name}
                    </td>
                    <td
                      className="px-4 py-2 whitespace-nowrap text-sm"
                      style={{ color: colors.text }}
                    >
                      {record.country}
                    </td>
                    <td
                      className="px-4 py-2 whitespace-nowrap text-sm"
                      style={{
                        color: record.success ? colors.success : colors.error,
                      }}
                    >
                      {record.success ? "Successfully imported" : record.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="p-4 flex justify-end"
            style={{ backgroundColor: colors.panel }}
          >
            <button
              onClick={resetFileInput}
              className="mr-3 px-4 py-2 rounded border text-sm"
              style={{
                borderColor: colors.accent + "40",
                color: colors.textMuted,
              }}
            >
              Reset
            </button>
            <Link
              to="/suppliers"
              className="px-4 py-2 rounded text-sm"
              style={{
                backgroundColor: colors.accent,
                color: colors.panel,
              }}
            >
              View All Suppliers
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const AddSupplier = () => {
  const colors = useThemeColors() as any;
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupSuccess, setLookupSuccess] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [uploadMode, setUploadMode] = useState("single"); // 'single' or 'batch'

  // Form sections initial state
  const [formData, setFormData] = useState({
    // Basic info
    name: "",
    country: "",
    industry: "Manufacturing",
    description: "",
    website: "",
    revenue: 0, // millions USD
    employee_count: 0,

    // Environmental metrics
    co2_emissions: 50,
    water_usage: 50,
    waste_generated: 0,
    total_emissions: 0,
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
    injury_rate: 0,
    training_hours: 0,
    living_wage_ratio: 1,
    gender_diversity_percent: 0,

    // Governance metrics
    transparency_score: 0.5,
    corruption_risk: 0.5,
    board_diversity: 0.5,
    board_independence: 0,
    ethics_program: 0.5,
    compliance_systems: 0.5,
    anti_corruption_policy: false,

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

  // Estimate data completeness similar to backend (key metrics presence)
  const estimatedCompleteness = useMemo(() => {
    const has = (v: any) => v !== undefined && v !== null && v !== "";
    let present = 0;
    let total = 0;
    // Intensities require revenue + numerator
    const rev = Number(formData.revenue) || 0;
    const em = Number(formData.total_emissions ?? formData.co2_emissions);
    const water = Number(formData.water_usage);
    const waste = Number(formData.waste_generated);
    const addMetric = (cond: boolean) => {
      total++;
      if (cond) present++;
    };
    addMetric(rev > 0 && (em || em === 0)); // emission_intensity
    addMetric(has(formData.renewable_energy_percent)); // renewable_pct
    addMetric(rev > 0 && (water || water === 0)); // water_intensity
    addMetric(rev > 0 && (waste || waste === 0)); // waste_intensity
    addMetric(has(formData.injury_rate));
    addMetric(has(formData.training_hours));
    addMetric(has(formData.living_wage_ratio)); // wage_ratio
    addMetric(
      has(formData.gender_diversity_percent) ||
        has(formData.diversity_inclusion_score)
    );
    addMetric(has(formData.board_diversity));
    addMetric(has(formData.board_independence));
    addMetric(has(formData.transparency_score));
    addMetric(typeof formData.anti_corruption_policy === "boolean");
    const ratio = total > 0 ? present / total : 1;
    return { ratio, present, total };
  }, [formData]);

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
      if (type === "checkbox") {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({ ...prev, [name]: checked }));
        return;
      }
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
        if (
          name === "renewable_energy_percent" ||
          name === "gender_diversity_percent" ||
          name === "board_independence"
        ) {
          processedValue = Math.max(0, Math.min(100, processedValue as number));
        }
        if (name === "living_wage_ratio") {
          processedValue = Math.max(0.5, Math.min(2, processedValue as number));
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

  // Check if the form is in a loading state
  const isLoading = isSubmitting || lookupLoading;

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

      {/* Upload Mode Toggle */}
      <div className="mb-8">
        <div
          className="inline-flex rounded-lg p-1"
          style={{
            backgroundColor: colors.panel,
            border: `1px solid ${colors.accent}40`,
          }}
        >
          <button
            className={`px-6 py-2 rounded text-sm font-medium transition-colors ${
              uploadMode === "single" ? "bg-accent/30" : ""
            }`}
            style={{
              color:
                uploadMode === "single" ? colors.primary : colors.textMuted,
            }}
            onClick={() => setUploadMode("single")}
          >
            <span className="flex items-center">
              <UserCircleIcon className="h-4 w-4 mr-2" />
              Single Supplier
            </span>
          </button>
          <button
            className={`px-6 py-2 rounded text-sm font-medium transition-colors ${
              uploadMode === "batch" ? "bg-accent/30" : ""
            }`}
            style={{
              color: uploadMode === "batch" ? colors.primary : colors.textMuted,
            }}
            onClick={() => setUploadMode("batch")}
          >
            <span className="flex items-center">
              <TableCellsIcon className="h-4 w-4 mr-2" />
              Batch Upload
            </span>
          </button>
        </div>
      </div>

      {/* Data Quality Indicator */}
      {uploadMode === "single" && (
        <div
          className="mb-6 p-4 rounded-lg border flex items-center justify-between"
          style={{
            borderColor: colors.accent + "40",
            backgroundColor: colors.panel,
          }}
        >
          <div>
            <div className="text-sm font-medium" style={{ color: colors.text }}>
              Estimated Data Completeness
            </div>
            <div className="text-xs" style={{ color: colors.textMuted }}>
              {estimatedCompleteness.present}/{estimatedCompleteness.total} key
              metrics provided
              {estimatedCompleteness.ratio < 0.7 && (
                <span className="ml-2" style={{ color: colors.warning }}>
                  • Scores may be capped at 50 if below 70%
                </span>
              )}
            </div>
          </div>
          <span
            className="px-2 py-1 rounded text-sm font-mono"
            style={{
              color:
                estimatedCompleteness.ratio >= 0.85
                  ? colors.success
                  : estimatedCompleteness.ratio >= 0.7
                  ? colors.warning
                  : colors.error,
              backgroundColor:
                (estimatedCompleteness.ratio >= 0.85
                  ? colors.success
                  : estimatedCompleteness.ratio >= 0.7
                  ? colors.warning
                  : colors.error) + "20",
              border: `1px solid ${
                estimatedCompleteness.ratio >= 0.85
                  ? colors.success
                  : estimatedCompleteness.ratio >= 0.7
                  ? colors.warning
                  : colors.error
              }40`,
            }}
          >
            {(estimatedCompleteness.ratio * 100).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Display either Real-Time ESG Preview or Batch Upload UI based on mode */}
      {uploadMode === "single" ? (
        <>
          {/* Real-Time ESG Score Preview */}
          <div className="mb-8">
            <ESGScorePreview formData={formData} />
          </div>

          {/* Single Supplier Form */}
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

                      <InputField
                        name="revenue"
                        label="Revenue (millions USD)"
                        type="number"
                        value={formData.revenue ?? 0}
                        onChange={handleChange}
                        placeholder="e.g., 120.5"
                        helper="Used to compute intensities (emissions, water, waste per revenue)."
                      />
                      <InputField
                        name="employee_count"
                        label="Employee Count"
                        type="number"
                        value={formData.employee_count ?? 0}
                        onChange={handleChange}
                        placeholder="e.g., 2500"
                        helper="Total number of employees across operations."
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
                      <InputField
                        name="waste_generated"
                        label="Waste Generated (tons)"
                        type="number"
                        value={formData.waste_generated ?? 0}
                        onChange={handleChange}
                        placeholder="e.g., 1200"
                        helper="Annual hazardous + non-hazardous waste generated."
                      />
                      <InputField
                        name="total_emissions"
                        label="Total Emissions (tons CO₂e)"
                        type="number"
                        value={formData.total_emissions ?? 0}
                        onChange={handleChange}
                        placeholder="Optional"
                        helper="If provided, used to compute emission intensity."
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
                      <InputField
                        name="injury_rate"
                        label="Injury Rate (per 200k hrs)"
                        type="number"
                        value={formData.injury_rate ?? 0}
                        onChange={handleChange}
                        placeholder="0-10"
                        helper="OSHA-like recordable incident rate. Lower is better."
                      />
                      <InputField
                        name="training_hours"
                        label="Training Hours per Employee"
                        type="number"
                        value={formData.training_hours ?? 0}
                        onChange={handleChange}
                        placeholder="e.g., 40"
                        helper="Average annual hours per employee."
                      />
                      <InputField
                        name="living_wage_ratio"
                        label="Living Wage Ratio"
                        type="number"
                        value={formData.living_wage_ratio ?? 1}
                        onChange={handleChange}
                        placeholder="e.g., 1.0"
                        helper="1.0 = wages meet local living wage benchmark."
                      />
                      <InputField
                        name="gender_diversity_percent"
                        label="Gender Diversity (% Women)"
                        type="number"
                        value={formData.gender_diversity_percent ?? 0}
                        onChange={handleChange}
                        placeholder="0-100"
                        helper="Percentage of women across workforce."
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
                      <InputField
                        name="board_independence"
                        label="Board Independence (%)"
                        type="number"
                        value={formData.board_independence ?? 0}
                        onChange={handleChange}
                        placeholder="0-100"
                        helper="Share of independent directors."
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
                      <label
                        htmlFor="anti_corruption_policy"
                        className="flex items-center gap-3 cursor-pointer select-none mt-2"
                        style={{ color: colors.text }}
                      >
                        <input
                          id="anti_corruption_policy"
                          name="anti_corruption_policy"
                          type="checkbox"
                          checked={!!formData.anti_corruption_policy}
                          onChange={handleChange as any}
                          className="h-4 w-4 rounded border focus:ring-2"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.accent + "60",
                          }}
                        />
                        <span className="text-sm">
                          Anti-Corruption Policy in Place
                        </span>
                      </label>
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
                      <p
                        className="text-sm"
                        style={{ color: colors.textMuted }}
                      >
                        Fields marked with an{" "}
                        <span className="text-yellow-400 font-medium">
                          asterisk (*)
                        </span>{" "}
                        are required. Scores will be automatically calculated
                        upon submission.
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
                        disabled={isLoading}
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

                        {isLoading ? (
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
        </>
      ) : (
        <BatchUpload />
      )}

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
