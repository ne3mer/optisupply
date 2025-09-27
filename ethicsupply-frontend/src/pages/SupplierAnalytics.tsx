import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSupplierAnalytics } from "../services/api";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  FireIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  BuildingLibraryIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
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
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";

// --- Theme Colors & Helpers ---
const colors = {
  background: "#070B14",
  panel: "rgba(16, 23, 42, 0.7)",
  card: "rgba(22, 28, 45, 0.6)",
  primary: "#05D3FB", // Brighter teal
  secondary: "#FF00FF", // Magenta
  accent: "#5667FF", // Bluer accent
  text: "#E6E7FF",
  textMuted: "#8A94C8",
  success: "#05FFA3", // Brighter green
  warning: "#FFE347", // Warmer yellow
  error: "#FF5370", // Softer red
  gradientStart: "#05D3FB",
  gradientEnd: "#FF00FF",
};

// Reusable components
const LoadingIndicator = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh]">
    <motion.div
      className="relative w-24 h-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full border-b-4 border-t-4"
        style={{ borderColor: colors.primary }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border-r-4 border-l-4"
        style={{ borderColor: colors.secondary }}
        animate={{ rotate: -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.primary}30, ${colors.secondary}10)`,
        }}
        animate={{ scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
    <motion.p
      className="mt-6 text-xl font-light"
      style={{ color: colors.textMuted }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      Analyzing data streams...
    </motion.p>
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[80vh]">
    <div
      className="max-w-lg p-8 rounded-xl backdrop-blur-lg border"
      style={{
        backgroundColor: "rgba(255,70,70,0.1)",
        borderColor: colors.error + "30",
      }}
    >
      <ExclamationTriangleIcon
        className="h-20 w-20 mx-auto mb-6"
        style={{ color: colors.error }}
      />
      <h2
        className="text-2xl font-semibold text-center mb-4"
        style={{ color: colors.error }}
      >
        Analytics Unavailable
      </h2>
      <p className="text-center mb-6" style={{ color: colors.textMuted }}>
        {message}
      </p>
      <div className="flex justify-center">
        <Link
          to="/suppliers"
          className="px-6 py-3 rounded-lg border transition-all hover:scale-105"
          style={{ borderColor: colors.accent, color: colors.accent }}
        >
          <ArrowLeftIcon className="h-5 w-5 inline mr-2" />
          Return to Suppliers
        </Link>
      </div>
    </div>
  </div>
);

const Card = ({ title, icon: Icon, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`relative overflow-hidden rounded-xl border backdrop-blur-md p-5 ${className}`}
    style={{
      backgroundColor: colors.card,
      borderColor: colors.accent + "20",
    }}
  >
    {/* Subtle gradient background */}
    <div
      className="absolute inset-0 opacity-10 z-0"
      style={{
        background: `linear-gradient(135deg, ${colors.gradientStart}10, ${colors.gradientEnd}10)`,
      }}
    />
    <div className="relative z-10">
      <div className="flex items-center mb-4">
        <div
          className="p-2 rounded-lg mr-3"
          style={{ backgroundColor: colors.background }}
        >
          <Icon className="h-5 w-5" style={{ color: colors.primary }} />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  </motion.div>
);

const ScoreCard = ({ label, value, icon: Icon, color }) => (
  <div
    className="relative p-4 rounded-lg backdrop-blur-sm border overflow-hidden"
    style={{
      backgroundColor: color + "10",
      borderColor: color + "30",
    }}
  >
    <div className="flex justify-between items-center mb-1">
      <div className="flex items-center">
        <Icon className="h-5 w-5 mr-2" style={{ color: color }} />
        <span
          className="text-sm font-medium"
          style={{ color: colors.textMuted }}
        >
          {label}
        </span>
      </div>
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold"
        style={{ backgroundColor: color + "20", color }}
      >
        {Math.round(value) === value ? value : value.toFixed(1)}
      </div>
    </div>
    <div className="mt-2 bg-black bg-opacity-20 rounded-full h-1.5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.2 }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  </div>
);

// Helper to get risk color
const getRiskColor = (level) => {
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

// Fix for line 652 formatter issue
const formatSentimentValue = (value: string | number) => {
  if (typeof value === "number") {
    return `${value.toFixed(0)}%`;
  }
  return `${value}%`;
};

// Main component
const SupplierAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("No supplier ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getSupplierAnalytics(id);
        console.log("Normalized analytics data:", result);
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load analytics data"
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Prepare chart data
  const radarData = useMemo(() => {
    if (!data?.supplier || !data?.industry_average) return [];

    return [
      {
        subject: "Environmental",
        supplier: data.supplier.environmental_score || 0,
        industry: data.industry_average.environmental_score || 0,
        fullMark: 100,
      },
      {
        subject: "Social",
        supplier: data.supplier.social_score || 0,
        industry: data.industry_average.social_score || 0,
        fullMark: 100,
      },
      {
        subject: "Governance",
        supplier: data.supplier.governance_score || 0,
        industry: data.industry_average.governance_score || 0,
        fullMark: 100,
      },
      {
        subject: "Ethical",
        supplier: data.supplier.ethical_score || 0,
        industry: data.industry_average.ethical_score || 0,
        fullMark: 100,
      },
    ];
  }, [data]);

  // Loading and error states
  if (loading) return <LoadingIndicator />;
  if (error || !data)
    return <ErrorDisplay message={error || "Data unavailable"} />;

  const {
    supplier,
    industry_average,
    risk_factors,
    ai_recommendations,
    sentiment_trend,
    isMockData,
  } = data;

  return (
    <div
      className="min-h-screen p-4 lg:p-8"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        backgroundImage:
          "radial-gradient(circle at 10% 20%, rgba(5, 211, 251, 0.05) 0%, transparent 30%), radial-gradient(circle at 90% 80%, rgba(255, 0, 255, 0.05) 0%, transparent 30%)",
      }}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center">
              <div
                className="p-2 rounded-full mr-3"
                style={{ backgroundColor: "rgba(5, 211, 251, 0.1)" }}
              >
                <ChartPieIcon
                  className="h-8 w-8"
                  style={{ color: colors.primary }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {supplier.name || `Supplier Analytics`}
                </h1>
                <p style={{ color: colors.textMuted }}>
                  Advanced insights and risk assessment
                </p>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-3">
            {isMockData && (
              <div
                className="px-3 py-1 rounded-full text-xs flex items-center"
                style={{
                  backgroundColor: colors.warning + "10",
                  color: colors.warning,
                  border: `1px solid ${colors.warning}30`,
                }}
              >
                <InformationCircleIcon className="h-4 w-4 mr-2" />
                Demo Data
              </div>
            )}

            <button
              onClick={() => navigate(`/suppliers/${id}`)}
              className="flex items-center px-4 py-2 rounded-lg border transition-all hover:scale-105"
              style={{
                borderColor: colors.accent + "40",
                color: colors.accent,
              }}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Details
            </button>

            {/* View Methodology CTA */}
            <Link
              to="/methodology"
              className="flex items-center px-4 py-2 rounded-lg border transition-all hover:scale-105"
              style={{ borderColor: colors.primary + "40", color: colors.primary }}
            >
              <InformationCircleIcon className="h-4 w-4 mr-2" />
              View Methodology
            </Link>

            {/* Score Breakdown trigger */}
            {data?.breakdown && (
              <button
                onClick={() => setShowBreakdown(true)}
                className="flex items-center px-4 py-2 rounded-lg border transition-all hover:scale-105"
                style={{ borderColor: colors.secondary + "40", color: colors.secondary }}
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Score Breakdown
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto mt-8">
          {/* Performance Overview */}
          <Card
            title="Performance Overview"
            icon={ChartBarIcon}
            className="md:col-span-2 xl:col-span-1"
          >
            <div className="space-y-4">
              <ScoreCard
                label="Overall Ethical Score"
                value={supplier.ethical_score || 0}
                icon={SparklesIcon}
                color={colors.primary}
              />
              <ScoreCard
                label="Environmental"
                value={supplier.environmental_score || 0}
                icon={GlobeAltIcon}
                color={colors.success}
              />
              <ScoreCard
                label="Social Responsibility"
                value={supplier.social_score || 0}
                icon={UserGroupIcon}
                color={colors.accent}
              />
              <ScoreCard
                label="Governance"
                value={supplier.governance_score || 0}
                icon={BuildingLibraryIcon}
                color={colors.secondary}
              />
            </div>
          </Card>

          {/* Industry Benchmark */}
          <Card
            title="Performance Benchmark"
            icon={ChartPieIcon}
            className="md:col-span-2 xl:col-span-1"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="75%" data={radarData}>
                  <defs>
                    <filter
                      id="glow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite
                        in="SourceGraphic"
                        in2="blur"
                        operator="over"
                      />
                    </filter>
                  </defs>
                  <PolarGrid stroke={colors.accent + "20"} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: colors.textMuted }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: colors.textMuted }}
                  />
                  <Radar
                    name="Supplier"
                    dataKey="supplier"
                    stroke={colors.primary}
                    fill={colors.primary}
                    fillOpacity={0.5}
                    strokeWidth={2}
                    filter="url(#glow)"
                  />
                  <Radar
                    name="Industry Average"
                    dataKey="industry"
                    stroke={colors.secondary}
                    fill={colors.secondary}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.card,
                      borderColor: colors.accent + "30",
                      borderRadius: "0.5rem",
                      boxShadow: "0 0 20px rgba(0,0,0,0.2)",
                    }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Risk Factors */}
          <Card
            title="Risk Assessment"
            icon={FireIcon}
            className="xl:col-span-1"
          >
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {risk_factors && risk_factors.length > 0 ? (
                risk_factors.map((risk, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.2)",
                      borderColor: getRiskColor(risk.severity) + "30",
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4
                        className="font-medium text-sm"
                        style={{ color: colors.text }}
                      >
                        {risk.factor}
                      </h4>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getRiskColor(risk.severity) + "20",
                          color: getRiskColor(risk.severity),
                        }}
                      >
                        {risk.severity}
                      </span>
                    </div>
                    <p
                      className="text-xs mb-2"
                      style={{ color: colors.textMuted }}
                    >
                      {risk.description}
                    </p>
                    <div
                      className="text-xs"
                      style={{ color: colors.textMuted }}
                    >
                      Probability:
                      <span className="ml-1" style={{ color: colors.accent }}>
                        {risk.probability}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div
                  className="text-center p-4"
                  style={{ color: colors.textMuted }}
                >
                  No risk factors identified
                </div>
              )}
            </div>
          </Card>

          {/* AI Recommendations */}
          <Card
            title="AI Recommendations"
            icon={LightBulbIcon}
            className="xl:col-span-3"
          >
            <div className="mt-3">
              {ai_recommendations?.length > 0 ? (
                <div className="space-y-4">
                  {ai_recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: "rgba(9, 14, 27, 0.6)",
                        borderColor: colors.accent + "30",
                      }}
                    >
                      <div className="flex items-center mb-2">
                        <div
                          className="p-1 rounded mr-2"
                          style={{ backgroundColor: colors.primary + "30" }}
                        >
                          <SparklesIcon
                            className="h-4 w-4"
                            style={{ color: colors.primary }}
                          />
                        </div>
                        <h4 className="font-semibold">
                          {rec.area || "Improvement"}
                        </h4>
                      </div>
                      <p className="ml-7 mb-3 text-sm">{rec.suggestion}</p>

                      {/* Add impact and difficulty indicators */}
                      {rec.impact && rec.difficulty && (
                        <div className="ml-7 flex items-center text-xs gap-4">
                          <span
                            className="px-2 py-1 rounded-full"
                            style={{
                              backgroundColor:
                                rec.impact === "High"
                                  ? colors.success + "30"
                                  : rec.impact === "Medium"
                                  ? colors.warning + "30"
                                  : colors.error + "30",
                              color:
                                rec.impact === "High"
                                  ? colors.success
                                  : rec.impact === "Medium"
                                  ? colors.warning
                                  : colors.error,
                            }}
                          >
                            Impact: {rec.impact}
                          </span>
                          <span
                            className="px-2 py-1 rounded-full"
                            style={{
                              backgroundColor:
                                rec.difficulty === "Low"
                                  ? colors.success + "30"
                                  : rec.difficulty === "Medium"
                                  ? colors.warning + "30"
                                  : colors.error + "30",
                              color:
                                rec.difficulty === "Low"
                                  ? colors.success
                                  : rec.difficulty === "Medium"
                                  ? colors.warning
                                  : colors.error,
                            }}
                          >
                            Difficulty: {rec.difficulty}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="text-center py-6"
                  style={{ color: colors.textMuted }}
                >
                  No recommendations available for this supplier
                </p>
              )}
            </div>
          </Card>

          {/* Sentiment Trend if available */}
          {sentiment_trend && sentiment_trend.length > 0 && (
            <Card
              title="Media Sentiment Analysis"
              icon={ArrowTrendingUpIcon}
              className="md:col-span-2 xl:col-span-1"
            >
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={sentiment_trend.map((d) => ({
                      ...d,
                      score: d.score * 100,
                    }))}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={colors.accent + "20"}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: colors.textMuted, fontSize: 11 }}
                    />
                    <YAxis
                      domain={[-100, 100]}
                      tick={{ fill: colors.textMuted, fontSize: 11 }}
                      unit="%"
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatSentimentValue(value),
                        "Sentiment",
                      ]}
                      contentStyle={{
                        backgroundColor: colors.card,
                        borderColor: colors.accent + "30",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={colors.primary}
                      strokeWidth={2}
                      activeDot={{
                        r: 6,
                        fill: colors.primary,
                        strokeWidth: 0,
                        filter: "url(#glow)",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Add Performance Projection Card */}
          {data?.performance_projection && (
            <Card
              title="Performance Projection"
              icon={ArrowTrendingUpIcon}
              className="xl:col-span-2"
            >
              <div className="mt-2">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={data.performance_projection}
                    margin={{ top: 5, right: 10, left: 10, bottom: 15 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={colors.accent + "20"}
                    />
                    <XAxis
                      dataKey="period"
                      tick={{ fill: colors.textMuted, fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: colors.textMuted, fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.panel,
                        borderColor: colors.accent + "30",
                        color: colors.text,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="projected_score"
                      name="Projected Score"
                      stroke={colors.success}
                      strokeWidth={2}
                      dot={{
                        fill: colors.background,
                        stroke: colors.success,
                        strokeWidth: 2,
                        r: 4,
                      }}
                      activeDot={{
                        fill: colors.success,
                        stroke: colors.background,
                        strokeWidth: 2,
                        r: 6,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div
                  className="text-center text-xs mt-2"
                  style={{ color: colors.textMuted }}
                >
                  Projected ethical performance over time based on current
                  strategy
                </div>
              </div>
            </Card>
          )}

          {/* Add ESG Impact Card */}
          {data?.esg_impact && (
            <Card
              title="Sustainability Impact"
              icon={GlobeAltIcon}
              className="xl:col-span-1"
            >
              <div className="space-y-4 mt-3">
                {Object.entries(data.esg_impact).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center p-3 rounded-lg"
                    style={{ backgroundColor: "rgba(9, 14, 27, 0.6)" }}
                  >
                    <div className="text-sm">
                      {key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor:
                          typeof value === "string" && value.includes("%")
                            ? colors.success + "20"
                            : colors.primary + "20",
                        color:
                          typeof value === "string" && value.includes("%")
                            ? colors.success
                            : colors.primary,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Add ML Confidence Card */}
          {data?.ml_confidence && (
            <Card
              title="AI Analysis Confidence"
              icon={SparklesIcon}
              className="xl:col-span-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {Object.entries(data.ml_confidence).map(([key, value]) => (
                  <div
                    key={key}
                    className="p-4 rounded-lg border flex flex-col items-center justify-center text-center"
                    style={{
                      backgroundColor: "rgba(9, 14, 27, 0.6)",
                      borderColor: colors.accent + "20",
                      minHeight: "120px",
                    }}
                  >
                    <div
                      className="text-3xl font-bold mb-2"
                      style={{
                        color:
                          value >= 90
                            ? colors.success
                            : value >= 80
                            ? colors.primary
                            : value >= 70
                            ? colors.warning
                            : colors.error,
                      }}
                    >
                      {value}%
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: colors.textMuted }}
                    >
                      {key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="text-center text-xs mt-4"
                style={{ color: colors.textMuted }}
              >
                Confidence metrics for the AI-powered analysis and
                recommendations
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Breakdown Modal */}
      {showBreakdown && data?.breakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowBreakdown(false)} />
          <div className="relative max-w-5xl w-[95%] rounded-xl border p-6 overflow-auto max-h-[90vh]"
               style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">Transparent Score Breakdown</h3>
              <button onClick={() => setShowBreakdown(false)} className="text-sm" style={{ color: colors.textMuted }}>Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border p-4" style={{ borderColor: colors.accent+"30" }}>
                <h4 className="font-semibold mb-2">Pillar Scores</h4>
                <ul style={{ color: colors.textMuted }}>
                  <li>Environmental: {Math.round(data.breakdown.pillarScores.environmental)}</li>
                  <li>Social: {Math.round(data.breakdown.pillarScores.social)}</li>
                  <li>Governance: {Math.round(data.breakdown.pillarScores.governance)}</li>
                  <li>Composite: {Math.round(data.breakdown.composite)}</li>
                  <li>Risk factor: {(data.breakdown.risk?.factor ?? 0).toFixed(2)} ({data.breakdown.risk?.level})</li>
                  <li>Completeness: {((data.breakdown.completeness_ratio ?? 1)*100).toFixed(0)}%</li>
                  <li>Ethical score: {Math.round(data.breakdown.ethical_score)}</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4" style={{ borderColor: colors.accent+"30" }}>
                <h4 className="font-semibold mb-2">Weights</h4>
                <div className="grid grid-cols-2 gap-3" style={{ color: colors.textMuted }}>
                  <div>
                    <div className="font-medium" style={{ color: colors.text }}>Environmental</div>
                    <div>emission_intensity 0.4</div>
                    <div>renewable_pct 0.2</div>
                    <div>water_intensity 0.2</div>
                    <div>waste_intensity 0.2</div>
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: colors.text }}>Social</div>
                    <div>injury_rate 0.3</div>
                    <div>training_hours 0.2</div>
                    <div>wage_ratio 0.2</div>
                    <div>diversity_pct 0.3</div>
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: colors.text }}>Governance</div>
                    <div>board_diversity 0.25</div>
                    <div>board_independence 0.25</div>
                    <div>anti_corruption 0.2</div>
                    <div>transparency 0.3</div>
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: colors.text }}>Composite</div>
                    <div>E 0.4; S 0.3; G 0.3</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-lg border p-4" style={{ borderColor: colors.accent+"30" }}>
              <h4 className="font-semibold mb-3">Normalized Metrics</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead style={{ color: colors.textMuted }}>
                    <tr>
                      <th className="px-2 py-1">Metric</th>
                      <th className="px-2 py-1">Raw</th>
                      <th className="px-2 py-1">Normalized</th>
                      <th className="px-2 py-1">Imputed</th>
                      <th className="px-2 py-1">Band min</th>
                      <th className="px-2 py-1">Band avg</th>
                      <th className="px-2 py-1">Band max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries<any>(data.breakdown.normalizedMetrics || {}).map(([k, v]: any) => (
                      <tr key={k} className="border-t" style={{ borderColor: colors.accent+"20" }}>
                        <td className="px-2 py-1" style={{ color: colors.text }}>{k}</td>
                        <td className="px-2 py-1" style={{ color: colors.textMuted }}>{v?.value ?? "—"}</td>
                        <td className="px-2 py-1" style={{ color: colors.textMuted }}>{typeof v?.normalized === 'number' ? v.normalized.toFixed(2) : "—"}</td>
                        <td className="px-2 py-1" style={{ color: colors.textMuted }}>{v?.imputed ? "yes" : "no"}</td>
                        <td className="px-2 py-1" style={{ color: colors.textMuted }}>{v?.band?.min ?? "—"}</td>
                        <td className="px-2 py-1" style={{ color: colors.textMuted }}>{v?.band?.avg ?? "—"}</td>
                        <td className="px-2 py-1" style={{ color: colors.textMuted }}>{v?.band?.max ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierAnalytics;
