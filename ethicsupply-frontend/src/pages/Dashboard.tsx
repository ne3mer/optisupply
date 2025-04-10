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
        {data.suppliersByCountry &&
          Object.keys(data.suppliersByCountry).length > 0 && (
            <DashboardCard
              title="Suppliers by Country"
              icon={MapIcon}
              gridSpan="lg:col-span-3"
              className="h-[400px]"
            >
              <SuppliersByCountryChart data={data.suppliersByCountry} />
            </DashboardCard>
          )}

        {/* Add more charts here based on available data */}
        {/* e.g., Water Usage Trend, Renewable Energy, etc. */}
      </div>
    </div>
  );
};

export default Dashboard;
