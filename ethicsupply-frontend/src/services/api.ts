// API URL and service functions for the application
import logger from "../utils/log";
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://optisupply.onrender.com/api";

// Ensure proper URL formatting
const formatUrl = (url: string) => {
  // Remove trailing slashes and ensure single slashes
  return url.replace(/\/+$/, "").replace(/([^:]\/)\/+/g, "$1");
};

const API_URL = formatUrl(API_BASE_URL);

// Helper function to construct API endpoints
const getEndpoint = (path: string) => {
  // Remove leading and trailing slashes from path
  const cleanPath = path.replace(/^\/+|\/+$/g, ""); // Corrected regex
  return `${API_URL}/${cleanPath}`;
};

export interface Supplier {
  id: number;
  name: string;
  country: string;
  industry?: string;
  revenue?: number;
  employee_count?: number;
  co2_emissions: number;
  total_emissions?: number;
  delivery_efficiency: number;
  wage_fairness: number;
  human_rights_index: number;
  waste_management_score: number;
  ethical_score: number | null;

  // Additional fields for enhanced data
  environmental_score?: number;
  social_score?: number;
  governance_score?: number;
  risk_level?: string;
  risk_factor?: number;
  composite_score?: number;
  completeness_ratio?: number;
  renewable_energy_percent?: number;
  water_usage?: number;
  waste_generated?: number;
  injury_rate?: number;
  training_hours?: number;
  living_wage_ratio?: number;
  gender_diversity_percent?: number;
  board_independence?: number;
  board_diversity?: number;
  anti_corruption_policy?: boolean;
  transparency_score?: number;
  geopolitical_risk?: number;
  climate_risk?: number;
  labor_dispute_risk?: number;

  created_at: string;
  updated_at: string;
  isMockData?: boolean;
}

export interface SupplierEvaluation {
  // Basic Information
  name: string;
  country: string;
  industry: string;
  ethical_score?: number;

  // Environmental Metrics
  co2_emissions: number; // Carbon emissions in tons
  water_usage: number; // Water usage in cubic meters
  energy_efficiency: number; // Energy efficiency score (0-1)
  waste_management_score: number; // Waste management score (0-1)
  renewable_energy_percent: number; // Percentage of renewable energy used
  pollution_control: number; // Pollution control measures score (0-1)

  // Social Metrics
  wage_fairness: number; // Wage fairness score (0-1)
  human_rights_index: number; // Human rights compliance score (0-1)
  diversity_inclusion_score: number; // Diversity and inclusion score (0-1)
  community_engagement: number; // Community engagement score (0-1)
  worker_safety: number; // Worker safety score (0-1)

  // Governance Metrics
  transparency_score: number; // Transparency score (0-1)
  corruption_risk: number; // Corruption risk score (0-1)
  board_diversity: number; // Board diversity score (0-1)
  ethics_program: number; // Ethics program strength score (0-1)
  compliance_systems: number; // Compliance systems score (0-1)

  // Supply Chain Metrics
  delivery_efficiency: number; // Delivery efficiency score (0-1)
  quality_control_score: number; // Quality control score (0-1)
  supplier_diversity: number; // Supplier diversity score (0-1)
  traceability: number; // Supply chain traceability score (0-1)

  // Risk Factors
  geopolitical_risk: number; // Geopolitical risk exposure (0-1)
  climate_risk: number; // Climate risk exposure (0-1)
  labor_dispute_risk: number; // Labor dispute risk (0-1)
}

export interface EvaluationResult {
  id: number;
  name: string;

  // Overall Scores
  ethical_score: number; // Overall ethical score
  environmental_score: number; // Environmental category score
  social_score: number; // Social category score
  governance_score: number; // Governance category score
  supply_chain_score: number; // Supply chain category score
  risk_score: number; // Risk assessment score

  // Detailed Assessment
  assessment: {
    strengths: string[]; // Key strengths identified
    weaknesses: string[]; // Areas needing improvement
    opportunities: string[]; // Opportunities for enhancement
    threats: string[]; // Potential threats or risks
  };

  // Recommendations
  recommendation: string; // Overall recommendation
  suggestions: string[]; // Specific improvement suggestions

  // Risk Assessment
  risk_factors: {
    factor: string; // Risk factor name
    severity: string; // Severity level (Low, Medium, High)
    probability: string; // Probability level (Low, Medium, High)
    mitigation: string; // Suggested mitigation strategy
  }[];

  // Compliance Status
  compliance: {
    status: string; // Overall compliance status
    standards_met: string[]; // Standards the supplier meets
    certifications: string[]; // Current certifications
    gaps: string[]; // Compliance gaps identified
  };

  // Comparison Data
  industry_comparison: {
    percentile: number; // Percentile ranking in industry
    average_score: number; // Industry average score
    top_performer_score: number; // Top performer score in industry
  };

  isMockData?: boolean; // Flag for mock data
}

export interface DashboardData {
  total_suppliers: number;
  avg_ethical_score: number;
  avg_co2_emissions: number;
  suppliers_by_country: Record<string, number>;
  ethical_score_distribution: Array<{ range: string; count: number }>;
  co2_emissions_by_industry: Array<{ name: string; value: number }>;
  risk_breakdown: Record<string, number>;
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
    ethical_score?: number;
    composite_score?: number;
    risk_level?: string;
    risk_factor?: number;
    completeness_ratio?: number;
    updated_at?: string;
  }>;
  industry_distribution: Record<string, number>;
  compliance_rate_trend: Array<{ month: string; rate: number }>;
  isMockData?: boolean;
  avg_composite_score?: number;
  avgCompositeScore?: number;
  avg_risk_factor?: number;
  avgRiskFactor?: number;
  avg_completeness_ratio?: number;
  avgCompletenessRatio?: number;
  pillar_averages?: {
    environmental: number;
    social: number;
    governance: number;
  };
  pillarAverages?: {
    environmental: number;
    social: number;
    governance: number;
  };
  completeness_distribution?: Record<string, number>;
  completenessDistribution?: Record<string, number>;
}

export interface Recommendation {
  _id?: string; // Optional ID from MongoDB
  id?: string | number; // Fallback ID if _id is not present
  action: string;
  impact: string;
  difficulty: string;
  timeframe: string;
  details: string;
  title?: string; // From mock data
  description?: string; // From mock data
  category?: "environmental" | "social" | "governance"; // From mock data
  priority?: "high" | "medium" | "low"; // From mock data
  status?: "pending" | "in_progress" | "completed"; // From mock data
  supplier?: { name: string } | string; // Can be object or string ID
  ai_explanation?: string | { reasoning?: string }; // From mock data
  estimated_impact?:
    | string
    | {
        score_improvement?: number;
        cost_savings?: number;
        implementation_time?: number;
      }; // From mock data
  created_at?: string; // From mock data
  updated_at?: string; // Optional updated timestamp
  isMockData?: boolean; // Flag if it's mock data
}

export interface ImprovementScenario {
  name: string;
  description: string;
  changes: Record<string, number>;
  impact: {
    current_scores: Record<string, number>;
    predicted_scores: Record<string, number>;
    improvements: Record<string, number>;
  };
}

export interface DetailedAnalysis {
  id: number;
  name: string;
  country: string;
  industry: string;
  scores: {
    overall: number;
    environmental: number;
    social: number;
    governance: number;
    risk_level: string;
  };
  industry_benchmarks: {
    avg_ethical_score: number;
    avg_environmental_score: number;
    avg_social_score: number;
    avg_governance_score: number;
    best_ethical_score: number;
    worst_ethical_score: number;
  };
  percentiles: {
    overall: number;
    environmental: number;
    social: number;
    governance: number;
  };
  recommendations: Recommendation[];
  improvement_scenarios: ImprovementScenario[];
  isMockData?: boolean;
}

// Dataset meta
export interface DatasetMeta {
  version: string;
  seed: string | null;
  generatedAt: string | null;
  bandsVersion: string | null;
}

