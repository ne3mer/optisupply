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
          backgroundColor: "#333",
          color: "#fff",
          padding: "10px",
          border: "1px solid #666",
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

  // Set of colors for the chart
  const chartColors = [
    "#8884d8",
    "#83a6ed",
    "#8dd1e1",
    "#82ca9d",
    "#a4de6c",
    "#d0ed57",
    "#ffc658",
    "#ff8042",
    "#ff5252",
    "#ff758f",
    "#d3b5ff",
    "#84d2ff",
    "#8be3a0",
    "#ffeca0",
    "#ff9a9a",
  ];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 80, // Increased for longer country names
          bottom: 5,
        }}
        layout="vertical"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={true}
          vertical={false}
        />
        <XAxis type="number" />
        <YAxis
          dataKey="name"
          type="category"
          width={70}
          interval={0} // Show all labels
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="value"
          name="Suppliers"
          fill={chartColors[0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SuppliersByCountryChart;
