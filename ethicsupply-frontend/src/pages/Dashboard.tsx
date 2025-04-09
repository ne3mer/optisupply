import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowTrendingUpIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ShieldExclamationIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  UsersIcon,
  ScaleIcon,
  CloudIcon,
  SparklesIcon,
  LightBulbIcon,
  CheckCircleIcon,
  Activity,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClipboardDocumentCheckIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  ChartPieIcon,
  BeakerIcon,
  LinkIcon,
  MapPinIcon,
  ArrowTrendingDownIcon,
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
} from "recharts";
import { getDashboardData, DashboardData, Supplier } from "../services/api";
import MachineLearningStatus from "../components/MachineLearningStatus";
import EthicalScoreDistributionChart from "../components/EthicalScoreDistributionChart";
import CO2EmissionsChart from "../components/CO2EmissionsChart";
import SupplierGeoChart from "../components/SupplierGeoChart";
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
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import WorldMap from "../components/WorldMap";
import { motion, AnimatePresence } from "framer-motion";

// Constant needed for pie chart calculations
const RADIAN = Math.PI / 180;

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
  riskBreakdown: {
    title: "Risk Breakdown",
    description: "Distribution of suppliers by risk category",
  },
  industryDistribution: {
    title: "Industry Distribution",
    description: "Breakdown of suppliers by industry sector",
  },
  complianceRate: {
    title: "Compliance Rate Trend",
    description: "Monthly supplier compliance rate over the past year",
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

// Sample data for sustainable practices
const sustainablePracticesData = [
  { practice: "Recycling", adoption: 92, target: 95 },
  { practice: "Emissions Reduction", adoption: 68, target: 80 },
  { practice: "Water Conservation", adoption: 76, target: 85 },
  { practice: "Renewable Energy", adoption: 83, target: 90 },
  { practice: "Zero Waste", adoption: 54, target: 75 },
];

// Sample data for water usage trend
const waterUsageTrendData = [
  { month: "Jan", usage: 135 },
  { month: "Feb", usage: 128 },
  { month: "Mar", usage: 124 },
  { month: "Apr", usage: 118 },
  { month: "May", usage: 113 },
  { month: "Jun", usage: 108 },
  { month: "Jul", usage: 102 },
  { month: "Aug", usage: 94 },
  { month: "Sep", usage: 89 },
  { month: "Oct", usage: 86 },
  { month: "Nov", usage: 82 },
  { month: "Dec", usage: 79 },
];

// Sample data for renewable energy adoption
const renewableEnergyData = [
  { name: "Solar", value: 38 },
  { name: "Wind", value: 27 },
  { name: "Hydro", value: 12 },
  { name: "Biomass", value: 6 },
  { name: "Traditional", value: 17 },
];

// Sample data for sustainability metrics
const sustainabilityMetricsData = [
  { metric: "Carbon Footprint", current: 82, industry: 68 },
  { metric: "Water Usage", current: 76, industry: 62 },
  { metric: "Waste Reduction", current: 91, industry: 59 },
  { metric: "Energy Efficiency", current: 84, industry: 71 },
  { metric: "Social Impact", current: 70, industry: 58 },
];

// Define the dashboard data interface to fix type errors
interface DashboardData {
  total_suppliers: number;
  avg_ethical_score: number;
  avg_co2_emissions: number;
  suppliers_by_country: Record<string, number>;
  ethical_score_distribution: Array<{ range: string; count: number }>;
  co2_emissions_by_industry: Array<{ name: string; value: number }>;
  risk_breakdown: { [key: string]: number };
  water_usage_trend: Array<{ month: string; usage: number }>;
  renewable_energy_adoption: Array<{ name: string; value: number }>;
  sustainable_practices: Array<{
    practice: string;
    adoption: number;
    target: number;
  }>;
  sustainability_metrics: Array<{
    metric: string;
    current: number;
    industry: number;
  }>;
  recent_suppliers: Array<{
    id: number;
    name: string;
    country: string;
    ethical_score: number;
    trend: string;
    date: string;
  }>;
  industry_distribution: Record<string, number>;
  compliance_rate_trend: Array<{ month: string; rate: number }>;
  isMockData?: boolean;
}

const apiEndpoint = "/api/dashboard/";

// --- Color Palette ---
const colors = {
  background: "#0D0F1A", // Deep space blue/black
  panel: "rgba(25, 28, 43, 0.8)", // Slightly lighter panel background with transparency
  primary: "#00F0FF", // Neon Teal
  secondary: "#FF00FF", // Neon Magenta
  accent: "#4D5BFF", // Electric Blue
  text: "#E0E0FF", // Light lavender/white text
  textMuted: "#8A94C8", // Muted lavender text
  success: "#00FF8F", // Neon Green
  warning: "#FFD700", // Gold/Yellow
  error: "#FF4D4D", // Bright Red
};

// --- Helper Components ---

const LoadingIndicator = () => (
  <div
    className="flex flex-col items-center justify-center h-screen"
    style={{ backgroundColor: colors.background }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-t-4 border-b-4 rounded-full mb-4"
      style={{ borderColor: colors.primary }}
    ></motion.div>
    <p style={{ color: colors.textMuted }}>Initializing Nexus Interface...</p>
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div
    className="flex items-center justify-center h-screen"
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
        System Alert
      </h3>
      <p style={{ color: colors.textMuted }}>{message}</p>
    </div>
  </div>
);

const MetricPanel = ({ title, value, unit = "", icon: Icon, trend = null }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="p-4 rounded-lg border backdrop-blur-sm"
    style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }} // Panel with blurred background
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium" style={{ color: colors.textMuted }}>
        {title}
      </span>
      {Icon && <Icon className="h-5 w-5" style={{ color: colors.secondary }} />}
    </div>
    <div
      className="text-3xl font-bold font-mono tracking-tight"
      style={{ color: colors.primary }}
    >
      {value ?? "N/A"}
      {unit && (
        <span className="text-xl ml-1" style={{ color: colors.textMuted }}>
          {unit}
        </span>
      )}
    </div>
    {trend !== null && (
      <div
        className="flex items-center text-xs mt-1"
        style={{ color: trend >= 0 ? colors.success : colors.error }}
      >
        {trend >= 0 ? (
          <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
        ) : (
          <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
        )}
        {trend >= 0 ? "+" : ""}
        {trend.toFixed(1)}% vs last period
      </div>
    )}
  </motion.div>
);

