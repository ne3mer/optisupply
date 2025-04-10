import { API_BASE_URL } from "../config";

// Update the dashboard data interface to match API response
export interface DashboardData {
  totalSuppliers: number; // Use camelCase
  avgEthicalScore: string; // Expect string
  riskBreakdown?: {
    // Add optional riskBreakdown
    high: number;
    low: number;
    medium: number;
  };
  // Mark previously expected fields as optional, as they might be missing
  avg_co2_emissions?: number; // Keep original name for now or switch later
  suppliers_by_country?: Record<string, number>;
  ethical_score_distribution?: Array<{ range: string; count: number }>;
  co2_emissions_by_industry?: Array<{ name: string; value: number }>;
  // Add new optional fields for the other charts
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

/**
 * Helper function to convert 0-1 values to 0-100 scale
 * @param data The dashboard data object
 * @returns The dashboard data with values scaled from 0-100
 */
const convertToPercentage = (data: Partial<DashboardData>): DashboardData => {
  // Create a copy of the data to avoid mutating the original
  const result = { ...data };

  // Convert avgEthicalScore from 0-1 to 0-100 if it's numeric
  if (typeof result.avgEthicalScore === "number") {
    result.avgEthicalScore = (result.avgEthicalScore * 100).toFixed(1);
  } else if (
    typeof result.avgEthicalScore === "string" &&
    !isNaN(parseFloat(result.avgEthicalScore))
  ) {
    const numScore = parseFloat(result.avgEthicalScore);
    // Check if the score is in 0-1 range
    if (numScore >= 0 && numScore <= 1) {
      result.avgEthicalScore = (numScore * 100).toFixed(1);
    }
  }

  // Process sustainability_performance metrics
  if (result.sustainability_performance) {
    result.sustainability_performance = result.sustainability_performance.map(
      (item: { metric: string; current: number; industry: number }) => ({
        ...item,
        current:
          item.current >= 0 && item.current <= 1
            ? Math.round(item.current * 100)
            : item.current,
        industry:
          item.industry >= 0 && item.industry <= 1
            ? Math.round(item.industry * 100)
            : item.industry,
      })
    );
  }

  // Process sustainable_practices values
  if (result.sustainable_practices) {
    result.sustainable_practices = result.sustainable_practices.map(
      (item: { practice: string; adoption: number; target: number }) => ({
        ...item,
        adoption:
          item.adoption >= 0 && item.adoption <= 1
            ? Math.round(item.adoption * 100)
            : item.adoption,
        target:
          item.target >= 0 && item.target <= 1
            ? Math.round(item.target * 100)
            : item.target,
      })
    );
  }

  return result as DashboardData;
};

/**
 * Fetches dashboard data from the API
 * Falls back to mock data if the API request fails
 */
export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    console.log("Fetching dashboard data from API...");
    const response = await fetch(`${API_BASE_URL}/dashboard/`);

    if (!response.ok) {
      console.warn(
        `Dashboard API returned status ${response.status}. Using mock data.`
      );
      return getMockDashboardData();
    }

    const data = await response.json();
    console.log("Dashboard API response:", data);

    // Convert any 0-1 values to 0-100 scale
    const convertedData = convertToPercentage(data);
    console.log("Converted dashboard data (0-100 scale):", convertedData);

    // Ensure the returned data conforms to the interface
    return {
      ...convertedData,
      isMockData: false,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return mock data in case of error
    return getMockDashboardData();
  }
};

/**
 * Checks if the API is connected and responding
 */
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    console.log("Checking API connection...");
    const response = await fetch(`${API_BASE_URL}/health-check/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (error) {
    console.error("API connection check failed:", error);
    return false;
  }
};

// Mock dashboard data - ADJUST to new interface or handle in component
export const getMockDashboardData = (): DashboardData => {
  console.log("Using mock dashboard data");

  // Create mock data
  const mockData = {
    totalSuppliers: 12,
    avgEthicalScore: "75.3", // Already in 0-100 format
    riskBreakdown: { high: 1, medium: 4, low: 7 },
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

  return mockData;
};
