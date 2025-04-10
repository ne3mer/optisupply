import React from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions: ChartOptions<"bar" | "line" | "pie"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
  },
};

export const BarChart = () => {
  const data: ChartData<"bar"> = {
    labels: ["North America", "Europe", "Asia", "Africa", "South America"],
    datasets: [
      {
        label: "Suppliers",
        data: [65, 59, 80, 81, 56],
        backgroundColor: "rgba(14, 165, 233, 0.5)",
        borderColor: "rgb(14, 165, 233)",
        borderWidth: 1,
      },
    ],
  };

  return React.createElement(Bar, { options: chartOptions, data });
};

export const LineChart = () => {
  const data: ChartData<"line"> = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Compliance Score",
        data: [65, 59, 80, 81, 56, 55],
        fill: false,
        borderColor: "rgb(34, 197, 94)",
        tension: 0.1,
      },
    ],
  };

  return React.createElement(Line, { options: chartOptions, data });
};

export const PieChart = () => {
  const data: ChartData<"pie"> = {
    labels: ["High Risk", "Medium Risk", "Low Risk"],
    datasets: [
      {
        data: [30, 50, 20],
        backgroundColor: [
          "rgba(239, 68, 68, 0.5)",
          "rgba(234, 179, 8, 0.5)",
          "rgba(34, 197, 94, 0.5)",
        ],
        borderColor: [
          "rgb(239, 68, 68)",
          "rgb(234, 179, 8)",
          "rgb(34, 197, 94)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return React.createElement(Pie, { options: chartOptions, data });
};