export const getDatasetMeta = async (): Promise<DatasetMeta | null> => {
  try {
    const resp = await fetch(getEndpoint("dataset/meta"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      version: String(data.version ?? "synthetic-v1"),
      seed: data.seed ?? null,
      generatedAt: data.generatedAt ?? null,
      bandsVersion: data.bandsVersion ?? null,
    };
  } catch (e) {
    console.warn("Failed to fetch dataset meta:", e);
    return null;
  }
};

// Bands types and API
export type BandsEntry = { min: number; avg?: number; max: number };
export type BandsMap = Record<string, Record<string, BandsEntry>>; // industry -> metric -> entry

export const getBands = async (): Promise<BandsMap | null> => {
  try {
    const resp = await fetch(getEndpoint("bands"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    // Accept {bands: {...}} or direct mapping
    const root = data && data.bands ? data.bands : data;
    return root as BandsMap;
  } catch (e) {
    console.warn("Failed to fetch bands:", e);
    return null;
  }
};

// Mock data for suppliers
const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: "Procter & Gamble",
    country: "United States",
    industry: "Consumer Goods",
    co2_emissions: 2.4, // Million metric tons CO2e
    delivery_efficiency: 0.92,
    wage_fairness: 0.88,
    human_rights_index: 0.85,
    waste_management_score: 0.83,
    ethical_score: 81.5,
    environmental_score: 78,
    social_score: 82,
    governance_score: 85,
    risk_level: "Low",
    created_at: "2023-05-15T10:30:00Z",
    updated_at: "2024-01-12T09:45:00Z",
  },
  {
    id: 2,
    name: "Foxconn Technology Group",
    country: "Taiwan",
    industry: "Electronics Manufacturing",
    co2_emissions: 4.3, // Million metric tons CO2e
    delivery_efficiency: 0.89,
    wage_fairness: 0.61,
    human_rights_index: 0.58,
    waste_management_score: 0.75,
    ethical_score: 67.4,
    environmental_score: 70,
    social_score: 59,
    governance_score: 72,
    risk_level: "Medium",
    created_at: "2023-06-20T08:15:00Z",
    updated_at: "2024-02-18T11:30:00Z",
  },
  {
    id: 3,
    name: "Unilever",
    country: "United Kingdom",
    industry: "Consumer Goods",
    co2_emissions: 1.9, // Million metric tons CO2e
    delivery_efficiency: 0.87,
    wage_fairness: 0.84,
    human_rights_index: 0.87,
    waste_management_score: 0.89,
    ethical_score: 84.2,
    environmental_score: 85,
    social_score: 83,
    governance_score: 84,
    risk_level: "Low",
    created_at: "2023-04-10T09:20:00Z",
    updated_at: "2024-01-25T16:40:00Z",
  },
  {
    id: 4,
    name: "Samsung Electronics",
    country: "South Korea",
    industry: "Electronics",
    co2_emissions: 16.1, // Million metric tons CO2e
    delivery_efficiency: 0.91,
    wage_fairness: 0.82,
    human_rights_index: 0.79,
    waste_management_score: 0.81,
    ethical_score: 77.8,
    environmental_score: 75,
    social_score: 78,
    governance_score: 82,
    risk_level: "Low",
    created_at: "2023-07-05T11:45:00Z",
    updated_at: "2024-02-01T13:20:00Z",
  },
  {
    id: 5,
    name: "Nestlé",
    country: "Switzerland",
    industry: "Food & Beverage",
    co2_emissions: 92, // Million metric tons CO2e
    delivery_efficiency: 0.84,
    wage_fairness: 0.76,
    human_rights_index: 0.73,
    waste_management_score: 0.77,
    ethical_score: 72.5,
    environmental_score: 69,
    social_score: 74,
    governance_score: 80,
    risk_level: "Medium",
    created_at: "2023-03-18T07:30:00Z",
    updated_at: "2024-02-10T10:15:00Z",
  },
  {
    id: 6,
    name: "Li & Fung",
    country: "Hong Kong",
    industry: "Supply Chain Management",
    co2_emissions: 0.8, // Million metric tons CO2e
    delivery_efficiency: 0.94,
    wage_fairness: 0.73,
    human_rights_index: 0.68,
    waste_management_score: 0.65,
    ethical_score: 71.2,
    environmental_score: 68,
    social_score: 70,
    governance_score: 75,
    risk_level: "Medium",
    created_at: "2023-08-12T13:10:00Z",
    updated_at: "2024-01-27T09:50:00Z",
  },
  {
    id: 7,
    name: "Tyson Foods",
    country: "United States",
    industry: "Food Processing",
    co2_emissions: 25, // Million metric tons CO2e
    delivery_efficiency: 0.82,
    wage_fairness: 0.71,
    human_rights_index: 0.68,
    waste_management_score: 0.66,
    ethical_score: 68.9,
    environmental_score: 64,
    social_score: 69,
    governance_score: 73,
    risk_level: "Medium",
    created_at: "2023-05-25T08:20:00Z",
    updated_at: "2024-01-15T14:30:00Z",
  },
  {
    id: 8,
    name: "Danone",
    country: "France",
    industry: "Food & Beverage",
    co2_emissions: 24.7, // Million metric tons CO2e
    delivery_efficiency: 0.85,
    wage_fairness: 0.83,
    human_rights_index: 0.81,
    waste_management_score: 0.84,
    ethical_score: 80.6,
    environmental_score: 82,
    social_score: 81,
    governance_score: 79,
    risk_level: "Low",
    created_at: "2023-06-14T10:45:00Z",
    updated_at: "2024-02-05T11:20:00Z",
  },
  {
    id: 9,
    name: "General Mills",
    country: "United States",
    industry: "Food & Beverage",
    co2_emissions: 12, // Million metric tons CO2e
    delivery_efficiency: 0.87,
    wage_fairness: 0.85,
    human_rights_index: 0.82,
    waste_management_score: 0.79,
    ethical_score: 79.8,
    environmental_score: 76,
    social_score: 83,
    governance_score: 82,
    risk_level: "Low",
    created_at: "2023-04-28T09:30:00Z",
    updated_at: "2024-01-18T16:15:00Z",
  },
  {
    id: 10,
    name: "Nike",
    country: "United States",
    industry: "Apparel & Footwear",
    co2_emissions: 0.3, // Million metric tons CO2e (direct operations)
    delivery_efficiency: 0.89,
    wage_fairness: 0.74,
    human_rights_index: 0.76,
    waste_management_score: 0.86,
    ethical_score: 78.3,
    environmental_score: 81,
    social_score: 75,
    governance_score: 80,
    risk_level: "Low",
    created_at: "2023-07-10T14:20:00Z",
    updated_at: "2024-02-12T10:40:00Z",
  },
  {
    id: 11,
    name: "VF Corporation",
    country: "United States",
    industry: "Apparel & Footwear",
    co2_emissions: 2.2, // Million metric tons CO2e
    delivery_efficiency: 0.86,
    wage_fairness: 0.78,
    human_rights_index: 0.77,
    waste_management_score: 0.81,
    ethical_score: 77.4,
    environmental_score: 79,
    social_score: 76,
    governance_score: 78,
    risk_level: "Low",
    created_at: "2023-05-22T11:15:00Z",
    updated_at: "2024-01-20T09:30:00Z",
  },
  {
    id: 12,
    name: "Haier",
    country: "China",
    industry: "Home Appliances",
    co2_emissions: 18.5, // Million metric tons CO2e
    delivery_efficiency: 0.84,
    wage_fairness: 0.69,
    human_rights_index: 0.65,
    waste_management_score: 0.72,
    ethical_score: 68.7,
    environmental_score: 71,
    social_score: 67,
    governance_score: 70,
    risk_level: "Medium",
    created_at: "2023-06-30T08:45:00Z",
    updated_at: "2024-02-08T15:10:00Z",
  },
];

export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const response = await fetch(getEndpoint("suppliers"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error("Error fetching suppliers:", error);
    // Return mock data as fallback
    return mockSuppliers.map((supplier) => ({ ...supplier, isMockData: true }));
  }
};

export const getSupplier = async (id: number | string): Promise<Supplier> => {
  try {
    const response = await fetch(getEndpoint(`suppliers/${id}`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Supplier with ID ${id} not found. Trying mock data.`);
        // Try to find the supplier in mock data
        const mockSupplier = mockSuppliers.find((s) => s.id === Number(id));
        if (mockSupplier) {
          return { ...mockSupplier, isMockData: true };
        }
        throw new Error(`Supplier with ID ${id} not found`);
      }
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    logger.log("API response data for single supplier:", data);

    return {
      ...data,
      isMockData: false,
    };
  } catch (error) {
    logger.error(`Error fetching supplier with ID ${id}:`, error);

    // Try to find the supplier in mock data as a fallback
    const mockSupplier = mockSuppliers.find((s) => s.id === Number(id));
    if (mockSupplier) {
      logger.log(`Using mock data for supplier ${id}`);
      return { ...mockSupplier, isMockData: true };
    }

    throw error;
  }
};

export const evaluateSupplier = async (
  supplierData: SupplierEvaluation
): Promise<EvaluationResult> => {
  try {
    const response = await fetch(getEndpoint("suppliers/evaluate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplierData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("API error:", response.status, errorText);

      // Return mock result if API is not available
      if (response.status === 404) {
        logger.warn("Evaluation API endpoint not available. Using mock data.");
        return createMockEvaluationResult(supplierData);
      }

      throw new Error(
        `Failed to evaluate supplier: ${response.status} ${errorText}`
      );
    }

    // Process the real API response
    const data = await response.json();
    logger.log("Evaluation API response:", data);
    return data;
  } catch (error) {
    logger.error("Error in evaluateSupplier:", error);

    // If the error is related to the API not being available, return mock data
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string" &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError"))
    ) {
      logger.warn("Evaluation API endpoint not available. Using mock data.");
      return createMockEvaluationResult(supplierData);
    }

    throw error;
  }
};

// Helper function to create mock evaluation result
function createMockEvaluationResult(
  supplierData: SupplierEvaluation
): EvaluationResult {
  // Calculate main category scores
  const environmentalScore = calculateEnvironmentalScore(supplierData);
  const socialScore = calculateSocialScore(supplierData);
  const governanceScore = calculateGovernanceScore(supplierData);
  const supplyChainScore = calculateSupplyChainScore(supplierData);
  const riskScore = calculateRiskScore(supplierData);

  // Calculate overall ethical score as weighted average
  const ethicalScore =
    (environmentalScore * 0.25 +
      socialScore * 0.25 +
      governanceScore * 0.25 +
      supplyChainScore * 0.15 +
      (1 - riskScore) * 0.1) *
    100;

  // Generate strengths and weaknesses based on scores
  const strengths = generateStrengths(supplierData);
  const weaknesses = generateWeaknesses(supplierData);

  // Generate risk factors
  const riskFactors = generateRiskFactors(supplierData);

  return {
    id: Math.floor(Math.random() * 1000) + 100,
    name: supplierData.name,

    // Overall scores (convert 0-1 scores to 0-100 for display)
    ethical_score: parseFloat(ethicalScore.toFixed(1)),
    environmental_score: parseFloat((environmentalScore * 100).toFixed(1)),
    social_score: parseFloat((socialScore * 100).toFixed(1)),
    governance_score: parseFloat((governanceScore * 100).toFixed(1)),
    supply_chain_score: parseFloat((supplyChainScore * 100).toFixed(1)),
    risk_score: parseFloat((riskScore * 100).toFixed(1)),

    // Detailed assessment
    assessment: {
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      opportunities: generateOpportunities(),
      threats: generateThreats(supplierData),
    },

    // Recommendations
    recommendation: generateMockRecommendation(supplierData),
    suggestions: generateMockSuggestions(supplierData),

    // Risk factors
    risk_factors: riskFactors,

    // Compliance information
    compliance: {
      status:
        ethicalScore > 75
          ? "Compliant"
          : ethicalScore > 50
          ? "Partially Compliant"
          : "Non-Compliant",
      standards_met: generateStandardsMet(supplierData),
      certifications: generateCertifications(supplierData),
      gaps: generateComplianceGaps(supplierData),
    },

    // Industry comparison
    industry_comparison: {
      percentile: Math.min(
        95,
        Math.max(5, Math.round(ethicalScore * 0.8 + Math.random() * 20))
      ),
      average_score: 68.5,
      top_performer_score: 94.2,
    },

    isMockData: true,
  };
}

// Helper functions for score calculations
function calculateEnvironmentalScore(data: SupplierEvaluation): number {
  const metrics = [
    1 - Math.min(1, data.co2_emissions / 100), // Lower is better for CO2
    1 - Math.min(1, data.water_usage / 100), // Lower is better for water usage
    data.energy_efficiency || 0.5,
    data.waste_management_score || 0.5,
    data.renewable_energy_percent ? data.renewable_energy_percent / 100 : 0.3,
    data.pollution_control || 0.5,
  ];
  return metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
}

function calculateSocialScore(data: SupplierEvaluation): number {
  const metrics = [
    data.wage_fairness || 0.5,
    data.human_rights_index || 0.5,
    data.diversity_inclusion_score || 0.5,
    data.community_engagement || 0.5,
    data.worker_safety || 0.5,
  ];
  return metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
}

function calculateGovernanceScore(data: SupplierEvaluation): number {
  const metrics = [
    data.transparency_score || 0.5,
    1 - (data.corruption_risk || 0.5), // Lower corruption risk is better
    data.board_diversity || 0.5,
    data.ethics_program || 0.5,
    data.compliance_systems || 0.5,
  ];
  return metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
}

function calculateSupplyChainScore(data: SupplierEvaluation): number {
  const metrics = [
    data.delivery_efficiency || 0.5,
    data.quality_control_score || 0.5,
    data.supplier_diversity || 0.5,
    data.traceability || 0.5,
  ];
  return metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
}

function calculateRiskScore(data: SupplierEvaluation): number {
  const metrics = [
    data.geopolitical_risk || 0.5,
    data.climate_risk || 0.5,
    data.labor_dispute_risk || 0.5,
  ];
  return metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
}

// Helper functions for generating assessment items
function generateStrengths(data: SupplierEvaluation): string[] {
  const strengths = [];

  if ((data.co2_emissions || 50) < 30)
    strengths.push("Low carbon emissions compared to industry average");

  if ((data.waste_management_score || 0) > 0.7)
    strengths.push("Excellent waste management practices");

  if ((data.renewable_energy_percent || 0) > 50)
    strengths.push("High utilization of renewable energy sources");

  if ((data.wage_fairness || 0) > 0.7)
    strengths.push("Strong commitment to fair wage practices");

  if ((data.human_rights_index || 0) > 0.7)
    strengths.push("Strong human rights protections and policies");

  if ((data.diversity_inclusion_score || 0) > 0.7)
    strengths.push("Excellent diversity and inclusion initiatives");

  if ((data.transparency_score || 0) > 0.7)
    strengths.push("High level of corporate transparency");

  if ((data.corruption_risk || 1) < 0.3) strengths.push("Low corruption risk");

  if ((data.ethics_program || 0) > 0.7)
    strengths.push("Robust ethics program implementation");

  if ((data.delivery_efficiency || 0) > 0.7)
    strengths.push("Highly efficient delivery systems");

  if ((data.quality_control_score || 0) > 0.7)
    strengths.push("Superior quality control processes");

  // If we don't have enough strengths, add some generic ones
  if (strengths.length < 3) {
    strengths.push(
      "Established reputation in the industry",
      "Commitment to sustainability principles",
      "Responsive management structure"
    );
  }

  return strengths;
}

function generateWeaknesses(data: SupplierEvaluation): string[] {
  const weaknesses = [];

  if ((data.co2_emissions || 50) > 70)
    weaknesses.push("High carbon emissions relative to industry standards");

  if ((data.waste_management_score || 0) < 0.3)
    weaknesses.push("Poor waste management practices");

  if ((data.renewable_energy_percent || 0) < 20)
    weaknesses.push("Low utilization of renewable energy sources");

  if ((data.wage_fairness || 0) < 0.3)
    weaknesses.push("Concerning wage fairness practices");

  if ((data.human_rights_index || 0) < 0.3)
    weaknesses.push("Human rights compliance issues identified");

  if ((data.diversity_inclusion_score || 0) < 0.3)
    weaknesses.push("Limited diversity and inclusion initiatives");

  if ((data.transparency_score || 0) < 0.3)
    weaknesses.push("Lack of corporate transparency");

  if ((data.corruption_risk || 0) > 0.7)
    weaknesses.push("High corruption risk identified");

  if ((data.ethics_program || 0) < 0.3)
    weaknesses.push("Inadequate ethics program implementation");

  if ((data.delivery_efficiency || 0) < 0.3)
    weaknesses.push("Inefficient delivery systems");

  if ((data.quality_control_score || 0) < 0.3)
    weaknesses.push("Deficient quality control processes");

  // If we don't have enough weaknesses, add some generic ones
  if (weaknesses.length < 2) {
    weaknesses.push(
      "Limited documentation of sustainability practices",
      "Potential challenges with supply chain visibility",
      "Opportunity to enhance stakeholder engagement"
    );
  }

  return weaknesses;
}

function generateOpportunities(): string[] {
  return [
    "Carbon neutrality certification potential",
    "Industry leadership in sustainable practices",
    "Partnership with NGOs on social projects",
    "Vertical integration with ethical suppliers",
    "Development of circular economy initiatives",
    "First-mover advantage in emerging markets",
    "Consider joint training programs on ethical practices",
  ];
}

function generateMockRecommendation(data: SupplierEvaluation): string {
  const score = data.ethical_score || 50;

  if (score > 80) {
    return `${data.name} is performing exceptionally well in ethical and sustainability metrics. Consider strengthening partnership and exploring collaborative sustainability initiatives.`;
  } else if (score > 60) {
    return `${data.name} shows good potential with moderate ethical scores. Focus on specific improvements in environmental and governance areas to enhance overall performance.`;
  } else {
    return `${data.name} requires closer monitoring due to below-average ethical scores. Recommend implementing a structured improvement plan focusing on key sustainability metrics.`;
  }
}

function generateMockSuggestions(data: SupplierEvaluation): string[] {
  const score = data.ethical_score || 50;

  if (score > 80) {
    return [
      "Highlight this supplier as a best practice model for others",
      "Consider joint sustainability marketing initiatives",
      "Explore expanding relationship to additional product lines",
    ];
  } else if (score > 60) {
    return [
      "Schedule quarterly sustainability review meetings",
      "Provide resources for improving carbon footprint",
      "Consider joint training programs on ethical practices",
    ];
  } else {
    return [
      "Implement sustainable sourcing policy for key materials",
      "Establish carbon offset program for emissions",
      "Conduct third-party audit of labor practices",
      "Improve transparency in governance structure",
      "Enhance supplier diversity program effectiveness",
      "Develop more robust environmental management system",
      "Improve water usage efficiency in manufacturing",
      "Update human rights policy and training",
      "Strengthen anti-corruption compliance measures",
      "Improve waste reduction and recycling initiatives",
      "Explore expanding relationship to additional product lines",
    ];
  }
}

function generateThreats(data: SupplierEvaluation): string[] {
  const threats = [];

  if ((data.geopolitical_risk || 0) > 0.5)
    threats.push("Exposure to geopolitical instability in operating regions");

  if ((data.climate_risk || 0) > 0.5)
    threats.push("Vulnerability to climate change impacts on operations");

  if ((data.labor_dispute_risk || 0) > 0.5)
    threats.push("Potential labor disputes affecting production continuity");

  // Add generic threats if needed
  if (threats.length < 2) {
    threats.push(
      "Changing regulations in key operating regions",
      "Increased stakeholder scrutiny on ethics",
      "Supply chain disruption risks",
      "Rising costs of sustainable materials",
      "Negative public perception if improvement not shown",
      "Loss of customers to more ethical competitors",
      "Consider alternative suppliers while monitoring improvements"
    );
  }

  return threats.slice(0, 3);
}

// Define a more specific type for risk factors
interface RiskFactor {
  factor: string;
  severity: string;
  probability: string;
  mitigation: string;
}

function generateRiskFactors(data: SupplierEvaluation): RiskFactor[] {
  const riskFactors: RiskFactor[] = [];

  // Environmental risks
  if ((data.co2_emissions || 50) > 70) {
    riskFactors.push({
      factor: "Carbon Emissions Compliance",
      severity: "High",
      probability: "Medium",
      mitigation: "Implement emissions reduction program with strict targets",
    });
  }

  // Social risks
  if ((data.human_rights_index || 0.5) < 0.4) {
    riskFactors.push({
      factor: "Human Rights Violations",
      severity: "High",
      probability: "Medium",
      mitigation: "Develop comprehensive human rights due diligence process",
    });
  }

  // Governance risks
  if ((data.corruption_risk || 0.5) > 0.6) {
    riskFactors.push({
      factor: "Corruption and Bribery",
      severity: "High",
      probability: "Medium",
      mitigation:
        "Strengthen anti-corruption policies and whistleblower protection",
    });
  }

  // Supply chain risks
  if ((data.traceability || 0.5) < 0.4) {
    riskFactors.push({
      factor: "Supply Chain Opacity",
      severity: "Medium",
      probability: "High",
      mitigation: "Implement blockchain-based supply chain tracking",
    });
  }

  // Add generic risk factor if needed
  if (riskFactors.length < 2) {
    riskFactors.push({
      factor: "Regulatory Compliance",
      severity: "Medium",
      probability: "Medium",
      mitigation: "Establish regulatory intelligence system to track changes",
    });
  }

  return riskFactors;
}

function generateStandardsMet(data: SupplierEvaluation): string[] {
  const standards = [];

  // Environmental standards
  if (calculateEnvironmentalScore(data) > 0.6) {
    standards.push("ISO 14001 Environmental Management");
  }

  // Social standards
  if (calculateSocialScore(data) > 0.6) {
    standards.push("SA8000 Social Accountability");
  }

  // Governance standards
  if (calculateGovernanceScore(data) > 0.6) {
    standards.push("ISO 37001 Anti-Bribery Management");
  }

  // Generic standards
  standards.push("UN Global Compact Principles");

  return standards;
}

function generateCertifications(data: SupplierEvaluation): string[] {
  const certifications = [];

  // Based on environmental performance
  if ((data.renewable_energy_percent || 0) > 50) {
    certifications.push("Green Energy Certification");
  }

  // Based on social performance
  if ((data.wage_fairness || 0.5) > 0.7) {
    certifications.push("Fair Labor Association Certification");
  }

  // Generic certifications
  if (certifications.length < 2) {
    certifications.push("ISO 9001 Quality Management");
  }

  return certifications;
}

function generateComplianceGaps(data: SupplierEvaluation): string[] {
  const gaps = [];

  if ((data.co2_emissions || 50) > 60) {
    gaps.push("Carbon emissions reduction targets not met");
  }

  if ((data.water_usage || 50) > 60) {
    gaps.push("Water conservation requirements not fulfilled");
  }

  if ((data.worker_safety || 0.5) < 0.5) {
    gaps.push("Worker safety protocols below industry standards");
  }

  if ((data.transparency_score || 0.5) < 0.5) {
    gaps.push("Insufficient disclosure of supply chain information");
  }

  return gaps.slice(0, 3);
}

export const getRecommendations = async () => {
  try {
    console.log("Fetching AI-powered recommendations from API...");
    const response = await fetch(`${API_BASE_URL}/suppliers/recommendations/`);

    if (!response.ok) {
      console.warn(
        `Recommendations API returned status ${response.status}. Using AI-simulated data.`
      );
      // Return enhanced mock suppliers with AI recommendations if the endpoint is not available
      return mockSuppliers
        .sort((a, b) => (b.ethical_score || 0) - (a.ethical_score || 0))
        .map((supplier) => {
          // Create a partial SupplierEvaluation from Supplier data
          const supplierEval: SupplierEvaluation = {
            name: supplier.name,
            country: supplier.country,
            industry: supplier.industry || "Unknown",
            ethical_score: supplier.ethical_score || 50,
            co2_emissions: supplier.co2_emissions,
            water_usage: 0,
            energy_efficiency: 0,
            waste_management_score: supplier.waste_management_score,
            renewable_energy_percent: 0,
            pollution_control: 0,
            wage_fairness: supplier.wage_fairness,
            human_rights_index: supplier.human_rights_index,
            diversity_inclusion_score: 0,
            community_engagement: 0,
            worker_safety: 0,
            transparency_score: 0,
            corruption_risk: 0,
            board_diversity: 0,
            ethics_program: 0,
            compliance_systems: 0,
            delivery_efficiency: supplier.delivery_efficiency,
            quality_control_score: 0,
            supplier_diversity: 0,
            traceability: 0,
            geopolitical_risk: 0,
            climate_risk: 0,
            labor_dispute_risk: 0,
          };

          // Calculate main scores to determine primary focus area
          const environmentalScore = calculateEnvironmentalScore(supplierEval);
          const socialScore = calculateSocialScore(supplierEval);
          const governanceScore = calculateGovernanceScore(supplierEval);
          const supplyChainScore = calculateSupplyChainScore(supplierEval);

          // Determine the primary category based on the lowest score
          const scores = [
            { category: "Environmental", score: environmentalScore },
            { category: "Social", score: socialScore },
            { category: "Governance", score: governanceScore },
            { category: "Supply Chain", score: supplyChainScore },
          ];
          scores.sort((a, b) => a.score - b.score);
          const primaryCategory = scores[0].category;

          // Determine urgency based on how low the score is
          let urgency = "Medium";
          if (scores[0].score < 0.4) urgency = "High";
          else if (scores[0].score > 0.7) urgency = "Low";

          // Generate AI explanation with more detailed insights
          const generatedAiExplanation = {
            reasoning:
              generateActionItems(supplierEval, primaryCategory)?.[0] ||
              `Low score in ${primaryCategory}.`,
            impact_assessment: `Improving ${primaryCategory} score could enhance overall rating.`,
            implementation_difficulty: urgency === "High" ? "Medium" : "Low",
            timeframe: urgency === "High" ? "3-6 months" : "1-3 months",
            comparative_insights:
              generateComparativeInsights(supplierEval, primaryCategory) || [],
            primary_category: primaryCategory,
            urgency: urgency,
            key_strengths: generateStrengths(supplierEval),
            percentile_insights: generatePercentileInsights(
              supplierEval,
              primaryCategory
            ),
            action_items: generateActionItems(supplierEval, primaryCategory),
          };

          // Construct the mock Recommendation object matching the frontend interface
          return {
            _id: `mock-${supplier.id}`,
            title: `Improve ${primaryCategory} for ${supplier.name}`,
            description: generatedAiExplanation.reasoning,
            category: primaryCategory,
            priority: urgency,
            status: "pending", // <-- Added missing status field
            created_at: supplier.created_at,
            updated_at: supplier.updated_at,
            supplier: {
              // Ensure nested supplier object matches frontend type
              name: supplier.name,
              country: supplier.country,
              industry: supplier.industry || "Unknown",
              ethical_score: supplier.ethical_score || 0,
            },
            ai_explanation: generatedAiExplanation, // Use the constructed explanation object
            estimated_impact: {
              // Add mock estimated impact
              score_improvement: Math.floor(Math.random() * 5) + 1,
              cost_savings: Math.floor(Math.random() * 10000) + 5000,
              implementation_time: urgency === "High" ? 180 : 90,
            },
            isMockData: true,
          };
        });
    }

    const data = await response.json();
    console.log("AI Recommendations API response:", data);

    // Handle paginated response (Django REST Framework format)
    if (data && typeof data === "object") {
      // Check if the response has a 'results' field (paginated response)
      if (data.results && Array.isArray(data.results)) {
        console.log(
          "Using paginated API results for AI recommendations:",
          data.results
        );
        if (data.results.length > 0) {
          return data.results;
        }
      }

      // Handle non-paginated response
      if (Array.isArray(data) && data.length > 0) {
        console.log("Using non-paginated API results for AI recommendations");
        return data;
      }
    }

    // Return enhanced mock data if we couldn't get valid data from the API
    console.warn(
      "API returned empty recommendation data. Using AI-simulated data."
    );
    return mockSuppliers
      .sort((a, b) => (b.ethical_score || 0) - (a.ethical_score || 0))
      .map((supplier) => {
        // Create a partial SupplierEvaluation from Supplier data
        const supplierEval: SupplierEvaluation = {
          name: supplier.name,
          country: supplier.country,
          industry: supplier.industry || "Unknown",
          ethical_score: supplier.ethical_score || 50,
          co2_emissions: supplier.co2_emissions,
          water_usage: 0,
          energy_efficiency: 0,
          waste_management_score: supplier.waste_management_score,
          renewable_energy_percent: 0,
          pollution_control: 0,
          wage_fairness: supplier.wage_fairness,
          human_rights_index: supplier.human_rights_index,
          diversity_inclusion_score: 0,
          community_engagement: 0,
          worker_safety: 0,
          transparency_score: 0,
          corruption_risk: 0,
          board_diversity: 0,
          ethics_program: 0,
          compliance_systems: 0,
          delivery_efficiency: supplier.delivery_efficiency,
          quality_control_score: 0,
          supplier_diversity: 0,
          traceability: 0,
          geopolitical_risk: 0,
          climate_risk: 0,
          labor_dispute_risk: 0,
        };

        // Calculate main scores to determine primary focus area
        const environmentalScore = calculateEnvironmentalScore(supplierEval);
        const socialScore = calculateSocialScore(supplierEval);
        const governanceScore = calculateGovernanceScore(supplierEval);
        const supplyChainScore = calculateSupplyChainScore(supplierEval);

        // Determine the primary category based on the lowest score
        const scores = [
          { category: "Environmental", score: environmentalScore },
          { category: "Social", score: socialScore },
          { category: "Governance", score: governanceScore },
          { category: "Supply Chain", score: supplyChainScore },
        ];
        scores.sort((a, b) => a.score - b.score);
        const primaryCategory = scores[0].category;

        // Determine urgency based on how low the score is
        let urgency = "Medium";
        if (scores[0].score < 0.4) urgency = "High";
        else if (scores[0].score > 0.7) urgency = "Low";

        // Generate AI explanation with more detailed insights
        const generatedAiExplanation = {
          reasoning:
            generateActionItems(supplierEval, primaryCategory)?.[0] ||
            `Low score in ${primaryCategory}.`,
          impact_assessment: `Improving ${primaryCategory} score could enhance overall rating.`,
          implementation_difficulty: urgency === "High" ? "Medium" : "Low",
          timeframe: urgency === "High" ? "3-6 months" : "1-3 months",
          comparative_insights:
            generateComparativeInsights(supplierEval, primaryCategory) || [],
          primary_category: primaryCategory,
          urgency: urgency,
          key_strengths: generateStrengths(supplierEval),
          percentile_insights: generatePercentileInsights(
            supplierEval,
            primaryCategory
          ),
          action_items: generateActionItems(supplierEval, primaryCategory),
        };

        // Construct the mock Recommendation object matching the frontend interface
        return {
          _id: `mock-${supplier.id}`,
          title: `Improve ${primaryCategory} for ${supplier.name}`,
          description: generatedAiExplanation.reasoning,
          category: primaryCategory,
          priority: urgency,
          status: "pending", // <-- Added missing status field
          created_at: supplier.created_at,
          updated_at: supplier.updated_at,
          supplier: {
            // Ensure nested supplier object matches frontend type
            name: supplier.name,
            country: supplier.country,
            industry: supplier.industry || "Unknown",
            ethical_score: supplier.ethical_score || 0,
          },
          ai_explanation: generatedAiExplanation, // Use the constructed explanation object
          estimated_impact: {
            // Add mock estimated impact
            score_improvement: Math.floor(Math.random() * 5) + 1,
            cost_savings: Math.floor(Math.random() * 10000) + 5000,
            implementation_time: urgency === "High" ? 180 : 90,
          },
          isMockData: true,
        };
      });
  } catch (error) {
    console.error("Error fetching AI recommendations:", error);
    // Return enhanced mock suppliers in case of error
    return mockSuppliers
      .sort((a, b) => (b.ethical_score || 0) - (a.ethical_score || 0))
      .map((supplier) => {
        // Create a partial SupplierEvaluation from Supplier data
        const supplierEval: SupplierEvaluation = {
          name: supplier.name,
          country: supplier.country,
          industry: supplier.industry || "Unknown",
          ethical_score: supplier.ethical_score || 50,
          co2_emissions: supplier.co2_emissions,
          water_usage: 0,
          energy_efficiency: 0,
          waste_management_score: supplier.waste_management_score,
          renewable_energy_percent: 0,
          pollution_control: 0,
          wage_fairness: supplier.wage_fairness,
          human_rights_index: supplier.human_rights_index,
          diversity_inclusion_score: 0,
          community_engagement: 0,
          worker_safety: 0,
          transparency_score: 0,
          corruption_risk: 0,
          board_diversity: 0,
          ethics_program: 0,
          compliance_systems: 0,
          delivery_efficiency: supplier.delivery_efficiency,
          quality_control_score: 0,
          supplier_diversity: 0,
          traceability: 0,
          geopolitical_risk: 0,
          climate_risk: 0,
          labor_dispute_risk: 0,
        };

        // Calculate main scores to determine primary focus area
        const environmentalScore = calculateEnvironmentalScore(supplierEval);
        const socialScore = calculateSocialScore(supplierEval);
        const governanceScore = calculateGovernanceScore(supplierEval);
        const supplyChainScore = calculateSupplyChainScore(supplierEval);

        // Determine the primary category based on the lowest score
        const scores = [
          { category: "Environmental", score: environmentalScore },
          { category: "Social", score: socialScore },
          { category: "Governance", score: governanceScore },
          { category: "Supply Chain", score: supplyChainScore },
        ];
        scores.sort((a, b) => a.score - b.score);
        const primaryCategory = scores[0].category;

        // Determine urgency based on how low the score is
        let urgency = "Medium";
        if (scores[0].score < 0.4) urgency = "High";
        else if (scores[0].score > 0.7) urgency = "Low";

        // Generate AI explanation with more detailed insights
        const generatedAiExplanation = {
          reasoning:
            generateActionItems(supplierEval, primaryCategory)?.[0] ||
            `Low score in ${primaryCategory}.`,
          impact_assessment: `Improving ${primaryCategory} score could enhance overall rating.`,
          implementation_difficulty: urgency === "High" ? "Medium" : "Low",
          timeframe: urgency === "High" ? "3-6 months" : "1-3 months",
          comparative_insights:
            generateComparativeInsights(supplierEval, primaryCategory) || [],
          primary_category: primaryCategory,
          urgency: urgency,
          key_strengths: generateStrengths(supplierEval),
          percentile_insights: generatePercentileInsights(
            supplierEval,
            primaryCategory
          ),
          action_items: generateActionItems(supplierEval, primaryCategory),
        };

        // Construct the mock Recommendation object matching the frontend interface
        return {
          _id: `mock-${supplier.id}`,
          title: `Improve ${primaryCategory} for ${supplier.name}`,
          description: generatedAiExplanation.reasoning,
          category: primaryCategory,
          priority: urgency,
          status: "pending", // <-- Added missing status field
          created_at: supplier.created_at,
          updated_at: supplier.updated_at,
          supplier: {
            // Ensure nested supplier object matches frontend type
            name: supplier.name,
            country: supplier.country,
            industry: supplier.industry || "Unknown",
            ethical_score: supplier.ethical_score || 0,
          },
          ai_explanation: generatedAiExplanation, // Use the constructed explanation object
          estimated_impact: {
            // Add mock estimated impact
            score_improvement: Math.floor(Math.random() * 5) + 1,
            cost_savings: Math.floor(Math.random() * 10000) + 5000,
            implementation_time: urgency === "High" ? 180 : 90,
          },
          isMockData: true,
        };
      });
  }
};

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await fetch(getEndpoint("dashboard"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      console.warn(
        `Dashboard API returned status ${response.status}. Using mock data.`
      );
      return getMockDashboardData();
    }

    const data = await response.json();
    console.log("Dashboard API response:", data);
    const normalized = normalizeDashboardPayload(data);

    return {
      ...normalized,
      isMockData: false,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return mock data in case of error
    return getMockDashboardData();
  }
};

const normalizeDashboardPayload = (payload: any): any => {
  if (!payload || typeof payload !== "object") return payload;

  const normalised = { ...payload };

  normalised.totalSuppliers ??= normalised.total_suppliers;
  normalised.avgEthicalScore ??= normalised.avg_ethical_score;
  normalised.avgCo2Emissions ??= normalised.avg_co2_emissions;
  normalised.avgCompositeScore ??=
    normalised.avg_composite_score ?? normalised.avgEthicalScore;
  normalised.avgRiskFactor ??= normalised.avg_risk_factor;
  normalised.avgCompletenessRatio ??= normalised.avg_completeness_ratio;
  normalised.suppliersByCountry ??= normalised.suppliers_by_country;
  normalised.ethicalScoreDistribution ??=
    normalised.ethical_score_distribution;
  normalised.co2EmissionsByIndustry ??=
    normalised.co2_emissions_by_industry;
  normalised.waterUsageTrend ??= normalised.water_usage_trend;
  normalised.renewableEnergyMix ??=
    normalised.renewable_energy_mix ?? normalised.renewable_energy_adoption;
  normalised.sustainablePractices ??= normalised.sustainable_practices;
  normalised.sustainabilityPerformance ??=
    normalised.sustainability_performance;
  normalised.recentSuppliers ??= normalised.recent_suppliers;
  normalised.industryDistribution ??= normalised.industry_distribution;
  normalised.complianceRateTrend ??= normalised.compliance_rate_trend;
  normalised.pillarAverages ??= normalised.pillar_averages;
  normalised.completenessDistribution ??=
    normalised.completeness_distribution;

  if (normalised.recentSuppliers) {
    normalised.recentSuppliers = normalised.recentSuppliers.map((item: any) => ({
      ...item,
      updated_at: item.updated_at ?? item.date,
    }));
  }

  const rawRiskBreakdown =
    normalised.riskBreakdown ?? normalised.risk_breakdown ?? {};
  const riskBreakdown: Record<string, number> = {};
  Object.entries(rawRiskBreakdown).forEach(([key, value]) => {
    const normalKey = key.toLowerCase().replace(/\s+/g, "");
    if (normalKey.includes("low")) riskBreakdown.low = Number(value);
    else if (normalKey.includes("medium"))
      riskBreakdown.medium = Number(value);
    else if (normalKey.includes("high") && !normalKey.includes("critical"))
      riskBreakdown.high = Number(value);
    else if (normalKey.includes("critical"))
      riskBreakdown.critical = Number(value);
  });
  normalised.riskBreakdown = riskBreakdown;

  return normalised;
};

// Mock dashboard data
const getMockDashboardData = (): DashboardData => {
  console.log("Using mock dashboard data");
  return {
    total_suppliers: 12,
    avg_ethical_score: 75.3,
    avg_composite_score: 82.4,
    avg_risk_factor: 0.22,
    avg_completeness_ratio: 0.84,
    avg_co2_emissions: 23.9,
    suppliers_by_country: {
      "United States": 4,
      "United Kingdom": 1,
      Taiwan: 1,
      "South Korea": 1,
      Switzerland: 1,
      "Hong Kong": 1,
      France: 1,
      China: 1,
    },
    ethical_score_distribution: [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 2 },
      { range: "41-60", count: 2 },
      { range: "61-80", count: 5 },
      { range: "81-100", count: 3 },
    ],
    co2_emissions_by_industry: [
      { name: "Food & Beverage", value: 128.7 },
      { name: "Electronics", value: 20.4 },
      { name: "Consumer Goods", value: 4.3 },
      { name: "Apparel", value: 2.5 },
      { name: "Home Appliances", value: 18.5 },
    ],
    risk_breakdown: {
      low: 5,
      medium: 4,
      high: 2,
      critical: 1,
    },
    completeness_distribution: {
      high: 7,
      medium: 3,
      low: 2,
    },
    pillar_averages: {
      environmental: 78,
      social: 73,
      governance: 80,
    },
    water_usage_trend: [
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
    ],
    renewable_energy_adoption: [
      { name: "Solar", value: 38 },
      { name: "Wind", value: 27 },
      { name: "Hydro", value: 12 },
      { name: "Biomass", value: 6 },
      { name: "Traditional", value: 17 },
    ],
    sustainable_practices: [
      { practice: "Recycling", adoption: 92, target: 95 },
      { practice: "Emissions Reduction", adoption: 68, target: 80 },
      { practice: "Water Conservation", adoption: 76, target: 85 },
      { practice: "Renewable Energy", adoption: 83, target: 90 },
      { practice: "Zero Waste", adoption: 54, target: 75 },
    ],
    sustainability_metrics: [
      { metric: "Carbon Footprint", current: 82, industry: 68 },
      { metric: "Water Usage", current: 76, industry: 62 },
      { metric: "Waste Reduction", current: 91, industry: 59 },
      { metric: "Energy Efficiency", current: 84, industry: 71 },
      { metric: "Social Impact", current: 70, industry: 58 },
    ],
    recent_suppliers: [
      {
        id: 1,
        name: "TechGlobal Inc.",
        country: "United States",
        ethical_score: 82,
        composite_score: 88,
        risk_level: "low",
        risk_factor: 0.18,
        completeness_ratio: 0.9,
        updated_at: "2025-04-01T08:30:00Z",
      },
      {
        id: 2,
        name: "EcoFabrics Ltd.",
        country: "United Kingdom",
        ethical_score: 78,
        composite_score: 84,
        risk_level: "medium",
        risk_factor: 0.25,
        completeness_ratio: 0.82,
        updated_at: "2025-03-28T10:15:00Z",
      },
      {
        id: 3,
        name: "GreenSource Materials",
        country: "Germany",
        ethical_score: 91,
        composite_score: 95,
        risk_level: "low",
        risk_factor: 0.12,
        completeness_ratio: 0.95,
        updated_at: "2025-03-25T14:45:00Z",
      },
      {
        id: 4,
        name: "Pacific Components",
        country: "Taiwan",
        ethical_score: 65,
        composite_score: 72,
        risk_level: "high",
        risk_factor: 0.36,
        completeness_ratio: 0.68,
        updated_at: "2025-03-22T09:20:00Z",
      },
      {
        id: 5,
        name: "Global Foods Co.",
        country: "France",
        ethical_score: 73,
        composite_score: 79,
        risk_level: "medium",
        risk_factor: 0.28,
        completeness_ratio: 0.88,
        updated_at: "2025-03-20T11:05:00Z",
      },
    ],
    industry_distribution: {
      Electronics: 4,
      "Consumer Goods": 3,
      "Food & Beverage": 2,
      Apparel: 2,
      Automotive: 1,
    },
    compliance_rate_trend: [
      { month: "Jan", rate: 63 },
      { month: "Feb", rate: 67 },
      { month: "Mar", rate: 68 },
      { month: "Apr", rate: 72 },
      { month: "May", rate: 74 },
      { month: "Jun", rate: 69 },
      { month: "Jul", rate: 73 },
      { month: "Aug", rate: 75 },
      { month: "Sep", rate: 78 },
      { month: "Oct", rate: 82 },
      { month: "Nov", rate: 86 },
      { month: "Dec", rate: 90 },
    ],
    isMockData: true,
  };
}; 

export const getDetailedAnalysis = async (
  supplierId: number
): Promise<DetailedAnalysis> => {
  try {
    const response = await fetch(
      getEndpoint(`suppliers/${supplierId}/analytics`),
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

    if (!response.ok) {
      console.warn(
        `Detailed analysis API returned status ${response.status}. Using mock data.`
      );
      return getMockDetailedAnalysis(supplierId);
    }

    const data = await response.json();
    console.log("Detailed analysis API response:", data);
    return data;
  } catch (error) {
    console.error(
      `Error fetching detailed analysis for supplier ${supplierId}:`,
      error
    );
    // Fallback to mock data
    return getMockDetailedAnalysis(supplierId);
  }
};

export const simulateChanges = async (
  supplierId: number,
  changes: Record<string, number>
): Promise<Record<string, any>> => {
  try {
    const response = await fetch(
      getEndpoint(`suppliers/${supplierId}/simulate`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes }),
        credentials: "include",
      }
    );

    if (!response.ok) {
      console.warn(
        `Simulation API returned status ${response.status}. Using mock data.`
      );
      return getMockSimulationResult(supplierId, changes);
    }

    const data = await response.json();
    console.log("Simulation API response:", data);
    return data;
  } catch (error) {
    console.error(
      `Error simulating changes for supplier ${supplierId}:`,
      error
    );
    // Fallback to mock data
    return getMockSimulationResult(supplierId, changes);
  }
};

// Mock data generators for the new endpoints
function getMockDetailedAnalysis(supplierId: number): DetailedAnalysis {
  const supplier =
    mockSuppliers.find((s) => s.id === supplierId) || mockSuppliers[0];
  const score = supplier.ethical_score || 75;

  return {
    id: supplier.id,
    name: supplier.name,
    country: supplier.country,
    industry: "Manufacturing",
    scores: {
      overall: score,
      environmental: score - 5 + Math.random() * 10,
      social: score - 5 + Math.random() * 10,
      governance: score - 5 + Math.random() * 10,
      risk_level:
        score > 80
          ? "low"
          : score > 60
          ? "medium"
          : score > 40
          ? "high"
          : "critical",
    },
    industry_benchmarks: {
      avg_ethical_score: 72.5,
      avg_environmental_score: 68.2,
      avg_social_score: 71.8,
      avg_governance_score: 74.3,
      best_ethical_score: 91.2,
      worst_ethical_score: 48.7,
    },
    percentiles: {
      overall: 65,
      environmental: 58,
      social: 72,
      governance: 61,
    },
    recommendations: [
      {
        action:
          "Reduce carbon emissions by implementing energy efficiency measures",
        impact: "high",
        difficulty: "medium",
        timeframe: "long-term",
        details:
          "Current emissions are at 35.2. Aim to reduce by 15% over the next year.",
      },
      {
        action: "Implement water conservation and recycling systems",
        impact: "medium",
        difficulty: "medium",
        timeframe: "medium-term",
        details:
          "Current water usage is at 42.3. Aim to reduce by 20% within 6 months.",
      },
      {
        action: "Invest in renewable energy sources and efficiency upgrades",
        impact: "high",
        difficulty: "high",
        timeframe: "long-term",
        details: "Current efficiency score is 62.5%. Target 25% improvement.",
      },
    ],
    improvement_scenarios: [
      {
        name: "Environmental Focus",
        description: "Improve environmental metrics by 20%",
        changes: {
          co2_emissions: supplier.co2_emissions * 0.8,
          waste_management_score: supplier.waste_management_score * 1.2,
        },
        impact: {
          current_scores: {
            overall_score: score,
            environmental_score: score - 5 + Math.random() * 10,
            social_score: score - 5 + Math.random() * 10,
            governance_score: score - 5 + Math.random() * 10,
          },
          predicted_scores: {
            overall_score: score + 8.5,
            environmental_score: score - 5 + Math.random() * 10 + 15.2,
            social_score: score - 5 + Math.random() * 10,
            governance_score: score - 5 + Math.random() * 10,
          },
          improvements: {
            overall_score: 11.3,
            environmental_score: 22.4,
            social_score: 0,
            governance_score: 0,
          },
        },
      },
      {
        name: "Social Responsibility Focus",
        description: "Improve social metrics by 20%",
        changes: {
          wage_fairness: supplier.wage_fairness * 1.2,
          human_rights_index: supplier.human_rights_index * 1.2,
        },
        impact: {
          current_scores: {
            overall_score: score,
            environmental_score: score - 5 + Math.random() * 10,
            social_score: score - 5 + Math.random() * 10,
            governance_score: score - 5 + Math.random() * 10,
          },
          predicted_scores: {
            overall_score: score + 7.2,
            environmental_score: score - 5 + Math.random() * 10,
            social_score: score - 5 + Math.random() * 10 + 18.5,
            governance_score: score - 5 + Math.random() * 10,
          },
          improvements: {
            overall_score: 9.6,
            environmental_score: 0,
            social_score: 25.8,
            governance_score: 0,
          },
        },
      },
    ],
    isMockData: true,
  };
}

function getMockSimulationResult(
  supplierId: number,
  changes: Record<string, number>
): Record<string, any> {
  const supplier =
    mockSuppliers.find((s) => s.id === supplierId) || mockSuppliers[0];
  const currentScore = supplier.ethical_score || 75;

  // Calculate a simple impact based on changes
  let improvement = 0;
  if (changes.co2_emissions && changes.co2_emissions < supplier.co2_emissions) {
    improvement += 3;
  }
  if (changes.wage_fairness && changes.wage_fairness > supplier.wage_fairness) {
    improvement += 3;
  }
  if (
    changes.human_rights_index &&
    changes.human_rights_index > supplier.human_rights_index
  ) {
    improvement += 3;
  }
  if (
    changes.waste_management_score &&
    changes.waste_management_score > supplier.waste_management_score
  ) {
    improvement += 3;
  }

  const newScore = Math.min(100, currentScore + improvement);
  const percentChange = ((newScore - currentScore) / currentScore) * 100;

  return {
    current_scores: {
      overall_score: currentScore,
      environmental_score: currentScore - 5 + Math.random() * 10,
      social_score: currentScore - 5 + Math.random() * 10,
      governance_score: currentScore - 5 + Math.random() * 10,
    },
    predicted_scores: {
      overall_score: newScore,
      environmental_score:
        currentScore -
        5 +
        Math.random() * 10 +
        (changes.co2_emissions ? 5 : 0) +
        (changes.waste_management_score ? 5 : 0),
      social_score:
        currentScore -
        5 +
        Math.random() * 10 +
        (changes.wage_fairness ? 5 : 0) +
        (changes.human_rights_index ? 5 : 0),
      governance_score: currentScore - 5 + Math.random() * 10,
    },
    improvements: {
      overall_score: percentChange.toFixed(2),
      environmental_score:
        changes.co2_emissions || changes.waste_management_score
          ? (5 + Math.random() * 5).toFixed(2)
          : "0.00",
      social_score:
        changes.wage_fairness || changes.human_rights_index
          ? (5 + Math.random() * 5).toFixed(2)
          : "0.00",
      governance_score: "0.00",
    },
  };
}

// Add this new function to handle adding suppliers
export const addSupplier = async (
  supplierData: Record<string, any>
): Promise<Supplier> => {
  try {
    const response = await fetch(getEndpoint("suppliers"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplierData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "API error when adding supplier:",
        response.status,
        errorText
      );

      if (response.status === 404) {
        console.warn(
          "Add supplier API endpoint not available. Creating mock supplier."
        );
        // Create a mock supplier with a new ID higher than existing mock suppliers
        const newId = Math.max(...mockSuppliers.map((s) => s.id)) + 1;
        const mockSupplier: Supplier = {
          id: newId,
          name: supplierData.name,
          country: supplierData.country,
          industry: supplierData.industry || "Manufacturing",
          co2_emissions: supplierData.co2_emissions || 50,
          delivery_efficiency: supplierData.delivery_efficiency || 0.5,
          wage_fairness: supplierData.wage_fairness || 0.5,
          human_rights_index: supplierData.human_rights_index || 0.5,
          waste_management_score: supplierData.waste_management_score || 0.5,
          ethical_score: calculateMockEthicalScore(supplierData),
          environmental_score: calculateMockEnvironmentalScore(supplierData),
          social_score: calculateMockSocialScore(supplierData),
          governance_score: calculateMockGovernanceScore(supplierData),
          risk_level: calculateMockRiskLevel(supplierData),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isMockData: true,
        };

        // Add this new supplier to the mockSuppliers array so it will show up in future getSuppliers calls
        mockSuppliers.push(mockSupplier);
        return mockSupplier;
      }

      throw new Error(
        `Failed to add supplier: ${response.status} ${errorText}`
      );
    }

    // Process the real API response
    const data = await response.json();
    console.log("Add supplier API response:", data);
    return data;
  } catch (error) {
    console.error("Error in addSupplier:", error);

    // If the error is related to the API not being available, create a mock supplier
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string" &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError"))
    ) {
      console.warn(
        "Add supplier API endpoint not available. Creating mock supplier."
      );
      // Create a mock supplier with a new ID
      const newId = Math.max(...mockSuppliers.map((s) => s.id)) + 1;
      const mockSupplier: Supplier = {
        id: newId,
        name: supplierData.name,
        country: supplierData.country,
        industry: supplierData.industry || "Manufacturing",
        co2_emissions: supplierData.co2_emissions || 50,
        delivery_efficiency: supplierData.delivery_efficiency || 0.5,
        wage_fairness: supplierData.wage_fairness || 0.5,
        human_rights_index: supplierData.human_rights_index || 0.5,
        waste_management_score: supplierData.waste_management_score || 0.5,
        ethical_score: calculateMockEthicalScore(supplierData),
        environmental_score: calculateMockEnvironmentalScore(supplierData),
        social_score: calculateMockSocialScore(supplierData),
        governance_score: calculateMockGovernanceScore(supplierData),
        risk_level: calculateMockRiskLevel(supplierData),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isMockData: true,
      };

      // Add this new supplier to the mockSuppliers array
      mockSuppliers.push(mockSupplier);
      return mockSupplier;
    }

    throw error;
  }
};

// Helper functions for mock supplier creation
const calculateMockEthicalScore = (data: Record<string, any>): number => {
  // Simple algorithm to calculate a mock ethical score based on input data
  const scores = [
    data.co2_emissions ? Math.max(0, 100 - data.co2_emissions) / 100 : 0.5,
    data.delivery_efficiency || 0.5,
    data.wage_fairness || 0.5,
    data.human_rights_index || 0.5,
    data.waste_management_score || 0.5,
    data.energy_efficiency || 0.5,
    data.diversity_inclusion_score || 0.5,
    data.transparency_score || 0.5,
    1 - (data.corruption_risk || 0.5),
    data.quality_control_score || 0.5,
  ];

  // Average score multiplied by 100
  return (
    Math.round(
      (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100
    ) / 100
  );
};

const calculateMockEnvironmentalScore = (data: Record<string, any>): number => {
  const scores = [
    data.co2_emissions ? Math.max(0, 100 - data.co2_emissions) / 100 : 0.5,
    data.waste_management_score || 0.5,
    data.energy_efficiency || 0.5,
    data.water_usage ? Math.max(0, 100 - data.water_usage) / 100 : 0.5,
  ];

  return (
    Math.round(
      (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100
    ) / 100
  );
};

const calculateMockSocialScore = (data: Record<string, any>): number => {
  const scores = [
    data.wage_fairness || 0.5,
    data.human_rights_index || 0.5,
    data.diversity_inclusion_score || 0.5,
    data.community_engagement || 0.5,
  ];

  return (
    Math.round(
      (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100
    ) / 100
  );
};

const calculateMockGovernanceScore = (data: Record<string, any>): number => {
  const scores = [
    data.transparency_score || 0.5,
    1 - (data.corruption_risk || 0.5),
  ];

  return (
    Math.round(
      (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100
    ) / 100
  );
};

const calculateMockRiskLevel = (data: Record<string, any>): string => {
  const ethicalScore = calculateMockEthicalScore(data);
  if (ethicalScore >= 0.8) return "Low";
  if (ethicalScore >= 0.6) return "Medium";
  return "High";
};

export const getSupplierAnalytics = async (
  supplierId: number | string
): Promise<SupplierAnalyticsData> => {
  try {
    console.log(`Fetching analytics for supplier ${supplierId}...`);
    const response = await fetch(
      `${API_URL}/suppliers/${supplierId}/analytics`
    );

    if (!response.ok) {
      console.warn(
        `Analytics API returned status ${response.status}. Using mock data.`
      );
      return getMockSupplierAnalytics(Number(supplierId));
    }

    const data = await response.json();
    console.log("Supplier analytics API response:", data);

    // Check if data is empty or doesn't contain proper values
    if (
      !data ||
      !data.supplier ||
      data.supplier.ethical_score === 0 ||
      data.supplier.environmental_score === 0
    ) {
      console.warn(
        "API returned data with empty/zero values, using mock data instead"
      );
      return getMockSupplierAnalytics(Number(supplierId));
    }

    return data;
  } catch (error) {
    console.error("Error fetching supplier analytics:", error);
    return getMockSupplierAnalytics(Number(supplierId));
  }
};

// Mock data generator for supplier analytics
function getMockSupplierAnalytics(supplierId: number): SupplierAnalyticsData {
  // Create more realistic mock data based on the supplier ID
  const randomBase =
    parseInt(supplierId.toString().slice(-3)) ||
    Math.floor(Math.random() * 100);

  // Generate scores in 0-100 range
  const ethicalScore = Math.min(95, Math.max(40, 65 + (randomBase % 30)));
  const environmentalScore = Math.min(98, Math.max(35, 60 + (randomBase % 35)));
  const socialScore = Math.min(95, Math.max(45, 70 + (randomBase % 25)));
  const governanceScore = Math.min(90, Math.max(40, 65 + (randomBase % 20)));

  // Get supplier name from mock suppliers or generate one
  const supplier = mockSuppliers.find((s) => s.id === supplierId);
  const supplierName = supplier?.name || `Supplier ${supplierId}`;
  const supplierCountry =
    supplier?.country ||
    ["United States", "China", "Germany", "Japan", "India"][randomBase % 5];
  const supplierIndustry =
    supplier?.industry ||
    ["Manufacturing", "Technology", "Consumer Goods", "Energy", "Healthcare"][
      randomBase % 5
    ];

  // Risk level based on ethical score
  const riskLevel =
    ethicalScore >= 75 ? "Low" : ethicalScore >= 55 ? "Medium" : "High";

  // Generate performance projection data for 6 months
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const performanceProjection = [];

  for (let i = 0; i < 6; i++) {
    const projectionMonth = (currentMonth + i) % 12;
    const projectionYear = currentYear + Math.floor((currentMonth + i) / 12);
    const monthName = new Date(
      projectionYear,
      projectionMonth,
      1
    ).toLocaleString("default", { month: "short" });
    const yearShort = projectionYear.toString().slice(-2);

    // Generate a small improvement trend based on the current score
    const improvement = Math.min(0.5 + i * 1.2, 15); // Progressive improvement
    const projectedScore = Math.min(100, ethicalScore + improvement);

    performanceProjection.push({
      period: `${monthName} '${yearShort}`,
      projected_score: Math.round(projectedScore * 10) / 10,
    });
  }

  return {
    supplier: {
      id: supplierId,
      name: supplierName,
      country: supplierCountry,
      industry: supplierIndustry,
      ethical_score: ethicalScore,
      environmental_score: environmentalScore,
      social_score: socialScore,
      governance_score: governanceScore,
      risk_level: riskLevel,
      overall_score: ethicalScore,
    },
    industry_average: {
      ethical_score: 65,
      environmental_score: 60,
      social_score: 68,
      governance_score: 63,
    },
    peer_comparison: [
      {
        name: `${supplierIndustry} Company A`,
        country: ["United States", "France", "Sweden"][randomBase % 3],
        ethical_score: Math.min(
          95,
          Math.max(50, ethicalScore - 5 + (randomBase % 10))
        ),
      },
      {
        name: `${supplierIndustry} Company B`,
        country: ["Germany", "Japan", "Canada"][randomBase % 3],
        ethical_score: Math.min(
          95,
          Math.max(50, ethicalScore - 10 + (randomBase % 20))
        ),
      },
      {
        name: `${supplierIndustry} Company C`,
        country: ["South Korea", "United Kingdom", "Australia"][randomBase % 3],
        ethical_score: Math.min(
          95,
          Math.max(50, ethicalScore - 8 + (randomBase % 15))
        ),
      },
    ],
    risk_factors: [
      {
        factor: "Supply Chain Disruption",
        severity:
          randomBase % 3 === 0
            ? "High"
            : randomBase % 3 === 1
            ? "Medium"
            : "Low",
        probability: randomBase % 2 === 0 ? "Medium" : "Low",
        description:
          "Potential disruptions due to reliance on suppliers in regions with geopolitical instability.",
      },
      {
        factor: "Regulatory Compliance",
        severity: randomBase % 2 === 0 ? "High" : "Medium",
        probability:
          randomBase % 3 === 0
            ? "High"
            : randomBase % 3 === 1
            ? "Medium"
            : "Low",
        description:
          "Risk of non-compliance with upcoming carbon emissions regulations in key markets.",
      },
      {
        factor: "Labor Practices",
        severity: randomBase % 3 === 0 ? "Medium" : "Low",
        probability: randomBase % 2 === 0 ? "Low" : "Medium",
        description:
          "Potential issues with labor practices in certain manufacturing facilities requiring attention.",
      },
      {
        factor: "Material Sourcing",
        severity: randomBase % 2 === 0 ? "Medium" : "Low",
        probability: randomBase % 3 === 0 ? "Medium" : "Low",
        description:
          "Concerns about sustainable sourcing practices for key materials in the supply chain.",
      },
    ],
    ai_recommendations: [
      {
        area: "Environmental",
        suggestion:
          "Implement water recycling systems in manufacturing plants to reduce consumption by up to 40%.",
        impact: "High",
        difficulty: "Medium",
      },
      {
        area: "Social",
        suggestion:
          "Expand community engagement program to include educational initiatives in supplier regions.",
        impact: "Medium",
        difficulty: "Low",
      },
      {
        area: "Governance",
        suggestion:
          "Enhance board diversity and establish an independent ethics committee for improved oversight.",
        impact: "Medium",
        difficulty: "Medium",
      },
      {
        area: environmentalScore < 70 ? "Environmental" : "Supply Chain",
        suggestion:
          environmentalScore < 70
            ? "Transition to renewable energy sources for manufacturing facilities to reduce carbon footprint."
            : "Implement blockchain-based supply chain tracking to improve transparency and traceability.",
        impact: "High",
        difficulty: "High",
      },
      {
        area: socialScore < 70 ? "Social" : "Governance",
        suggestion:
          socialScore < 70
            ? "Develop comprehensive worker well-being programs including mental health support and work-life balance initiatives."
            : "Strengthen whistleblower protection policies and reporting mechanisms for ethical concerns.",
        impact: socialScore < 70 ? "Medium" : "High",
        difficulty: "Medium",
      },
    ],
    sentiment_trend: [
      { date: "2023-01", score: 0.2 - 0.5 }, // Normalized to -0.5 to 0.5 range
      { date: "2023-02", score: 0.3 - 0.5 },
      { date: "2023-03", score: 0.1 - 0.5 },
      { date: "2023-04", score: -0.1 - 0.5 },
      { date: "2023-05", score: 0.2 - 0.5 },
      { date: "2023-06", score: 0.4 - 0.5 },
      { date: "2023-07", score: 0.5 - 0.5 },
      { date: "2023-08", score: 0.6 - 0.5 },
      { date: "2023-09", score: 0.4 - 0.5 },
      { date: "2023-10", score: 0.5 - 0.5 },
      { date: "2023-11", score: 0.7 - 0.5 },
      { date: "2023-12", score: 0.8 - 0.5 },
    ],
    performance_projection: performanceProjection,
    isMockData: true,
  };
}

// ML Status Interfaces
export interface MLModelStatus {
  name: string;
  status: "training" | "ready" | "error";
  accuracy: number;
  lastUpdated: string;
  predictionCount: number;
}

export interface MLSystemStatus {
  apiHealth: boolean;
  dataIngestion: boolean;
  mlPipeline: boolean;
  lastChecked: string;
}

export interface MLStatus {
  models: MLModelStatus[];
  systemStatus: MLSystemStatus;
  isMockData?: boolean;
}

// Get Machine Learning Status from the API
export const getMLStatus = async (): Promise<MLStatus> => {
  try {
    const response = await fetch(getEndpoint("ml/status"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      console.warn(
        `ML Status API returned status ${response.status}. Using mock data.`
      );
      return getMockMLStatus();
    }

    const data = await response.json();
    console.log("ML Status API response:", data);
    return {
      ...data,
      isMockData: false,
    };
  } catch (error) {
    console.error("Error fetching ML status:", error);
    return getMockMLStatus(); // Fallback to mock
  }
};

// Helper function to get mock ML status
function getMockMLStatus(): MLStatus {
  return {
    models: [
      {
        name: "Supplier Risk Prediction",
        status: "ready",
        accuracy: 0.89,
        lastUpdated: "2 hours ago",
        predictionCount: 287,
      },
      {
        name: "ESG Score Estimation",
        status: "training",
        accuracy: 0.75,
        lastUpdated: "in progress",
        predictionCount: 143,
      },
      {
        name: "Supply Chain Disruption",
        status: "ready",
        accuracy: 0.91,
        lastUpdated: "30 minutes ago",
        predictionCount: 321,
      },
    ],
    systemStatus: {
      apiHealth: true,
      dataIngestion: true,
      mlPipeline: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    isMockData: true,
  };
}

// Export a function to check if the API is available
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(getEndpoint("health-check"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return response.ok;
  } catch (error) {
    console.error("API connection check failed:", error);
    return false;
  }
};

// Add new interfaces for supply chain graph
export interface GraphNode {
  id: string;
  name: string;
  type:
    | "supplier"
    | "manufacturer"
    | "wholesaler"
    | "rawMaterial"
    | "distributor"
    | "retailer";
  country?: string;
  ethical_score?: number;
  group?: number;
  level?: number;
  lat?: number; // Added latitude
  lng?: number; // Added longitude
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type?: string;
  strength?: number;
  ethical?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  isMockData?: boolean;
}

// Function to get supply chain graph data
export const getSupplyChainGraphData = async (): Promise<GraphData> => {
  const isConnected = await checkApiConnection();

  if (isConnected) {
    try {
      const response = await fetch(getEndpoint("supply-chain-graph"), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        console.warn(
          `Supply Chain Graph API returned status ${response.status}. Using mock data.`
        );
        return getMockSupplyChainGraphData();
      }

      const data = await response.json();

      // Ensure all nodes have lat/lng coordinates
      const countryCoords: Record<string, { lat: number; lng: number }> = {
        USA: { lat: 38.9637, lng: -95.7129 },
        China: { lat: 35.8617, lng: 104.1954 },
        Germany: { lat: 51.1657, lng: 10.4515 },
        Brazil: { lat: -14.235, lng: -51.9253 },
        India: { lat: 20.5937, lng: 78.9629 },
        Vietnam: { lat: 14.0583, lng: 108.2772 },
        Mexico: { lat: 23.6345, lng: -102.5528 },
        Canada: { lat: 56.1304, lng: -106.3468 },
        Taiwan: { lat: 23.6978, lng: 120.9605 },
        Japan: { lat: 36.2048, lng: 138.2529 },
        "South Korea": { lat: 35.9078, lng: 127.7669 },
        UK: { lat: 55.3781, lng: -3.436 },
        France: { lat: 46.6034, lng: 1.8883 },
        Australia: { lat: -25.2744, lng: 133.7751 },
        Nigeria: { lat: 9.082, lng: 8.6753 },
        // Default for unknown countries
        Unknown: { lat: 0, lng: 0 },
      };

      // Make sure each node has coordinates
      const nodesWithCoords = data.nodes.map((node) => {
        if (node.lat !== undefined && node.lng !== undefined) {
          return node; // Node already has coordinates
        }

        // Try to get coordinates based on country
        if (node.country && countryCoords[node.country]) {
          return {
            ...node,
            lat: countryCoords[node.country].lat + (Math.random() - 0.5) * 5, // Add jitter
            lng: countryCoords[node.country].lng + (Math.random() - 0.5) * 5, // Add jitter
          };
        }

        // If no country or unknown country, use random coordinates
        return {
          ...node,
          lat: Math.random() * 180 - 90, // Random latitude between -90 and 90
          lng: Math.random() * 360 - 180, // Random longitude between -180 and 180
        };
      });

      return {
        nodes: nodesWithCoords,
        links: data.links,
        isMockData: false,
      };
    } catch (error) {
      console.error("Error fetching supply chain graph data:", error);
      return getMockSupplyChainGraphData();
    }
  } else {
    console.warn("API not available, using mock data for supply chain graph");
    return getMockSupplyChainGraphData();
  }
};

// Mock data for supply chain graph
const getMockSupplyChainGraphData = (): GraphData => {
  // Approximate coordinates for countries
  const countryCoords: Record<string, { lat: number; lng: number }> = {
    USA: { lat: 38.9637, lng: -95.7129 },
    China: { lat: 35.8617, lng: 104.1954 },
    Germany: { lat: 51.1657, lng: 10.4515 },
    Brazil: { lat: -14.235, lng: -51.9253 },
    India: { lat: 20.5937, lng: 78.9629 },
    Vietnam: { lat: 14.0583, lng: 108.2772 },
    Mexico: { lat: 23.6345, lng: -102.5528 },
    Canada: { lat: 56.1304, lng: -106.3468 },
    Taiwan: { lat: 23.6978, lng: 120.9605 },
    Japan: { lat: 36.2048, lng: 138.2529 },
    "South Korea": { lat: 35.9078, lng: 127.7669 },
    UK: { lat: 55.3781, lng: -3.436 },
    France: { lat: 46.6034, lng: 1.8883 },
    Australia: { lat: -25.2744, lng: 133.7751 },
    Nigeria: { lat: 9.082, lng: 8.6753 },
  };

  const nodeTypes = [
    "supplier",
    "manufacturer",
    "wholesaler",
    "rawMaterial",
    "distributor",
    "retailer",
  ];

  const countries = Object.keys(countryCoords);
  const numNodes = 40; // Increased node count for better visualization
  const nodes: GraphNode[] = [];
  const supplierNames = [
    "EcoFabrics Ltd.",
    "GreenTech Solutions",
    "Sustainable Circuits",
    "Ethical Components Inc.",
    "Pure Harvest Organics",
    "Renewable Resources Co.",
    "FairTrade Goods",
    "Transparent Textiles",
    "Clean Energy Systems",
    "BioPlastics Innovations",
    "AquaPure Filters",
    "Solaris Panels",
    "GeoThermal Drilling",
    "WindTurbine Parts",
    "AgriFutures Corp",
    "Oceanic Goods",
    "Forest Stewardship Timber",
    "Mineral Extraction Ethical",
    "LaborLink Apparel",
    "CommunityCrafts Co-op",
  ]; // More diverse names

  for (let i = 0; i < numNodes; i++) {
    const country = countries[i % countries.length];
    const coords = countryCoords[country] || { lat: 0, lng: 0 };
    nodes.push({
      id: `node_${i}`,
      name: `${supplierNames[i % supplierNames.length]} (${country})`,
      type: nodeTypes[i % nodeTypes.length] as GraphNode["type"],
      country: country,
      ethical_score: 50 + Math.random() * 50, // 50-100
      group: Math.floor(Math.random() * 5), // Assign random groups
      level: Math.floor(Math.random() * 3), // Assign random levels for potential layering
      lat: coords.lat + (Math.random() - 0.5) * 5, // Add slight jitter
      lng: coords.lng + (Math.random() - 0.5) * 5, // Add slight jitter
    });
  }

  const links: GraphLink[] = [];
  const numLinks = 60; // Increased link count
  for (let i = 0; i < numLinks; i++) {
    const sourceIndex = Math.floor(Math.random() * numNodes);
    let targetIndex = Math.floor(Math.random() * numNodes);
    // Ensure source and target are different
    while (targetIndex === sourceIndex) {
      targetIndex = Math.floor(Math.random() * numNodes);
    }
    const sourceNode = nodes[sourceIndex];
    const targetNode = nodes[targetIndex];
    const isEthical =
      (sourceNode.ethical_score ?? 0) > 70 &&
      (targetNode.ethical_score ?? 0) > 70;
    links.push({
      source: sourceNode.id,
      target: targetNode.id,
      type: Math.random() > 0.7 ? "Primary" : "Secondary",
      strength: Math.random(),
      ethical: isEthical,
    });
  }

  // Corrected return statement
  return {
    nodes,
    links,
    isMockData: true,
  };
};

// Interface for geo risk alerts
export interface GeoRiskAlert {
  id: number;
  date: string;
  title: string;
  description: string;
  type: string;
  country: string;
  read: boolean;
}

// Function to fetch geo risk alerts
export async function getGeoRiskAlerts(): Promise<GeoRiskAlert[]> {
  try {
    const response = await fetch(getEndpoint("geo-risk-alerts"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Geo Risk Alerts API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.map((alert: any) => ({
      ...alert,
      read: false, // Default all fetched alerts to unread
    }));
  } catch (error) {
    console.error("Error fetching geo risk alerts:", error);

    // Generate mock alerts as fallback
    return generateMockGeoRiskAlerts();
  }
}

// Generate mock geo risk alerts
function generateMockGeoRiskAlerts(): GeoRiskAlert[] {
  const today = new Date();

  const mockAlerts: GeoRiskAlert[] = [
    {
      id: 1,
      date: formatDate(subtractDays(today, 0)),
      title: "Political Unrest in Thailand",
      description:
        "Increasing political protests in Bangkok may cause supply chain disruptions",
      type: "political",
      country: "Thailand",
      read: false,
    },
    {
      id: 2,
      date: formatDate(subtractDays(today, 1)),
      title: "Water Scarcity Alert: India",
      description:
        "Severe water shortages reported in manufacturing regions of South India",
      type: "environmental",
      country: "India",
      read: false,
    },
    {
      id: 3,
      date: formatDate(subtractDays(today, 2)),
      title: "New Labor Regulations in China",
      description:
        "Chinese government announces stricter labor laws affecting manufacturing",
      type: "regulatory",
      country: "China",
      read: true,
    },
    {
      id: 4,
      date: formatDate(subtractDays(today, 3)),
      title: "Child Labor Investigation in Bangladesh",
      description:
        "NGO report highlights child labor concerns in textile industry",
      type: "socialEthical",
      country: "Bangladesh",
      read: true,
    },
    {
      id: 5,
      date: formatDate(subtractDays(today, 4)),
      title: "Conflict Escalation in Nigeria",
      description:
        "Civil unrest increases in Lagos region, affecting oil suppliers",
      type: "conflict",
      country: "Nigeria",
      read: true,
    },
  ];

  return mockAlerts;
}

// Helper function to format dates
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Helper function to subtract days from a date
function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

// Function to update an existing supplier
export const updateSupplier = async (
  id: string,
  supplierData: Partial<Supplier> // Use Partial as we might only send updated fields
): Promise<Supplier> => {
  try {
    const response = await fetch(getEndpoint(`suppliers/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplierData),
      credentials: "include",
    });

    if (!response.ok) {
      let errorBody = "Invalid response from server";
      try {
        errorBody = await response.text(); // Get more details if possible
      } catch (_) {}
      console.error(
        `API Error ${response.status}: ${response.statusText}. Body: ${errorBody}`
      );
      throw new Error(
        `Failed to update supplier. Server responded with ${response.status}: ${errorBody}`
      );
    }

    const updatedSupplier: Supplier = await response.json();
    console.log("Supplier updated successfully:", updatedSupplier);
    return updatedSupplier;
  } catch (error) {
    logger.error("Error in updateSupplier API call:", error);
    // Re-throw the error so the component can catch it
    throw error instanceof Error
      ? error
      : new Error("An unknown error occurred during supplier update.");
  }
};

// --- Define Interface for Analytics Data ---
// NOTE: This is an assumed structure based on typical analytics.
// Adjust based on the actual API response.
export interface SupplierAnalyticsData {
  supplier: Partial<Supplier> & { overall_score?: number }; // Core supplier info + overall score
  industry_average?: { [key: string]: number }; // Avg scores for industry
  peer_comparison?: Array<Partial<Supplier>>; // List of similar suppliers for comparison
  risk_factors?: Array<{
    factor: string;
    severity: string;
    probability: string;
    description: string;
  }>;
  ai_recommendations?: Array<{
    area: string;
    suggestion: string;
    impact: string;
    difficulty: string;
  }>;
  sentiment_trend?: Array<{ date: string; score: number }>; // e.g., -1 to 1
  performance_projection?: Array<{ period: string; projected_score: number }>; // Performance projection data
  // Add other potential fields: controversies, esg_report_summary, etc.
  isMockData?: boolean;
}

// Function to get AI Analytics data for a supplier
export const getSupplierAnalyticsData = async (
  id: string
): Promise<SupplierAnalyticsData> => {
  try {
    const response = await fetch(getEndpoint(`suppliers/${id}/analytics`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      let errorBody = "Invalid response from server";
      try {
        errorBody = await response.text();
      } catch (_) {}
      console.error(
        `API Error ${response.status}: ${response.statusText}. Body: ${errorBody}`
      );
      throw new Error(
        `Failed to fetch analytics. Server responded with ${response.status}: ${errorBody}`
      );
    }

    const analyticsData: SupplierAnalyticsData = await response.json();
    console.log("Supplier analytics data received:", analyticsData);

    // --- MOCK DATA FALLBACK (Remove if API is reliable) ---
    // If the API returns an empty object or indicates mock, generate mock data.
    // This helps in development if the backend endpoint isn't fully implemented.
    if (!analyticsData || Object.keys(analyticsData).length <= 1) {
      // Check if essentially empty (besides maybe isMockData)
      console.warn(
        "API returned minimal/no analytics data. Generating mock analytics."
      );
      return generateMockAnalyticsData(id); // Call a mock generator
    }
    // --- END MOCK DATA FALLBACK ---

    return analyticsData;
  } catch (error) {
    console.error("Error in getSupplierAnalytics API call:", error);
    // --- MOCK DATA FALLBACK ON ERROR (Remove if API is reliable) ---
    console.warn("API call failed. Generating mock analytics as fallback.");
    return generateMockAnalyticsData(id); // Generate mock on error
    // --- END MOCK DATA FALLBACK ON ERROR ---
    // // Original error throwing (uncomment if not using mock fallback):
    // throw error instanceof Error ? error : new Error("An unknown error occurred while fetching supplier analytics.");
  }
};

// --- Mock Data Generator (for development/fallback) ---
const generateMockAnalyticsData = (id: string): SupplierAnalyticsData => {
  const mockSupplierBase = {
    id: parseInt(id, 10) || Date.now(), // Use passed ID or generate one
    name: `Mock Supplier ${id}`,
    country: ["USA", "China", "Germany", "India"][
      Math.floor(Math.random() * 4)
    ],
    industry: ["Tech", "Manufacturing", "Retail", "Healthcare"][
      Math.floor(Math.random() * 4)
    ],
    ethical_score: Math.random() * 50 + 40, // 40-90
    environmental_score: Math.random() * 50 + 30,
    social_score: Math.random() * 50 + 45,
    governance_score: Math.random() * 50 + 50,
    risk_level: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
  };

  return {
    supplier: {
      ...mockSupplierBase,
      overall_score:
        (mockSupplierBase.ethical_score +
          mockSupplierBase.environmental_score +
          mockSupplierBase.social_score +
          mockSupplierBase.governance_score) /
        4,
    },
    industry_average: {
      ethical_score: 75,
      environmental_score: 70,
      social_score: 78,
      governance_score: 80,
    },
    risk_factors: [
      {
        factor: "Geopolitical Instability",
        severity: "Medium",
        probability: "Low",
        description:
          "Operations in region X pose moderate risk due to political shifts.",
      },
      {
        factor: "Climate Change Impact",
        severity: "High",
        probability: "Medium",
        description:
          "Increased risk of supply disruption due to extreme weather events in key sourcing areas.",
      },
      {
        factor: "Labor Practices",
        severity: "Low",
        probability: "Low",
        description:
          "Minor concerns regarding overtime hours noted in last audit.",
      },
    ],
    ai_recommendations: [
      {
        area: "Environmental",
        suggestion:
          "Investigate solar panel installation at primary manufacturing facility.",
        impact: "High",
        difficulty: "Medium",
      },
      {
        area: "Social",
        suggestion: "Enhance worker training programs for safety protocols.",
        impact: "Medium",
        difficulty: "Low",
      },
      {
        area: "Governance",
        suggestion:
          "Increase transparency in political contribution reporting.",
        impact: "Medium",
        difficulty: "Medium",
      },
    ],
    sentiment_trend: [
      { date: "2024-01", score: 0.2 },
      { date: "2024-02", score: 0.3 },
      { date: "2024-03", score: 0.1 },
      { date: "2024-04", score: 0.4 },
    ],
    performance_projection: [
      { period: "Jan '24", projected_score: 78 },
      { period: "Feb '24", projected_score: 79 },
      { period: "Mar '24", projected_score: 80 },
      { period: "Apr '24", projected_score: 81 },
    ],
    isMockData: true,
  };
};

// Helper function to generate percentile insights based on supplier data
function generatePercentileInsights(
  data: SupplierEvaluation,
  primaryCategory: string
): string[] {
  const insights: string[] = [];

  // Add 1-2 general insights
  if (data.ethical_score) {
    insights.push(
      `This supplier's overall ethical score of ${data.ethical_score.toFixed(
        1
      )}% places them in the ${getPercentileText(
        data.ethical_score
      )} of industry peers.`
    );
  }

  // Add category-specific insights
  switch (primaryCategory) {
    case "Environmental":
      if (data.co2_emissions) {
        insights.push(
          `CO2 emissions are ${
            data.co2_emissions > 50 ? "higher" : "lower"
          } than ${Math.abs(
            50 - data.co2_emissions
          )}% of comparable suppliers in the ${data.industry} industry.`
        );
      }
      if (data.waste_management_score) {
        insights.push(
          `Waste management practices rank in the ${getPercentileText(
            data.waste_management_score * 100
          )} percentile compared to industry standards.`
        );
      }
      break;
    case "Social":
      if (data.wage_fairness) {
        insights.push(
          `Wage fairness score is in the ${getPercentileText(
            data.wage_fairness * 100
          )} compared to the industry average of 0.65.`
        );
      }
      if (data.human_rights_index) {
        insights.push(
          `Human rights compliance ranks in the ${getPercentileText(
            data.human_rights_index * 100
          )} of suppliers in ${data.country}.`
        );
      }
      break;
    case "Governance":
      if (data.transparency_score) {
        insights.push(
          `Transparency practices rank in the ${getPercentileText(
            data.transparency_score * 100
          )} of the industry benchmark.`
        );
      }
      if (data.corruption_risk) {
        insights.push(
          `Corruption risk exposure is ${
            data.corruption_risk > 0.5 ? "higher" : "lower"
          } than ${Math.round(
            Math.abs(0.5 - data.corruption_risk) * 100
          )}% of peers in similar regions.`
        );
      }
      break;
    case "Supply Chain":
      if (data.delivery_efficiency) {
        insights.push(
          `Delivery efficiency ranks in the ${getPercentileText(
            data.delivery_efficiency * 100
          )} of industry standards.`
        );
      }
      if (data.traceability) {
        insights.push(
          `Supply chain traceability is better than ${Math.round(
            data.traceability * 100
          )}% of comparable suppliers.`
        );
      }
      break;
  }

  // Add at least one insight if none were generated
  if (insights.length === 0) {
    insights.push(
      `This supplier's performance in ${primaryCategory.toLowerCase()} metrics requires attention, with opportunities for significant improvement compared to industry benchmarks.`
    );
  }

  return insights;
}

// Helper function to generate comparative insights based on supplier data
function generateComparativeInsights(
  data: SupplierEvaluation,
  primaryCategory: string
): string[] {
  const insights: string[] = [];

  // Add category-specific insights with specific metrics
  switch (primaryCategory) {
    case "Environmental":
      if (data.co2_emissions !== undefined) {
        insights.push(
          `CO2 emissions are ${
            data.co2_emissions > 50
              ? data.co2_emissions - 50
              : 50 - data.co2_emissions
          }% ${
            data.co2_emissions > 50 ? "above" : "below"
          } industry average of 50 tons.`
        );
      }
      if (data.water_usage !== undefined) {
        insights.push(
          `Water usage efficiency is ${
            data.water_usage > 50 ? "below average" : "above average"
          } with utilization at ${
            data.water_usage
          } cubic meters per production unit.`
        );
      }
      if (data.renewable_energy_percent !== undefined) {
        insights.push(
          `Renewable energy usage at ${data.renewable_energy_percent}% compared to industry average of 35%.`
        );
      }
      break;
    case "Social":
      if (data.wage_fairness !== undefined) {
        insights.push(
          `Wage fairness ratio of ${(data.wage_fairness * 100).toFixed(
            1
          )}% compared to regional average of 65%.`
        );
      }
      if (data.human_rights_index !== undefined) {
        insights.push(
          `Human rights compliance score of ${(
            data.human_rights_index * 100
          ).toFixed(1)}% versus global standard of 70%.`
        );
      }
      if (data.diversity_inclusion_score !== undefined) {
        insights.push(
          `Diversity and inclusion score of ${(
            data.diversity_inclusion_score * 100
          ).toFixed(1)}% against benchmark of 60%.`
        );
      }
      break;
    case "Governance":
      if (data.transparency_score !== undefined) {
        insights.push(
          `Transparency rating of ${(data.transparency_score * 100).toFixed(
            1
          )}% compared to industry standard of 65%.`
        );
      }
      if (data.corruption_risk !== undefined) {
        insights.push(
          `Corruption risk index of ${(data.corruption_risk * 100).toFixed(
            1
          )}% versus acceptable threshold of 30%.`
        );
      }
      if (data.ethics_program !== undefined) {
        insights.push(
          `Ethics program maturity at ${(data.ethics_program * 100).toFixed(
            1
          )}% compared to best practice score of 80%.`
        );
      }
      break;
    case "Supply Chain":
      if (data.delivery_efficiency !== undefined) {
        insights.push(
          `Delivery efficiency rating of ${(
            data.delivery_efficiency * 100
          ).toFixed(1)}% against industry average of 75%.`
        );
      }
      if (data.quality_control_score !== undefined) {
        insights.push(
          `Quality control performance at ${(
            data.quality_control_score * 100
          ).toFixed(1)}% versus benchmark of 80%.`
        );
      }
      if (data.traceability !== undefined) {
        insights.push(
          `Supply chain traceability index of ${(
            data.traceability * 100
          ).toFixed(1)}% compared to industry goal of 85%.`
        );
      }
      break;
  }

  // Add general cross-category insight as well
  if (data.ethical_score) {
    const categories = [
      "environmental",
      "social",
      "governance",
      "supply chain",
    ];
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    insights.push(
      `Overall ethical score is ${
        data.ethical_score > 70 ? "strong" : "below optimal"
      } at ${data.ethical_score.toFixed(
        1
      )}%, with ${randomCategory} metrics having the greatest impact on overall rating.`
    );
  }

  // Add at least one insight if none were generated
  if (insights.length === 0) {
    insights.push(
      `This supplier's ${primaryCategory.toLowerCase()} metrics require detailed assessment, as current performance indicates potential gaps in meeting industry standards.`
    );
  }

  return insights;
}

// Helper function to generate actionable recommendations
function generateActionItems(
  data: SupplierEvaluation,
  primaryCategory: string
): string[] {
  const actions: string[] = [];

  // Add category-specific action items
  switch (primaryCategory) {
    case "Environmental":
      if (data.co2_emissions && data.co2_emissions > 40) {
        actions.push(
          `Implement carbon reduction plan targeting ${Math.round(
            (data.co2_emissions - 30) / 2
          )}% decrease in emissions over next 18 months.`
        );
      }
      if (data.water_usage && data.water_usage > 40) {
        actions.push(
          `Adopt water recycling systems to reduce consumption by 30% within 12 months.`
        );
      }
      if (
        !data.renewable_energy_percent ||
        data.renewable_energy_percent < 40
      ) {
        actions.push(
          `Increase renewable energy sourcing to minimum 40% through power purchase agreements or on-site generation.`
        );
      }
      if (!data.waste_management_score || data.waste_management_score < 0.7) {
        actions.push(
          `Implement comprehensive waste reduction program with circular economy principles and zero-waste targets.`
        );
      }
      break;
    case "Social":
      if (!data.wage_fairness || data.wage_fairness < 0.7) {
        actions.push(
          `Conduct wage equity audit to establish fair compensation structure based on regional living wage standards.`
        );
      }
      if (!data.human_rights_index || data.human_rights_index < 0.7) {
        actions.push(
          `Implement enhanced human rights due diligence process with quarterly monitoring and annual third-party verification.`
        );
      }
      if (
        !data.diversity_inclusion_score ||
        data.diversity_inclusion_score < 0.6
      ) {
        actions.push(
          `Establish diversity, equity and inclusion program with measurable targets and executive accountability.`
        );
      }
      if (!data.worker_safety || data.worker_safety < 0.8) {
        actions.push(
          `Upgrade workplace safety protocols with enhanced training and incident prevention systems.`
        );
      }
      break;
    case "Governance":
      if (!data.transparency_score || data.transparency_score < 0.7) {
        actions.push(
          `Enhance disclosure practices through comprehensive ESG reporting aligned with GRI standards.`
        );
      }
      if (data.corruption_risk && data.corruption_risk > 0.3) {
        actions.push(
          `Strengthen anti-corruption controls with enhanced training, whistleblower protection, and third-party verification.`
        );
      }
      if (!data.board_diversity || data.board_diversity < 0.5) {
        actions.push(
          `Improve governance structure with increased board diversity and ESG oversight committee.`
        );
      }
      if (!data.ethics_program || data.ethics_program < 0.6) {
        actions.push(
          `Implement robust ethics program with clear code of conduct, training, and compliance monitoring.`
        );
      }
      break;
    case "Supply Chain":
      if (!data.delivery_efficiency || data.delivery_efficiency < 0.7) {
        actions.push(
          `Optimize logistics operations to improve delivery efficiency and reduce transportation emissions.`
        );
      }
      if (!data.quality_control_score || data.quality_control_score < 0.8) {
        actions.push(
          `Implement enhanced quality management system with continuous improvement protocols.`
        );
      }
      if (!data.traceability || data.traceability < 0.6) {
        actions.push(
          `Deploy blockchain-based traceability system to track products from raw materials to finished goods.`
        );
      }
      if (!data.supplier_diversity || data.supplier_diversity < 0.5) {
        actions.push(
          `Expand supplier diversity program with targets for minority and women-owned business inclusion.`
        );
      }
      break;
  }

  // Add at least one general action item
  if (data.ethical_score && data.ethical_score < 75) {
    actions.push(
      `Develop comprehensive ESG improvement roadmap with quarterly progress reviews and executive accountability.`
    );
  } else {
    actions.push(
      `Enhance ESG data collection systems to enable more granular performance tracking and improvement identification.`
    );
  }

  // Add industry-specific action if possible
  if (data.industry) {
    const industryActions = {
      Electronics:
        "Implement closed-loop recycling for electronic components and packaging materials.",
      "Food & Beverage":
        "Transition to sustainable packaging alternatives and reduce food waste across operations.",
      Apparel:
        "Adopt sustainably sourced materials and implement water-efficient manufacturing processes.",
      Automotive:
        "Accelerate transition to low-carbon manufacturing processes and circular material usage.",
      Manufacturing:
        "Implement energy efficiency measures across production facilities and optimize resource use.",
    };

    if (data.industry in industryActions) {
      actions.push(industryActions[data.industry]);
    }
  }

  // Ensure we have at least 3 actions
  while (actions.length < 3) {
    const generalActions = [
      "Establish supplier code of conduct with clear ESG requirements and verification protocols.",
      "Implement data-driven sustainability KPIs with regular executive review and improvement planning.",
      "Develop ESG training program for all employees to build organization-wide sustainability capacity.",
      "Create transparency dashboard for real-time tracking and reporting of key sustainability metrics.",
    ];

    const randomAction =
      generalActions[Math.floor(Math.random() * generalActions.length)];
    if (!actions.includes(randomAction)) {
      actions.push(randomAction);
    }
  }

  return actions.slice(0, 4); // Return at most 4 action items
}

// Helper function to get percentile text
function getPercentileText(score: number): string {
  if (score >= 90) return "top 10%";
  if (score >= 80) return "top 20%";
  if (score >= 70) return "top 30%";
  if (score >= 60) return "top 40%";
  if (score >= 50) return "average range";
  if (score >= 40) return "bottom 40%";
  if (score >= 30) return "bottom 30%";
  if (score >= 20) return "bottom 20%";
  return "bottom 10%";
}
