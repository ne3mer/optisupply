import React from "react";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface SupplierTradeOff {
  name: string;
  cost: number;
  ethicsScore: number;
  overallScore: number;
}

interface TradeOffAnalysisProps {
  suppliers: SupplierTradeOff[];
}

const TradeOffAnalysis: React.FC<TradeOffAnalysisProps> = ({ suppliers }) => {
  const data = {
    datasets: [
      {
        label: "Suppliers",
        data: suppliers.map((supplier) => ({
          x: supplier.cost,
          y: supplier.ethicsScore,
          r: supplier.overallScore * 2, // Bubble size based on overall score
        })),
        backgroundColor: suppliers.map((supplier) => {
          // Color based on overall score
          if (supplier.overallScore >= 8) return "rgba(0, 255, 71, 0.5)";
          if (supplier.overallScore >= 6) return "rgba(255, 199, 0, 0.5)";
          if (supplier.overallScore >= 4) return "rgba(255, 125, 255, 0.5)";
          return "rgba(255, 58, 94, 0.5)";
        }),
        borderColor: suppliers.map((supplier) => {
          if (supplier.overallScore >= 8) return "rgba(0, 255, 71, 1)";
          if (supplier.overallScore >= 6) return "rgba(255, 199, 0, 1)";
          if (supplier.overallScore >= 4) return "rgba(255, 125, 255, 1)";
          return "rgba(255, 58, 94, 1)";
        }),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const supplier = suppliers[context.dataIndex];
            return [
              `Supplier: ${supplier.name}`,
              `Cost: $${supplier.cost}`,
              `Ethics Score: ${supplier.ethicsScore}/10`,
              `Overall Score: ${supplier.overallScore}/10`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Cost ($)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Ethics Score",
        },
        min: 0,
        max: 10,
      },
    },
  };

  return (
    <div className="bg-panel rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-textPrimary mb-4">
        Ethics vs. Cost Trade-Off Analysis
      </h3>
      <div className="h-[500px]">
        <Scatter data={data} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-[#00FF47] mr-2" />
          <span className="text-sm">High Overall (8-10)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-[#FFC700] mr-2" />
          <span className="text-sm">Medium Overall (6-7)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-[#FF7DFF] mr-2" />
          <span className="text-sm">Low Overall (4-5)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-[#FF3A5E] mr-2" />
          <span className="text-sm">Poor Overall (0-3)</span>
        </div>
      </div>
    </div>
  );
};

export default TradeOffAnalysis;
