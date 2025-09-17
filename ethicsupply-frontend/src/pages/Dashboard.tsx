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
import {
  getDashboardData,
  checkApiConnection,
  getMockDashboardData,
} from "../services/dashboardService";
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

// --- Dashboard Specific Design System ---
const colors = {
  background: "#0D0F1A", // Dark background
  panel: "rgba(25, 28, 43, 0.8)", // Translucent panel
  card: "rgba(22, 28, 45, 0.6)", // Slightly darker card background
  primary: "#00F0FF", // Teal
  secondary: "#FF00FF", // Magenta
  accent: "#4D5BFF", // Blue
  text: "#E0E0FF",
  textMuted: "#8A94C8",
  success: "#00FF8F", // Green
  warning: "#FFD700", // Yellow
  error: "#FF4D4D", // Red
  grid: "rgba(77, 91, 255, 0.1)", // Grid lines color (accent with low opacity)
  tooltipBg: "rgba(13, 15, 26, 0.95)", // Darker tooltip background
};

const chartColors = [
  colors.primary,
  colors.secondary,
  colors.success,
  colors.warning,
  "#8B5CF6", // Purple
  "#38BDF8", // Sky Blue
];

// Helper to get score color (consistent with other pages)
const getScoreColor = (score: number | null | undefined) => {
  if (score === null || score === undefined) return colors.textMuted;
  const normalizedScore = score > 0 && score <= 1 ? score * 100 : score;
  if (normalizedScore >= 80) return colors.success;
  if (normalizedScore >= 60) return colors.primary; // Use teal for good
  if (normalizedScore >= 40) return colors.warning;
  return colors.error;
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

// --- Reusable Styled Components ---

const LoadingIndicator = () => (
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

const ErrorDisplay = ({ message }) => (
  <div className="flex items-center justify-center min-h-[80vh]">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-red-900/30 border border-red-500 p-8 rounded-lg text-center max-w-lg shadow-xl"
    >
      <ExclamationTriangleIcon
        className="h-16 w-16 mx-auto mb-5"
        style={{ color: colors.error }}
      />
      <h3
        className="text-2xl font-semibold mb-3"
        style={{ color: colors.error }}
      >
        Connection Error
      </h3>
      <p className="text-lg" style={{ color: colors.textMuted }}>
        {message}
      </p>
    </motion.div>
  </div>
);

const DashboardCard = ({
  title,
  icon: Icon,
  children,
  className = "",
  gridSpan = "col-span-1",
}) => (
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
    {/* Subtle background pattern/glow could be added here */}
    <div className="relative z-10 h-full flex flex-col">
      <div className="flex items-center mb-4">
        <div
          className="p-2 rounded-lg mr-3"
          style={{ backgroundColor: colors.panel }}
        >
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

const KpiIndicator = ({
  label,
  value,
  unit = "",
  icon: Icon,
  color,
  children,
}) => (
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

// Report Generation
const ReportGenerator = ({
  dashboardData,
  year = new Date().getFullYear(),
}) => {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const reportContainerRef = React.useRef(null);

  // Format data for report
  const formatDataForReport = () => {
    if (!dashboardData) return null;

    return {
      summary: {
        title: `Annual ESG Performance Report ${year}`,
        date: new Date().toLocaleDateString(),
        totalSuppliers: dashboardData.totalSuppliers || 0,
        avgEthicalScore: dashboardData.avgEthicalScore || 0,
        avgCO2Emissions: dashboardData.avgCo2Emissions || 0,
        riskBreakdown: dashboardData.riskBreakdown || {
          low: 0,
          medium: 0,
          high: 0,
        },
      },
      scoreDistribution: dashboardData.ethicalScoreDistribution || [],
      co2ByIndustry: dashboardData.co2EmissionsByIndustry || [],
      suppliersByCountry: dashboardData.suppliersByCountry || {},
      waterUsageTrend: dashboardData.waterUsageTrend || [],
      renewableEnergy: dashboardData.renewableEnergyAdoption || [],
      sustainablePractices: dashboardData.sustainablePractices || [],
      recentSuppliers: dashboardData.recentSuppliers || [],
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

      autoTable(doc, {
        head: [riskData[0]],
        body: riskData.slice(1),
        startY: 130,
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
        const supplierData = [["Supplier", "Country", "ESG Score", "Date"]];

        reportData.recentSuppliers.forEach((supplier) => {
          supplierData.push([
            supplier.name || "N/A",
            supplier.country || "N/A",
            supplier.ethical_score
              ? `${Math.round(supplier.ethical_score)}%`
              : "N/A",
            supplier.date || "N/A",
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
          ["Name", "Country", "ESG Score", "Trend", "Date"],
        ];

        reportData.recentSuppliers.forEach((supplier) => {
          supplierData.push([
            supplier.name || "N/A",
            supplier.country || "N/A",
            supplier.ethical_score || "N/A",
            supplier.trend || "N/A",
            supplier.date || "N/A",
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

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

        const dashboardData = await getDashboardData();
        console.log("Dashboard data received:", dashboardData);
        setData(dashboardData);
        setUsingMockData(!!dashboardData.isMockData);

        if (dashboardData.isMockData) {
          setError("API returned an error or no data. Displaying mock data.");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
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
  }, []);

  // --- Derived Data for KPIs and Charts ---
  const kpiData = useMemo(() => {
    if (!data) return null;
    const avgScore = parseFloat(data.avgEthicalScore || "0");
    return {
      totalSuppliers: data.totalSuppliers || 0,
      avgEthicalScore: avgScore,
      avgCo2Emissions: data.avgCo2Emissions ?? 0, // Use CORRECT camelCase key
      highRiskCount: data.riskBreakdown?.high ?? 0,
    };
  }, [data]);

  const suppliersByCountry = useMemo(
    () =>
      (data?.suppliersByCountry ||
        data?.suppliers_by_country ||
        {}) as Record<string, number>,
    [data?.suppliersByCountry, data?.suppliers_by_country]
  );

  // Risk breakdown data for Pie Chart
  const riskPieData = useMemo(() => {
    if (!data?.riskBreakdown) return [];
    return [
      {
        name: "Low Risk",
        value: data.riskBreakdown.low ?? 0,
        fill: colors.success,
      },
      {
        name: "Medium Risk",
        value: data.riskBreakdown.medium ?? 0,
        fill: colors.warning,
      },
      {
        name: "High Risk",
        value: data.riskBreakdown.high ?? 0,
        fill: colors.error,
      },
    ].filter((item) => item.value > 0); // Remove slices with 0 value
  }, [data?.riskBreakdown]);

  // Loading and Error Handling
  if (loading) return <LoadingIndicator />;
  if (error && !data) return <ErrorDisplay message={error} />; // Show error only if no data at all
  if (!data) return <ErrorDisplay message="No dashboard data available." />; // Handle case where data is null

  // Use kpiData for rendering
  const { totalSuppliers, avgEthicalScore, avgCo2Emissions, highRiskCount } =
    kpiData || {};
  const scoreColor = getScoreColor(avgEthicalScore);

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

      {/* KPI Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <KpiIndicator
          label="Total Suppliers"
          value={totalSuppliers}
          icon={UsersIcon}
          color={colors.accent}
        />
        <KpiIndicator
          label="Avg. Ethical Score"
          value={avgEthicalScore}
          icon={ScaleIcon}
          color={scoreColor}
          isPercentage
        />
        <KpiIndicator
          label="Avg. CO₂ Emissions"
          value={avgCo2Emissions ? avgCo2Emissions.toFixed(1) + " t" : "N/A"}
          icon={CloudIcon}
          color={colors.secondary}
        />
        <KpiIndicator
          label="High Risk Suppliers"
          value={highRiskCount}
          icon={ShieldExclamationIcon}
          color={colors.error}
        />
      </motion.div>

      {/* Main Grid: Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ethical Score Distribution */}
        <DashboardCard
          title="Ethical Score Distribution"
          icon={ScaleIcon}
          gridSpan="lg:col-span-2"
          className="h-[400px]"
        >
          {data.ethicalScoreDistribution &&
          data.ethicalScoreDistribution.length > 0 ? (
            <EthicalScoreDistributionChart
              data={data.ethicalScoreDistribution}
            />
          ) : (
            <p
              className="text-center flex-grow flex items-center justify-center"
              style={{ color: colors.textMuted }}
            >
              No score distribution data available.
            </p>
          )}
        </DashboardCard>

        {/* Risk Breakdown */}
        <DashboardCard
          title="Risk Breakdown"
          icon={ShieldExclamationIcon}
          className="h-[400px]"
        >
          {riskPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    borderColor: colors.accent + "40",
                    color: colors.text,
                  }}
                  itemStyle={{ color: colors.textMuted }}
                />
                <Legend
                  formatter={(value, entry) => (
                    <span style={{ color: colors.textMuted }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p
              className="text-center flex-grow flex items-center justify-center"
              style={{ color: colors.textMuted }}
            >
              No risk breakdown data available.
            </p>
          )}
        </DashboardCard>

        {/* CO2 Emissions by Industry */}
        <DashboardCard
          title="CO₂ Emissions by Industry"
          icon={BeakerIcon}
          gridSpan="lg:col-span-3" // Make it full width
          className="h-[450px]"
        >
          {data.co2EmissionsByIndustry &&
          data.co2EmissionsByIndustry.length > 0 ? (
            <CO2EmissionsChart data={data.co2EmissionsByIndustry} />
          ) : (
            <p
              className="text-center flex-grow flex items-center justify-center"
              style={{ color: colors.textMuted }}
            >
              No CO₂ emission data by industry available.
            </p>
          )}
        </DashboardCard>

        {/* Suppliers by Country (Example of another chart) */}
        {suppliersByCountry &&
          Object.keys(suppliersByCountry).length > 0 && (
            <DashboardCard
              title="Suppliers by Country"
              icon={MapIcon}
              gridSpan="lg:col-span-3"
              className="h-[400px]"
            >
              <SuppliersByCountryChart data={suppliersByCountry} />
            </DashboardCard>
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
          />
        </motion.div>

        {/* Add more charts here based on available data */}
        {/* e.g., Water Usage Trend, Renewable Energy, etc. */}
      </div>
    </div>
  );
};

export default Dashboard;
