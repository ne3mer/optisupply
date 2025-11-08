import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  Download,
  Sparkles,
  Activity,
  PieChart,
  LineChart,
  DollarSign,
  Timer,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Layers,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Building2,
  MapPin,
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useThemeColors } from "../theme/useThemeColors";
import { Link } from "react-router-dom";

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

// Colors come from theme

// --- Adjusted Configs for Dark Theme ---
const buildCategoryConfig = (colors: any) => ({
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
});

const buildPriorityConfig = (colors: any) => ({
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
});

const buildStatusConfig = (colors: any) => ({
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
});

type EnhancedRecommendation = Recommendation & {
  action_started_at?: string;
  action_owner?: string;
  action_notes?: string[];
  action_completed_at?: string;
};

const actionOwners = [
  "Sustainability Office",
  "Operations",
  "Procurement",
  "Compliance",
  "ESG Taskforce",
];

const ACTION_STATE_KEY = "ethicsupply-recommendation-actions";

const loadActionState = (): Record<string, Partial<EnhancedRecommendation>> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACTION_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch (error) {
    console.warn("Failed to load recommendation action state", error);
    return {};
  }
};

const persistActionState = (
  state: Record<string, Partial<EnhancedRecommendation>>
) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTION_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to persist recommendation action state", error);
  }
};

const applyStoredActionState = (
  recommendations: EnhancedRecommendation[]
): EnhancedRecommendation[] => {
  const storedState = loadActionState();
  if (!storedState || Object.keys(storedState).length === 0) {
    return recommendations;
  }

  return recommendations.map((rec) => {
    const stored = storedState[rec._id];
    if (!stored) return rec;

    return {
      ...rec,
      ...stored,
      action_notes: stored.action_notes ?? rec.action_notes,
    };
  });
};

const persistActionStateFromArray = (
  recommendations: EnhancedRecommendation[]
) => {
  const stateIndex: Record<string, Partial<EnhancedRecommendation>> = {};

  recommendations.forEach((rec) => {
    const entry: Partial<EnhancedRecommendation> = {};

    if (rec.action_owner) entry.action_owner = rec.action_owner;
    if (rec.action_started_at) entry.action_started_at = rec.action_started_at;
    if (rec.action_completed_at)
      entry.action_completed_at = rec.action_completed_at;
    if (rec.action_notes && rec.action_notes.length > 0)
      entry.action_notes = rec.action_notes;
    if (rec.status === "in_progress" || rec.status === "completed")
      entry.status = rec.status;

    if (Object.keys(entry).length > 0) {
      stateIndex[rec._id] = entry;
    }
  });

  persistActionState(stateIndex);
};

const getRelativeTime = (dateString?: string | null) => {
  if (!dateString) return null;
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return null;

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return "just now";

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  return "just now";
};

const buildActionSteps = (recommendation: Recommendation) => {
  const steps: string[] = [];

  if (recommendation.details) {
    steps.push(`Scope focus: ${recommendation.details}`);
  }

  if (recommendation.timeframe) {
    steps.push(`Timeline commitment: ${recommendation.timeframe}`);
  }

  if (recommendation.estimated_impact) {
    if (typeof recommendation.estimated_impact === "string") {
      steps.push(`Expected impact: ${recommendation.estimated_impact}`);
    } else if (typeof recommendation.estimated_impact === "object") {
      const impactEntries = Object.entries(recommendation.estimated_impact)
        .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
        .join(", ");
      steps.push(`Projected benefits: ${impactEntries}`);
    }
  }

  if (!steps.length && recommendation.description) {
    steps.push(recommendation.description);
  }

  if (!steps.length) {
    steps.push("Review supplier baseline metrics with your ESG analyst.");
    steps.push("Align on milestones with the supplier relationship owner.");
    steps.push("Schedule progress check-ins and define success KPIs.");
  }

  return steps;
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

// Impact Score Card Component
const ImpactScoreCard = ({ 
  label, 
  value, 
  trend, 
  icon, 
  color, 
  delay = 0 
}: { 
  label: string; 
  value: string | number; 
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
  delay?: number;
}) => {
  const colors = useThemeColors() as any;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="p-4 rounded-xl border backdrop-blur-sm"
      style={{
        backgroundColor: color + "15",
        borderColor: color + "40",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: color + "25" }}
          >
            {icon}
          </div>
          <span className="text-sm font-medium" style={{ color: colors.textMuted }}>
            {label}
          </span>
        </div>
        {trend && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, delay: delay + 0.3 }}
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-4 w-4" style={{ color: colors.success }} />
            ) : trend === "down" ? (
              <ArrowDownRight className="h-4 w-4" style={{ color: colors.error }} />
            ) : null}
          </motion.div>
        )}
      </div>
      <div className="text-2xl font-bold" style={{ color: color }}>
        {value}
      </div>
    </motion.div>
  );
};

