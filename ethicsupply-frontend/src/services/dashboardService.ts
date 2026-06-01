import { getApiBaseUrl } from "../config";
import { apiFetch, checkApiConnection } from "./apiClient";
import logger from "../utils/log";

export { checkApiConnection };

// Update the dashboard data interface to match API response
export interface DashboardData {
  totalSuppliers: number;
  avgEthicalScore: string;
  riskBreakdown?: {
    high: number;
    low: number;
    medium: number;
  };
  avgCo2Emissions?: number;
  suppliers_by_country?: Record<string, number>;
  ethical_score_distribution?: Array<{ range: string; count: number }>;
  co2_emissions_by_industry?: Array<{ name: string; value: number }>;
  water_usage_trend?: Array<{ month: string; usage: number }>;
  renewable_energy_mix?: Array<{ name: string; value: number }>;
  sustainable_practices?: Array<{
    practice: string;
    adoption: number;
    target: number;
  }>;
  sustainability_performance?: Array<{
    metric: string;
    current: number;
    industry: number;
  }>;
  isMockData?: boolean;
}

export interface DatasetMeta {
  version: string;
  seed: string | null;
  generatedAt: string | null;
  bandsVersion: string | null;
}

const convertToPercentage = (data: Partial<DashboardData>): DashboardData => {
  const result = { ...data };

  if (typeof result.avgEthicalScore === "number") {
    const v = result.avgEthicalScore;
    result.avgEthicalScore = (v >= 0 && v <= 1 ? v * 100 : v).toFixed(1);
  } else if (
    typeof result.avgEthicalScore === "string" &&
    !isNaN(parseFloat(result.avgEthicalScore))
  ) {
    const numScore = parseFloat(result.avgEthicalScore);
    if (numScore >= 0 && numScore <= 1) {
      result.avgEthicalScore = (numScore * 100).toFixed(1);
    }
  }

  if (result.sustainability_performance) {
    result.sustainability_performance = result.sustainability_performance.map(
      (item) => ({
        ...item,
        current:
          item.current >= 0 && item.current <= 1
            ? Math.round(item.current * 100)
            : item.current,
        industry:
          item.industry >= 0 && item.industry <= 1
            ? Math.round(item.industry * 100)
            : item.industry,
      }),
    );
  }

  if (result.sustainable_practices) {
    result.sustainable_practices = result.sustainable_practices.map((item) => ({
      ...item,
      adoption:
        item.adoption >= 0 && item.adoption <= 1
          ? Math.round(item.adoption * 100)
          : item.adoption,
      target:
        item.target >= 0 && item.target <= 1
          ? Math.round(item.target * 100)
          : item.target,
    }));
  }

  return result as DashboardData;
};

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    logger.log(
      `Fetching dashboard data from API (${getApiBaseUrl()})...`,
    );
    const response = await apiFetch("dashboard", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      logger.warn(
        `Dashboard API returned status ${response.status}. Using mock data.`,
      );
      return getMockDashboardData();
    }

    const data = await response.json();
    const convertedData = convertToPercentage(data);

    return {
      ...convertedData,
      isMockData: false,
    };
  } catch (error) {
    logger.error("Error fetching dashboard data:", error);
    return getMockDashboardData();
  }
};

export const getDatasetMeta = async (): Promise<DatasetMeta | null> => {
  try {
    const resp = await apiFetch("dataset/meta", {
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
    } as DatasetMeta;
  } catch (e) {
    console.warn("Failed to fetch dataset meta:", e);
    return null;
  }
};

export const getMockDashboardData = (): DashboardData => {
  logger.log("Using mock dashboard data");

  return {
    totalSuppliers: 12,
    avgEthicalScore: "75.3",
    riskBreakdown: { high: 1, medium: 4, low: 7 },
    avgCo2Emissions: 23.9,
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
      { range: "21-40", count: 0 },
      { range: "41-60", count: 2 },
      { range: "61-80", count: 7 },
      { range: "81-100", count: 3 },
    ],
    co2_emissions_by_industry: [
      { name: "Consumer Goods", value: 4.3 },
      { name: "Electronics", value: 20.4 },
      { name: "Food & Beverage", value: 128.7 },
      { name: "Apparel", value: 2.5 },
      { name: "Home Appliances", value: 18.5 },
    ],
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
    renewable_energy_mix: [
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
    sustainability_performance: [
      { metric: "Carbon Footprint", current: 82, industry: 68 },
      { metric: "Water Usage", current: 76, industry: 62 },
      { metric: "Waste Reduction", current: 91, industry: 59 },
      { metric: "Energy Efficiency", current: 84, industry: 71 },
      { metric: "Social Impact", current: 70, industry: 58 },
    ],
    isMockData: true,
  };
};
