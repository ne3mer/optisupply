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
} from "recharts";
import { useTheme } from "../contexts/ThemeContext";

interface CO2Emission {
  name: string;
  value: number;
}

interface CO2EmissionsChartProps {
  data: CO2Emission[];
}

// Lime-to-danger gradient scale for emission magnitude
const chartColors = [
  "#E84545", // highest emitter — danger
  "#FB923C",
  "#FBBF24",
  "#86EFAC",
  "#C8F05A", // lowest — lime
  "#C8F05A",
  "#86EFAC",
  "#FBBF24",
];

const CustomTooltip = ({ active, payload, label, dark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: dark ? "rgba(10,10,10,0.97)" : "rgba(245,245,240,0.97)",
          border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          borderRadius: "6px",
          padding: "8px 12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: dark ? "#808080" : "#555555", marginBottom: 4 }}>
          {label}
        </p>
        <p style={{ fontSize: 22, fontFamily: '"Geist Mono", monospace', fontWeight: 300, letterSpacing: "-0.03em", color: dark ? "#F5F5F0" : "#0A0A0A", lineHeight: 1 }}>
          {payload[0].value.toFixed(1)}
          <span style={{ fontSize: 11, color: dark ? "#808080" : "#555555", marginLeft: 4, fontWeight: 400 }}>t CO₂</span>
        </p>
      </div>
    );
  }
  return null;
};

const CO2EmissionsChart: React.FC<CO2EmissionsChartProps> = ({ data }) => {
  const { darkMode } = useTheme();
  const isMobile = useIsMobile();

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data]
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (sortedData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="20" width="8" height="16" rx="2" fill="currentColor" opacity="0.4" />
          <rect x="16" y="10" width="8" height="26" rx="2" fill="currentColor" opacity="0.6" />
          <rect x="28" y="14" width="8" height="22" rx="2" fill="currentColor" opacity="0.5" />
        </svg>
        <p style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
          No emission data
        </p>
      </div>
    );
  }

  const tickColor = darkMode ? "#808080" : "#555555";
  const gridColor = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{ top: 4, right: isMobile ? 8 : 20, left: isMobile ? 36 : 56, bottom: 4 }}
        barCategoryGap="30%"
      >
        <CartesianGrid
          strokeDasharray="0"
          stroke={gridColor}
          horizontal={false}
          strokeOpacity={1}
        />
        <XAxis
          type="number"
          tick={{ fontSize: isMobile ? 10 : 11, fill: tickColor, fontFamily: '"Geist Mono", monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: isMobile ? 10 : 11, fill: tickColor, fontFamily: '"Geist", sans-serif' }}
          axisLine={false}
          tickLine={false}
          width={isMobile ? 90 : 120}
          interval={0}
        />
        <Tooltip
          content={<CustomTooltip dark={darkMode} />}
          cursor={{ fill: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}
        />
        <Bar dataKey="value" name="CO₂ Emissions (tons)" radius={[0, 3, 3, 0]} maxBarSize={isMobile ? 14 : 22}>
          {sortedData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={chartColors[index % chartColors.length]}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CO2EmissionsChart;
