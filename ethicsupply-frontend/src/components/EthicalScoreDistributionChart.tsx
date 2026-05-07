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
import { useTheme } from "../contexts/ThemeContext";

interface EthicalScoreRange {
  range: string;
  count: number;
}

interface EthicalScoreDistributionChartProps {
  data: EthicalScoreRange[];
}

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
          Score Range {label}
        </p>
        <p style={{ fontSize: 22, fontFamily: '"Geist Mono", monospace', fontWeight: 300, letterSpacing: "-0.03em", color: dark ? "#F5F5F0" : "#0A0A0A", lineHeight: 1 }}>
          {payload[0].value}
          <span style={{ fontSize: 12, color: dark ? "#808080" : "#555555", marginLeft: 4, fontWeight: 400 }}>suppliers</span>
        </p>
      </div>
    );
  }
  return null;
};

// Score-range to lime/amber/red spectrum — communicates quality
const getBarColor = (range: string) => {
  switch (range) {
    case "81-100": return "#C8F05A";   // lime — excellent
    case "61-80":  return "#86EFAC";   // green — good
    case "41-60":  return "#FBBF24";   // amber — average
    case "21-40":  return "#FB923C";   // orange — below average
    case "0-20":   return "#E84545";   // red — at risk
    default:       return "#C8F05A";
  }
};

const EthicalScoreDistributionChart: React.FC<EthicalScoreDistributionChartProps> = ({ data }) => {
  const { darkMode } = useTheme();
  const isMobile = useIsMobile();

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

  const axisColor = darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";
  const gridColor = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const tickColor = darkMode ? "#808080" : "#555555";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 12, right: isMobile ? 8 : 16, left: isMobile ? -8 : 0, bottom: isMobile ? 0 : 4 }}
        barCategoryGap="28%"
      >
        {/* Faint horizontal gridlines only — no borders */}
        <CartesianGrid
          strokeDasharray="0"
          stroke={gridColor}
          vertical={false}
          strokeOpacity={1}
        />
        <XAxis
          dataKey="range"
          tick={{ fontSize: isMobile ? 10 : 11, fill: tickColor, fontFamily: '"Geist Mono", monospace', letterSpacing: "-0.01em" }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: isMobile ? 10 : 11, fill: tickColor, fontFamily: '"Geist Mono", monospace' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip dark={darkMode} />} cursor={{ fill: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={isMobile ? 28 : 44}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.range)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EthicalScoreDistributionChart;
