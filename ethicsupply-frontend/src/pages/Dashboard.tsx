import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  UsersIcon,
  ScaleIcon,
  CloudIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ListBulletIcon,
  BeakerIcon,
  MapIcon,
  DocumentArrowDownIcon,
  DocumentChartBarIcon,
  ClipboardDocumentCheckIcon,
  PresentationChartLineIcon,
  CalendarIcon,
  SparklesIcon,
  TrophyIcon,
  LightBulbIcon,
  CheckBadgeIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ComposedChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
  DonutChart,
} from "recharts";
import { getDashboardData, checkApiConnection, getMockDashboardData } from "../services/dashboardService";
import { getDatasetMeta, getBands, getSuppliers, Supplier, BandsMap } from "../services/api";
import { getSupplyChainGraphData, GraphData } from "../services/api";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import MachineLearningStatus from "../components/MachineLearningStatus";
import EthicalScoreDistributionChart from "../components/EthicalScoreDistributionChart";
import CO2EmissionsChart from "../components/CO2EmissionsChart";
import RecentSuppliersList from "../components/RecentSuppliersList";
import EthicalScoreTooltip from "../components/tooltips/EthicalScoreTooltip";
import CO2EmissionsTooltip from "../components/tooltips/CO2EmissionsTooltip";
import WaterUsageTooltip from "../components/tooltips/WaterUsageTooltip";
import RenewableEnergyTooltip from "../components/tooltips/RenewableEnergyTooltip";
import SustainablePracticesTooltip from "../components/tooltips/SustainablePracticesTooltip";
import SustainabilityMetricsTooltip from "../components/tooltips/SustainabilityMetricsTooltip";
import ChartInfoOverlay from "../components/ChartInfoOverlay";
import ChartMetricsExplainer from "../components/ChartMetricsExplainer";
import InsightsPanel, { chartInsights } from "../components/InsightsPanel";
import SuppliersByCountryChart from "../components/SuppliersByCountryChart";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import MethodologyModal from "../components/MethodologyModal";
import DataQualityCard from "../components/DataQualityCard";
import MetricCard from "../components/MetricCard";
import EditTargetsModal from "../components/EditTargetsModal";
import { defaultTargets, Targets } from "../config/targets";
import logger from "../utils/log";
import useIsMobile from "../hooks/useIsMobile";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../theme/colors";

// Load persisted target overrides
function loadTargets(): Targets {
  try {
    const raw = localStorage.getItem("targetsOverride");
    if (!raw) return defaultTargets;
    const parsed = JSON.parse(raw);
    return {
      renewablePct: Number.isFinite(Number(parsed.renewablePct)) ? Number(parsed.renewablePct) : defaultTargets.renewablePct,
      injuryRate: Number.isFinite(Number(parsed.injuryRate)) ? Number(parsed.injuryRate) : defaultTargets.injuryRate,
    };
  } catch {
    return defaultTargets;
  }
}

// LocalStorage key shared with SupplyChainGraph for user-created links
const USER_LINKS_KEY = "supplyChain:userLinks";

// Define chart info content
const chartInfoContent = {
  ethicalScore: {
    title: "Ethical Score Distribution",
    description:
      "Distribution of suppliers across ethical score ranges from 0-100.",
  },
  co2Emissions: {
    title: "CO₂ Emissions by Industry",
    description:
      "Carbon emissions breakdown by industry sector in your supply chain.",
  },
  waterUsage: {
    title: "Water Usage Trend",
    description: "Monthly water consumption per production unit over time.",
  },
  renewableEnergy: {
    title: "Renewable Energy Adoption",
    description: "Breakdown of energy sources used across your supply chain.",
  },
  sustainablePractices: {
    title: "Sustainable Practices Adoption",
    description:
      "Current adoption rates versus target goals for key sustainable practices.",
  },
  sustainabilityMetrics: {
    title: "Sustainability Performance",
    description: "Your sustainability metrics compared to industry averages.",
  },
};

// Define colors for charts
const COLORS = [
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#EF4444",
];

const apiEndpoint = "/api/dashboard/";

// Theme-aware colors
const useColors = () => {
  const { darkMode } = useTheme();
  return getThemeColors(darkMode) as any;
};

// Chart colors derived per-render from active theme

// Helper to get score color (consistent with other pages)
const getScoreColor = (score: number | null | undefined, themeColors: any) => {
  if (score === null || score === undefined) return themeColors.textMuted;
  const normalizedScore = score > 0 && score <= 1 ? score * 100 : score;
  if (normalizedScore >= 80) return themeColors.success;
  if (normalizedScore >= 60) return themeColors.primary; // Use teal for good
  if (normalizedScore >= 40) return themeColors.warning;
  return themeColors.error;
};

// Helper to get risk color (consistent with other pages)
const getRiskColor = (level: string | undefined) => {
  switch (level?.toLowerCase()) {
    case "low":
      return colors.success;
    case "medium":
      return colors.warning;
    case "high":
      return colors.error;
    default:
      return colors.textMuted;
  }
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

// --- Reusable Styled Components ---

const LoadingIndicator = () => {
  const colors = useColors();
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-20 h-20 border-t-4 border-b-4 rounded-full mb-6"
        style={{ borderColor: colors.primary }}
      />
      <p className="text-xl font-light" style={{ color: colors.textMuted }}>
        Initializing Command Center...
      </p>
    </div>
  );
};

const ErrorDisplay = ({ message }) => {
  const colors = useColors();
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-red-900/30 border border-red-500 p-8 rounded-lg text-center max-w-lg shadow-xl"
      >
        <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-5" style={{ color: colors.error }} />
        <h3 className="text-2xl font-semibold mb-3" style={{ color: colors.error }}>
          Connection Error
        </h3>
        <p className="text-lg" style={{ color: colors.textMuted }}>
          {message}
        </p>
      </motion.div>
    </div>
  );
};

