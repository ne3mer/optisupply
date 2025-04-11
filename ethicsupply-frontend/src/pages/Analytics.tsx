/* Unused analytics component - superseded by SupplierAnalytics.tsx 
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSupplierAnalytics, SupplierAnalyticsData } from "../services/api";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  ScaleIcon,
  FireIcon,
  LightBulbIcon,
  BeakerIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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
};

const LoadingIndicator = ({ message = "Analyzing Data Streams..." }) => (
  <div
    className="flex flex-col items-center justify-center min-h-[80vh]"
    style={{ backgroundColor: colors.background }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-t-4 border-b-4 rounded-full mb-4"
      style={{ borderColor: colors.secondary }} // Use secondary for AI/Analytics?
    ></motion.div>
    <p style={{ color: colors.textMuted }}>{message}</p>
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
        Analysis Failed
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

const Panel = ({ title, icon: Icon, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`p-5 rounded-lg border backdrop-blur-sm ${className}`}
    style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
  >
    <h3
      className="text-lg font-semibold mb-4 flex items-center"
      style={{ color: colors.primary }}
    >
      {Icon && <Icon className="h-5 w-5 mr-2" />}
      {title}
    </h3>
    {children}
  </motion.div>
);

// Helper to get risk color (redefined or import from shared location)
const getRiskColor = (level: string | undefined) => {
  switch (level?.toLowerCase()) {
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

// --- Analytics Component ---
const Analytics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] =
    useState<SupplierAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("No Supplier ID provided for analysis.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await getSupplierAnalytics(id);
        setAnalyticsData(data);
      } catch (err) {
        setError(
          `Failed to load analytics data: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setAnalyticsData(null); // Ensure data is null on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // --- Memoized Data for Charts ---
  const radarChartData = useMemo(() => {
    if (!analyticsData?.supplier || !analyticsData?.industry_average) return [];
    const supplier = analyticsData.supplier;
    const industry = analyticsData.industry_average;
    // Normalize scores to be out of 100 for radar chart consistency if needed
    return [
      {
        subject: "Environmental",
        A: supplier.environmental_score ?? 0,
        B: industry.environmental_score ?? 0,
        fullMark: 100,
      },
      {
        subject: "Social",
        A: supplier.social_score ?? 0,
        B: industry.social_score ?? 0,
        fullMark: 100,
      },
      {
        subject: "Governance",
        A: supplier.governance_score ?? 0,
        B: industry.governance_score ?? 0,
        fullMark: 100,
      },
      // Add other comparable scores if available (e.g., supply chain)
      {
        subject: "Overall Ethical",
        A: supplier.ethical_score ?? 0,
        B: industry.ethical_score ?? 0,
        fullMark: 100,
      },
    ];
  }, [analyticsData]);

  const sentimentChartData = useMemo(() => {
    return (
      analyticsData?.sentiment_trend?.map((d) => ({
        ...d,
        score: d.score * 100,
      })) || []
    ); // Scale score for display
  }, [analyticsData?.sentiment_trend]);

  // --- Render Logic ---
  if (loading) return <LoadingIndicator />;
  if (error || !analyticsData)
    return <ErrorDisplay message={error || "Analytics data unavailable."} />;

  const {
    supplier,
    industry_average,
    risk_factors,
    ai_recommendations,
    sentiment_trend,
    isMockData,
  } = analyticsData;

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <CpuChipIcon
              className="h-8 w-8 mr-3"
              style={{ color: colors.secondary }}
            />{" "}
            AI Analysis Dossier:
            <span className="ml-2" style={{ color: colors.primary }}>
              {supplier?.name || `ID ${id}`}
            </span>
          </h1>
          <p style={{ color: colors.textMuted }} className="ml-11">
            Deep insights and predictive risk assessment
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isMockData && (
            <div
              className="flex items-center p-2 rounded border text-xs"
              style={{
                borderColor: colors.warning + "50",
                backgroundColor: colors.warning + "10",
                color: colors.warning,
              }}
            >
              <InformationCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              Demo Mode: Displaying Mock Analytics Data
            </div>
          )}
          <button
            onClick={() => navigate(`/suppliers/${id}`)} // Link back to details
            className="flex items-center px-3 py-1.5 rounded border border-transparent hover:border-accent transition-colors text-sm"
            style={{ color: colors.accent }}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Return to Details
          </button>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Radar Chart & Risk Factors */}
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Performance Benchmark" icon={ScaleIcon}>
            <div className="h-80">
              {" "}
              {/* Ensure container has height */}
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={radarChartData}
                >
                  <defs>
                    <filter
                      id="glow"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <PolarGrid stroke={colors.accent + "30"} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: colors.textMuted, fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: colors.textMuted, fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.panel,
                      border: `1px solid ${colors.accent}40`,
                      borderRadius: "8px",
                      color: colors.text,
                    }}
                    itemStyle={{ color: colors.text }}
                    labelStyle={{ color: colors.textMuted, fontWeight: "bold" }}
                  />
                  <Radar
                    name={supplier?.name || "Supplier"}
                    dataKey="A"
                    stroke={colors.primary}
                    fill={colors.primary}
                    fillOpacity={0.5}
                    strokeWidth={2}
                    filter="url(#glow)"
                  />
                  <Radar
                    name="Industry Average"
                    dataKey="B"
                    stroke={colors.secondary}
                    fill={colors.secondary}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Identified Risk Factors" icon={FireIcon}>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {risk_factors && risk_factors.length > 0 ? (
                risk_factors.map((risk, index) => (
                  <div
                    key={index}
                    className="p-3 rounded border"
                    style={{
                      backgroundColor: colors.background + "60",
                      borderColor: getRiskColor(risk.severity) + "40",
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        {risk.factor}
                      </h4>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold capitalize"
                        style={{
                          backgroundColor: getRiskColor(risk.severity) + "20",
                          color: getRiskColor(risk.severity),
                        }}
                      >
                        {risk.severity} Risk
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      {risk.description}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: colors.accent }}
                    >
                      Probability: {risk.probability}
                    </p>
                  </div>
                ))
              ) : (
                <p
                  className="text-center py-4"
                  style={{ color: colors.textMuted }}
                >
                  No specific risk factors identified.
                </p>
              )}
            </div>
          </Panel>
        </div>

        {/* Right Column: Recommendations & Sentiment */}
        <div className="lg:col-span-1 space-y-6">
          <Panel title="AI Recommendations" icon={LightBulbIcon}>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {ai_recommendations && ai_recommendations.length > 0 ? (
                ai_recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-3 rounded border border-dashed"
                    style={{ borderColor: colors.accent + "30" }}
                  >
                    <p
                      className="font-medium text-sm mb-1"
                      style={{ color: colors.text }}
                    >
                      {rec.suggestion}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: colors.textMuted }}>
                        Area:{" "}
                        <span style={{ color: colors.primary }}>
                          {rec.area}
                        </span>
                      </span>
                      <span style={{ color: colors.textMuted }}>
                        Impact:{" "}
                        <span style={{ color: colors.secondary }}>
                          {rec.impact}
                        </span>
                      </span>
                      <span style={{ color: colors.textMuted }}>
                        Difficulty:{" "}
                        <span style={{ color: colors.warning }}>
                          {rec.difficulty}
                        </span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p
                  className="text-center py-4"
                  style={{ color: colors.textMuted }}
                >
                  No specific AI recommendations available.
                </p>
              )}
            </div>
          </Panel>

          {sentiment_trend && sentiment_trend.length > 0 && (
            <Panel title="Media Sentiment Trend" icon={ArrowTrendingUpIcon}>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={sentimentChartData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      stroke={colors.accent + "20"}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: colors.textMuted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[-100, 100]}
                      tick={{ fill: colors.textMuted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${value.toFixed(0)}%`,
                        "Sentiment Score",
                      ]}
                      cursor={{
                        stroke: colors.primary,
                        strokeWidth: 1,
                        strokeDasharray: "3 3",
                      }}
                      contentStyle={{
                        backgroundColor: colors.panel,
                        border: `1px solid ${colors.accent}40`,
                        borderRadius: "8px",
                        color: colors.text,
                      }}
                      itemStyle={{ color: colors.primary }}
                      labelStyle={{ color: colors.textMuted }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={colors.primary}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: colors.primary,
                        style: { filter: "url(#glow)" },
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          )}

          {/* Placeholder for Peer Comparison */}
          {/* <Panel title="Peer Comparison" icon={UsersIcon}>...</Panel> */}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
