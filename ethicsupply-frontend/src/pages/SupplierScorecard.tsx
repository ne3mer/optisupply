import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getDetailedAnalysis, simulateChanges } from "../services/api";
import {
  UserGroupIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  ChartBarIcon,
  AcademicCapIcon,
  SparklesIcon,
  ChartPieIcon,
} from "@heroicons/react/24/outline";
import { usePageTitle } from "../hooks/usePageTitle";

const SupplierScorecard = () => {
  usePageTitle("Scorecard");
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [simulationResults, setSimulationResults] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const data = await getDetailedAnalysis(parseInt(id, 10));
        setAnalysis(data);
        setUsingMockData(data.isMockData === true);
      } catch (err) {
        console.error("Error fetching supplier analysis:", err);
        setError("Failed to fetch supplier analysis");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return "bg-gray-200";
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreTextColor = (score) => {
    if (score === null || score === undefined) return "text-gray-500";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleSimulateChanges = async (scenario) => {
    try {
      const results = await simulateChanges(parseInt(id, 10), scenario.changes);
      setSimulationResults(results);
    } catch (err) {
      console.error("Error simulating changes:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 bg-neutral-50 p-4">
        <div className="px-4 py-6 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-lg shadow-md text-white">
          <h1 className="text-3xl font-bold">Supplier Ethical Scorecard</h1>
          <p className="mt-2 text-emerald-100">Loading scorecard data...</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 bg-neutral-50 p-4">
        <div className="px-4 py-6 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-lg shadow-md text-white">
          <h1 className="text-3xl font-bold">Supplier Ethical Scorecard</h1>
          <p className="mt-2 text-emerald-100">Error loading scorecard</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="text-red-500">{error}</div>
          <div className="mt-6">
            <Link
              to="/suppliers"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Suppliers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-8 bg-neutral-50 p-4">
        <div className="px-4 py-6 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-lg shadow-md text-white">
          <h1 className="text-3xl font-bold">Supplier Ethical Scorecard</h1>
          <p className="mt-2 text-emerald-100">Scorecard not found</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="text-yellow-600">
            The supplier scorecard with ID {id} could not be found.
          </div>
          <div className="mt-6">
            <Link
              to="/suppliers"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Suppliers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-neutral-50 p-4">
      <div className="px-4 py-6 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-lg shadow-md text-white flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ethical Supplier Scorecard</h1>
          <p className="mt-2 text-emerald-100">
            {analysis.name} - {analysis.country}
          </p>
        </div>
        <Link
          to="/suppliers"
          className="inline-flex items-center px-3 py-2 border border-emerald-300 shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-500 transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Suppliers
        </Link>
      </div>

      {usingMockData && (
        <div className="rounded-md bg-blue-50 p-4 border-l-4 border-blue-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Demo Mode</h3>
              <div className="mt-2 text-sm text-blue-700">
                You are viewing demo data. The API endpoint may not be
                available.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "overview"
              ? "border-b-2 border-emerald-500 text-emerald-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "recommendations"
              ? "border-b-2 border-emerald-500 text-emerald-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("recommendations")}
        >
          Recommendations
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "simulation"
              ? "border-b-2 border-emerald-500 text-emerald-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("simulation")}
        >
          What-If Analysis
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "ai_analysis"
              ? "border-b-2 border-emerald-500 text-emerald-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("ai_analysis")}
        >
          AI Analysis
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scorecard Summary */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Score Summary
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">
                    Overall Score
                  </h4>
                  <p
                    className={`text-2xl font-bold ${getScoreTextColor(
                      analysis.scores.overall
                    )}`}
                  >
                    {analysis.scores.overall.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analysis.percentiles.overall}th percentile
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">
                    Environmental
                  </h4>
                  <p
                    className={`text-2xl font-bold ${getScoreTextColor(
                      analysis.scores.environmental
                    )}`}
                  >
                    {analysis.scores.environmental !== null
                      ? analysis.scores.environmental.toFixed(1)
                      : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analysis.percentiles.environmental}th percentile
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Social</h4>
                  <p
                    className={`text-2xl font-bold ${getScoreTextColor(
                      analysis.scores.social
                    )}`}
                  >
                    {analysis.scores.social !== null
                      ? analysis.scores.social.toFixed(1)
                      : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analysis.percentiles.social}th percentile
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">
                    Governance
                  </h4>
                  <p
                    className={`text-2xl font-bold ${getScoreTextColor(
                      analysis.scores.governance
                    )}`}
                  >
                    {analysis.scores.governance !== null
                      ? analysis.scores.governance.toFixed(1)
                      : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analysis.percentiles.governance}th percentile
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-500">
                    Risk Level
                  </h4>
                </div>
                <p
                  className={`text-lg font-bold ${getScoreTextColor(
                    analysis.scores.risk_level === "low"
                      ? 90
                      : analysis.scores.risk_level === "medium"
                      ? 70
                      : analysis.scores.risk_level === "high"
                      ? 50
                      : 30
                  )}`}
                >
                  {analysis.scores.risk_level.charAt(0).toUpperCase() +
                    analysis.scores.risk_level.slice(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Industry Benchmarks */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Industry Benchmarks
              </h3>
              <p className="text-sm text-gray-500">
                {analysis.industry} Industry
              </p>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Average Ethical Score
                  </span>
                  <span className="font-medium">
                    {analysis.industry_benchmarks.avg_ethical_score !== null
                      ? analysis.industry_benchmarks.avg_ethical_score.toFixed(
                          1
                        )
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Your Score</span>
                  <span
                    className={`font-medium ${getScoreTextColor(
                      analysis.scores.overall
                    )}`}
                  >
                    {analysis.scores.overall !== null
                      ? analysis.scores.overall.toFixed(1)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Best in Industry
                  </span>
                  <span className="font-medium text-green-600">
                    {analysis.industry_benchmarks.best_ethical_score !== null
                      ? analysis.industry_benchmarks.best_ethical_score.toFixed(
                          1
                        )
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Worst in Industry
                  </span>
                  <span className="font-medium text-red-600">
                    {analysis.industry_benchmarks.worst_ethical_score !== null
                      ? analysis.industry_benchmarks.worst_ethical_score.toFixed(
                          1
                        )
                      : "N/A"}
                  </span>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Your Position
                  </h4>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${analysis.percentiles.overall}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === "recommendations" && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Personalized Recommendations
            </h3>
          </div>
          <div className="p-4">
            {analysis.recommendations.length > 0 ? (
              <div className="space-y-4">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between">
                      <h4 className="text-md font-medium text-gray-800">
                        {recommendation.action}
                      </h4>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          recommendation.impact === "high"
                            ? "bg-red-100 text-red-800"
                            : recommendation.impact === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {recommendation.impact.toUpperCase()} Impact
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {recommendation.details}
                    </p>
                    <div className="flex mt-2 text-xs text-gray-500">
                      <span className="mr-4">
                        Difficulty: {recommendation.difficulty}
                      </span>
                      <span>Timeframe: {recommendation.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recommendations available.</p>
            )}
          </div>
        </div>
      )}

      {/* Simulation Tab */}
      {activeTab === "simulation" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Improvement Scenarios
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {analysis.improvement_scenarios.map((scenario, index) => (
                  <button
                    key={index}
                    onClick={() => handleSimulateChanges(scenario)}
                    className="w-full text-left border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="text-md font-medium text-gray-800">
                      {scenario.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {scenario.description}
                    </p>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        Click to simulate
                      </span>
                      <span className="text-xs text-emerald-600">
                        {scenario.impact.improvements.overall_score !== null
                          ? `+${scenario.impact.improvements.overall_score.toFixed(
                              1
                            )}% overall`
                          : "Improvement available"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Simulation Results
              </h3>
            </div>
            <div className="p-4">
              {simulationResults ? (
                <div>
                  <div className="flex items-center justify-center mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg w-full">
                      <p className="text-sm text-gray-500">
                        Overall Score Improvement
                      </p>
                      <p className="text-3xl font-bold text-emerald-600">
                        {simulationResults.improvements.overall_score !== null
                          ? `+${parseFloat(
                              simulationResults.improvements.overall_score
                            ).toFixed(1)}%`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">
                        Environmental Impact
                      </h4>
                      <p className="text-xl font-bold text-emerald-600">
                        {simulationResults.improvements.environmental_score !==
                        null
                          ? `+${parseFloat(
                              simulationResults.improvements.environmental_score
                            ).toFixed(1)}%`
                          : "N/A"}
                      </p>
                      <div className="mt-2 flex justify-between text-sm">
                        <span>
                          Current:{" "}
                          {simulationResults.current_scores
                            .environmental_score !== null
                            ? simulationResults.current_scores.environmental_score.toFixed(
                                1
                              )
                            : "N/A"}
                        </span>
                        <span>
                          New:{" "}
                          {simulationResults.predicted_scores
                            .environmental_score !== null
                            ? simulationResults.predicted_scores.environmental_score.toFixed(
                                1
                              )
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">
                        Social Impact
                      </h4>
                      <p className="text-xl font-bold text-emerald-600">
                        {simulationResults.improvements.social_score !== null
                          ? `+${parseFloat(
                              simulationResults.improvements.social_score
                            ).toFixed(1)}%`
                          : "N/A"}
                      </p>
                      <div className="mt-2 flex justify-between text-sm">
                        <span>
                          Current:{" "}
                          {simulationResults.current_scores.social_score !==
                          null
                            ? simulationResults.current_scores.social_score.toFixed(
                                1
                              )
                            : "N/A"}
                        </span>
                        <span>
                          New:{" "}
                          {simulationResults.predicted_scores.social_score !==
                          null
                            ? simulationResults.predicted_scores.social_score.toFixed(
                                1
                              )
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">
                        Governance Impact
                      </h4>
                      <p className="text-xl font-bold text-emerald-600">
                        {simulationResults.improvements.governance_score !==
                        null
                          ? `+${parseFloat(
                              simulationResults.improvements.governance_score
                            ).toFixed(1)}%`
                          : "N/A"}
                      </p>
                      <div className="mt-2 flex justify-between text-sm">
                        <span>
                          Current:{" "}
                          {simulationResults.current_scores.governance_score !==
                          null
                            ? simulationResults.current_scores.governance_score.toFixed(
                                1
                              )
                            : "N/A"}
                        </span>
                        <span>
                          New:{" "}
                          {simulationResults.predicted_scores
                            .governance_score !== null
                            ? simulationResults.predicted_scores.governance_score.toFixed(
                                1
                              )
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex">
                      <AcademicCapIcon className="h-6 w-6 text-blue-500 mr-2" />
                      <div>
                        <h4 className="text-md font-medium text-blue-800">
                          AI Analysis
                        </h4>
                        <p className="text-sm text-blue-600 mt-1">
                          Implementing these changes would significantly improve
                          your ethical score, particularly in the environmental
                          category. This would move you up approximately 15
                          percentile points among your industry peers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <ChartBarIcon className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    Select a scenario to see the impact simulation
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Tab */}
      {activeTab === "ai_analysis" && analysis.ai_explanation && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-emerald-600" />
              Transparent AI Analysis
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Explainable insights about why this supplier received its ethical
              score
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* AI Summary */}
            {analysis.ai_explanation.summary && (
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <h4 className="text-md font-medium text-emerald-800 mb-2">
                  Summary Analysis
                </h4>
                <p className="text-emerald-700">
                  {analysis.ai_explanation.summary}
                </p>
              </div>
            )}

            {/* Key Strengths */}
            {analysis.ai_explanation.key_strengths &&
              analysis.ai_explanation.key_strengths.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <SparklesIcon className="h-5 w-5 text-yellow-400 mr-2" />
                    Key Strengths
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.ai_explanation.key_strengths.map(
                      (strength, i) => (
                        <div
                          key={i}
                          className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                        >
                          <p className="text-gray-700">{strength}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Percentile Insights */}
            {analysis.ai_explanation.percentile_insights &&
              analysis.ai_explanation.percentile_insights.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Industry Percentile Rankings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.ai_explanation.percentile_insights.map(
                      (insight, i) => (
                        <div
                          key={i}
                          className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm"
                        >
                          <p className="text-blue-800">{insight}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Comparative Insights */}
            {analysis.ai_explanation.comparative_insights &&
              analysis.ai_explanation.comparative_insights.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <ChartPieIcon className="h-5 w-5 text-purple-500 mr-2" />
                    Comparative Performance Metrics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.ai_explanation.comparative_insights.map(
                      (insight, i) => (
                        <div
                          key={i}
                          className="bg-purple-50 p-4 rounded-lg border border-purple-200 shadow-sm"
                        >
                          <p className="text-purple-800">{insight}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* If no explanation data available */}
            {(!analysis.ai_explanation.key_strengths ||
              analysis.ai_explanation.key_strengths.length === 0) &&
              (!analysis.ai_explanation.percentile_insights ||
                analysis.ai_explanation.percentile_insights.length === 0) &&
              (!analysis.ai_explanation.comparative_insights ||
                analysis.ai_explanation.comparative_insights.length === 0) && (
                <div className="text-center py-8">
                  <InformationCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No detailed AI analysis available for this supplier yet.
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Try evaluating this supplier with more metrics to generate
                    insights.
                  </p>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierScorecard;
