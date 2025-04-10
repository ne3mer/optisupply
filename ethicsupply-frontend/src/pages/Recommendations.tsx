import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { getRecommendations, Recommendation } from "../services/api";
import {
  AlertTriangle,
  ArrowDownUp,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Info,
  ListChecks,
  Loader2,
  Target,
  Users,
  Zap,
  RefreshCcw,
  ExternalLink,
  BarChart2,
  ArrowRightCircle,
  Award,
  Calendar,
  Star,
  TrendingUp,
  Lightbulb,
  ThumbsUp,
  Eye,
  Clock,
  FileText,
  MoreHorizontal,
  Globe,
  AlertCircle,
  Search,
  Tags,
  Sliders,
} from "lucide-react";
import { useInView } from "react-intersection-observer";

// --- MOCK DATA for Fallback ---
const generateMockRecommendationsFallback = (): Recommendation[] => [
  {
    _id: "mock-1",
    title: "Improve Environmental Score",
    description:
      "Implement water recycling and treatment systems to reduce water usage and pollution.",
    category: "environmental",
    priority: "high",
    status: "pending",
    supplier: { name: "Eco Friendly Manufacturing" },
    ai_explanation:
      "High water usage pattern detected in production processes, currently 50% above industry benchmark. Water recycling could reduce usage by 30-40%.",
    estimated_impact:
      "Significant water savings of approximately 500,000 gallons per year with potential cost reduction of $25,000 annually.",
    created_at: new Date().toISOString(),
    isMockData: true,
    action: "Implement water recycling",
    impact: "High",
    difficulty: "Medium",
    timeframe: "6 months",
    details: "Focus on production lines A and B first.",
  },
  {
    _id: "mock-2",
    title: "Enhance Worker Safety Programs",
    description:
      "Implement comprehensive worker safety training and monitoring systems across all production facilities.",
    category: "social",
    priority: "medium",
    status: "in_progress",
    supplier: { name: "Global Tech Solutions" },
    ai_explanation:
      "Recent safety assessment revealed gaps in worker training and protective equipment usage. Workplace incident rate is 15% above industry average.",
    estimated_impact:
      "Expected 70% reduction in workplace incidents and improved compliance with international labor standards.",
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    isMockData: true,
    action: "Conduct safety audits",
    impact: "Medium",
    difficulty: "Low",
    timeframe: "3 months",
    details: "Mandatory training sessions for all staff.",
  },
  {
    _id: "mock-3",
    title: "Implement Transparent Governance Practices",
    description:
      "Establish clear governance framework and reporting mechanisms that align with international standards.",
    category: "governance",
    priority: "low",
    status: "completed",
    supplier: { name: "Nordic Renewables" },
    ai_explanation:
      "Analysis shows potential for improved stakeholder trust through enhanced transparency in decision-making processes and financial reporting.",
    estimated_impact:
      "Improved investor relations and potential for higher ESG ratings, with estimated 15% increase in investor confidence metrics.",
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    isMockData: true,
    action: "Publish annual ESG report",
    impact: "Low",
    difficulty: "Medium",
    timeframe: "12 months",
    details: "Follow GRI standards for reporting.",
  },
];

// --- Supplier List Theme Colors ---
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

// --- Adjusted Configs for Dark Theme ---
const categoryConfig = {
  environmental: {
    icon: <Zap className="h-5 w-5" />,
    color: colors.primary, // Teal
    bgLight: "bg-cyan-900/20", // Adjusted for dark theme
    bgDark: "dark:bg-cyan-950/30",
    border: "border-cyan-700",
    gradient: `from-[${colors.primary}]/20 to-[${colors.accent}]/20`, // Teal to Blue
  },
  social: {
    icon: <Users className="h-5 w-5" />,
    color: colors.accent, // Blue
    bgLight: "bg-blue-900/20",
    bgDark: "dark:bg-blue-950/30",
    border: "border-blue-700",
    gradient: `from-[${colors.accent}]/20 to-[${colors.secondary}]/20`, // Blue to Magenta
  },
  governance: {
    icon: <Target className="h-5 w-5" />,
    color: colors.secondary, // Magenta
    bgLight: "bg-purple-900/20",
    bgDark: "dark:bg-purple-950/30",
    border: "border-purple-700",
    gradient: `from-[${colors.secondary}]/20 to-[${colors.primary}]/20`, // Magenta to Teal
  },
};

