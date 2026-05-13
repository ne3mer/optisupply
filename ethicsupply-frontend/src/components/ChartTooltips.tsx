import React from "react";
import { TooltipProps } from "recharts";
import {
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { fmtRawMetric } from "../lib/formatters";

// Common tooltip wrapper component with enhanced styling
const TooltipWrapper = ({ children, title }) => (
  <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-3 min-w-[200px] max-w-[300px]">
    {title && <h4 className="font-medium text-gray-900 mb-2">{title}</h4>}
    {children}
  </div>
);

// Tooltip for Ethical Score Distribution
export const EthicalScoreTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="text-sm font-medium">{`Score Range: ${label}`}</p>
        <p className="text-sm text-gray-700">{`Suppliers: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

// Tooltip for CO2 Emissions by Industry
export const CO2EmissionsTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="text-sm font-medium">{`${payload[0].name}`}</p>
        <p className="text-sm text-gray-700">{`CO₂ Emissions: ${fmtRawMetric(
          Number(payload[0].value),
          "t",
        )}`}</p>
        <p className="text-xs text-gray-500 mt-1">
          {getIndustryEmissionsContext(payload[0].name, payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

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

// Tooltip for Water Usage Trend
export const WaterUsageTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="text-sm font-medium">{`${label}`}</p>
        <p className="text-sm text-gray-700">{`Water Usage: ${fmtRawMetric(
          Number(payload[0].value),
          "gallons/unit",
        )}`}</p>
        <p className="text-xs text-gray-500 mt-1">
          {payload[0].value > 100
            ? "Above target threshold"
            : "Below target threshold"}
        </p>
      </div>
    );
  }
  return null;
};

// Tooltip for Renewable Energy Adoption
export const RenewableEnergyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="text-sm font-medium">{`${data.name}`}</p>
        <p className="text-sm text-gray-700">{`${data.value}% of total energy use`}</p>
        <p className="text-xs text-gray-500 mt-1">
          {data.name === "Traditional"
            ? "Goal: Reduce to below 10% by 2025"
            : `Renewable source`}
        </p>
      </div>
    );
  }
  return null;
};

// Tooltip for Sustainable Practices Adoption
export const SustainablePracticesTooltip = ({
  active,
  payload,
  label,
}: any) => {
  if (active && payload && payload.length) {
    const adoptionData = payload.find((p: any) => p.dataKey === "adoption");
    const targetData = payload.find((p: any) => p.dataKey === "target");

    if (adoptionData && targetData) {
      const gap = targetData.value - adoptionData.value;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="text-sm font-medium">{`${label}`}</p>
          <p className="text-sm text-gray-700">{`Current: ${adoptionData.value}%`}</p>
          <p className="text-sm text-gray-700">{`Target: ${targetData.value}%`}</p>
          <p className="text-xs text-gray-500 mt-1">
            {gap > 0 ? `Gap to close: ${gap}%` : "Target achieved"}
          </p>
        </div>
      );
    }
  }
  return null;
};

// Tooltip for Sustainability Metrics Radar
export const SustainabilityMetricsTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const currentData = payload.find((p: any) => p.dataKey === "current");
    const industryData = payload.find((p: any) => p.dataKey === "industry");

    if (currentData && industryData) {
      const difference = currentData.value - industryData.value;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="text-sm font-medium">{`${payload[0].payload.metric}`}</p>
          <p className="text-sm text-gray-700">{`Your performance: ${currentData.value}/100`}</p>
          <p className="text-sm text-gray-700">{`Industry average: ${industryData.value}/100`}</p>
          <p className="text-xs text-green-600 mt-1 font-semibold">
            {difference > 0
              ? `${difference} points above average`
              : difference === 0
                ? "At industry average"
                : `${Math.abs(difference)} points below average`}
          </p>
        </div>
      );
    }
  }
  return null;
};