const DashboardCard = ({
  title,
  icon: Icon,
  children,
  className = "",
  gridSpan = "col-span-1",
}) => {
  const colors = useColors();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-xl border backdrop-blur-md p-5 ${gridSpan} ${className}`}
      style={{
        backgroundColor: colors.card,
        borderColor: colors.accent + "20",
        boxShadow: `0 0 15px ${colors.accent}10`,
      }}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-lg mr-3" style={{ backgroundColor: colors.panel }}>
            <Icon className="h-5 w-5" style={{ color: colors.primary }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
            {title}
          </h3>
        </div>
        <div className="flex-grow">{children}</div>
      </div>
    </motion.div>
  );
};

const KpiIndicator = ({
  label,
  value,
  unit = "",
  icon: Icon,
  color,
  children,
}) => {
  const colors = useColors();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center p-4 rounded-lg border"
      style={{ borderColor: color + "40", backgroundColor: color + "10" }}
    >
      <Icon className="h-8 w-8 mb-3" style={{ color: color }} />
      <span className="text-sm font-medium" style={{ color: colors.textMuted }}>
        {label}
      </span>
      {value !== undefined && value !== null && (
        <span className="text-3xl font-bold mt-1" style={{ color: colors.text }}>
          {value}
          {unit}
        </span>
      )}
      {children}
    </motion.div>
  );
};

// Report Generation
const ReportGenerator = ({
  dashboardData,
  year = new Date().getFullYear(),
  allSuppliers = [] as Supplier[],
}) => {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const reportContainerRef = React.useRef(null);
  const colors = useColors();

  // Format data for report
  const formatDataForReport = () => {
    if (!dashboardData) return null;

    return {
      summary: {
        title: `Annual ESG Performance Report ${year}`,
        date: new Date().toLocaleDateString(),
        totalSuppliers:
          dashboardData.totalSuppliers ?? dashboardData.total_suppliers ?? 0,
        avgEthicalScore:
          dashboardData.avgEthicalScore ?? dashboardData.avg_ethical_score ?? 0,
        avgCompositeScore:
          dashboardData.avgCompositeScore ??
          dashboardData.avg_composite_score ??
          dashboardData.avgEthicalScore ??
          0,
        avgRiskFactor:
          dashboardData.avgRiskFactor ?? dashboardData.avg_risk_factor ?? 0,
        avgCompletenessRatio:
          dashboardData.avgCompletenessRatio ??
          dashboardData.avg_completeness_ratio ??
          1,
        avgCO2Emissions:
          dashboardData.avgCo2Emissions ?? dashboardData.avg_co2_emissions ?? 0,
        riskBreakdown:
          dashboardData.riskBreakdown ?? dashboardData.risk_breakdown ?? {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
          },
      },
      scoreDistribution:
        dashboardData.ethicalScoreDistribution ||
        dashboardData.ethical_score_distribution ||
        [],
      co2ByIndustry:
        dashboardData.co2EmissionsByIndustry ||
        dashboardData.co2_emissions_by_industry ||
        [],
      pillarAverages:
        (dashboardData.pillarAverages || dashboardData.pillar_averages || null) as
          | { environmental: number; social: number; governance: number }
          | null,
      suppliersByCountry:
        dashboardData.suppliersByCountry ||
        dashboardData.suppliers_by_country ||
        {},
      waterUsageTrend:
        dashboardData.waterUsageTrend ||
        dashboardData.water_usage_trend ||
        [],
      renewableEnergy:
        dashboardData.renewableEnergyMix ||
        dashboardData.renewableEnergyAdoption ||
        dashboardData.renewable_energy_adoption ||
        [],
      sustainablePractices:
        dashboardData.sustainablePractices ||
        dashboardData.sustainable_practices ||
        [],
      recentSuppliers:
        dashboardData.recentSuppliers ||
        dashboardData.recent_suppliers ||
        [],
      mlInsights: [
        {
          title: "Predicted Trend Analysis",
          description:
            "Based on current trajectory, your overall ESG score is predicted to improve by 12% next quarter, primarily driven by improvements in the social responsibility domain.",
          confidence: 0.87,
        },
        {
          title: "Risk Factor Analysis",
          description:
            "Machine learning models have identified 3 suppliers with high potential for experiencing labor disputes in the next 6 months. Proactive engagement recommended.",
          confidence: 0.82,
        },
        {
          title: "Opportunity Detection",
          description:
            "Switching 15% of your energy suppliers to renewable sources would improve your environmental score by 22% with minimal cost impact based on current market conditions.",
          confidence: 0.91,
        },
        {
          title: "Anomaly Detection",
          description:
            "Unusual pattern detected in water usage reporting from 2 suppliers in Southeast Asia region. Data verification recommended.",
          confidence: 0.78,
        },
      ],
      improvementRecommendations: [
        "Implement supplier diversity program to improve social score",
        "Encourage top 10 carbon-emitting suppliers to set science-based targets",
        "Develop water conservation incentives for water-intensive industries",
        "Enhance supply chain transparency through blockchain tracking",
      ],
    };
  };

  // Generate and download PDF report
  const generatePDFReport = async () => {
    setGenerating(true);
    const reportData = formatDataForReport();
    if (!reportData) {
      setGenerating(false);
      return;
    }

    try {
      // Import the comprehensive PDF generator
      const { generateComprehensivePDFReport } = await import("./Dashboard_PDF_Enhanced");
      await generateComprehensivePDFReport(reportData, allSuppliers, year);
      setGenerating(false);
      return;
    } catch (importError) {
      console.warn("Failed to load enhanced PDF generator, using fallback:", importError);
      // Fallback to original implementation if import fails
    }

    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Add fancy background
      doc.setFillColor(13, 15, 26); // Dark background color
      doc.rect(0, 0, 210, 297, "F");

      // Title page
      doc.setTextColor(0, 240, 255); // Primary teal color
      doc.setFontSize(24);
      doc.text(reportData.summary.title, 105, 40, { align: "center" });

      doc.setTextColor(224, 224, 255); // Text color
      doc.setFontSize(12);
      doc.text(`Generated on: ${reportData.summary.date}`, 105, 50, {
        align: "center",
      });

      // Add your company logo or placeholder
      // This would be implemented with an image in the real version
      doc.setFillColor(77, 91, 255); // Accent color
      doc.roundedRect(75, 70, 60, 60, 5, 5, "F");
      doc.setTextColor(13, 15, 26);
      doc.setFontSize(18);
      doc.text("LOGO", 105, 100, { align: "center" });

      // Summary section
      doc.addPage();
      doc.setFillColor(13, 15, 26);
      doc.rect(0, 0, 210, 297, "F");

      doc.setTextColor(0, 240, 255);
      doc.setFontSize(18);
      doc.text("Executive Summary", 105, 20, { align: "center" });

      doc.setTextColor(224, 224, 255);
      doc.setFontSize(11);
      doc.text(
        "This report provides a comprehensive overview of your supply chain's ESG performance",
        105,
        30,
        { align: "center" }
      );
      doc.text(
        "for the past year, with detailed analytics and actionable insights.",
        105,
        36,
        { align: "center" }
      );

      // Key metrics
      doc.setFillColor(25, 28, 43);
      doc.roundedRect(20, 45, 170, 60, 3, 3, "F");

      doc.setTextColor(138, 148, 200);
      doc.text("Total Suppliers", 40, 58);
      doc.text("Avg. Ethical Score", 95, 58);
      doc.text("Avg. CO₂ Emissions", 150, 58);

      doc.setTextColor(0, 240, 255);
      doc.setFontSize(18);
      doc.text(reportData.summary.totalSuppliers.toString(), 40, 70);
      doc.text(`${Math.round(reportData.summary.avgEthicalScore)}%`, 95, 70);
      doc.text(`${reportData.summary.avgCO2Emissions.toFixed(1)}t`, 150, 70);

      // Additional KPIs
      doc.setTextColor(138, 148, 200);
      doc.text("Avg. Risk Penalty", 40, 88);
      doc.text("Avg. Data Completeness", 120, 88);
      doc.setTextColor(0, 240, 255);
      doc.setFontSize(14);
      doc.text(`${Math.round((reportData.summary.avgRiskFactor || 0) * 100)}%`, 40, 98);
      doc.text(`${Math.round((reportData.summary.avgCompletenessRatio || 1) * 100)}%`, 120, 98);

      // Risk breakdown table
      doc.setTextColor(0, 240, 255);
      doc.setFontSize(14);
      doc.text("Risk Distribution", 105, 120, { align: "center" });

      const riskData = [
        ["Risk Level", "Count", "Percentage"],
        [
          "Low Risk",
          reportData.summary.riskBreakdown.low || 0,
          `${(
            ((reportData.summary.riskBreakdown.low || 0) /
              reportData.summary.totalSuppliers) *
            100
          ).toFixed(1)}%`,
        ],
        [
          "Medium Risk",
          reportData.summary.riskBreakdown.medium || 0,
          `${(
            ((reportData.summary.riskBreakdown.medium || 0) /
              reportData.summary.totalSuppliers) *
            100
          ).toFixed(1)}%`,
        ],
        [
          "High Risk",
          reportData.summary.riskBreakdown.high || 0,
          `${(
            ((reportData.summary.riskBreakdown.high || 0) /
              reportData.summary.totalSuppliers) *
            100
          ).toFixed(1)}%`,
        ],
      ];

      // Stacked bar visualization (100% width)
      const barX = 30;
      const barY = 126;
      const barW = 150;
      const barH = 8;
      const total = Math.max(1, reportData.summary.totalSuppliers || 1);
      const low = reportData.summary.riskBreakdown.low || 0;
      const med = reportData.summary.riskBreakdown.medium || 0;
      const high = reportData.summary.riskBreakdown.high || 0;
      const critical = reportData.summary.riskBreakdown.critical || 0;
      const lowW = (low / total) * barW;
      const medW = (med / total) * barW;
      const highW = (high / total) * barW;
      const critW = (critical / total) * barW;
      // Track
      doc.setFillColor(40, 44, 66);
      doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F');
      // Segments
      let offsetX = barX;
      const segs: [number, number, number, number][] = [
        [10, 185, 129, lowW],
        [245, 158, 11, medW],
        [239, 68, 68, highW],
        [139, 92, 246, critW],
      ];
      segs.forEach(([r, g, b, w]) => {
        if (w <= 0.1) return;
        doc.setFillColor(r, g, b);
        doc.roundedRect(offsetX, barY, w, barH, 2, 2, 'F');
        offsetX += w;
      });
      // Legend
      const legendY = barY + 15;
      const legendItems: [string, [number, number, number], number][] = [
        [`Low (${low})`, [10,185,129], 35],
        [`Medium (${med})`, [245,158,11], 85],
        [`High (${high})`, [239,68,68], 150],
        [`Critical (${critical})`, [139,92,246], 190],
      ];
      legendItems.forEach(([label, color, x]) => {
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(x, legendY - 4, 6, 6, 'F');
        doc.setTextColor(224, 224, 255);
        doc.setFontSize(10);
        doc.text(label, x + 9, legendY + 1);
      });

      autoTable(doc, {
        head: [riskData[0]],
        body: riskData.slice(1),
        startY: 155,
        styles: {
          font: "helvetica",
          fillColor: [25, 28, 43],
          textColor: [224, 224, 255],
          lineColor: [77, 91, 255, 0.2],
        },
        headStyles: {
          fillColor: [77, 91, 255],
          textColor: [224, 224, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [30, 33, 48],
        },
      });

      // Pillars & Top Countries page
      doc.addPage();
      doc.setFillColor(13, 15, 26);
      doc.rect(0, 0, 210, 297, "F");

      doc.setTextColor(0, 240, 255);
      doc.setFontSize(18);
      doc.text("Pillars & Top Countries", 105, 20, { align: "center" });

      doc.setTextColor(138, 148, 200);
      doc.text("Pillar Scores", 30, 40);

      const p = reportData.pillarAverages;
      const pillarLabels = ["Environmental", "Social", "Governance"];
      const pillarVals: number[] = p ? [p.environmental, p.social, p.governance] : [0, 0, 0];
      const pillarColors: [number, number, number][] = [
        [16, 185, 129],
        [59, 130, 246],
        [139, 92, 246],
      ];
      let yPos = 50;
      for (let i = 0; i < 3; i++) {
        doc.setTextColor(224, 224, 255);
        doc.text(`${pillarLabels[i]}: ${pillarVals[i].toFixed(1)}`, 30, yPos);
        doc.setFillColor(40, 44, 66);
        doc.roundedRect(30, yPos + 4, 110, 6, 2, 2, 'F');
        const w = Math.max(2, Math.min(110, pillarVals[i] * 1.1));
        const c = pillarColors[i];
        doc.setFillColor(c[0], c[1], c[2]);
        doc.roundedRect(30, yPos + 4, w, 6, 2, 2, 'F');
        yPos += 18;
      }

      // Top countries list
      const countryEntries = Object.entries(reportData.suppliersByCountry || {})
        .filter(([_, v]) => (v as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 10);
      if (countryEntries.length) {
        doc.setTextColor(138, 148, 200);
        doc.text("Top Countries", 150, 40, { align: 'center' });
        let cy = 50;
        countryEntries.forEach(([name, val], idx) => {
          const color: [number, number, number] = idx < 4 ? [77,91,255] : idx < 7 ? [0,240,255] : [16,185,129];
          doc.setFillColor(...color);
          doc.circle(120, cy - 3, 2, 'F');
          doc.setTextColor(224,224,255);
          // wrap long names if needed
          const display = String(name).length > 18 ? String(name).slice(0, 17) + '…' : String(name);
          doc.text(display, 125, cy);
          doc.setTextColor(138,148,200);
          doc.text(String(val), 195, cy, { align: 'right' });
          cy += 10;
        });
      }

      // ML Insights page
      doc.addPage();
      doc.setFillColor(13, 15, 26);
      doc.rect(0, 0, 210, 297, "F");

      doc.setTextColor(255, 0, 255); // Secondary color
      doc.setFontSize(18);
      doc.text("AI-Powered Insights", 105, 20, { align: "center" });

      doc.setFillColor(25, 28, 43);
      reportData.mlInsights.forEach((insight, index) => {
        const yPos = 40 + index * 45;

        // Insight box
        doc.setFillColor(25, 28, 43);
        doc.roundedRect(20, yPos, 170, 35, 3, 3, "F");

        // Title
        doc.setTextColor(0, 240, 255);
        doc.setFontSize(12);
        doc.text(insight.title, 25, yPos + 10);

        // Confidence pill
        doc.setFillColor(77, 91, 255, 0.2);
        const confidenceText = `${(insight.confidence * 100).toFixed(
          0
        )}% confidence`;
        const confidenceWidth = doc.getTextWidth(confidenceText) + 10;
        doc.roundedRect(
          170 - confidenceWidth,
          yPos + 5,
          confidenceWidth,
          7,
          3,
          3,
          "F"
        );

        doc.setTextColor(138, 148, 200);
        doc.setFontSize(8);
        doc.text(confidenceText, 170 - confidenceWidth / 2, yPos + 9, {
          align: "center",
        });

        // Description
        doc.setTextColor(224, 224, 255);
        doc.setFontSize(10);
        const splitDescription = doc.splitTextToSize(insight.description, 160);
        doc.text(splitDescription, 25, yPos + 18);
      });

      // Recommendations
      doc.addPage();
      doc.setFillColor(13, 15, 26);
      doc.rect(0, 0, 210, 297, "F");

      doc.setTextColor(0, 255, 143); // Success color
      doc.setFontSize(18);
      doc.text("Improvement Recommendations", 105, 20, { align: "center" });

      doc.setTextColor(224, 224, 255);
      doc.setFontSize(11);
      doc.text(
        "Based on data analysis and industry benchmarks, we recommend these actions:",
        105,
        32,
        { align: "center" }
      );

      doc.setFillColor(25, 28, 43);
      doc.roundedRect(20, 40, 170, 80, 3, 3, "F");

      doc.setTextColor(224, 224, 255);
      reportData.improvementRecommendations.forEach((recommendation, index) => {
        const yPos = 55 + index * 15;

        // Bullet point
        doc.setFillColor(0, 240, 255);
        doc.circle(30, yPos - 4, 1.5, "F");

        // Recommendation text
        doc.text(recommendation, 35, yPos);
      });

      // Recent suppliers
      if (reportData.recentSuppliers.length > 0) {
        const supplierData = [
          [
            "Supplier",
            "Country",
            "ESG (Risk)",
            "Composite",
            "Risk",
            "Disclosure",
          ],
        ];

        reportData.recentSuppliers.forEach((supplier) => {
          supplierData.push([
            supplier.name || "N/A",
            supplier.country || "N/A",
            supplier.ethical_score !== undefined && supplier.ethical_score !== null
              ? `${Math.round(supplier.ethical_score)}%`
              : "N/A",
            supplier.composite_score !== undefined &&
            supplier.composite_score !== null
              ? `${Math.round(supplier.composite_score)}%`
              : "N/A",
            (supplier.risk_level || "N/A").toString(),
            supplier.completeness_ratio !== undefined &&
            supplier.completeness_ratio !== null
              ? formatPercent(supplier.completeness_ratio, 0)
              : "N/A",
          ]);
        });

        doc.setTextColor(0, 240, 255);
        doc.setFontSize(14);
        doc.text("Recent Supplier Additions", 105, 140, { align: "center" });

        autoTable(doc, {
          head: [supplierData[0]],
          body: supplierData.slice(1),
          startY: 150,
          styles: {
            font: "helvetica",
            fillColor: [25, 28, 43],
            textColor: [224, 224, 255],
            lineColor: [77, 91, 255, 0.2],
          },
          headStyles: {
            fillColor: [77, 91, 255],
            textColor: [224, 224, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [30, 33, 48],
          },
        });
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer separator
        doc.setDrawColor(77, 91, 255, 0.3);
        doc.line(20, 280, 190, 280);

        // Footer text
        doc.setTextColor(138, 148, 200);
        doc.setFontSize(8);
        doc.text(
          `Annual ESG Performance Report ${year} | Generated with EthicSupply AI | Page ${i} of ${pageCount}`,
          105,
          288,
          { align: "center" }
        );
      }

      // Save the PDF
      doc.save(`ESG_Annual_Report_${year}.pdf`);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      alert(
        "An error occurred while generating the PDF report. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  // Generate and download Excel report
  const generateExcelReport = async () => {
    setGenerating(true);
    const reportData = formatDataForReport();
    if (!reportData) {
      setGenerating(false);
      return;
    }

    try {
      // Create workbook and worksheets
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Annual ESG Performance Report", year],
        ["Generated on", new Date().toLocaleDateString()],
        [""],
        ["Key Metrics", "Value"],
        ["Total Suppliers", reportData.summary.totalSuppliers],
        [
          "Average ESG Score",
          `${Math.round(reportData.summary.avgEthicalScore)}%`,
        ],
        [
          "Average CO₂ Emissions",
          `${reportData.summary.avgCO2Emissions.toFixed(1)} tons`,
        ],
        [""],
        ["Risk Distribution", "Count", "Percentage"],
        [
          "Low Risk",
          reportData.summary.riskBreakdown.low || 0,
          `${(
            ((reportData.summary.riskBreakdown.low || 0) /
              reportData.summary.totalSuppliers) *
            100
          ).toFixed(1)}%`,
        ],
        [
          "Medium Risk",
          reportData.summary.riskBreakdown.medium || 0,
          `${(
            ((reportData.summary.riskBreakdown.medium || 0) /
              reportData.summary.totalSuppliers) *
            100
          ).toFixed(1)}%`,
        ],
        [
          "High Risk",
          reportData.summary.riskBreakdown.high || 0,
          `${(
            ((reportData.summary.riskBreakdown.high || 0) /
              reportData.summary.totalSuppliers) *
            100
          ).toFixed(1)}%`,
        ],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Executive Summary");

      // Score Distribution sheet
      if (reportData.scoreDistribution.length > 0) {
        const scoreDistData = [["Score Range", "Number of Suppliers"]];

        reportData.scoreDistribution.forEach((item) => {
          scoreDistData.push([item.range, item.count]);
        });

        const scoreDistSheet = XLSX.utils.aoa_to_sheet(scoreDistData);
        XLSX.utils.book_append_sheet(wb, scoreDistSheet, "Score Distribution");
      }

      // CO2 by Industry sheet
      if (reportData.co2ByIndustry.length > 0) {
        const co2Data = [["Industry", "CO₂ Emissions (tons)"]];

        reportData.co2ByIndustry.forEach((item) => {
          co2Data.push([item.name, item.value]);
        });

        const co2Sheet = XLSX.utils.aoa_to_sheet(co2Data);
        XLSX.utils.book_append_sheet(wb, co2Sheet, "CO2 Emissions");
      }

      // Water Usage Trend sheet
      if (reportData.waterUsageTrend.length > 0) {
        const waterData = [["Month", "Water Usage (m³)"]];

        reportData.waterUsageTrend.forEach((item) => {
          waterData.push([item.month, item.usage]);
        });

        const waterSheet = XLSX.utils.aoa_to_sheet(waterData);
        XLSX.utils.book_append_sheet(wb, waterSheet, "Water Usage");
      }

      // Suppliers sheet
      if (reportData.recentSuppliers.length > 0) {
        const supplierData = [
          [
            "Name",
            "Country",
            "ESG (Risk)",
            "Composite",
            "Risk Level",
            "Disclosure",
            "Updated",
          ],
        ];

        reportData.recentSuppliers.forEach((supplier) => {
          supplierData.push([
            supplier.name || "N/A",
            supplier.country || "N/A",
            supplier.ethical_score ?? "N/A",
            supplier.composite_score ?? "N/A",
            (supplier.risk_level || "N/A").toString(),
            supplier.completeness_ratio !== undefined &&
            supplier.completeness_ratio !== null
              ? formatPercent(supplier.completeness_ratio, 0)
              : "N/A",
            supplier.updated_at
              ? new Date(supplier.updated_at).toLocaleDateString()
              : "N/A",
          ]);
        });

        const supplierSheet = XLSX.utils.aoa_to_sheet(supplierData);
        XLSX.utils.book_append_sheet(wb, supplierSheet, "Suppliers");
      }

      // ML Insights sheet
      const insightsData = [["AI-Powered Insights"], [""]];

      reportData.mlInsights.forEach((insight, index) => {
        insightsData.push([`Insight ${index + 1}: ${insight.title}`]);
        insightsData.push([insight.description]);
        insightsData.push([
          `Confidence: ${(insight.confidence * 100).toFixed(0)}%`,
        ]);
        insightsData.push([""]);
      });

      const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData);
      XLSX.utils.book_append_sheet(wb, insightsSheet, "AI Insights");

      // Improvement Recommendations sheet
      const recommendationsData = [["Improvement Recommendations"], [""]];

      reportData.improvementRecommendations.forEach((recommendation, index) => {
        recommendationsData.push([`${index + 1}. ${recommendation}`]);
      });

      const recommendationsSheet = XLSX.utils.aoa_to_sheet(recommendationsData);
      XLSX.utils.book_append_sheet(wb, recommendationsSheet, "Recommendations");

      // Generate the Excel file
      XLSX.writeFile(wb, `ESG_Annual_Report_${year}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel report:", error);
      alert(
        "An error occurred while generating the Excel report. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleReportGeneration = (type) => {
    setReportType(type);

    if (type === "pdf") {
      generatePDFReport();
    } else if (type === "excel") {
      generateExcelReport();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl backdrop-blur-sm border p-5"
        style={{
          backgroundColor: colors.panel,
          borderColor: colors.accent + "40",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div
              className="p-2 rounded-lg mr-3"
              style={{ backgroundColor: colors.background }}
            >
              <DocumentChartBarIcon
                className="h-5 w-5"
                style={{ color: colors.secondary }}
              />
            </div>
            <h3
              className="text-lg font-semibold"
              style={{ color: colors.text }}
            >
              Annual ESG Reports
            </h3>
          </div>
          <div className="flex items-center">
            <CalendarIcon
              className="h-5 w-5 mr-2"
              style={{ color: colors.accent }}
            />
            <span style={{ color: colors.textMuted }}>{year}</span>
          </div>
        </div>

        <p className="mb-4 text-sm" style={{ color: colors.textMuted }}>
          Generate comprehensive reports with your ESG performance data,
          including AI-powered insights and visualizations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleReportGeneration("pdf")}
            disabled={generating}
            className="flex items-center justify-center p-4 rounded-lg border transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.primary + "40",
              color: colors.primary,
            }}
          >
            <div className="flex flex-col items-center">
              {generating && reportType === "pdf" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-t-2 border-b-2 rounded-full mb-2"
                  style={{ borderColor: colors.primary }}
                />
              ) : (
                <DocumentArrowDownIcon className="h-8 w-8 mb-2" />
              )}
              <span className="font-medium">
                {generating && reportType === "pdf"
                  ? "Generating..."
                  : "PDF Report"}
              </span>
              <span
                className="text-xs mt-1"
                style={{ color: colors.textMuted }}
              >
                Interactive PDF with visualizations
              </span>
            </div>
          </button>

          <button
            onClick={() => handleReportGeneration("excel")}
            disabled={generating}
            className="flex items-center justify-center p-4 rounded-lg border transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.secondary + "40",
              color: colors.secondary,
            }}
          >
            <div className="flex flex-col items-center">
              {generating && reportType === "excel" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-t-2 border-b-2 rounded-full mb-2"
                  style={{ borderColor: colors.secondary }}
                />
              ) : (
                <ClipboardDocumentCheckIcon className="h-8 w-8 mb-2" />
              )}
              <span className="font-medium">
                {generating && reportType === "excel"
                  ? "Generating..."
                  : "Excel Report"}
              </span>
              <span
                className="text-xs mt-1"
                style={{ color: colors.textMuted }}
              >
                Detailed data for further analysis
              </span>
            </div>
          </button>
        </div>

        <div
          className="mt-4 pt-4 border-t"
          style={{ borderColor: colors.accent + "20" }}
        >
          <div className="flex items-center">
            <PresentationChartLineIcon
              className="h-4 w-4 mr-2"
              style={{ color: colors.success }}
            />
            <span className="text-sm" style={{ color: colors.success }}>
              Report includes AI-powered insights and trend analysis
            </span>
          </div>
        </div>
      </motion.div>

    </>
  );
};