const priorityConfig = {
  high: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: colors.error, // Red
    bgLight: "bg-red-900/20",
    bgDark: "dark:bg-red-950/30",
    border: "border-red-700",
    label: "High Priority",
  },
  medium: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: colors.warning, // Yellow
    bgLight: "bg-yellow-900/20",
    bgDark: "dark:bg-yellow-950/30",
    border: "border-yellow-700",
    label: "Medium Priority",
  },
  low: {
    icon: <Info className="h-4 w-4" />,
    color: colors.success, // Green
    bgLight: "bg-green-900/20",
    bgDark: "dark:bg-green-950/30",
    border: "border-green-700",
    label: "Low Priority",
  },
};

const statusConfig = {
  pending: {
    icon: <Clock className="h-4 w-4" />,
    color: colors.textMuted, // Grayish-blue
    bgLight: "bg-gray-700/20",
    bgDark: "dark:bg-gray-800/50",
    border: "border-gray-600",
    label: "Pending",
  },
  in_progress: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: colors.accent, // Blue
    bgLight: "bg-blue-900/20",
    bgDark: "dark:bg-blue-950/30",
    border: "border-blue-700",
    label: "In Progress",
  },
  completed: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: colors.success, // Green
    bgLight: "bg-green-900/20",
    bgDark: "dark:bg-green-950/30",
    border: "border-green-700",
    label: "Completed",
  },
};

// Animated Badge Component
const AnimatedBadge = ({ children, className = "", style = {} }) => {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={style}
    >
      {children}
    </motion.span>
  );
};

