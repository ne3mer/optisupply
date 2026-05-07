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
  TooltipProps,
  Cell,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useTheme } from "../contexts/ThemeContext";

interface SupplierCountData {
  name: string;
  value: number;
}

interface SuppliersByCountryChartProps {
  suppliersByCountry: Record<string, number>;
}

const CustomTooltip = ({
  active,
  payload,
  dark,
}: TooltipProps<ValueType, NameType> & { dark: boolean }) => {
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
          {payload[0].payload.name}
        </p>
        <p style={{ fontSize: 22, fontFamily: '"Geist Mono", monospace', fontWeight: 300, letterSpacing: "-0.03em", color: dark ? "#F5F5F0" : "#0A0A0A", lineHeight: 1 }}>
          {payload[0].value}
          <span style={{ fontSize: 11, color: dark ? "#808080" : "#555555", marginLeft: 4, fontWeight: 400 }}>suppliers</span>
        </p>
      </div>
    );
  }
  return null;
};

const SuppliersByCountryChart: React.FC<SuppliersByCountryChartProps> = ({
  suppliersByCountry,
}) => {
  const { darkMode } = useTheme();
  const isMobile = useIsMobile();

  const data = useMemo(() => {
    const dataArray = Object.entries(suppliersByCountry || {}).map(
      ([name, value]) => ({ name, value })
    );
    return dataArray
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [suppliersByCountry]);

  const maxVal = useMemo(
    () => (data.length ? Math.max(...data.map((d) => d.value)) : 0),
    [data]
  );

  // Lime-to-muted scale based on relative rank — not the generic rainbow
  const getColor = (value: number) => {
    if (!maxVal) return "#C8F05A";
    const t = Math.max(0, Math.min(1, value / maxVal));
    if (t > 0.75) return "#C8F05A";     // lime — top tier
    if (t > 0.5)  return "#86EFAC";     // green
    if (t > 0.25) return "#FBBF24";     // amber
    return "#808080";                   // muted — tail
  };

  const yAxisWidth = useMemo(() => {
    const longest = data.reduce((m, d) => Math.max(m, (d.name || "").length), 0);
    const base = Math.max(60, Math.min(160, longest * 7));
    return isMobile ? Math.min(base, 100) : base;
  }, [data, isMobile]);

  const tickColor = darkMode ? "#808080" : "#555555";
  const gridColor = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: isMobile ? 8 : 20, left: 8, bottom: 4 }}
        barCategoryGap="32%"
      >
        <CartesianGrid
          strokeDasharray="0"
          stroke={gridColor}
          horizontal={false}
          strokeOpacity={1}
        />
        <XAxis
          type="number"
          tick={{ fill: tickColor, fontSize: isMobile ? 10 : 11, fontFamily: '"Geist Mono", monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="name"
          type="category"
          width={yAxisWidth}
          tick={{ fill: tickColor, fontSize: isMobile ? 10 : 11, fontFamily: '"Geist", sans-serif' }}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <Tooltip
          content={<CustomTooltip dark={darkMode} />}
          cursor={{ fill: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}
        />
        <Bar
          dataKey="value"
          name="Suppliers"
          maxBarSize={isMobile ? 14 : 20}
          radius={[0, 3, 3, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.value)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SuppliersByCountryChart;
