import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SustainabilityData {
  timeline: string[];
  ethicalSuppliers: number[];
  carbonSavings: number[];
  fairTradePercentage: number[];
}

interface SustainabilityTrackerProps {
  data: SustainabilityData;
}

const SustainabilityTracker: React.FC<SustainabilityTrackerProps> = ({
  data,
}) => {
  const chartData = {
    labels: data.timeline,
    datasets: [
      {
        label: "Ethical Suppliers",
        data: data.ethicalSuppliers,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
      },
      {
        label: "Carbon Savings (tons)",
        data: data.carbonSavings,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.1,
      },
      {
        label: "Fair Trade %",
        data: data.fairTradePercentage,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        tension: 0.1,
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
        text: "Sustainability Progress Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Calculate total impact
  const totalImpact = {
    ethicalSuppliers: data.ethicalSuppliers[data.ethicalSuppliers.length - 1],
    carbonSavings: data.carbonSavings[data.carbonSavings.length - 1],
    fairTradePercentage:
      data.fairTradePercentage[data.fairTradePercentage.length - 1],
  };

  return (
    <div className="bg-panel rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-textPrimary mb-4">
        Sustainability Contribution Tracker
      </h3>
      <div className="h-[400px]">
        <Line data={chartData} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-panel rounded-lg p-4">
          <h4 className="text-sm font-medium text-textSecondary">
            Total Ethical Suppliers
          </h4>
          <p className="text-2xl font-bold text-primary">
            {totalImpact.ethicalSuppliers}
          </p>
        </div>
        <div className="bg-panel rounded-lg p-4">
          <h4 className="text-sm font-medium text-textSecondary">
            Total Carbon Savings
          </h4>
          <p className="text-2xl font-bold text-success">
            {totalImpact.carbonSavings} tons
          </p>
        </div>
        <div className="bg-panel rounded-lg p-4">
          <h4 className="text-sm font-medium text-textSecondary">
            Fair Trade Percentage
          </h4>
          <p className="text-2xl font-bold text-accent">
            {totalImpact.fairTradePercentage}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default SustainabilityTracker;
