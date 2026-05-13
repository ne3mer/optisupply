import React from "react";
import { fmtRawMetric } from "../../lib/formatters";

interface WaterUsageTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const WaterUsageTooltip: React.FC<WaterUsageTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="text-sm font-medium">{`${label}`}</p>
        <p className="text-sm text-gray-700">{`Water Usage: ${fmtRawMetric(
          Number(payload[0].value),
          "gallons/unit"
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

export default WaterUsageTooltip;