// Category Distribution Chart Component
const CategoryDistribution = ({ recommendations, colors }: { recommendations: EnhancedRecommendation[]; colors: any }) => {
  const categoryCounts = useMemo(() => {
    const counts = { environmental: 0, social: 0, governance: 0 };
    recommendations.forEach((rec) => {
      const cat = rec.category || "governance";
      if (cat in counts) {
        counts[cat as keyof typeof counts]++;
      }
    });
    return counts;
  }, [recommendations]);

  const total = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const categoryConfig = buildCategoryConfig(colors);

  return (
    <div className="space-y-3">
      {Object.entries(categoryCounts).map(([category, count]) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.governance;
        
        return (
          <div key={category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span style={{ color: config.color }}>{React.cloneElement(config.icon, { className: "h-4 w-4" })}</span>
                <span className="capitalize" style={{ color: colors.text }}>{category}</span>
              </div>
              <span className="font-semibold" style={{ color: colors.text }}>{count}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.background }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ backgroundColor: config.color, height: "100%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Recommendation Card Component (Enhanced)
const RecommendationCard = ({
  recommendation,
  isExpanded,
  onToggleExpand,
  onActionClick,
  index,
}: {
  recommendation: EnhancedRecommendation;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onActionClick: () => void;
  index: number;
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const colors = useThemeColors() as any;
  const categoryConfig = buildCategoryConfig(colors);
  const priorityConfig = buildPriorityConfig(colors);
  const statusConfig = buildStatusConfig(colors);

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

  const actionStartedAgo = getRelativeTime(recommendation.action_started_at);
  const actionCompletedAgo = getRelativeTime(recommendation.action_completed_at);
  const isCompleted = currentStatus === "completed";
  const hasActivePlan = Boolean(recommendation.action_started_at) && !isCompleted;

  const actionButtonLabel = isCompleted
    ? "View Action Record"
    : hasActivePlan
    ? "Update Plan"
    : "Launch Action Plan";

  const actionButtonColor = isCompleted
    ? colors.success
    : hasActivePlan
    ? colors.primary
    : colors.accent;

  const actionButtonIcon = isCompleted ? (
    <ThumbsUp className="h-4 w-4" />
  ) : hasActivePlan ? (
    <TrendingUp className="h-4 w-4" />
  ) : (
    <ArrowRightCircle className="h-4 w-4" />
  );

  // Extract impact metrics
  const impactText = typeof recommendation.estimated_impact === "string" 
    ? recommendation.estimated_impact 
    : "Impact assessment available";
  
  const hasCostSavings = impactText.toLowerCase().includes("$") || impactText.toLowerCase().includes("cost");
  const hasTimeframe = recommendation.timeframe;

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
      className={`border ${categoryInfo.border} rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 mb-6 group`}
      style={{
        backgroundColor: colors.panel,
        borderColor: categoryInfo.border,
      }}
    >
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${categoryInfo.gradient}`}
        style={{
          background: `linear-gradient(to right, ${categoryInfo.color}40, ${categoryInfo.color}80)`,
        }}
      />

      <button
        onClick={onToggleExpand}
        className="flex items-start justify-between w-full p-6 text-left hover:bg-gray-700/10 transition-colors focus:outline-none"
      >
        <div className="flex-1 pr-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <AnimatedBadge
              className={`${categoryInfo.bgLight} ${categoryInfo.bgDark} ${categoryInfo.border} px-3 py-1`}
              style={{
                color: categoryInfo.color,
                backgroundColor: categoryInfo.bgLight,
                borderColor: categoryInfo.border,
              }}
            >
              {categoryInfo.icon}
              <span className="capitalize font-medium">{currentCategory}</span>
            </AnimatedBadge>

            <AnimatedBadge
              className={`${priorityInfo.bgLight} ${priorityInfo.bgDark} ${priorityInfo.border} px-3 py-1`}
              style={{
                color: priorityInfo.color,
                backgroundColor: priorityInfo.bgLight,
                borderColor: priorityInfo.border,
              }}
            >
              {priorityInfo.icon}
              <span className="font-medium">{priorityInfo.label}</span>
            </AnimatedBadge>

            <AnimatedBadge
              className={`${statusInfo.bgLight} ${statusInfo.bgDark} ${statusInfo.border} px-3 py-1`}
              style={{
                color: statusInfo.color,
                backgroundColor: statusInfo.bgLight,
                borderColor: statusInfo.border,
              }}
            >
              {statusInfo.icon}
              <span className="font-medium">{statusInfo.label}</span>
            </AnimatedBadge>

            {hasCostSavings && (
              <AnimatedBadge
                className="px-3 py-1 border"
                style={{
                  color: colors.success,
                  backgroundColor: colors.success + "15",
                  borderColor: colors.success + "40",
                }}
              >
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Cost Savings</span>
              </AnimatedBadge>
            )}

            {hasTimeframe && (
              <AnimatedBadge
                className="px-3 py-1 border"
                style={{
                  color: colors.primary,
                  backgroundColor: colors.primary + "15",
                  borderColor: colors.primary + "40",
                }}
              >
                <Timer className="h-4 w-4" />
                <span className="font-medium">{recommendation.timeframe}</span>
              </AnimatedBadge>
            )}
          </div>

          {(recommendation.action_owner || hasActivePlan || actionCompletedAgo) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {recommendation.action_owner && (
                <AnimatedBadge
                  className="px-3 py-1 border"
                  style={{
                    color: colors.accent,
                    backgroundColor: colors.accent + "15",
                    borderColor: colors.accent + "40",
                  }}
                >
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Owner: {recommendation.action_owner}</span>
                </AnimatedBadge>
              )}

              {hasActivePlan && actionStartedAgo && (
                <AnimatedBadge
                  className="px-3 py-1 border"
                  style={{
                    color: colors.primary,
                    backgroundColor: colors.primary + "15",
                    borderColor: colors.primary + "40",
                  }}
                >
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Started {actionStartedAgo}</span>
                </AnimatedBadge>
              )}

              {actionCompletedAgo && (
                <AnimatedBadge
                  className="px-3 py-1 border"
                  style={{
                    color: colors.success,
                    backgroundColor: colors.success + "15",
                    borderColor: colors.success + "40",
                  }}
                >
                  <Award className="h-4 w-4" />
                  <span className="font-medium">Completed {actionCompletedAgo}</span>
                </AnimatedBadge>
              )}
            </div>
          )}

          <h3
            className="text-xl font-bold group-hover:text-blue-400 transition-colors mb-2"
            style={{ color: colors.text }}
          >
            {recommendation.title || "Untitled Recommendation"}
          </h3>

          <p className="text-sm mb-3 flex items-center gap-4" style={{ color: colors.textMuted }}>
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4" style={{ color: colors.accent }} />
              <span style={{ color: colors.accent }} className="font-medium">
                {typeof recommendation.supplier === "object"
                  ? recommendation.supplier.name
                  : "Unknown Supplier"}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5">
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
            className={`p-2 rounded-full ${categoryInfo.bgLight} hover:scale-110 transition-transform`}
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
            className="overflow-hidden border-t"
            style={{ borderColor: colors.accent + "20" }}
          >
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 text-sm font-semibold"
                    style={{ color: colors.textMuted }}
                  >
                    <FileText className="h-4 w-4" />
                    Description
                  </div>
                  <p className="pl-6 leading-relaxed" style={{ color: colors.text }}>
                    {recommendation.description || "No description available."}
                  </p>
                </div>

                {recommendation.ai_explanation && (
                  <div className="space-y-2">
                    <div
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: colors.textMuted }}
                    >
                      <Sparkles
                        className="h-4 w-4"
                        style={{ color: colors.warning }}
                      />
                      AI Insights
                    </div>
                    <div
                      className={`pl-6 p-4 rounded-lg border ${categoryInfo.border} backdrop-blur-sm`}
                      style={{
                        backgroundColor: categoryInfo.bgLight,
                        borderColor: categoryInfo.border,
                        color: colors.text,
                      }}
                    >
                      <p className="leading-relaxed">
                        {typeof recommendation.ai_explanation === "object"
                          ? recommendation.ai_explanation.reasoning ||
                            "No AI explanation available."
                          : recommendation.ai_explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {recommendation.estimated_impact && (
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 text-sm font-semibold"
                    style={{ color: colors.textMuted }}
                  >
                    <TrendingUp
                      className="h-4 w-4"
                      style={{ color: colors.success }}
                    />
                    Estimated Impact
                  </div>
                  <div className="pl-6 p-4 rounded-lg border" style={{ 
                    backgroundColor: colors.success + "10",
                    borderColor: colors.success + "30",
                  }}>
                    <p className="leading-relaxed font-medium" style={{ color: colors.text }}>
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
                </div>
              )}

              <div className="pt-4 flex justify-between items-center border-t" style={{ borderColor: colors.accent + "20" }}>
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
                  onClick={onActionClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all shadow-sm hover:shadow-md"
                  style={{
                    color: colors.background,
                    backgroundColor: actionButtonColor,
                    borderColor: actionButtonColor,
                    boxShadow: hasActivePlan
                      ? `0 0 0 2px ${colors.primary}30`
                      : "none",
                  }}
                >
                  <span>{actionButtonLabel}</span>
                  {actionButtonIcon}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ActionPlanModal = ({
  recommendation,
  onClose,
  onConfirm,
}: {
  recommendation: EnhancedRecommendation;
  onClose: () => void;
  onConfirm: (options: {
    mode: "start" | "complete";
    owner: string;
    notes?: string;
  }) => void;
}) => {
  const [owner, setOwner] = useState(
    recommendation.action_owner || actionOwners[0]
  );
  const [notes, setNotes] = useState("");
  const colors = useThemeColors() as any;

  const steps = useMemo(() => buildActionSteps(recommendation), [recommendation]);
  const hasActivePlan = Boolean(recommendation.action_started_at);
  const isCompleted = recommendation.status === "completed";

  const handleConfirm = (mode: "start" | "complete") => {
    onConfirm({ mode, owner, notes: notes.trim() || undefined });
    setNotes("");
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: colors.panel, border: `1px solid ${colors.accent}40` }}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between px-6 py-5 border-b"
          style={{ borderColor: colors.accent + "30", backgroundColor: colors.accent + "10" }}
        >
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: colors.textMuted }}>
              Action plan for
            </p>
            <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
              {recommendation.title || "Recommendation"}
            </h2>
            <p className="text-sm mt-2 flex items-center gap-2" style={{ color: colors.textMuted }}>
              <Building2 className="h-4 w-4" />
              {typeof recommendation.supplier === "object"
                ? recommendation.supplier?.name
                : "Unnamed supplier"}
              {recommendation.timeframe && (
                <>
                  <span>•</span>
                  <Timer className="h-4 w-4" />
                  <span>Target: {recommendation.timeframe}</span>
                </>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition"
            style={{ color: colors.textMuted }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: colors.textMuted }}>
                Assign owner
              </p>
              <div className="relative">
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 rounded-lg pr-10 text-sm font-medium"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    border: `1px solid ${colors.accent}40`,
                  }}
                >
                  {actionOwners.map((team) => (
                    <option key={team} value={team} style={{ color: "#000" }}>
                      {team}
                    </option>
                  ))}
                </select>
                <Users
                  className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: colors.textMuted }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: colors.textMuted }}>
                Add a kickoff note (optional)
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Capture next steps, stakeholders, or quick reminders..."
                className="w-full resize-none px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  border: `1px solid ${colors.accent}30`,
                }}
              />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide mb-3 font-semibold" style={{ color: colors.textMuted }}>
              Recommended playbook
            </p>
            <div
              className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: colors.accent + "25", backgroundColor: colors.background }}
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: colors.primary + "25",
                      color: colors.primary,
                    }}
                  >
                    {index + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
                    {step}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="px-6 py-4 flex flex-wrap gap-3 justify-end border-t"
          style={{ borderColor: colors.accent + "30", backgroundColor: colors.background }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: colors.panel,
              color: colors.textMuted,
              border: `1px solid ${colors.accent}30`,
            }}
          >
            Cancel
          </button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleConfirm("start")}
            className="px-5 py-2 rounded-lg text-sm font-semibold shadow-sm"
            style={{
              backgroundColor: hasActivePlan ? colors.primary : colors.accent,
              color: colors.background,
              border: "none",
            }}
          >
            {hasActivePlan ? "Update & Continue" : "Launch Action Plan"}
          </motion.button>

          {(!isCompleted && hasActivePlan) && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleConfirm("complete")}
              className="px-5 py-2 rounded-lg text-sm font-semibold shadow-sm"
              style={{
                backgroundColor: colors.success,
                color: colors.background,
                border: "none",
              }}
            >
              Mark as Complete
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main Page Component (Enhanced)
const RecommendationsPage = () => {
  const colors = useThemeColors() as any;
  const categoryConfig = buildCategoryConfig(colors);
  const priorityConfig = buildPriorityConfig(colors);
  const statusConfig = buildStatusConfig(colors);
  const [recommendations, setRecommendations] = useState<
    EnhancedRecommendation[]
  >([]);
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
  const [activeActionPlan, setActiveActionPlan] =
    useState<EnhancedRecommendation | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const fetchRecommendations = useCallback(async () => {
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
          typeof response.isMockData === "boolean" ? response.isMockData : false;
        console.log(`API returned object. isMockData: ${isMock}`);
      } else {
        console.warn(
          "Unexpected API response structure. Using fallback mock data."
        );
        fetchedData = generateMockRecommendationsFallback();
        isMock = true;
      }

      const normalized: EnhancedRecommendation[] = fetchedData.map((r) => ({
        ...r,
        _id: r._id || r.id || `tmp-${Math.random().toString(36).substring(2)}`,
      }));

      const merged = applyStoredActionState(normalized);
      setRecommendations(merged);
      persistActionStateFromArray(merged);
      setUsingMockData(isMock);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setError("Failed to fetch recommendations. Using mock data instead.");
      const fallback = generateMockRecommendationsFallback().map((r) => ({
        ...r,
        _id: r._id || r.id || `tmp-${Math.random().toString(36).substring(2)}`,
      }));
      const mergedFallback = applyStoredActionState(fallback);
      setRecommendations(mergedFallback);
      persistActionStateFromArray(mergedFallback);
      setUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleToggleExpand = (id: string | undefined) => {
    if (!id) return;
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  const handleTakeAction = (id: string | undefined) => {
    if (!id) return;
    const target = recommendations.find((rec) => rec._id === id);
    if (target) {
      setActiveActionPlan(target);
    }
  };

  const handleActionPlanCommit = ({
    mode,
    owner,
    notes,
  }: {
    mode: "start" | "complete";
    owner: string;
    notes?: string;
  }) => {
    if (!activeActionPlan) return;

    const ownerName = owner || activeActionPlan.action_owner || actionOwners[0];

    setRecommendations((prev) => {
      const now = new Date().toISOString();
      const updated = prev.map((rec) => {
        if (rec._id !== activeActionPlan._id) return rec;

        let updatedRec: EnhancedRecommendation = {
          ...rec,
          action_owner: ownerName,
        };

        if (mode === "start") {
          if (!updatedRec.action_started_at) {
            updatedRec = { ...updatedRec, action_started_at: now };
          }
          if (updatedRec.status !== "completed") {
            updatedRec = { ...updatedRec, status: "in_progress" };
          }
        }

        if (mode === "complete") {
          updatedRec = {
            ...updatedRec,
            action_completed_at: now,
            status: "completed",
            action_started_at: updatedRec.action_started_at || now,
          };
        }

        if (notes) {
          updatedRec = {
            ...updatedRec,
            action_notes: [...(updatedRec.action_notes || []), notes],
          };
        }

        return updatedRec;
      });

      persistActionStateFromArray(updated);
      return updated;
    });

    setActiveActionPlan(null);
    setActionFeedback(
      mode === "complete"
        ? "Action plan marked as completed."
        : "Action plan launched and assigned."
    );
  };

  useEffect(() => {
    if (!actionFeedback) return;
    const timeout = setTimeout(() => setActionFeedback(null), 3500);
    return () => clearTimeout(timeout);
  }, [actionFeedback]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = recommendations.length;
    const highPriority = recommendations.filter((r) => r.priority === "high").length;
    const inProgress = recommendations.filter((r) => r.status === "in_progress").length;
    const completed = recommendations.filter((r) => r.status === "completed").length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    // Calculate average impact score (simplified)
    const avgImpact = recommendations.length > 0 
      ? recommendations.filter(r => r.impact === "High").length / recommendations.length * 100
      : 0;

    return {
      total,
      highPriority,
      inProgress,
      completed,
      completionRate: Math.round(completionRate),
      avgImpact: Math.round(avgImpact),
    };
  }, [recommendations]);

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

  // Component Renderer
  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="p-3 rounded-xl"
                  style={{ 
                    backgroundColor: colors.primary + "20",
                  }}
                >
                  <Sparkles className="h-6 w-6" style={{ color: colors.primary }} />
                </div>
                <div>
                  <h1
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: colors.text }}
                  >
                    AI-Powered{" "}
                    <span style={{ color: colors.primary }}>Recommendations</span>
                  </h1>
                  <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
                    Intelligent insights to optimize your supply chain sustainability
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border"
                style={{
                  backgroundColor: colors.panel,
                  borderColor: colors.accent + "40",
                  color: colors.text,
                }}
              >
                {viewMode === "list" ? <Layers className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
                <span className="hidden sm:inline">{viewMode === "list" ? "Grid" : "List"}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchRecommendations}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                style={{
                  backgroundColor: colors.accent,
                  color: colors.background,
                }}
              >
                <RefreshCcw className="h-4 w-4" />
                <span>Refresh</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Export functionality
                  const csv = [
                    ["Title", "Category", "Priority", "Status", "Supplier", "Impact", "Timeframe"],
                    ...recommendations.map(r => [
                      r.title || "",
                      r.category || "",
                      r.priority || "",
                      r.status || "",
                      typeof r.supplier === "object" ? r.supplier.name : "",
                      r.impact || "",
                      r.timeframe || ""
                    ])
                  ].map(row => row.join(",")).join("\n");
                  
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `recommendations_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors border shadow-sm"
                style={{
                  backgroundColor: colors.panel,
                  borderColor: colors.accent + "40",
                  color: colors.accent,
                }}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </motion.button>
            </div>
          </div>

          {/* Enhanced Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <ImpactScoreCard
              label="Total"
              value={stats.total}
              icon={<BarChart2 className="h-5 w-5" />}
              color={colors.primary}
              delay={0}
            />
            <ImpactScoreCard
              label="High Priority"
              value={stats.highPriority}
              trend="up"
              icon={<AlertCircle className="h-5 w-5" />}
              color={colors.error}
              delay={0.1}
            />
            <ImpactScoreCard
              label="In Progress"
              value={stats.inProgress}
              icon={<Activity className="h-5 w-5" />}
              color={colors.accent}
              delay={0.2}
            />
            <ImpactScoreCard
              label="Completed"
              value={stats.completed}
              trend="up"
              icon={<CheckCircle2 className="h-5 w-5" />}
              color={colors.success}
              delay={0.3}
            />
            <ImpactScoreCard
              label="Completion"
              value={`${stats.completionRate}%`}
              icon={<Percent className="h-5 w-5" />}
              color={colors.primary}
              delay={0.4}
            />
            <ImpactScoreCard
              label="High Impact"
              value={`${stats.avgImpact}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              color={colors.warning}
              delay={0.5}
            />
          </div>

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6 p-5 rounded-xl border"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "30",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.text }}>
                <PieChart className="h-5 w-5" style={{ color: colors.primary }} />
                Category Distribution
              </h3>
              <Link
                to="/suppliers"
                className="text-sm font-medium flex items-center gap-1 hover:underline"
                style={{ color: colors.accent }}
              >
                View Suppliers <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <CategoryDistribution recommendations={recommendations} colors={colors} />
          </motion.div>

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
                  placeholder="Search recommendations, suppliers, or insights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:outline-none transition-all"
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border hover:bg-gray-700/30 font-medium transition-colors"
                  style={{
                    borderColor: colors.accent + "50",
                    color: colors.text,
                    backgroundColor: filtersVisible ? colors.accent + "20" : "transparent",
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border hover:bg-gray-700/30 font-medium transition-colors"
                  style={{
                    borderColor: colors.accent + "50",
                    color: colors.text,
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
                    className="ml-auto flex items-center gap-1 px-4 py-2.5 rounded-lg border font-medium hover:bg-red-900/50 transition-colors"
                    style={{
                      borderColor: colors.error + "80",
                      backgroundColor: colors.error + "20",
                      color: colors.error,
                    }}
                  >
                    <X className="h-4 w-4" />
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
                  className="overflow-hidden pt-4 mt-4 border-t"
                  style={{ borderColor: colors.accent + "20" }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category Filter */}
                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
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
                        className="block text-sm font-semibold mb-2"
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
                        className="block text-sm font-semibold mb-2"
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
            <div className="flex flex-col items-center justify-center py-20">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <Loader2
                  className="h-16 w-16 animate-spin mb-4"
                  style={{ color: colors.primary }}
                />
                <p
                  className="text-lg font-semibold"
                  style={{ color: colors.textMuted }}
                >
                  Loading recommendations...
                </p>
                <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
                  Analyzing your supply chain data
                </p>
              </motion.div>
            </div>
          ) : error ? (
            <div
              className="flex flex-col items-center justify-center py-20 rounded-xl border"
              style={{
                backgroundColor: colors.error + "20",
                borderColor: colors.error + "80",
              }}
            >
              <AlertTriangle
                className="h-16 w-16 mb-4"
                style={{ color: colors.error }}
              />
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: colors.error }}
              >
                Error Loading Recommendations
              </h2>
              <p className="mb-6 text-center max-w-md" style={{ color: colors.error }}>
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
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
              className="flex flex-col items-center justify-center py-20 rounded-xl border"
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
                  className="h-16 w-16 mb-4"
                  style={{ color: colors.textMuted }}
                />
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: colors.text }}
                >
                  No Recommendations Found
                </h2>
                <p className="mb-6" style={{ color: colors.textMuted }}>
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
                  className="px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
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

              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium" style={{ color: colors.textMuted }}>
                    Showing {filteredAndSortedRecommendations.length}{" "}
                    recommendation
                    {filteredAndSortedRecommendations.length !== 1 ? "s" : ""}
                  </p>

                  <div className="flex items-center gap-2">
                    <label
                      className="text-sm font-medium"
                      style={{ color: colors.textMuted }}
                    >
                      Sort by:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-lg border text-sm p-2 focus:ring-2 focus:outline-none font-medium"
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
                      onActionClick={() => handleTakeAction(recommendation._id)}
                      index={index}
                    />
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activeActionPlan && (
          <ActionPlanModal
            recommendation={activeActionPlan}
            onClose={() => setActiveActionPlan(null)}
            onConfirm={handleActionPlanCommit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border shadow-xl backdrop-blur-sm"
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            style={{
              backgroundColor: colors.background,
              borderColor: colors.primary + "40",
              color: colors.text,
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" style={{ color: colors.success }} />
              <span className="font-medium">{actionFeedback}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecommendationsPage;
