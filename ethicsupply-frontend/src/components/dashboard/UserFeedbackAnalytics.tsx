import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface FeedbackData {
  trustScore: number;
  satisfactionRating: number;
  comments: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface UserFeedbackAnalyticsProps {
  data: FeedbackData;
}

const UserFeedbackAnalytics: React.FC<UserFeedbackAnalyticsProps> = ({
  data,
}) => {
  const trustData = {
    labels: ["Trust Score"],
    datasets: [
      {
        data: [data.trustScore, 100 - data.trustScore],
        backgroundColor: ["rgba(0, 255, 71, 0.5)", "rgba(255, 58, 94, 0.1)"],
        borderColor: ["rgba(0, 255, 71, 1)", "rgba(255, 58, 94, 0.2)"],
        borderWidth: 1,
      },
    ],
  };

  const satisfactionData = {
    labels: ["Satisfaction Rating"],
    datasets: [
      {
        data: [data.satisfactionRating, 100 - data.satisfactionRating],
        backgroundColor: ["rgba(255, 199, 0, 0.5)", "rgba(255, 199, 0, 0.1)"],
        borderColor: ["rgba(255, 199, 0, 1)", "rgba(255, 199, 0, 0.2)"],
        borderWidth: 1,
      },
    ],
  };

  const commentsData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        data: [
          data.comments.positive,
          data.comments.neutral,
          data.comments.negative,
        ],
        backgroundColor: [
          "rgba(0, 255, 71, 0.5)",
          "rgba(255, 199, 0, 0.5)",
          "rgba(255, 58, 94, 0.5)",
        ],
        borderColor: [
          "rgba(0, 255, 71, 1)",
          "rgba(255, 199, 0, 1)",
          "rgba(255, 58, 94, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.raw}%`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-panel rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-textPrimary mb-4">
        User Feedback Analytics
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="text-lg font-medium text-textSecondary mb-2">
            Trust Score
          </h4>
          <div className="h-[200px]">
            <Pie data={trustData} options={chartOptions} />
          </div>
        </div>
        <div>
          <h4 className="text-lg font-medium text-textSecondary mb-2">
            Satisfaction Rating
          </h4>
          <div className="h-[200px]">
            <Pie data={satisfactionData} options={chartOptions} />
          </div>
        </div>
        <div>
          <h4 className="text-lg font-medium text-textSecondary mb-2">
            Feedback Comments
          </h4>
          <div className="h-[200px]">
            <Pie data={commentsData} options={chartOptions} />
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-panel rounded-lg p-4">
          <h4 className="text-sm font-medium text-textSecondary">
            Average Trust Score
          </h4>
          <p className="text-2xl font-bold text-[#00FF47]">
            {data.trustScore}%
          </p>
        </div>
        <div className="bg-panel rounded-lg p-4">
          <h4 className="text-sm font-medium text-textSecondary">
            Satisfaction Rating
          </h4>
          <p className="text-2xl font-bold text-[#FFC700]">
            {data.satisfactionRating}%
          </p>
        </div>
        <div className="bg-panel rounded-lg p-4">
          <h4 className="text-sm font-medium text-textSecondary">
            Positive Feedback
          </h4>
          <p className="text-2xl font-bold text-[#00FF47]">
            {data.comments.positive}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserFeedbackAnalytics;
