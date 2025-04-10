import React from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface SupplierData {
  name: string;
  costScore: number;
  ethicalScore: number;
  environmentalScore: number;
  overallSuitability: number;
}

interface SupplierComparisonChartProps {
  suppliers: SupplierData[];
}

const SupplierComparisonChart: React.FC<SupplierComparisonChartProps> = ({
  suppliers,
}) => {
  const data = {
    labels: [
      "Cost Score",
      "Ethical Score",
      "Environmental Score",
      "Overall Suitability",
    ],
    datasets: suppliers.map((supplier, index) => ({
      label: supplier.name,
      data: [
        supplier.costScore,
        supplier.ethicalScore,
        supplier.environmentalScore,
        supplier.overallSuitability,
      ],
      backgroundColor: `rgba(${index * 50}, ${index * 100}, ${
        index * 150
      }, 0.2)`,
      borderColor: `rgba(${index * 50}, ${index * 100}, ${index * 150}, 1)`,
      borderWidth: 2,
      pointBackgroundColor: `rgba(${index * 50}, ${index * 100}, ${
        index * 150
      }, 1)`,
    })),
  };

  const options = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw}%`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-panel rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-textPrimary mb-4">
        Supplier Comparison
      </h3>
      <div className="h-[400px]">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
};

export default SupplierComparisonChart;
