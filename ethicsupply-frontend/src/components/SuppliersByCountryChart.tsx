import React, { useMemo } from "react";
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

interface SupplierCountData {
  name: string;
  value: number;
}

interface SuppliersByCountryChartProps {
  suppliersByCountry: Record<string, number>;
}

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "rgba(20,20,30,0.95)",
          color: "#E0E0FF",
          padding: "10px",
          border: "1px solid rgba(120,120,200,0.5)",
          borderRadius: "4px",
          }}
      >
        <p style={{ margin: 0 }}>
          <strong>{payload[0].payload.name}</strong>
        </p>
        <p style={{ margin: 0 }}>{payload[0].value} suppliers</p>
      </div>
    );
  }

  return null;
};

const SuppliersByCountryChart: React.FC<SuppliersByCountryChartProps> = ({
  suppliersByCountry,
}) => {
  // Transform data and sort by count in descending order
  const data = useMemo(() => {
    // Convert the object to an array of { name, value } objects
    const dataArray = Object.entries(suppliersByCountry || {}).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    // Sort by value in descending order and filter out zero values
    return dataArray
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 15); // Limit to top 15 countries
  }, [suppliersByCountry]);

  // Dynamic color scale from red -> yellow -> green based on relative value
  const maxVal = useMemo(() => (data.length ? Math.max(...data.map((d) => d.value)) : 0), [data]);
  const getColor = (value: number, index: number) => {
    if (!maxVal) {
      // fallback multi-color palette
      const palette = [
        "#4D5BFF",
        "#00F0FF",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#a78bfa",
        "#38bdf8",
        "#f472b6",
        "#22c55e",
        "#f97316",
      ];
      return palette[index % palette.length];
    }
    const t = Math.max(0, Math.min(1, value / maxVal));
    // 0 -> red(0deg), 0.5 -> yellow(60deg), 1 -> green(120deg)
    const hue = 120 * t; // 0..120
    return `hsl(${hue.toFixed(0)}, 70%, 50%)`;
  };

  // Compute Y axis width based on longest label (approx 7px per char)
  const yAxisWidth = useMemo(() => {
    const longest = data.reduce((m, d) => Math.max(m, (d.name || "").length), 0);
    return Math.max(70, Math.min(180, longest * 7));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 16,
          right: 20,
          left: 10,
          bottom: 8,
        }}
        layout="vertical"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={true}
          vertical={false}
        />
        <XAxis type="number" tick={{ fill: "#8A94C8", fontSize: 12 }} />
        <YAxis
          dataKey="name"
          type="category"
          width={yAxisWidth}
          tick={{ fill: "#8A94C8", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          interval={0} // Show all labels
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="value"
          name="Suppliers"
          barSize={18}
          radius={[4, 4, 4, 4]}
          background={{ fill: "rgba(100, 100, 150, 0.15)" }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.value, index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SuppliersByCountryChart;