// --- Dashboard Component ---

const Dashboard = () => {
  const colors = useColors();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [datasetMeta, setDatasetMeta] = useState<{
    version: string;
    seed: string | null;
    generatedAt: string | null;
    bandsVersion: string | null;
  } | null>(null);
  const [showMethodology, setShowMethodology] = useState<boolean>(false);
  const [targets, setTargets] = useState<Targets>(loadTargets());
  const [showEditTargets, setShowEditTargets] = useState<boolean>(false);
  const [dqBands, setDqBands] = useState<BandsMap | null>(null);
  // Extra datasets for creative analytics
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  // Local snapshot for movers (persisted across sessions)
  const [topMovers, setTopMovers] = useState<{
    increases: Array<{ id: string | number; name: string; delta: number }>;
    decreases: Array<{ id: string | number; name: string; delta: number }>;
  }>({ increases: [], decreases: [] });

  // Check API connection status
  const checkConnection = async () => {
    const isConnected = await checkApiConnection();
    setApiConnected(isConnected);
    return isConnected;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setData(null); // Reset data on new fetch

        const isConnected = await checkConnection();
        if (!isConnected) {
          setError(
            "Cannot connect to the backend. Displaying mock data. Ensure server is running."
          );
          setData(getMockDashboardData());
          setUsingMockData(true);
          setLoading(false);
          return;
        }

        // Pull dataset meta for badge (non-blocking)
        try {
          const meta = await getDatasetMeta();
          setDatasetMeta(meta);
        } catch (e) {
          // ignore
        }

        const dashboardData = await getDashboardData();
        logger.log("Dashboard data received:", dashboardData);
        setData(dashboardData);
        setUsingMockData(!!dashboardData.isMockData);

        if (dashboardData.isMockData) {
          setError("API returned an error or no data. Displaying mock data.");
        }
      } catch (error) {
        logger.error("Error fetching dashboard data:", error);
        setError(
          "Failed to fetch data from API. Displaying mock data. Check backend."
        );
        setData(getMockDashboardData());
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Fetch bands for Data Quality card
    (async () => {
      try {
        const bands = await getBands();
        setDqBands(bands || null);
      } catch (e) {
        setDqBands(null);
      }
    })();
    // Load suppliers and graph for additional analytics
    (async () => {
      try {
        const suppliers = await getSuppliers();
        setAllSuppliers(suppliers || []);
      } catch (e) {
        logger.warn("Suppliers fetch failed for dashboard extras:", e);
        setAllSuppliers([]);
      }
      try {
        const g = await getSupplyChainGraphData();
        setGraphData(g);
      } catch (e) {
        logger.warn("Graph fetch failed for dashboard extras:", e);
        setGraphData(null);
      }
    })();
  }, []);

  // Calculate Top Movers whenever allSuppliers changes
  useEffect(() => {
    if (!allSuppliers || allSuppliers.length === 0) {
      // If no suppliers, try to preserve existing movers or clear them
      return;
    }

    try {
      // Get previous snapshot from localStorage
      const prevRaw = localStorage.getItem("dashboardSnapshot:v1");
      const prev: Record<string, { rf?: number; esg?: number }> = prevRaw
        ? JSON.parse(prevRaw)
        : {};
      
      // Build current snapshot
      const curr: Record<string, { rf?: number; esg?: number; name: string }> = {};
      const diffs: Array<{ id: string | number; name: string; delta: number }> = [];
      
      allSuppliers.forEach((s) => {
        const id = String((s as any)._id || s.id);
        const riskFactor = typeof s.risk_factor === "number" ? s.risk_factor : 
                          typeof s.risk_penalty === "number" ? s.risk_penalty / 100 : 
                          undefined;
        const finalScore = (s as any).finalScore ?? s.composite_score ?? s.ethical_score;
        
        curr[id] = {
          rf: riskFactor,
          esg: typeof finalScore === "number" ? finalScore : undefined,
          name: s.name || String(id),
        };
        
        // Compare with previous snapshot
        const prevRf = prev[id]?.rf;
        const currRf = curr[id].rf;
        
        if (typeof prevRf === "number" && typeof currRf === "number" && prevRf !== currRf) {
          const delta = currRf - prevRf;
          // Only include significant changes (at least 0.01 or 1%)
          if (Math.abs(delta) >= 0.01) {
            diffs.push({ id, name: curr[id].name, delta });
          }
        }
      });
      
      // Sort by absolute delta and get top movers
      diffs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
      const increases = diffs
        .filter((d) => d.delta > 0)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 5);
      const decreases = diffs
        .filter((d) => d.delta < 0)
        .sort((a, b) => a.delta - b.delta)
        .slice(0, 5);
      
      // Only update if we have meaningful changes
      if (diffs.length > 0) {
        setTopMovers({ increases, decreases });
      }
      
      // Save current snapshot for next comparison
      // Only save if we have valid data
      const toSave: Record<string, { rf?: number; esg?: number }> = {};
      Object.entries(curr).forEach(([id, v]) => {
        if (v.rf !== undefined || v.esg !== undefined) {
          toSave[id] = { rf: v.rf, esg: v.esg };
        }
      });
      
      // Only update localStorage if we have data to save
      if (Object.keys(toSave).length > 0) {
        localStorage.setItem("dashboardSnapshot:v1", JSON.stringify(toSave));
      }
    } catch (e) {
      logger.warn("Top movers calculation failed:", e);
    }
  }, [allSuppliers]);

  // --- Derived Data for KPIs and Charts ---
  const kpiData = useMemo(() => {
    if (!data) return null;
    const totalSuppliers = Number(
      data.totalSuppliers ?? data.total_suppliers ?? 0
    );
    const avgEthicalScore = Number(
      data.avgEthicalScore ?? data.avg_ethical_score ?? 0
    );
    const avgCompositeScore = Number(
      data.avgCompositeScore ?? data.avg_composite_score ?? avgEthicalScore
    );
    const avgRiskFactor = Number(
      data.avgRiskFactor ?? data.avg_risk_factor ?? 0
    );
    const avgCompletenessRatio = Number(
      data.avgCompletenessRatio ?? data.avg_completeness_ratio ?? 1
    );
    const riskBreakdown = (data.riskBreakdown ?? data.risk_breakdown) || {};
    const highRiskCount =
      (riskBreakdown.high ?? 0) + (riskBreakdown.critical ?? 0);

    return {
      totalSuppliers,
      avgEthicalScore,
      avgCompositeScore,
      avgRiskFactor,
      avgCompletenessRatio,
      highRiskCount,
    };
  }, [data]);

  const suppliersByCountry = useMemo(
    () =>
      (data?.suppliersByCountry ||
        data?.suppliers_by_country ||
        {}) as Record<string, number>,
    [data?.suppliersByCountry, data?.suppliers_by_country]
  );

  const pillarAverages = data?.pillarAverages || data?.pillar_averages;
  const pillarCards = useMemo(() => {
    if (!pillarAverages) return [];
    return [
      {
        key: "environmental",
        label: "Environmental Pillar",
        value: pillarAverages.environmental ?? 0,
        icon: CloudIcon,
        color: colors.primary,
      },
      {
        key: "social",
        label: "Social Pillar",
        value: pillarAverages.social ?? 0,
        icon: UsersIcon,
        color: colors.secondary,
      },
      {
        key: "governance",
        label: "Governance Pillar",
        value: pillarAverages.governance ?? 0,
        icon: PresentationChartLineIcon,
        color: colors.accent,
      },
    ];
  }, [pillarAverages]);

  // Risk breakdown data for Pie Chart
  const riskPieData = useMemo(() => {
    const breakdown = data?.riskBreakdown || {};
    const palette: Record<string, string> = {
      low: colors.success,
      medium: colors.warning,
      high: colors.error,
      critical: colors.secondary,
    };

    return Object.entries(breakdown)
      .filter(([, count]) => Number(count) > 0)
      .map(([level, count]) => ({
        name: `${level.charAt(0).toUpperCase()}${level.slice(1)} Risk`,
        value: Number(count),
        fill: palette[level] ?? colors.textMuted,
      }));
  }, [data?.riskBreakdown]);

  // --- Creative analytics derived from suppliers and graph ---
  const extraAnalytics = useMemo(() => {
    const suppliers = allSuppliers || [];
    const byNumber = (v: any) => (typeof v === 'number' && !Number.isNaN(v)) ? v : null;
    const avg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    // Averages
    const avgRenewable = avg(
      suppliers.map(s => byNumber((s as any).renewable_energy_percent)).filter((v): v is number => v !== null)
    );
    const avgInjury = avg(
      suppliers.map(s => byNumber((s as any).injury_rate)).filter((v): v is number => v !== null)
    );
    // Targets (configurable)
    const targetsCfg = targets;
    // Watchlist: high risk or low disclosure
    const watchHighRisk = suppliers
      .filter(s => (s.risk_level || '').toString().toLowerCase() === 'high' || (s.risk_level || '').toString().toLowerCase() === 'critical')
      .slice(0, 5);
    const watchLowDisclosure = suppliers
      .filter(s => typeof s.completeness_ratio === 'number' && (s.completeness_ratio as number) < 0.7)
      .slice(0, 5);
    // Largest risk penalties
    const riskLeaders = suppliers
      .filter(s => typeof s.risk_factor === 'number')
      .sort((a,b) => (b.risk_factor as number) - (a.risk_factor as number))
      .slice(0,5);
    // Data quality: missingness by metric (presence across a small key set)
    const keys: Array<keyof Supplier | string> = [
      'revenue','total_emissions','co2_emissions','water_usage','waste_generated','renewable_energy_percent',
      'injury_rate','training_hours','living_wage_ratio','gender_diversity_percent',
      'board_diversity','board_independence','transparency_score','anti_corruption_policy'
    ];
    const missingCounts: Record<string, number> = {};
    const totalSup = suppliers.length || 1;
    keys.forEach(k => { missingCounts[k as string] = 0; });
    suppliers.forEach(s => {
      keys.forEach(k => {
        const v = (s as any)[k];
        const present = !(v === undefined || v === null || v === '');
        if (!present) missingCounts[k as string] += 1;
      });
    });
    const topMissing = Object.entries(missingCounts)
      .sort((a,b) => b[1]-a[1])
      .slice(0,6)
      .map(([k, c]) => ({ metric: k, missing: c, pct: Math.round((c/totalSup)*100) }));
    // Ethical path ratio from graph
    let ethicalRatio = null;
    // Prefer links from API, otherwise fall back to locally saved user links
    let links: any[] = Array.isArray((graphData as any)?.links) ? (graphData as any).links : [];
    if (!links.length) {
      try {
        const raw = localStorage.getItem(USER_LINKS_KEY);
        const saved = raw ? JSON.parse(raw) : [];
        if (Array.isArray(saved)) links = saved;
      } catch {}
    }
    if (links.length) {
      const total = links.length;
      const ethical = links.filter((l: any) => l && l.ethical !== false).length;
      ethicalRatio = Math.round((ethical / total) * 100);
    }
    // Top performers by pillar
    const topPerformers = {
      environmental: suppliers
        .filter(s => typeof s.environmental_score === 'number')
        .sort((a, b) => (b.environmental_score || 0) - (a.environmental_score || 0))
        .slice(0, 5)
        .map(s => ({ id: (s as any)._id || s.id, name: s.name || 'Unknown', score: s.environmental_score || 0 })),
      social: suppliers
        .filter(s => typeof s.social_score === 'number')
        .sort((a, b) => (b.social_score || 0) - (a.social_score || 0))
        .slice(0, 5)
        .map(s => ({ id: (s as any)._id || s.id, name: s.name || 'Unknown', score: s.social_score || 0 })),
      governance: suppliers
        .filter(s => typeof s.governance_score === 'number')
        .sort((a, b) => (b.governance_score || 0) - (a.governance_score || 0))
        .slice(0, 5)
        .map(s => ({ id: (s as any)._id || s.id, name: s.name || 'Unknown', score: s.governance_score || 0 })),
      overall: suppliers
        .filter(s => {
          const final = (s as any).finalScore ?? s.composite_score ?? s.ethical_score;
          return typeof final === 'number';
        })
        .sort((a, b) => {
          const aScore = (a as any).finalScore ?? a.composite_score ?? a.ethical_score ?? 0;
          const bScore = (b as any).finalScore ?? b.composite_score ?? b.ethical_score ?? 0;
          return bScore - aScore;
        })
        .slice(0, 5)
        .map(s => {
          const final = (s as any).finalScore ?? s.composite_score ?? s.ethical_score ?? 0;
          return { id: (s as any)._id || s.id, name: s.name || 'Unknown', score: final };
        }),
    };

    // Environmental impact summary
    const envSummary = {
      totalCO2: suppliers.reduce((sum, s) => sum + (byNumber(s.co2_emissions) || 0), 0),
      totalWater: suppliers.reduce((sum, s) => sum + (byNumber(s.water_usage) || 0), 0),
      totalWaste: suppliers.reduce((sum, s) => sum + (byNumber((s as any).waste_generated) || 0), 0),
      avgRenewable: avgRenewable,
      suppliersWithRenewable: suppliers.filter(s => byNumber((s as any).renewable_energy_percent) !== null).length,
    };

    // Social metrics summary
    const socialSummary = {
      avgDiversity: avg(suppliers.map(s => byNumber((s as any).gender_diversity_percent)).filter((v): v is number => v !== null)),
      avgTraining: avg(suppliers.map(s => byNumber((s as any).training_hours)).filter((v): v is number => v !== null)),
      avgLivingWage: avg(suppliers.map(s => byNumber((s as any).living_wage_ratio)).filter((v): v is number => v !== null)),
      avgInjury: avgInjury,
      suppliersWithTraining: suppliers.filter(s => byNumber((s as any).training_hours) !== null).length,
    };

    // Governance metrics summary
    const govSummary = {
      avgTransparency: avg(suppliers.map(s => byNumber((s as any).transparency_score)).filter((v): v is number => v !== null)),
      avgBoardDiversity: avg(suppliers.map(s => byNumber((s as any).board_diversity)).filter((v): v is number => v !== null)),
      avgBoardIndependence: avg(suppliers.map(s => byNumber((s as any).board_independence)).filter((v): v is number => v !== null)),
      suppliersWithAntiCorruption: suppliers.filter(s => (s as any).anti_corruption_policy === true).length,
      antiCorruptionRate: suppliers.length > 0 ? (suppliers.filter(s => (s as any).anti_corruption_policy === true).length / suppliers.length) * 100 : 0,
    };

    // Compliance status
    const complianceRate = suppliers.length > 0
      ? (suppliers.filter(s => {
          const final = (s as any).finalScore ?? s.composite_score ?? s.ethical_score ?? 0;
          return typeof final === 'number' && final >= 60; // 60% threshold
        }).length / suppliers.length) * 100
      : 0;

    // Quick insights (use local variables, not extraAnalytics object)
    const insights = [];
    if (watchHighRisk.length > 0) {
      insights.push({
        type: 'error',
        title: `${watchHighRisk.length} High-Risk Supplier${watchHighRisk.length > 1 ? 's' : ''}`,
        message: 'Immediate attention required',
      });
    }
    if (watchLowDisclosure.length > 0) {
      insights.push({
        type: 'warning',
        title: `${watchLowDisclosure.length} Low Disclosure Supplier${watchLowDisclosure.length > 1 ? 's' : ''}`,
        message: 'Data completeness below 70%',
      });
    }
    if (complianceRate < 80) {
      insights.push({
        type: 'warning',
        title: 'Compliance Rate Below Target',
        message: `${complianceRate.toFixed(1)}% of suppliers meet 60%+ threshold`,
      });
    }
    if (envSummary.avgRenewable < targetsCfg.renewablePct) {
      insights.push({
        type: 'info',
        title: 'Renewable Energy Below Target',
        message: `Average ${envSummary.avgRenewable.toFixed(1)}% vs target ${targetsCfg.renewablePct}%`,
      });
    }

    return { 
      avgRenewable, 
      avgInjury, 
      targets: targetsCfg, 
      watchHighRisk, 
      watchLowDisclosure, 
      riskLeaders, 
      topMissing, 
      ethicalRatio,
      topPerformers,
      envSummary,
      socialSummary,
      govSummary,
      complianceRate,
      insights,
    };
  }, [allSuppliers, graphData, targets]);

  // Responsive flag must be declared before any early returns to keep hooks order stable
  const isMobile = useIsMobile();

  // Loading and Error Handling
  if (loading) return <LoadingIndicator />;
  if (error && !data) return <ErrorDisplay message={error} />; // Show error only if no data at all
  if (!data) return <ErrorDisplay message="No dashboard data available." />; // Handle case where data is null

  // Use kpiData for rendering
  const {
    totalSuppliers,
    avgEthicalScore,
    avgCompositeScore,
    avgRiskFactor,
    avgCompletenessRatio,
    highRiskCount,
  } = kpiData || {};
  const scoreColor = getScoreColor(avgEthicalScore, colors);

  const formatVersionLabel = (version?: string) => {
    if (!version) return "Synthetic v1";
    // Convert "synthetic-v1" -> "Synthetic v1"
    if (version.toLowerCase().startsWith("synthetic-")) {
      const suffix = version.slice("synthetic-".length);
      return `Synthetic ${suffix}`;
    }
    return version;
  };

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        backgroundImage:
          "radial-gradient(circle at 10% 20%, rgba(0, 240, 255, 0.03) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(77, 91, 255, 0.04) 0%, transparent 40%)",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Supplier ESG{" "}
            <span style={{ color: colors.primary }}>Dashboard</span>
          </h1>
          <p className="text-lg mt-1" style={{ color: colors.textMuted }}>
            Overview of your supply chain's ethical and sustainability
            performance.
          </p>
          {datasetMeta && (
            <div className="mt-2 flex items-center gap-3">
              <span
                className="px-2.5 py-1 rounded-full text-xs border"
                style={{
                  backgroundColor: colors.panel,
                  color: colors.text,
                  borderColor: colors.accent + "40",
                }}
                title={`Generated: ${datasetMeta.generatedAt || "n/a"} | Bands: ${datasetMeta.bandsVersion || "v1"}`}
              >
                Data Source: {formatVersionLabel(datasetMeta.version)}
                {datasetMeta.seed ? ` (seed: ${datasetMeta.seed})` : ""}
              </span>
              <button
                onClick={() => setShowMethodology(true)}
                className="text-xs underline flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 rounded"
                style={{ color: colors.textMuted }}
                title="View dataset generation methodology"
              >
                <InformationCircleIcon className="h-4 w-4" /> Methodology
              </button>
              <Link
                to="/methodology"
                className="text-xs underline flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 rounded"
                style={{ color: colors.textMuted }}
                title="View scoring formulas and weights"
              >
                <BeakerIcon className="h-4 w-4" /> Scoring Methodology
              </Link>
              <button
                onClick={() => setShowEditTargets(true)}
                className="text-xs underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 rounded"
                style={{ color: colors.textMuted }}
                title="Edit KPI/threshold targets (local only)"
              >
                Edit Targets
              </button>
            </div>
          )}
        </div>
        {usingMockData && (
          <div
            className="mt-4 md:mt-0 px-3 py-1 rounded-full text-xs flex items-center border"
            style={{
              backgroundColor: colors.warning + "10",
              color: colors.warning,
              borderColor: colors.warning + "30",
            }}
          >
            <InformationCircleIcon className="h-4 w-4 mr-2" />
            Displaying Demo Data
          </div>
        )}
      </motion.div>
      <MethodologyModal
        open={showMethodology}
        onClose={() => setShowMethodology(false)}
        meta={datasetMeta}
        colors={{ panel: colors.panel, accent: colors.accent, text: colors.text, textMuted: colors.textMuted }}
      />
      <EditTargetsModal
        open={showEditTargets}
        onClose={() => setShowEditTargets(false)}
        value={targets}
        onSave={(t)=> setTargets(t)}
        onReset={()=> setTargets(defaultTargets)}
        colors={{ panel: colors.panel, accent: colors.accent, text: colors.text, textMuted: colors.textMuted, primary: colors.primary }}
      />

      {/* KPI Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8"
      >
        <KpiIndicator
          label="Total Suppliers"
          value={totalSuppliers}
          icon={UsersIcon}
          color={colors.accent}
        />
        <KpiIndicator
          label="Avg. ESG Score (Risk Adjusted)"
          value={avgEthicalScore ? avgEthicalScore.toFixed(1) : "N/A"}
          icon={ScaleIcon}
          color={scoreColor}
          unit="%"
        />
        <KpiIndicator
          label="Avg. Composite Score"
          value={avgCompositeScore ? avgCompositeScore.toFixed(1) : "N/A"}
          icon={ChartBarIcon}
          color={colors.secondary}
          unit="%"
        />
        <KpiIndicator
          label="Avg. Risk Penalty"
          value={formatPercent(avgRiskFactor ?? 0, 0)}
          icon={ShieldExclamationIcon}
          color={colors.warning}
        >
          <div className="mt-2 text-xs" style={{ color: colors.textMuted }}>
            High & Critical suppliers: {highRiskCount ?? 0}
          </div>
        </KpiIndicator>
        <KpiIndicator
          label="Avg. Data Completeness"
          value={formatPercent(avgCompletenessRatio ?? 1, 0)}
          icon={SparklesIcon}
          color={colors.primary}
        >
          <div className="mt-2 text-xs" style={{ color: colors.textMuted }}>
            Scores capped at 50 when disclosure &lt; 70%
          </div>
        </KpiIndicator>
      </motion.div>

      {/* Extra KPI strip: ethical paths and targets */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto snap-x -mx-1 px-1">
        {(() => {
          const renewableOk = Math.round(extraAnalytics.avgRenewable) >= targets.renewablePct;
          const injuryOk = Number.isFinite(extraAnalytics.avgInjury) && extraAnalytics.avgInjury <= targets.injuryRate;
          const renewableColor = renewableOk ? colors.success : colors.error;
          const injuryColor = injuryOk ? colors.success : colors.error;
          return (
            <>
        <div className="min-w-[220px] md:min-w-0 snap-start">
        <KpiIndicator
          label="Ethical Paths (Supply Graph)"
          value={extraAnalytics.ethicalRatio !== null ? extraAnalytics.ethicalRatio.toString() : 'N/A'}
          unit="%"
          icon={GlobeAltIcon}
          color={colors.accent}
        />
        </div>
        <div className="min-w-[220px] md:min-w-0 snap-start">
        <KpiIndicator
          label="Renewable Energy (Avg vs Target)"
          value={`${Math.round(extraAnalytics.avgRenewable)}% / ${extraAnalytics.targets.renewablePct}%`}
          icon={SparklesIcon}
          color={renewableColor}
        />
        </div>
        <div className="min-w-[220px] md:min-w-0 snap-start">
        <KpiIndicator
          label="Injury Rate (Avg vs Target)"
          value={`${extraAnalytics.avgInjury.toFixed(1)} / ${extraAnalytics.targets.injuryRate}`}
          icon={ShieldExclamationIcon}
          color={injuryColor}
        />
        </div>
            </>
          );
        })()}
        </div>
      </motion.div>

      {/* Data Quality Card - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-1">
          <DataQualityCard
            suppliers={allSuppliers}
            bands={dqBands}
            colors={{
              panel: colors.card,
              accent: colors.accent,
              text: colors.text,
              textMuted: colors.textMuted,
              success: colors.success,
              warning: colors.warning,
              error: colors.error,
            }}
          />
        </div>
      </div>

      {pillarCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {pillarCards.map(({ key, label, value, icon: Icon, color }) => (
            <div
              key={key}
              className="rounded-lg border p-4 flex flex-col"
              style={{
                borderColor: color + "40",
                backgroundColor: color + "10",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" style={{ color }} />
                  <span className="text-sm font-medium" style={{ color: colors.text }}>
                    {label}
                  </span>
                </div>
                <span className="text-2xl font-semibold" style={{ color: colors.text }}>
                  {Number.isFinite(value) ? value.toFixed(1) : "N/A"}%
                </span>
              </div>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                Normalized average across suppliers (0 – 100).
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Main Grid: Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ethical Score Distribution */}
        <MetricCard
          title="Ethical Score Distribution"
          icon={ScaleIcon}
          minHeight={isMobile ? 280 : 400}
          className="lg:col-span-2"
          style={{ backgroundColor: colors.card, borderColor: colors.accent + "20" }}
          empty={!data.ethicalScoreDistribution || !data.ethicalScoreDistribution.length}
          emptyContent={<p className="text-sm" style={{ color: colors.textMuted }}>No score distribution data. <a href="/suppliers/add" className="underline">Add Supplier</a></p>}
        >
          <div role="img" aria-label="Histogram of ethical score distribution across suppliers" className="w-full h-full" style={{ height: '100%' }}>
            <EthicalScoreDistributionChart data={data.ethicalScoreDistribution} />
          </div>
        </MetricCard>

        {/* Risk Breakdown */}
        <MetricCard
          title="Risk Breakdown"
          icon={ShieldExclamationIcon}
          minHeight={isMobile ? 260 : 400}
          style={{ backgroundColor: colors.card, borderColor: colors.accent + "20" }}
          empty={!riskPieData.length}
          emptyContent={<p className="text-sm" style={{ color: colors.textMuted }}>No risk data. Add suppliers or set risk fields.</p>}
        >
          <div role="img" aria-label="Pie chart of supplier risk levels" className="w-full h-full" style={{ height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={isMobile ? 48 : 60} outerRadius={isMobile ? 80 : 100} paddingAngle={5} dataKey="value">
                {riskPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.accent + "40", color: colors.text }} itemStyle={{ color: colors.textMuted }} />
              {!isMobile && <Legend formatter={(value) => (<span style={{ color: colors.textMuted }}>{value}</span>)} />}
            </PieChart>
          </ResponsiveContainer>
          </div>
        </MetricCard>

        {/* CO2 Emissions by Industry */}
        <MetricCard
          title="CO₂ Emissions by Industry"
          icon={BeakerIcon}
          minHeight={isMobile ? 360 : 450}
          className="lg:col-span-3"
          style={{ backgroundColor: colors.card, borderColor: colors.accent + "20" }}
          empty={!data.co2EmissionsByIndustry || !data.co2EmissionsByIndustry.length}
          emptyContent={<p className="text-sm" style={{ color: colors.textMuted }}>No emission data by industry. Ensure suppliers have emissions and industry.</p>}
        >
          <div role="img" aria-label="Bar chart of CO2 emissions by industry" className="w-full h-full" style={{ height: '100%' }}>
            <CO2EmissionsChart data={data.co2EmissionsByIndustry} />
          </div>
        </MetricCard>

      {/* Suppliers by Country (Example of another chart) */}
        {suppliersByCountry &&
          Object.keys(suppliersByCountry).length > 0 && (
            <MetricCard
              title="Suppliers by Country"
              icon={MapIcon}
              minHeight={isMobile ? 360 : 400}
              className="lg:col-span-3"
              style={{ backgroundColor: colors.card, borderColor: colors.accent + "20" }}
              empty={!suppliersByCountry || !Object.keys(suppliersByCountry).length}
              emptyContent={<p className="text-sm" style={{ color: colors.textMuted }}>No suppliers yet. <a href="/suppliers/add" className="underline">Add Supplier</a></p>}
            >
              <div role="img" aria-label="Horizontal bar chart of supplier counts by country" className="w-full h-full" style={{ height: '100%' }}>
                <SuppliersByCountryChart suppliersByCountry={suppliersByCountry} />
              </div>
            </MetricCard>
          )}

        {/* Report Generator - Add this section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 mb-6"
        >
          <ReportGenerator
            dashboardData={{
              ...data,
              suppliersByCountry,
            }}
            allSuppliers={allSuppliers}
          />
      </motion.div>

      {/* Watchlist & Alerts */}
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Watchlist: High Risk" icon={ShieldExclamationIcon} gridSpan="col-span-1">
          {extraAnalytics.watchHighRisk.length ? (
            <div className="space-y-2">
              {extraAnalytics.watchHighRisk.map((s) => (
                <div key={(s as any)._id || s.id} className="flex items-center justify-between text-sm py-1 border-b" style={{ borderColor: colors.accent + '20' }}>
                  <span style={{ color: colors.text }}>{s.name}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium capitalize" style={{ color: colors.error, backgroundColor: colors.error + '15', border: `1px solid ${colors.error}40` }}>{s.risk_level}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: colors.textMuted }}>No high‑risk suppliers found.</p>
          )}
        </DashboardCard>

        <DashboardCard title="Watchlist: Low Disclosure" icon={InformationCircleIcon} gridSpan="col-span-1">
          {extraAnalytics.watchLowDisclosure.length ? (
            <div className="space-y-2">
              {extraAnalytics.watchLowDisclosure.map((s) => (
                <div key={(s as any)._id || s.id} className="flex items-center justify-between text-sm py-1 border-b" style={{ borderColor: colors.accent + '20' }}>
                  <span style={{ color: colors.text }}>{s.name}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ color: colors.warning, backgroundColor: colors.warning + '15', border: `1px solid ${colors.warning}40` }}>{Math.round((s.completeness_ratio || 0) * 100)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: colors.textMuted }}>All suppliers have adequate disclosure.</p>
          )}
        </DashboardCard>
        </div>
      </div>

      {/* Data Quality Panel & Risk Penalties */}
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <DashboardCard title="Data Quality: Top Missing Metrics" icon={ListBulletIcon} gridSpan="col-span-1">
          {extraAnalytics.topMissing.length ? (
            <div className="text-sm">
              {extraAnalytics.topMissing.map((m) => (
                <div key={m.metric} className="flex items-center justify-between py-1 border-b" style={{ borderColor: colors.accent + '20' }}>
                  <span style={{ color: colors.text }}>{m.metric}</span>
                  <span className="font-mono" style={{ color: colors.textMuted }}>{m.missing} ({m.pct}%)</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: colors.textMuted }}>No significant missingness detected.</p>
          )}
        </DashboardCard>

        <DashboardCard title="Largest Risk Penalties" icon={ExclamationTriangleIcon} gridSpan="col-span-1">
          {extraAnalytics.riskLeaders.length ? (
            <div className="text-sm">
              {extraAnalytics.riskLeaders.map((s) => (
                <div key={(s as any)._id || s.id} className="flex items-center justify-between py-1 border-b" style={{ borderColor: colors.accent + '20' }}>
                  <span style={{ color: colors.text }}>{s.name}</span>
                  <span className="font-mono" style={{ color: colors.textMuted }}>{Math.round((s.risk_factor || 0) * 100)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: colors.textMuted }}>No risk penalty data.</p>
          )}
        </DashboardCard>
        </div>
      </div>

      {/* Quick Insights & Alerts */}
      {extraAnalytics.insights && extraAnalytics.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-3 mt-6"
        >
          <DashboardCard title="Quick Insights & Alerts" icon={LightBulbIcon} gridSpan="col-span-1">
            <div className="space-y-2">
              {extraAnalytics.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                  style={{
                    backgroundColor: insight.type === 'error' ? colors.error + '10' :
                                   insight.type === 'warning' ? colors.warning + '10' :
                                   colors.primary + '10',
                    borderColor: insight.type === 'error' ? colors.error + '40' :
                                insight.type === 'warning' ? colors.warning + '40' :
                                colors.primary + '40',
                  }}
                >
                  {insight.type === 'error' && <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: colors.error }} />}
                  {insight.type === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: colors.warning }} />}
                  {insight.type === 'info' && <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: colors.primary }} />}
                  <div className="flex-1">
                    <div className="font-medium text-sm" style={{ color: colors.text }}>{insight.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{insight.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </motion.div>
      )}

      {/* Top Performers & Compliance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="lg:col-span-3 mt-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <DashboardCard title="Top Performers: Overall" icon={TrophyIcon} gridSpan="col-span-1">
            {extraAnalytics.topPerformers.overall.length > 0 ? (
              <div className="space-y-2">
                {extraAnalytics.topPerformers.overall.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b" style={{ borderColor: colors.accent + '20' }}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-bold" style={{ color: colors.primary }}>#{idx + 1}</span>
                      <span className="truncate" style={{ color: colors.text }} title={p.name}>{p.name}</span>
                    </div>
                    <span className="font-mono text-xs whitespace-nowrap ml-2" style={{ color: colors.success }}>{p.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: colors.textMuted }}>No data available.</p>
            )}
          </DashboardCard>

          <DashboardCard title="Top Performers: Environmental" icon={CloudIcon} gridSpan="col-span-1">
            {extraAnalytics.topPerformers.environmental.length > 0 ? (
              <div className="space-y-2">
                {extraAnalytics.topPerformers.environmental.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b" style={{ borderColor: colors.accent + '20' }}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-bold" style={{ color: colors.primary }}>#{idx + 1}</span>
                      <span className="truncate" style={{ color: colors.text }} title={p.name}>{p.name}</span>
                    </div>
                    <span className="font-mono text-xs whitespace-nowrap ml-2" style={{ color: colors.success }}>{p.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: colors.textMuted }}>No data available.</p>
            )}
          </DashboardCard>

          <DashboardCard title="Top Performers: Social" icon={UsersIcon} gridSpan="col-span-1">
            {extraAnalytics.topPerformers.social.length > 0 ? (
              <div className="space-y-2">
                {extraAnalytics.topPerformers.social.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b" style={{ borderColor: colors.accent + '20' }}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-bold" style={{ color: colors.primary }}>#{idx + 1}</span>
                      <span className="truncate" style={{ color: colors.text }} title={p.name}>{p.name}</span>
                    </div>
                    <span className="font-mono text-xs whitespace-nowrap ml-2" style={{ color: colors.success }}>{p.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: colors.textMuted }}>No data available.</p>
            )}
          </DashboardCard>

          <DashboardCard title="Compliance Status" icon={CheckBadgeIcon} gridSpan="col-span-1">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-4xl font-bold mb-2" style={{ 
                color: extraAnalytics.complianceRate >= 80 ? colors.success : 
                       extraAnalytics.complianceRate >= 60 ? colors.warning : colors.error 
              }}>
                {extraAnalytics.complianceRate.toFixed(1)}%
              </div>
              <p className="text-xs text-center" style={{ color: colors.textMuted }}>
                Suppliers meeting 60%+ threshold
              </p>
              <div className="mt-3 w-full bg-opacity-20 rounded-full h-2" style={{ backgroundColor: colors.accent + '20' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, extraAnalytics.complianceRate)}%`,
                    backgroundColor: extraAnalytics.complianceRate >= 80 ? colors.success : 
                                    extraAnalytics.complianceRate >= 60 ? colors.warning : colors.error,
                  }}
                />
              </div>
            </div>
          </DashboardCard>
        </div>
      </motion.div>

      {/* Environmental, Social & Governance Summaries */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="lg:col-span-3 mt-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <DashboardCard title="Environmental Impact Summary" icon={FireIcon} gridSpan="col-span-1">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Total CO₂ Emissions</span>
                <span className="font-mono font-semibold" style={{ color: colors.text }}>
                  {extraAnalytics.envSummary.totalCO2.toFixed(1)}t
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Total Water Usage</span>
                <span className="font-mono font-semibold" style={{ color: colors.text }}>
                  {extraAnalytics.envSummary.totalWater.toFixed(0)}m³
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Total Waste Generated</span>
                <span className="font-mono font-semibold" style={{ color: colors.text }}>
                  {extraAnalytics.envSummary.totalWaste.toFixed(1)}t
                </span>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: colors.accent + '20' }}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ color: colors.textMuted }}>Avg Renewable Energy</span>
                  <span className="font-mono font-semibold" style={{ color: colors.text }}>
                    {extraAnalytics.envSummary.avgRenewable.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs" style={{ color: colors.textMuted }}>
                  {extraAnalytics.envSummary.suppliersWithRenewable} suppliers reporting
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Social Metrics Summary" icon={UsersIcon} gridSpan="col-span-1">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Avg Gender Diversity</span>
                <span className="font-mono font-semibold" style={{ color: colors.text }}>
                  {extraAnalytics.socialSummary.avgDiversity.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Avg Training Hours</span>
                <span className="font-mono font-semibold" style={{ color: colors.text }}>
                  {extraAnalytics.socialSummary.avgTraining.toFixed(0)}h
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Avg Living Wage Ratio</span>
                <span className="font-mono font-semibold" style={{ color: colors.text }}>
                  {extraAnalytics.socialSummary.avgLivingWage.toFixed(2)}x
                </span>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: colors.accent + '20' }}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ color: colors.textMuted }}>Avg Injury Rate</span>
                  <span className="font-mono font-semibold" style={{ color: colors.text }}>
                    {extraAnalytics.socialSummary.avgInjury.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs" style={{ color: colors.textMuted }}>
                  {extraAnalytics.socialSummary.suppliersWithTraining} suppliers with training data
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Governance Metrics Summary" icon={PresentationChartLineIcon} gridSpan="col-span-1">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Avg Transparency</span>
                <span className="font-mono font-semibold" style={{ color: colors.text }}>
                  {extraAnalytics.govSummary.avgTransparency.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Avg Board Diversity</span>
                <span className="font-mono font-semibold" style={{ color: colors.text }}>
                  {extraAnalytics.govSummary.avgBoardDiversity.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Avg Board Independence</span>
                <span className="font-mono font-semibold" style={{ color: colors.text }}>
                  {extraAnalytics.govSummary.avgBoardIndependence.toFixed(1)}%
                </span>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: colors.accent + '20' }}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ color: colors.textMuted }}>Anti-Corruption Policy</span>
                  <span className="font-mono font-semibold" style={{ color: colors.text }}>
                    {extraAnalytics.govSummary.antiCorruptionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs" style={{ color: colors.textMuted }}>
                  {extraAnalytics.govSummary.suppliersWithAntiCorruption} suppliers with policy
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>
      </motion.div>

      {/* Recent Activity & Top Movers */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="lg:col-span-3 mt-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard title="Recent Activity" icon={CalendarIcon} gridSpan="col-span-1">
            {allSuppliers.length ? (
              <div className="text-sm">
                {allSuppliers
                  .slice()
                  .sort((a, b) => {
                    const ta = new Date(a.updated_at || a.created_at || 0).getTime();
                    const tb = new Date(b.updated_at || b.created_at || 0).getTime();
                    return tb - ta;
                  })
                  .slice(0, 8)
                  .map((s) => {
                    const t = new Date(s.updated_at || s.created_at || 0);
                    return (
                      <div key={(s as any)._id || s.id} className="flex items-center justify-between py-1 border-b" style={{ borderColor: colors.accent + '20' }}>
                        <span style={{ color: colors.text }}>{s.name}</span>
                        <span className="text-xs" style={{ color: colors.textMuted }}>{t.toLocaleString()}</span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm" style={{ color: colors.textMuted }}>No recent activity.</p>
            )}
          </DashboardCard>

          <DashboardCard title="Top Movers (Risk Penalty Δ)" icon={ArrowTrendingUpIcon} gridSpan="col-span-1">
            {(topMovers.increases.length || topMovers.decreases.length) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs mb-1 font-medium" style={{ color: colors.textMuted }}>Increases</div>
                  {topMovers.increases.length > 0 ? (
                    topMovers.increases.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: colors.accent + '20' }}>
                        <span className="truncate flex-1 mr-2" style={{ color: colors.text }} title={m.name}>{m.name}</span>
                        <span className="font-mono text-xs whitespace-nowrap" style={{ color: colors.error }}>
                          +{Math.abs(m.delta) >= 0.01 ? (m.delta * 100).toFixed(1) : '<0.1'}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs py-1" style={{ color: colors.textMuted }}>No increases</p>
                  )}
                </div>
                <div>
                  <div className="text-xs mb-1 font-medium" style={{ color: colors.textMuted }}>Decreases</div>
                  {topMovers.decreases.length > 0 ? (
                    topMovers.decreases.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: colors.accent + '20' }}>
                        <span className="truncate flex-1 mr-2" style={{ color: colors.text }} title={m.name}>{m.name}</span>
                        <span className="font-mono text-xs whitespace-nowrap" style={{ color: colors.success }}>
                          {Math.abs(m.delta) >= 0.01 ? (Math.abs(m.delta) * 100).toFixed(1) : '<0.1'}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs py-1" style={{ color: colors.textMuted }}>No decreases</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm" style={{ color: colors.textMuted }}>
                <p className="mb-2">No mover data yet.</p>
                <p className="text-xs">Edit a supplier and refresh to see risk penalty changes tracked over time.</p>
              </div>
            )}
          </DashboardCard>
        </div>
      </motion.div>
        {/* Add more charts here based on available data */}
        {/* e.g., Water Usage Trend, Renewable Energy, etc. */}
      </div>
    </div>
  );
};

export default Dashboard;
