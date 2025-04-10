import React from "react";
import { motion } from "framer-motion";

interface Supplier {
  name: string;
  totalScore: number;
  strengths: string[];
  ethicalScore: number;
  environmentalScore: number;
  costScore: number;
}

interface SupplierLeaderboardProps {
  suppliers: Supplier[];
}

const SupplierLeaderboard: React.FC<SupplierLeaderboardProps> = ({
  suppliers,
}) => {
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 0:
        return "text-yellow-400";
      case 1:
        return "text-gray-400";
      case 2:
        return "text-amber-600";
      default:
        return "text-textSecondary";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-[#00FF47]";
    if (score >= 6) return "text-[#FFC700]";
    if (score >= 4) return "text-[#FF7DFF]";
    return "text-[#FF3A5E]";
  };

  return (
    <div className="bg-panel rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-textPrimary mb-4">
        Top Performing Suppliers
      </h3>
      <div className="space-y-4">
        {suppliers.map((supplier, index) => (
          <motion.div
            key={supplier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-panel rounded-lg p-4 border border-border"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span
                  className={`text-2xl font-bold mr-4 ${getMedalColor(index)}`}
                >
                  {index + 1}
                </span>
                <div>
                  <h4 className="text-lg font-semibold text-textPrimary">
                    {supplier.name}
                  </h4>
                  <div className="flex gap-2 mt-1">
                    {supplier.strengths.map((strength, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${getScoreColor(
                    supplier.totalScore
                  )}`}
                >
                  {supplier.totalScore.toFixed(1)}
                </div>
                <div className="text-sm text-textSecondary">Overall Score</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-sm text-textSecondary">Ethical Score</div>
                <div
                  className={`font-semibold ${getScoreColor(
                    supplier.ethicalScore
                  )}`}
                >
                  {supplier.ethicalScore.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-textSecondary">
                  Environmental Score
                </div>
                <div
                  className={`font-semibold ${getScoreColor(
                    supplier.environmentalScore
                  )}`}
                >
                  {supplier.environmentalScore.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-textSecondary">Cost Score</div>
                <div
                  className={`font-semibold ${getScoreColor(
                    supplier.costScore
                  )}`}
                >
                  {supplier.costScore.toFixed(1)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SupplierLeaderboard;