// Recommendation Card Component (Dark Theme Adjustments)
const RecommendationCard = ({
  recommendation,
  isExpanded,
  onToggleExpand,
  index,
}: {
  recommendation: Recommendation;
  isExpanded: boolean;
  onToggleExpand: () => void;
  index: number;
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const currentStatus = recommendation.status || "pending";
  const statusInfo = statusConfig[currentStatus] || statusConfig.pending;

  const currentPriority = recommendation.priority || "medium";
  const priorityInfo = priorityConfig[currentPriority] || priorityConfig.medium;

  const currentCategory = recommendation.category || "governance";
  const categoryInfo =
    categoryConfig[currentCategory] || categoryConfig.governance;

  const createdDate = recommendation.created_at
    ? new Date(recommendation.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Date unknown";

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      className={`border ${categoryInfo.border} rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 mb-6`}
      style={{
        backgroundColor: colors.panel,
        borderColor: categoryInfo.border,
      }}
    >
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${categoryInfo.gradient}`}
        style={{
          background: `linear-gradient(to right, ${categoryInfo.gradient
            .split(" ")[0]
            .replace("from-", "")
            .replace("[", "")
            .replace("]", "")}, ${categoryInfo.gradient
            .split(" ")[1]
            .replace("to-", "")
            .replace("[", "")
            .replace("]", "")})`,
        }}
      />

      <button
        onClick={onToggleExpand}
        className="flex items-start justify-between w-full p-5 text-left hover:bg-gray-700/20 transition-colors focus:outline-none"
      >
        <div className="flex-1 pr-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <AnimatedBadge
              className={`${categoryInfo.bgLight} ${categoryInfo.bgDark} ${categoryInfo.border} px-2.5 py-0.5`}
              style={{
                color: categoryInfo.color,
                backgroundColor: categoryInfo.bgLight,
                borderColor: categoryInfo.border,
              }}
            >
              {categoryInfo.icon}
              <span className="capitalize">{currentCategory}</span>
            </AnimatedBadge>

            <AnimatedBadge
              className={`${priorityInfo.bgLight} ${priorityInfo.bgDark} ${priorityInfo.border} px-2.5 py-0.5`}
              style={{
                color: priorityInfo.color,
                backgroundColor: priorityInfo.bgLight,
                borderColor: priorityInfo.border,
              }}
            >
              {priorityInfo.icon}
              <span>{priorityInfo.label}</span>
            </AnimatedBadge>

            <AnimatedBadge
              className={`${statusInfo.bgLight} ${statusInfo.bgDark} ${statusInfo.border} px-2.5 py-0.5`}
              style={{
                color: statusInfo.color,
                backgroundColor: statusInfo.bgLight,
                borderColor: statusInfo.border,
              }}
            >
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </AnimatedBadge>
          </div>

          <h3
            className="text-xl font-semibold group-hover:text-blue-400 transition-colors mb-2"
            style={{ color: colors.text }}
          >
            {recommendation.title || "Untitled Recommendation"}
          </h3>

          <p className="text-sm mb-3" style={{ color: colors.textMuted }}>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-4 w-4" style={{ color: colors.accent }} />
              <span style={{ color: colors.accent }}>
                {typeof recommendation.supplier === "object"
                  ? recommendation.supplier.name
                  : "Unknown Supplier"}
              </span>
            </span>

            <span className="ml-4 inline-flex items-center gap-1.5">
              <Calendar
                className="h-4 w-4"
                style={{ color: colors.textMuted }}
              />
              {createdDate}
            </span>
          </p>

          {!isExpanded && (
            <p
              className="text-sm line-clamp-2"
              style={{ color: colors.textMuted }}
            >
              {recommendation.description || "No description available."}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 p-1">
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, type: "spring" }}
            className={`p-1.5 rounded-full ${categoryInfo.bgLight}`}
            style={{
              color: categoryInfo.color,
              backgroundColor: categoryInfo.bgLight,
            }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-gray-700"
          >
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: colors.textMuted }}
                >
                  <FileText className="h-4 w-4 text-gray-500" />
                  Description
                </div>
                <p className="pl-6" style={{ color: colors.text }}>
                  {recommendation.description || "No description available."}
                </p>
              </div>

              {recommendation.ai_explanation && (
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: colors.textMuted }}
                  >
                    <Lightbulb
                      className="h-4 w-4"
                      style={{ color: colors.warning }}
                    />
                    AI Insights
                  </div>
                  <div
                    className={`pl-6 p-3 rounded-lg border ${categoryInfo.border}`}
                    style={{
                      backgroundColor: categoryInfo.bgLight,
                      borderColor: categoryInfo.border,
                      color: colors.text,
                    }}
                  >
                    {typeof recommendation.ai_explanation === "object"
                      ? recommendation.ai_explanation.reasoning ||
                        "No AI explanation available."
                      : recommendation.ai_explanation}
                  </div>
                </div>
              )}

              {recommendation.estimated_impact && (
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: colors.textMuted }}
                  >
                    <TrendingUp
                      className="h-4 w-4"
                      style={{ color: colors.success }}
                    />
                    Estimated Impact
                  </div>
                  <p className="pl-6" style={{ color: colors.text }}>
                    {typeof recommendation.estimated_impact === "object"
                      ? `Score Improvement: ${
                          recommendation.estimated_impact.score_improvement ||
                          "N/A"
                        }, Cost Savings: $${
                          recommendation.estimated_impact.cost_savings || "N/A"
                        }, Time: ${
                          recommendation.estimated_impact.implementation_time ||
                          "N/A"
                        } days`
                      : recommendation.estimated_impact}
                  </p>
                </div>
              )}

              <div className="pt-3 flex justify-between items-center border-t border-gray-700">
                <div
                  className="text-xs flex items-center gap-1.5"
                  style={{ color: colors.textMuted }}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Last updated:{" "}
                  {recommendation.updated_at
                    ? new Date(recommendation.updated_at).toLocaleDateString()
                    : createdDate}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${categoryInfo.border}`}
                  style={{
                    color: categoryInfo.color,
                    backgroundColor: categoryInfo.bgLight,
                    borderColor: categoryInfo.border,
                  }}
                >
                  <span>Take Action</span>
                  <ArrowRightCircle className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main Page Component (Dark Theme Adjustments)
const RecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt_desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filtersVisible, setFiltersVisible] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      setUsingMockData(false);
      try {
        console.log("Fetching recommendations from API...");
        const response = await getRecommendations();
        console.log("Recommendations API raw response:", response);

        let fetchedData: Recommendation[];
        let isMock = false;

        if (Array.isArray(response)) {
          fetchedData = response;
          console.log("API returned an array directly.");
        } else if (
          response &&
          typeof response === "object" &&
          Array.isArray(response.data)
        ) {
          fetchedData = response.data;
          isMock =
            typeof response.isMockData === "boolean"
              ? response.isMockData
              : false;
          console.log(`API returned object. isMockData: ${isMock}`);
        } else {
          console.warn(
            "Unexpected API response structure. Using fallback mock data."
          );
          fetchedData = generateMockRecommendationsFallback();
          isMock = true;
        }

        setRecommendations(
          fetchedData.map((r) => ({
            ...r,
            _id:
              r._id || r.id || `tmp-${Math.random().toString(36).substring(2)}`,
          }))
        );
        setUsingMockData(isMock);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setError("Failed to fetch recommendations. Using mock data instead.");
        setRecommendations(generateMockRecommendationsFallback());
        setUsingMockData(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleToggleExpand = (id: string | undefined) => {
    if (!id) return;
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  // Filtering and Sorting Logic
  const filteredAndSortedRecommendations = useMemo(() => {
    let results = [...recommendations];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (rec) =>
          rec.title?.toLowerCase().includes(query) ||
          rec.description?.toLowerCase().includes(query) ||
          (typeof rec.supplier === "object" &&
            rec.supplier?.name?.toLowerCase().includes(query)) ||
          (typeof rec.ai_explanation === "string" &&
            rec.ai_explanation?.toLowerCase().includes(query)) ||
          (typeof rec.ai_explanation === "object" &&
            rec.ai_explanation?.reasoning?.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filterCategory !== "all") {
      results = results.filter((rec) => rec.category === filterCategory);
    }

    // Apply priority filter
    if (filterPriority !== "all") {
      results = results.filter((rec) => rec.priority === filterPriority);
    }

    // Apply status filter
    if (filterStatus !== "all") {
      results = results.filter((rec) => rec.status === filterStatus);
    }

    // Apply sorting
    const [sortField, sortDirection] = sortBy.split("_");
    results.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "");
          break;
        case "priority":
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          comparison =
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 99) -
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 99);
          break;
        case "category":
          comparison = (a.category || "").localeCompare(b.category || "");
          break;
        case "status":
          const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
          comparison =
            (statusOrder[a.status as keyof typeof statusOrder] || 99) -
            (statusOrder[b.status as keyof typeof statusOrder] || 99);
          break;
        case "supplier":
          const nameA =
            typeof a.supplier === "object" ? a.supplier.name || "" : "";
          const nameB =
            typeof b.supplier === "object" ? b.supplier.name || "" : "";
          comparison = nameA.localeCompare(nameB);
          break;
        case "createdAt":
        default:
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          comparison = dateA - dateB;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return results;
  }, [
    recommendations,
    searchQuery,
    filterCategory,
    filterPriority,
    filterStatus,
    sortBy,
  ]);

  // Component Renderer (Dark Theme)
  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ color: colors.text }}
              >
                Smart{" "}
                <span style={{ color: colors.primary }}>Recommendations</span>
              </h1>
              <p className="mt-1 max-w-3xl" style={{ color: colors.textMuted }}>
                AI-powered recommendations to improve ethical scores and
                sustainability across your supply chain.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  setRecommendations(generateMockRecommendationsFallback());
                  setIsLoading(false);
                }, 800);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors"
              style={{
                backgroundColor: colors.accent,
                color: colors.background,
              }}
            >
              <RefreshCcw className="h-4 w-4" />
              <span>Refresh</span>
            </motion.button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              {
                label: "High Priority",
                count: recommendations.filter((r) => r.priority === "high")
                  .length,
                icon: (
                  <AlertCircle
                    className="h-5 w-5"
                    style={{ color: colors.error }}
                  />
                ),
                bgColor: colors.error + "20",
                borderColor: colors.error + "80",
                textColor: colors.error,
              },
              {
                label: "In Progress",
                count: recommendations.filter((r) => r.status === "in_progress")
                  .length,
                icon: (
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    style={{ color: colors.accent }}
                  />
                ),
                bgColor: colors.accent + "20",
                borderColor: colors.accent + "80",
                textColor: colors.accent,
              },
              {
                label: "Total Recommendations",
                count: recommendations.length,
                icon: (
                  <BarChart2
                    className="h-5 w-5"
                    style={{ color: colors.primary }}
                  />
                ),
                bgColor: colors.primary + "20",
                borderColor: colors.primary + "80",
                textColor: colors.primary,
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex items-center p-4 rounded-xl border`}
                style={{
                  backgroundColor: stat.bgColor,
                  borderColor: stat.borderColor,
                }}
              >
                <div
                  className={`rounded-full p-3 mr-4`}
                  style={{ backgroundColor: stat.bgColor }}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    {stat.label}
                  </p>
                  <p
                    className={`text-2xl font-bold`}
                    style={{ color: stat.textColor }}
                  >
                    {stat.count}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Search and Filter Controls */}
          <div
            className="rounded-xl shadow-sm border p-4"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "30",
            }}
          >
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-96">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: colors.textMuted }}
                />
                <input
                  type="text"
                  placeholder="Search recommendations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.accent + "50",
                    color: colors.text,
                  }}
                />
              </div>

              <div className="flex-1 flex items-center gap-2">
                <button
                  onClick={() => setFiltersVisible(!filtersVisible)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-700/30 font-medium transition-colors"
                  style={{
                    borderColor: colors.accent + "50",
                    color: colors.textMuted,
                  }}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  <motion.span
                    animate={{ rotate: filtersVisible ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>

                <button
                  onClick={() => {
                    const [field, dir] = sortBy.split("_");
                    setSortBy(`${field}_${dir === "asc" ? "desc" : "asc"}`);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-700/30 font-medium transition-colors"
                  style={{
                    borderColor: colors.accent + "50",
                    color: colors.textMuted,
                  }}
                >
                  <ArrowDownUp className="h-4 w-4" />
                  <span>
                    {sortBy.split("_")[0].charAt(0).toUpperCase() +
                      sortBy.split("_")[0].slice(1)}
                  </span>
                  <span className="text-xs">
                    {sortBy.split("_")[1] === "asc" ? "↑" : "↓"}
                  </span>
                </button>

                {(filterCategory !== "all" ||
                  filterPriority !== "all" ||
                  filterStatus !== "all") && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => {
                      setFilterCategory("all");
                      setFilterPriority("all");
                      setFilterStatus("all");
                    }}
                    className="ml-auto flex items-center gap-1 px-3 py-2 rounded-lg border font-medium hover:bg-red-900/50 transition-colors"
                    style={{
                      borderColor: colors.error + "80",
                      backgroundColor: colors.error + "20",
                      color: colors.error,
                    }}
                  >
                    <span>Clear Filters</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Expanded Filter Options */}
            <AnimatePresence>
              {filtersVisible && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden pt-4 mt-4 border-t border-gray-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category Filter */}
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: colors.textMuted }}
                      >
                        Category
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["all", "environmental", "social", "governance"].map(
                          (category) => {
                            const config =
                              categoryConfig[category] ||
                              categoryConfig.governance;
                            const isActive = filterCategory === category;
                            return (
                              <button
                                key={category}
                                onClick={() => setFilterCategory(category)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border`}
                                style={{
                                  color: isActive
                                    ? config.color
                                    : colors.textMuted,
                                  backgroundColor: isActive
                                    ? config.bgLight
                                    : colors.inputBg,
                                  borderColor: isActive
                                    ? config.border
                                    : colors.accent + "50",
                                }}
                              >
                                {category === "all" ? (
                                  "All Categories"
                                ) : (
                                  <>
                                    {React.cloneElement(config.icon, {
                                      style: {
                                        color: isActive
                                          ? config.color
                                          : colors.textMuted,
                                      },
                                    })}
                                    <span className="ml-1 capitalize">
                                      {category}
                                    </span>
                                  </>
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Priority Filter */}
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: colors.textMuted }}
                      >
                        Priority
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["all", "high", "medium", "low"].map((priority) => {
                          const config =
                            priorityConfig[priority] || priorityConfig.medium;
                          const isActive = filterPriority === priority;
                          return (
                            <button
                              key={priority}
                              onClick={() => setFilterPriority(priority)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border`}
                              style={{
                                color: isActive
                                  ? config.color
                                  : colors.textMuted,
                                backgroundColor: isActive
                                  ? config.bgLight
                                  : colors.inputBg,
                                borderColor: isActive
                                  ? config.border
                                  : colors.accent + "50",
                              }}
                            >
                              {priority === "all" ? (
                                "All Priorities"
                              ) : (
                                <>
                                  {React.cloneElement(config.icon, {
                                    style: {
                                      color: isActive
                                        ? config.color
                                        : colors.textMuted,
                                    },
                                  })}
                                  <span className="ml-1">{config.label}</span>
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: colors.textMuted }}
                      >
                        Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["all", "pending", "in_progress", "completed"].map(
                          (status) => {
                            const config =
                              statusConfig[status] || statusConfig.pending;
                            const isActive = filterStatus === status;
                            return (
                              <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border`}
                                style={{
                                  color: isActive
                                    ? config.color
                                    : colors.textMuted,
                                  backgroundColor: isActive
                                    ? config.bgLight
                                    : colors.inputBg,
                                  borderColor: isActive
                                    ? config.border
                                    : colors.accent + "50",
                                }}
                              >
                                {status === "all" ? (
                                  "All Statuses"
                                ) : (
                                  <>
                                    {React.cloneElement(config.icon, {
                                      style: {
                                        color: isActive
                                          ? config.color
                                          : colors.textMuted,
                                      },
                                    })}
                                    <span className="ml-1">{config.label}</span>
                                  </>
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Main Content */}
        <div>
          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <Loader2
                  className="h-12 w-12 animate-spin mb-4"
                  style={{ color: colors.primary }}
                />
                <p
                  className="text-lg font-medium"
                  style={{ color: colors.textMuted }}
                >
                  Loading recommendations...
                </p>
              </motion.div>
            </div>
          ) : error ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-xl border"
              style={{
                backgroundColor: colors.error + "20",
                borderColor: colors.error + "80",
              }}
            >
              <AlertTriangle
                className="h-12 w-12 mb-4"
                style={{ color: colors.error }}
              />
              <h2
                className="text-xl font-semibold mb-2"
                style={{ color: colors.error }}
              >
                Error Loading Recommendations
              </h2>
              <p className="mb-4" style={{ color: colors.error }}>
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: colors.error,
                  color: colors.background,
                }}
              >
                Try Again
              </button>
            </div>
          ) : filteredAndSortedRecommendations.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-xl border"
              style={{
                backgroundColor: colors.panel,
                borderColor: colors.accent + "30",
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center max-w-md text-center"
              >
                <Search
                  className="h-12 w-12 mb-4"
                  style={{ color: colors.textMuted }}
                />
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ color: colors.text }}
                >
                  No Recommendations Found
                </h2>
                <p className="mb-4" style={{ color: colors.textMuted }}>
                  {searchQuery
                    ? `No recommendations match your search for "${searchQuery}"`
                    : "No recommendations match your current filters"}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterCategory("all");
                    setFilterPriority("all");
                    setFilterStatus("all");
                  }}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: colors.accent,
                    color: colors.background,
                  }}
                >
                  Clear All Filters
                </button>
              </motion.div>
            </div>
          ) : (
            <>
              {usingMockData && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-lg border p-4 flex items-center gap-3"
                  style={{
                    backgroundColor: colors.warning + "20",
                    borderColor: colors.warning + "80",
                  }}
                >
                  <AlertTriangle
                    className="h-5 w-5"
                    style={{ color: colors.warning }}
                  />
                  <p className="text-sm" style={{ color: colors.warning }}>
                    Viewing mock data. Connect to a real backend for production
                    use.
                  </p>
                </motion.div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    Showing {filteredAndSortedRecommendations.length}{" "}
                    recommendation
                    {filteredAndSortedRecommendations.length !== 1 ? "s" : ""}
                  </p>

                  <div className="flex items-center gap-2">
                    <label
                      className="text-sm"
                      style={{ color: colors.textMuted }}
                    >
                      Sort by:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded border text-sm p-1 focus:ring-2 focus:outline-none"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.accent + "50",
                        color: colors.text,
                      }}
                    >
                      <option value="createdAt_desc">Newest First</option>
                      <option value="createdAt_asc">Oldest First</option>
                      <option value="priority_desc">Priority (High-Low)</option>
                      <option value="priority_asc">Priority (Low-High)</option>
                      <option value="title_asc">Title (A-Z)</option>
                      <option value="title_desc">Title (Z-A)</option>
                      <option value="supplier_asc">Supplier (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Recommendation Cards */}
              <div className="mt-6">
                {filteredAndSortedRecommendations.map(
                  (recommendation, index) => (
                    <RecommendationCard
                      key={recommendation._id}
                      recommendation={recommendation}
                      isExpanded={expandedCardId === recommendation._id}
                      onToggleExpand={() =>
                        handleToggleExpand(recommendation._id)
                      }
                      index={index}
                    />
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPage;
