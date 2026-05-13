import React from "react";
import { fmtRawMetric } from "../../lib/formatters";

interface CO2EmissionsTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

// Helper function to provide context for emissions
const getIndustryEmissionsContext = (industry: string, value: number) => {
  const contexts: Record<string, string> = {
    "Consumer Goods": "Below average for sector",
    Electronics: "Above average, reduction opportunities",
    "Food & Beverage": "Significantly above average",
    Apparel: "Low emissions, industry leader",
    "Home Appliances": "Above average, improving trend",
  };

  return contexts[industry] || "Industry benchmark unavailable";
};

const CO2EmissionsTooltip: React.FC<CO2EmissionsTooltipProps> = ({
  active,
  payload,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="text-sm font-medium">{`${payload[0].name}`}</p>
        <p className="text-sm text-gray-700">{`CO₂ Emissions: ${fmtRawMetric(
          Number(payload[0].value),
          "t"
        )}`}</p>
        <p className="text-xs text-gray-500 mt-1">
          {getIndustryEmissionsContext(payload[0].name, payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default CO2EmissionsTooltip;
