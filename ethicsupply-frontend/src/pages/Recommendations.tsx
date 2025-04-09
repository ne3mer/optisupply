import { useEffect, useState, useRef } from "react";
import { getRecommendations } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  InformationCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  LightBulbIcon,
  SparklesIcon,
  ChartPieIcon,
  AcademicCapIcon,
  BeakerIcon,
  GlobeAltIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  DocumentIcon,
  CursorArrowRaysIcon,
  TagIcon,
  BoltIcon,
  FireIcon,
  ClipboardDocumentIcon,
  PresentationChartLineIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

// Define types for recommendations data
interface Supplier {
  name: string;
  country: string;
  industry: string;
  ethical_score: number;
}

interface AIExplanation {
  reasoning: string;
  impact_assessment: string;
  implementation_difficulty: string;
  timeframe: string;
  comparative_insights: string[];
  primary_category?: string;
  urgency?: string;
  key_strengths?: string[];
  percentile_insights?: string;
  action_items?: string[];
}

interface EstimatedImpact {
  score_improvement: number;
  cost_savings: number;
  implementation_time: number;
}

interface Recommendation {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  supplier: Supplier;
  ai_explanation: AIExplanation;
  estimated_impact: EstimatedImpact;
  isMockData?: boolean;
  isAiGenerated?: boolean;
  confidence_score?: number;
  generation_method?: string;
  data_sources?: string[];
}

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<Recommendation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortBy, setSortBy] = useState<
    "priority" | "impact" | "date" | "score"
  >("priority");
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "in_progress" | "completed"
  >("all");

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await getRecommendations();
      console.log("Recommendations data received:", data);
      setRecommendations(data);
      setError(null);

      // Check if we're using mock data
      if (data && Array.isArray(data) && data.length > 0) {
        const isMock = data[0].isMockData === true;
        console.log("Using mock recommendations data:", isMock);
        setUsingMockData(isMock);
      } else {
        setUsingMockData(false);
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError("Failed to fetch recommendations. Please try again later.");
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchRecommendations();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prevExpanded) =>
      prevExpanded.includes(id)
        ? prevExpanded.filter((item) => item !== id)
        : [...prevExpanded, id]
    );
  };

  const isExpanded = (id: string) => expandedItems.includes(id);

  const viewDetails = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRecommendation(null);
  };

  const getScoreBadge = (score: number) => {
    let variant = "success";
    let icon = ArrowTrendingUpIcon;
    if (score < 60) {
      variant = "danger";
      icon = ArrowTrendingDownIcon;
    } else if (score < 80) {
      variant = "warning";
      icon = MinusIcon;
    }
    return { variant, icon };
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "environmental":
        return <GlobeAltIcon className="h-5 w-5 text-emerald-500" />;
      case "social":
        return <UserGroupIcon className="h-5 w-5 text-blue-500" />;
      case "governance":
        return <BuildingLibraryIcon className="h-5 w-5 text-purple-500" />;
      case "supply chain":
        return <ChartBarIcon className="h-5 w-5 text-amber-500" />;
      case "compliance":
        return <ShieldCheckIcon className="h-5 w-5 text-indigo-500" />;
      default:
        return <LightBulbIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPriorityBadge = (priority: string | undefined | null) => {
    if (!priority) {
      return (
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
          Unknown
        </span>
      );
    }

    const priorityLower = priority.toLowerCase();
    if (priorityLower === "high") {
      return (
        <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
          High
        </span>
      );
    } else if (priorityLower === "medium") {
      return (
        <span className="inline-flex items-center rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
          Medium
        </span>
      );
    } else if (priorityLower === "low") {
      return (
        <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
          Low
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ArrowPathIcon className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter and sort recommendations
  const filteredRecommendations = recommendations
    .filter((rec) => {
      // Filter by category
      const matchesCategory =
        filterCategory === "all" ||
        rec.category?.toLowerCase() === filterCategory.toLowerCase();

      // Filter by priority
      const matchesPriority =
        filterPriority === "all" ||
        rec.priority?.toLowerCase() === filterPriority.toLowerCase();

      // Filter by status
      const matchesStatus =
        filterStatus === "all" ||
        rec.status?.toLowerCase() === filterStatus.toLowerCase();

      // Filter by search term (supplier name, country, industry)
      const matchesSearch =
        searchTerm === "" ||
        rec.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.supplier?.country
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        rec.supplier?.industry
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        rec.title?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by tab
      const matchesTab =
        activeTab === "all" ||
        rec.status?.toLowerCase() === activeTab.toLowerCase();

      return (
        matchesCategory &&
        matchesPriority &&
        matchesStatus &&
        matchesSearch &&
        matchesTab
      );
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case "priority":
          // Convert priority to numeric value for sorting
          const priorityValue = {
            high: 3,
            medium: 2,
            low: 1,
          };
          return (
            (priorityValue[b.priority?.toLowerCase()] || 0) -
            (priorityValue[a.priority?.toLowerCase()] || 0)
          );

        case "impact":
          // Sort by estimated score improvement
          return (
            (b.estimated_impact?.score_improvement || 0) -
            (a.estimated_impact?.score_improvement || 0)
          );

        case "date":
          // Sort by creation date (newest first)
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

        case "score":
          // Sort by supplier ethical score (lowest first, as they need more attention)
          return (
            (a.supplier?.ethical_score || 0) - (b.supplier?.ethical_score || 0)
          );

        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-8">
            <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg text-white">
              <h1 className="text-3xl font-bold flex items-center">
                <SparklesIcon className="h-8 w-8 mr-2" />
                AI-Powered Recommendations
              </h1>
              <p className="mt-2 text-blue-100">
                Analyzing your supply chain for ethical optimization
                opportunities...
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden animate-pulse"
                >
                  <div className="h-2 bg-gradient-to-r from-blue-400 to-indigo-500 w-full"></div>
                  <div className="p-5 space-y-4">
                    <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-700 rounded"></div>
                    <div className="flex space-x-3">
                      <div className="h-6 bg-gray-700 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-700 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center text-gray-400">
              <p className="text-sm">
                Analyzing supplier data and generating intelligent
                recommendations...
              </p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  <SparklesIcon className="h-8 w-8 mr-2" />
                  AI-Powered Recommendations
                </h1>
                <p className="mt-2 text-blue-100 max-w-3xl">
                  Data-driven supplier optimization strategies prioritized for
                  maximum ethical and business impact
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={refreshData}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all flex items-center"
                >
                  <ArrowPathIcon
                    className={`h-5 w-5 mr-2 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh Analysis
                </button>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-900 border border-red-700 p-4 text-red-100"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Mock data notice */}
          {usingMockData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-blue-900 border border-blue-700 p-4 text-blue-100"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    Using AI-Simulated Recommendations
                  </h3>
                  <div className="mt-1 text-sm opacity-90">
                    <p>
                      Currently displaying AI-simulated recommendations based on
                      supplier data patterns. Live AI recommendations will be
                      used when the API connection is established.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Filters and tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white flex items-center mb-6">
                <BoltIcon className="h-6 w-6 text-blue-400 mr-2" />
                Intelligent Supply Chain Optimization
              </h2>

              {/* Tabs */}
              <div className="border-b border-gray-700 -mx-6 px-6 mb-6">
                <div className="flex overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${
                      activeTab === "all"
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    All Recommendations
                  </button>
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${
                      activeTab === "pending"
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setActiveTab("in_progress")}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${
                      activeTab === "in_progress"
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => setActiveTab("completed")}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${
                      activeTab === "completed"
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>

              {/* Search and filter controls */}
              <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search recommendations..."
                    className="pl-3 pr-10 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full lg:w-64"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Category filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white rounded-lg py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="environmental">Environmental</option>
                    <option value="social">Social</option>
                    <option value="governance">Governance</option>
                    <option value="supply chain">Supply Chain</option>
                  </select>

                  {/* Priority filter */}
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white rounded-lg py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>

                  {/* Sort by */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-gray-700 border border-gray-600 text-white rounded-lg py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="priority">Sort by Priority</option>
                    <option value="impact">Sort by Impact</option>
                    <option value="date">Sort by Date</option>
                    <option value="score">Sort by Ethical Score</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-xl border border-gray-100">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <AcademicCapIcon className="h-6 w-6 text-emerald-600 mr-2" />
                  Smart Supplier Recommendations
                </h2>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search suppliers..."
                      className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 w-full sm:w-64"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </span>
                  </div>

                  {/* Filter dropdown */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="environmental">Environmental</option>
                    <option value="social">Social</option>
                    <option value="governance">Governance</option>
                    <option value="supply chain">Supply Chain</option>
                    <option value="compliance">Compliance</option>
                  </select>
                </div>
              </div>

              {/* Results count */}
              <div className="mb-4 text-gray-400 text-sm">
                Showing {filteredRecommendations.length} of{" "}
                {recommendations.length} recommendations
              </div>

              {/* Recommendations grid */}
              {filteredRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecommendations.map((recommendation) => (
                    <motion.div
                      key={recommendation._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden flex flex-col h-full group"
                    >
                      {/* Category indicator bar */}
                      <div
                        className={`h-1.5 w-full ${
                          recommendation.category === "environmental"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : recommendation.category === "social"
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                            : recommendation.category === "governance"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500"
                            : "bg-gradient-to-r from-amber-500 to-orange-500"
                        }`}
                      ></div>

                      <div className="p-5 flex-grow flex flex-col justify-between">
                        <div>
                          {/* Title and badges */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center mb-2 -ml-1">
                              {getCategoryIcon(recommendation.category)}
                              <span className="ml-1 text-xs uppercase tracking-wide text-gray-400 font-medium">
                                {recommendation.category}
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              {getPriorityBadge(recommendation.priority)}
                              {getStatusBadge(recommendation.status)}
                            </div>
                          </div>

                          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                            {recommendation.title}
                          </h3>

                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                            {recommendation.description}
                          </p>

                          {/* Supplier info */}
                          <div className="mb-4 bg-gray-900 rounded-lg p-3 text-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-blue-300">
                                {recommendation.supplier.name}
                              </span>
                              <div className="flex items-center">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    recommendation.supplier.ethical_score >= 80
                                      ? "bg-green-900 text-green-300"
                                      : recommendation.supplier.ethical_score >=
                                        60
                                      ? "bg-yellow-900 text-yellow-300"
                                      : "bg-red-900 text-red-300"
                                  }`}
                                >
                                  {recommendation.supplier.ethical_score}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <span>{recommendation.supplier.industry}</span>
                              <span className="mx-1.5">•</span>
                              <span>{recommendation.supplier.country}</span>
                            </div>
                          </div>
                        </div>

                        {/* Recommendation metrics */}
                        <div>
                          <div className="mb-3 grid grid-cols-2 gap-2">
                            <div className="flex items-center text-gray-400">
                              <CurrencyDollarIcon className="h-4 w-4 mr-1.5 text-green-400" />
                              <span className="text-xs font-medium text-green-400">
                                {formatCurrency(
                                  recommendation.estimated_impact.cost_savings
                                )}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-400">
                              <PresentationChartLineIcon className="h-4 w-4 mr-1.5 text-blue-400" />
                              <span className="text-xs font-medium text-blue-400">
                                +
                                {
                                  recommendation.estimated_impact
                                    .score_improvement
                                }{" "}
                                points
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between gap-2">
                            <button
                              onClick={() => toggleExpand(recommendation._id)}
                              className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg flex items-center justify-center"
                            >
                              {isExpanded(recommendation._id) ? (
                                <>
                                  <ChevronUpIcon className="h-4 w-4 mr-1.5" />
                                  Less
                                </>
                              ) : (
                                <>
                                  <ChevronDownIcon className="h-4 w-4 mr-1.5" />
                                  More
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => viewDetails(recommendation)}
                              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg flex items-center justify-center"
                            >
                              <CursorArrowRaysIcon className="h-4 w-4 mr-1.5" />
                              Details
                            </button>
                          </div>

                          {/* Expanded content */}
                          <AnimatePresence>
                            {isExpanded(recommendation._id) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-gray-700"
                              >
                                <h4 className="text-sm font-medium text-gray-300 mb-2">
                                  AI Analysis:
                                </h4>
                                <p className="text-sm text-gray-400 mb-3">
                                  {recommendation.ai_explanation.reasoning}
                                </p>

                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div className="text-xs text-gray-500">
                                    <span className="block text-gray-400 font-medium">
                                      Implementation:
                                    </span>
                                    {
                                      recommendation.ai_explanation
                                        .implementation_difficulty
                                    }
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    <span className="block text-gray-400 font-medium">
                                      Timeframe:
                                    </span>
                                    {recommendation.ai_explanation.timeframe}
                                  </div>
                                </div>

                                <div className="text-xs text-gray-500">
                                  <span className="block text-gray-400 font-medium mb-1">
                                    Insights:
                                  </span>
                                  <ul className="space-y-1">
                                    {recommendation.ai_explanation.comparative_insights?.map(
                                      (insight, i) => (
                                        <li
                                          key={i}
                                          className="flex items-start"
                                        >
                                          <span className="text-blue-400 mr-1.5">
                                            •
                                          </span>
                                          {insight}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
                  <LightBulbIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300">
                    No recommendations found
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Try adjusting your filters or search criteria
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <InformationCircleIcon className="h-5 w-5 text-emerald-600 mr-2" />
                About Our AI Recommendation Engine
              </h3>
            </div>
            <div className="p-6">
              <div className="prose prose-emerald max-w-none">
                <p>
                  Our AI-powered recommendation engine analyzes multiple ethical
                  and environmental factors to provide transparent, data-driven
                  supplier recommendations.
                </p>

                <h4>How It Works</h4>
                <p>
                  The system combines machine learning algorithms with ethical
                  frameworks to evaluate suppliers across five key dimensions:
                </p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 list-none pl-0">
                  <li className="flex items-start">
                    <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                      <GlobeAltIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-medium block">
                        Environmental Impact
                      </span>
                      <span className="text-sm text-gray-500">
                        CO2 emissions, water usage, waste management
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <UserGroupIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-medium block">
                        Social Responsibility
                      </span>
                      <span className="text-sm text-gray-500">
                        Labor practices, diversity, community impact
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                      <BuildingLibraryIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <span className="font-medium block">Governance</span>
                      <span className="text-sm text-gray-500">
                        Ethics, transparency, anti-corruption measures
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-amber-100 p-2 rounded-lg mr-3">
                      <ChartBarIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <span className="font-medium block">Supply Chain</span>
                      <span className="text-sm text-gray-500">
                        Traceability, delivery, quality control
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start sm:col-span-2">
                    <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                      <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <span className="font-medium block">Risk Assessment</span>
                      <span className="text-sm text-gray-500">
                        Geopolitical, climate, regulatory, and labor risks
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-400 font-medium text-sm">
                  High Priority
                </h3>
                <FireIcon className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-white">
                {recommendations.filter((r) => r.priority === "high").length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Critical issues requiring immediate attention
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-400 font-medium text-sm">
                  Potential Savings
                </h3>
                <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(
                  recommendations.reduce(
                    (total, rec) =>
                      total + (rec.estimated_impact?.cost_savings || 0),
                    0
                  )
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Estimated annual cost savings
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-400 font-medium text-sm">
                  Score Impact
                </h3>
                <PresentationChartLineIcon className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-white">
                +
                {recommendations.reduce(
                  (total, rec) =>
                    total + (rec.estimated_impact?.score_improvement || 0),
                  0
                )}{" "}
                pts
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Potential ethical score improvement
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-400 font-medium text-sm">Completed</h3>
                <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-white">
                {recommendations.filter((r) => r.status === "completed").length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Successfully implemented recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed recommendation modal */}
      <AnimatePresence>
        {showDetailsModal && selectedRecommendation && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-70"
              onClick={closeDetailsModal}
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden"
            >
              {/* Modal header with colored bar */}
              <div
                className={`h-2 w-full ${
                  selectedRecommendation.category === "environmental"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : selectedRecommendation.category === "social"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                    : selectedRecommendation.category === "governance"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-gradient-to-r from-amber-500 to-orange-500"
                }`}
              ></div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    {getCategoryIcon(selectedRecommendation.category)}
                    <h3 className="text-xl font-bold text-white ml-2">
                      {selectedRecommendation.title}
                    </h3>
                  </div>
                  <button
                    onClick={closeDetailsModal}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {getPriorityBadge(selectedRecommendation.priority)}
                  {getStatusBadge(selectedRecommendation.status)}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                    <BriefcaseIcon className="h-3 w-3 mr-1" />
                    {selectedRecommendation.supplier.industry}
                  </span>
                  {selectedRecommendation.isAiGenerated && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                      <SparklesIcon className="h-3 w-3 mr-1" />
                      AI Generated
                    </span>
                  )}
                </div>

                <p className="text-gray-300 mb-6">
                  {selectedRecommendation.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-400" />
                      <h4 className="text-sm font-medium text-gray-300">
                        Potential Savings
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(
                        selectedRecommendation.estimated_impact.cost_savings
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated annual cost reduction
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <PresentationChartLineIcon className="h-5 w-5 mr-2 text-blue-400" />
                      <h4 className="text-sm font-medium text-gray-300">
                        Score Impact
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      +
                      {
                        selectedRecommendation.estimated_impact
                          .score_improvement
                      }{" "}
                      points
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Potential ethical score improvement
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CalendarIcon className="h-5 w-5 mr-2 text-purple-400" />
                      <h4 className="text-sm font-medium text-gray-300">
                        Implementation Time
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(
                        selectedRecommendation.estimated_impact
                          .implementation_time / 30
                      )}{" "}
                      months
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated time to complete
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <LightBulbIcon className="h-4 w-4 mr-2 text-yellow-400" />
                      AI Analysis
                    </h4>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-300 mb-4">
                        {selectedRecommendation.ai_explanation.reasoning}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                        <div>
                          <span className="block text-gray-500 mb-1">
                            Implementation Difficulty:
                          </span>
                          {
                            selectedRecommendation.ai_explanation
                              .implementation_difficulty
                          }
                        </div>
                        <div>
                          <span className="block text-gray-500 mb-1">
                            Timeframe:
                          </span>
                          {selectedRecommendation.ai_explanation.timeframe}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <ChartBarIcon className="h-4 w-4 mr-2 text-blue-400" />
                      Comparative Insights
                    </h4>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <ul className="space-y-2 text-sm text-gray-400">
                        {selectedRecommendation.ai_explanation.comparative_insights?.map(
                          (insight, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-blue-400 mr-2">•</span>
                              {insight}
                            </li>
                          )
                        )}
                      </ul>
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-300">
                          {
                            selectedRecommendation.ai_explanation
                              .impact_assessment
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <BuildingLibraryIcon className="h-4 w-4 mr-2 text-indigo-400" />
                    Supplier Information
                  </h4>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-lg font-medium text-white">
                        {selectedRecommendation.supplier.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {selectedRecommendation.supplier.country} •{" "}
                        {selectedRecommendation.supplier.industry}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400 mr-2">
                        Ethical Score:
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          selectedRecommendation.supplier.ethical_score >= 80
                            ? "bg-green-900 text-green-300"
                            : selectedRecommendation.supplier.ethical_score >=
                              60
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {selectedRecommendation.supplier.ethical_score}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeDetailsModal}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center">
                    <DocumentIcon className="h-5 w-5 mr-2" />
                    Generate Report
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Recommendations;