const ChartPanel = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6 }}
    className="p-4 rounded-lg border backdrop-blur-sm h-80" // Fixed height for charts
    style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
  >
    <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
      {title}
    </h3>
    <div className="w-full h-64">
      {" "}
      {/* Container for chart itself */}
      {children}
    </div>
  </motion.div>
);

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching dashboard data from API...");
        const data = await getDashboardData();
        console.log("Dashboard API response:", data);

        // Add fallbacks directly here to prevent downstream errors
        setDashboardData({
          total_suppliers: data.total_suppliers ?? 0,
          avg_ethical_score: data.avg_ethical_score ?? 0,
          avg_co2_emissions: data.avg_co2_emissions ?? 0,
          suppliers_by_country: data.suppliers_by_country ?? {},
          ethical_score_distribution: data.ethical_score_distribution ?? [],
          co2_emissions_by_industry: data.co2_emissions_by_industry ?? [],
          risk_breakdown: data.risk_breakdown ?? {},
          water_usage_trend: data.water_usage_trend ?? [],
          renewable_energy_adoption: data.renewable_energy_adoption ?? [],
          sustainable_practices: data.sustainable_practices ?? [],
          sustainability_metrics: data.sustainability_metrics ?? [],
          recent_suppliers: data.recent_suppliers ?? [],
          industry_distribution: data.industry_distribution ?? {},
          compliance_rate_trend: data.compliance_rate_trend ?? [],
          isMockData: data.isMockData ?? false,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          `Failed to load dashboard data. ${
            err instanceof Error ? err.message : "Unknown error"
          }. Please try again later.`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCountrySelect = useCallback((countryCode: string | null) => {
    // In a real implementation, we'd use the countryCode to filter data
    // For now, just set the selected country name for display
    // You'd need a mapping from code to name or adjust WorldMap props
    console.log("Country selected:", countryCode);
    setSelectedCountry(countryCode ? `Data filtered for ${countryCode}` : null); // Placeholder
  }, []);

  // --- Memoized Data Transformations ---
  const scoreDistributionData = useMemo(() => {
    return (dashboardData?.ethical_score_distribution || []).map((item) => ({
      name: item.range,
      value: item.count,
    }));
  }, [dashboardData?.ethical_score_distribution]);

  const riskDistributionData = useMemo(() => {
    const risk = dashboardData?.risk_breakdown;
    if (!risk) return [];
    return [
      { name: "Low", value: risk.low, fill: colors.success },
      { name: "Medium", value: risk.medium, fill: colors.warning },
      { name: "High", value: risk.high, fill: colors.error },
      { name: "Critical", value: risk.critical, fill: colors.secondary },
    ];
  }, [dashboardData?.risk_breakdown]);

  const suppliersByCountryFormatted = useMemo(() => {
    return Object.entries(dashboardData?.suppliers_by_country || {}).map(
      ([country, count]) => ({
        id: country, // Assuming country codes are used here
        value: count,
      })
    );
  }, [dashboardData?.suppliers_by_country]);

  const complianceTrendData = useMemo(() => {
    // Assuming compliance_rate_trend is [{ month: 'Jan', rate: 85 }, ...]
    return dashboardData?.compliance_rate_trend || [];
  }, [dashboardData?.compliance_rate_trend]);

  // --- Render Logic ---
  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!dashboardData) {
    return <ErrorDisplay message="No dashboard data available." />;
  }

  const overallScore = dashboardData.avg_ethical_score ?? 0;
  const scoreColor =
    overallScore >= 80
      ? colors.success
      : overallScore >= 60
      ? colors.warning
      : colors.error;

  return (
    <div
      className="min-h-screen p-4 md:p-8 relative overflow-hidden"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* Background Effects (Subtle) */}
      <div
        className="absolute inset-0 z-0 opacity-10"
                style={{
          backgroundImage: "url(/grid_pattern.svg)",
          backgroundSize: "50px 50px",
                }}
              ></div>
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{
          background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)`,
        }}
      ></div>
      <div
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl"
        style={{
          background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)`,
        }}
      ></div>

      {/* Main Content Area */}
      <div className="relative z-10 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row justify-between items-center mb-8"
        >
            <div>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: colors.text }}
            >
              Supply Chain <span style={{ color: colors.primary }}>Nexus</span>
            </h1>
            <p style={{ color: colors.textMuted }}>
              Real-time Ethical & Sustainability Intelligence
            </p>
            {selectedCountry && (
              <p
                className="text-sm mt-2 p-2 rounded inline-block"
                style={{
                  color: colors.primary,
                  backgroundColor: colors.primary + "20",
                }}
              >
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                {selectedCountry}
              </p>
            )}
            </div>
          {dashboardData.isMockData && (
            <div
              className="mt-4 md:mt-0 flex items-center p-2 rounded border"
              style={{
                borderColor: colors.warning + "50",
                backgroundColor: colors.warning + "10",
                color: colors.warning,
              }}
            >
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              <span className="text-xs font-medium">Demo Mode Active</span>
            </div>
          )}
          {/* Add ML Status/Time Later */}
        </motion.div>

        {/* Core Intelligence & Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Central Score Gauge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-1 p-6 rounded-lg border flex flex-col items-center justify-center text-center backdrop-blur-sm"
            style={{
              backgroundColor: colors.panel,
              borderColor: scoreColor + "60",
              minHeight: "200px",
            }}
          >
            <span
              className="text-sm font-medium uppercase tracking-wider mb-2"
              style={{ color: colors.textMuted }}
            >
              Overall Ethical Score
            </span>
            <div className="relative w-32 h-32 mb-3">
              <svg
                viewBox="0 0 36 36"
                className="absolute inset-0 w-full h-full"
              >
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={colors.accent + "20"}
                  strokeWidth="3"
                />
                <motion.path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="3"
                  strokeDasharray={`${overallScore}, 100`}
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />
              </svg>
              <div
                className="absolute inset-0 flex items-center justify-center text-4xl font-bold font-mono tracking-tighter"
                style={{ color: scoreColor }}
              >
                {overallScore.toFixed(1)}
          </div>
        </div>
            <p
              className="text-xs mt-2 px-4"
              style={{ color: colors.textMuted }}
            >
              {overallScore >= 80
                ? "Excellent performance across dimensions."
                : overallScore >= 60
                ? "Good standing, potential for improvement."
                : "Requires attention in key ethical areas."}
            </p>
            {/* Add Critical Alerts Here Later */}
          </motion.div>

          {/* Key Metrics Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <MetricPanel
              title="Total Suppliers"
              value={dashboardData.total_suppliers}
              icon={BuildingOfficeIcon}
              trend={5.2} /* Dummy trend */
            />
            <MetricPanel
              title="Avg. CO₂ Emissions"
              value={dashboardData.avg_co2_emissions?.toLocaleString()}
              unit="t"
              icon={BeakerIcon}
              trend={-3.1} /* Dummy trend */
            />
            <MetricPanel
              title="High/Critical Risk"
              value={
                (dashboardData.risk_breakdown?.high || 0) +
                (dashboardData.risk_breakdown?.critical || 0)
              }
              icon={ShieldExclamationIcon}
            />
            <MetricPanel
              title="Compliance Rate"
              value={
                complianceTrendData.length > 0
                  ? complianceTrendData[complianceTrendData.length - 1].rate
                  : "N/A"
              }
              unit="%"
              icon={ScaleIcon}
              trend={1.5} /* Dummy trend */
            />
          </div>
        </div>

        {/* Charts Row 1: Distribution & Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartPanel title="Ethical Score Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scoreDistributionData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  stroke={colors.accent + "20"}
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.textMuted, fontSize: 12 }}
                  width={60}
                />
                <Tooltip
                  cursor={{ fill: colors.accent + "10" }}
                  contentStyle={{
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.accent}40`,
                    borderRadius: "8px",
                    color: colors.text,
                  }}
                  itemStyle={{ color: colors.primary }}
                  labelStyle={{ color: colors.textMuted }}
                  formatter={(value) => [`${value} Suppliers`, null]}
                />
                <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={15}>
                  {scoreDistributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors.primary}
                      fillOpacity={0.6 + index * 0.1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Risk Level Breakdown">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  cursor={{ fill: colors.accent + "10" }}
                  contentStyle={{
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.accent}40`,
                    borderRadius: "8px",
                    color: colors.text,
                  }}
                  formatter={(value, name) => [`${value} Suppliers`, name]}
                />
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke={colors.background}
                  strokeWidth={2}
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                {/* Add Legend or Center Text Later */}
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Compliance Rate Trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={complianceTrendData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                    id="complianceGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                    <stop
                      offset="5%"
                      stopColor={colors.secondary}
                      stopOpacity={0.6}
                    />
                    <stop
                      offset="95%"
                      stopColor={colors.secondary}
                      stopOpacity={0}
                    />
                </linearGradient>
              </defs>
                <CartesianGrid
                  stroke={colors.accent + "20"}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: colors.textMuted, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: colors.textMuted, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
              <Tooltip
                  cursor={{
                    stroke: colors.secondary,
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                  contentStyle={{
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.accent}40`,
                    borderRadius: "8px",
                    color: colors.text,
                  }}
                  itemStyle={{ color: colors.secondary }}
                  labelStyle={{ color: colors.textMuted }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                  stroke={colors.secondary}
                  strokeWidth={2}
                fillOpacity={1}
                  fill="url(#complianceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
          </ChartPanel>
      </div>

        {/* Row 3: Map & Recent Suppliers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="lg:col-span-2 p-4 rounded-lg border backdrop-blur-sm relative"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
              minHeight: "400px",
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: colors.text }}
            >
              Supplier Geographic Distribution
            </h3>
            <WorldMap
              data={suppliersByCountryFormatted}
              onCountryClick={handleCountrySelect}
              mapColor={colors.accent + "30"} // Base map color
              dataColor={colors.primary} // Color for data points/regions
              selectedColor={colors.secondary} // Color for selected region
            />
            <p
              className="text-xs absolute bottom-4 left-4"
              style={{ color: colors.textMuted }}
            >
              Click on a country to filter insights (feature pending).
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="p-4 rounded-lg border backdrop-blur-sm flex flex-col"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
              minHeight: "400px",
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: colors.text }}
            >
              Recently Added Suppliers
            </h3>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2">
              {(dashboardData.recent_suppliers || []).length > 0 ? (
                dashboardData.recent_suppliers.map((supplier: Supplier) => (
                  <div
                    key={supplier._id || supplier.id}
                    className="flex items-center justify-between p-3 rounded border border-transparent hover:border-primary transition-colors duration-200"
                    style={{ backgroundColor: colors.background + "80" }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: colors.text }}>
                        {supplier.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: colors.textMuted }}
                      >
                        {supplier.country} -{" "}
                        {supplier.ethical_score?.toFixed(1) ?? "N/A"}
                      </p>
                      </div>
                    <button
                      onClick={() =>
                        navigate(`/suppliers/${supplier._id || supplier.id}`)
                      }
                      className="ml-2 p-1 rounded hover:bg-accent/20 transition-colors"
                      title="View Details"
                    >
                      <LinkIcon
                        className="h-4 w-4"
                        style={{ color: colors.accent }}
                      />
                    </button>
                      </div>
                ))
              ) : (
                <p
                  className="text-center py-10"
                  style={{ color: colors.textMuted }}
                >
                  No recent suppliers found.
                </p>
              )}
        </div>
          </motion.div>
      </div>

        {/* Add Improvement Opportunities Section Later */}
      </div>
    </div>
  );
};

export default Dashboard;
