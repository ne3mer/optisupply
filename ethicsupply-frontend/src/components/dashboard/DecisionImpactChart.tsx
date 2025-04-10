import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ImpactData {
  originalChoice: {
    cost: number;
    ethicalScore: number;
    environmentalScore: number;
  };
  ethicSupplyChoice: {
    cost: number;
    ethicalScore: number;
    environmentalScore: number;
  };
  projectedImpact: {
    costSavings: number;
    ethicalImprovement: number;
    environmentalImprovement: number;
  };
}

interface DecisionImpactChartProps {
  data: ImpactData;
}

const DecisionImpactChart: React.FC<DecisionImpactChartProps> = ({ data }) => {
  const chartData = {
    labels: ["Cost", "Ethical Score", "Environmental Score"],
    datasets: [
      {
        label: "Original Choice",
        data: [
          data.originalChoice.cost,
          data.originalChoice.ethicalScore,
          data.originalChoice.environmentalScore,
        ],
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "EthicSupply Recommendation",
        data: [
          data.ethicSupplyChoice.cost,
          data.ethicSupplyChoice.ethicalScore,
          data.ethicSupplyChoice.environmentalScore,
        ],
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
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
      title: {
        display: true,
        text: "Decision Impact Analysis",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-panel rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-textPrimary mb-4">
        Decision Impact Summary
      </h3>
      <div className="h-[400px]">
        <Bar data={chartData} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-panel rounded-lg p-4">
          <h4 className="text-sm font-medium text-textSecondary">
            Cost Savings
          </h4>
          <p className="text-2xl font-bold text-success">
            {data.projectedImpact.costSavings}%
          </p>
        </div>
        <div className="bg-panel rounded-lg p-4">
          <h4 className="text-sm font-medium text-textSecondary">
            Ethical Improvement
          </h4>
          <p className="text-2xl font-bold text-primary">
            {data.projectedImpact.ethicalImprovement}%
          </p>
        </div>
        <div className="bg-panel rounded-lg p-4">
          <h4 className="text-sm font-medium text-textSecondary">
            Environmental Impact
          </h4>
          <p className="text-2xl font-bold text-accent">
            {data.projectedImpact.environmentalImprovement}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default DecisionImpactChart;
