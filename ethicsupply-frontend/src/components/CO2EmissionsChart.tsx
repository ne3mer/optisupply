import React, { useMemo } from "react";
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
  Legend,
} from "recharts";

interface CO2Emission {
  name: string;
  value: number;
}

interface CO2EmissionsChartProps {
  data: CO2Emission[];
}

// Use dashboard colors
const chartColors = [
  "#00F0FF", // Teal
  "#FF00FF", // Magenta
  "#00FF8F", // Green
  "#FFD700", // Yellow
  "#8B5CF6", // Purple
  "#38BDF8", // Sky Blue
  "#EC4899", // Pink
  "#10B981", // Emerald
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-md border backdrop-blur-sm p-2 text-sm shadow-lg"
        style={{
          backgroundColor: "rgba(13, 15, 26, 0.9)", // colors.tooltipBg
          borderColor: "rgba(77, 91, 255, 0.4)", // colors.accent + "40"
          color: "#E0E0FF", // colors.text
        }}
      >
        <p
          className="mb-1 font-semibold"
          style={{ color: "#E0E0FF" }} // colors.text
        >{`${label}`}</p>
        <p style={{ color: "#8A94C8" }}>{`CO₂: ${payload[0].value.toFixed(
          1
        )} t`}</p>
      </div>
    );
  }
  return null;
};

const CO2EmissionsChart: React.FC<CO2EmissionsChartProps> = ({ data }) => {
  const isMobile = useIsMobile();

  // Sort data descending by value and prepare for chart
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data]
      .filter((d) => d.value > 0) // Filter out zero values if needed
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (sortedData.length === 0) {
    return <p className="text-center">No CO₂ emission data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{ top: isMobile ? 4 : 5, right: isMobile ? 10 : 30, left: isMobile ? 32 : 50, bottom: isMobile ? 0 : 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(77, 91, 255, 0.1)"
          horizontal={false}
        />
        <XAxis type="number" stroke="#8A94C8" fontSize={isMobile ? 10 : 12} />
        <YAxis
          dataKey="name"
          type="category"
          stroke="#8A94C8"
          fontSize={isMobile ? 10 : 12}
          width={isMobile ? 90 : 120}
          tick={{ fill: "#E0E0FF" }}
          interval={0} // Ensure all labels are shown
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(77, 91, 255, 0.1)" }}
        />
        {!isMobile && <Legend />}
        <Bar dataKey="value" name="CO₂ Emissions (tons)" radius={[0, 4, 4, 0]} barSize={isMobile ? 12 : undefined}>
          {sortedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={chartColors[index % chartColors.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CO2EmissionsChart;
