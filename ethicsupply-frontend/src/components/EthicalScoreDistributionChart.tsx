import React from "react";
import useIsMobile from "../hooks/useIsMobile";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface EthicalScoreRange {
  range: string;
  count: number;
}

interface EthicalScoreDistributionChartProps {
  data: EthicalScoreRange[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="text-sm font-medium">{`Range: ${label}`}</p>
        <p className="text-sm text-gray-700">{`Suppliers: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const EthicalScoreDistributionChart: React.FC<
  EthicalScoreDistributionChartProps
> = ({ data }) => {
  // Ensure we have data to display
  const chartData =
    data && data.length > 0
      ? data
      : [
          { range: "0-20", count: 0 },
          { range: "21-40", count: 0 },
          { range: "41-60", count: 0 },
          { range: "61-80", count: 0 },
          { range: "81-100", count: 0 },
        ];

  const getBarColor = (range: string) => {
    switch (range) {
      case "81-100":
        return "#059669"; // dark green
      case "61-80":
        return "#10b981"; // medium green
      case "41-60":
        return "#14b8a6"; // teal
      case "21-40":
        return "#f59e0b"; // amber
      case "0-20":
        return "#ef4444"; // red
      default:
        return "#10b981"; // default emerald
    }
  };

  const isMobile = useIsMobile();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: isMobile ? 8 : 20, right: isMobile ? 10 : 30, left: 10, bottom: isMobile ? 0 : 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="range" tick={{ fontSize: isMobile ? 10 : 12 }} interval={0} />
        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={isMobile ? 20 : undefined}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.range)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EthicalScoreDistributionChart;
