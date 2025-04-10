import React from "react";
import { motion } from "framer-motion";

interface DashboardFiltersProps {
  onTimePeriodChange: (period: string) => void;
  onRegionChange: (region: string) => void;
  onIndustryChange: (industry: string) => void;
  onCriteriaWeightChange: (criteria: string, weight: number) => void;
  selectedTimePeriod: string;
  selectedRegion: string;
  selectedIndustry: string;
  criteriaWeights: {
    cost: number;
    ethics: number;
    environmental: number;
    quality: number;
  };
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  onTimePeriodChange,
  onRegionChange,
  onIndustryChange,
  onCriteriaWeightChange,
  selectedTimePeriod,
  selectedRegion,
  selectedIndustry,
  criteriaWeights,
}) => {
  const timePeriods = [
    "Last 6 Months",
    "Last Year",
    "Last 2 Years",
    "All Time",
  ];
  const regions = [
    "Global",
    "North America",
    "Europe",
    "Asia",
    "South America",
    "Africa",
  ];
  const industries = [
    "All",
    "Manufacturing",
    "Technology",
    "Agriculture",
    "Retail",
    "Services",
  ];

  return (
    <div className="bg-panel rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-textPrimary mb-4">
        Dashboard Filters
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <h4 className="text-sm font-medium text-textSecondary mb-2">
            Time Period
          </h4>
          <div className="flex flex-wrap gap-2">
            {timePeriods.map((period) => (
              <motion.button
                key={period}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTimePeriodChange(period)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTimePeriod === period
                    ? "bg-primary text-white"
                    : "bg-panel border border-border text-textSecondary"
                }`}
              >
                {period}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-textSecondary mb-2">
            Region
          </h4>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => (
              <motion.button
                key={region}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onRegionChange(region)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedRegion === region
                    ? "bg-primary text-white"
                    : "bg-panel border border-border text-textSecondary"
                }`}
              >
                {region}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-textSecondary mb-2">
            Industry
          </h4>
          <div className="flex flex-wrap gap-2">
            {industries.map((industry) => (
              <motion.button
                key={industry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onIndustryChange(industry)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedIndustry === industry
                    ? "bg-primary text-white"
                    : "bg-panel border border-border text-textSecondary"
                }`}
              >
                {industry}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-textSecondary mb-2">
            Criteria Weights
          </h4>
          <div className="space-y-2">
            <div>
              <label className="text-sm text-textSecondary">Cost</label>
              <input
                type="range"
                min="0"
                max="100"
                value={criteriaWeights.cost}
                onChange={(e) =>
                  onCriteriaWeightChange("cost", parseInt(e.target.value))
                }
                className="w-full"
              />
              <span className="text-sm text-textSecondary">
                {criteriaWeights.cost}%
              </span>
            </div>
            <div>
              <label className="text-sm text-textSecondary">Ethics</label>
              <input
                type="range"
                min="0"
                max="100"
                value={criteriaWeights.ethics}
                onChange={(e) =>
                  onCriteriaWeightChange("ethics", parseInt(e.target.value))
                }
                className="w-full"
              />
              <span className="text-sm text-textSecondary">
                {criteriaWeights.ethics}%
              </span>
            </div>
            <div>
              <label className="text-sm text-textSecondary">
                Environmental
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={criteriaWeights.environmental}
                onChange={(e) =>
                  onCriteriaWeightChange(
                    "environmental",
                    parseInt(e.target.value)
                  )
                }
                className="w-full"
              />
              <span className="text-sm text-textSecondary">
                {criteriaWeights.environmental}%
              </span>
            </div>
            <div>
              <label className="text-sm text-textSecondary">Quality</label>
              <input
                type="range"
                min="0"
                max="100"
                value={criteriaWeights.quality}
                onChange={(e) =>
                  onCriteriaWeightChange("quality", parseInt(e.target.value))
                }
                className="w-full"
              />
              <span className="text-sm text-textSecondary">
                {criteriaWeights.quality}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
