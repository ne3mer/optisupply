const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SupplierESGReportSchema = new Schema(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    report_year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    report_url: {
      type: String,
      trim: true,
    },
    report_title: {
      type: String,
      trim: true,
    },
    co2_emissions: {
      type: Number,
      min: 0,
    },
    water_usage: {
      type: Number,
      min: 0,
    },
    energy_consumption: {
      type: Number,
      min: 0,
    },
    waste_produced: {
      type: Number,
      min: 0,
    },
    renewable_energy_percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    diversity_stats: {
      type: Object,
      default: {},
    },
    employee_turnover: {
      type: Number,
      min: 0,
      max: 100,
    },
    employee_training_hours: {
      type: Number,
      min: 0,
    },
    health_safety_incidents: {
      type: Number,
      min: 0,
    },
    community_investment: {
      type: Number,
      min: 0,
    },
    data_quality_score: {
      type: Number,
      min: 0,
      max: 10,
      default: 5,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Index for faster queries
SupplierESGReportSchema.index({ supplier: 1, report_year: -1 });

// Get the most recent report for a supplier
SupplierESGReportSchema.statics.getMostRecent = function (supplierId) {
  return this.findOne({ supplier: supplierId }).sort({
    report_year: -1,
    created_at: -1,
  });
};

// Calculate year-over-year improvement for a specific metric
SupplierESGReportSchema.statics.calculateYoYImprovement = async function (
  supplierId,
  metric
) {
  if (!this.schema.paths[metric]) {
    throw new Error(`Invalid metric: ${metric}`);
  }

  const reports = await this.find({ supplier: supplierId })
    .sort({ report_year: -1 })
    .limit(2);

  if (reports.length < 2 || !reports[0][metric] || !reports[1][metric]) {
    return null; // Cannot calculate improvement
  }

  const current = reports[0][metric];
  const previous = reports[1][metric];

  // For metrics where lower is better (emissions, waste, etc.)
  const isLowerBetter = [
    "co2_emissions",
    "water_usage",
    "energy_consumption",
    "waste_produced",
    "employee_turnover",
    "health_safety_incidents",
  ].includes(metric);

  if (isLowerBetter) {
    return (previous - current) / previous; // Positive means improvement
  } else {
    return (current - previous) / previous; // Positive means improvement
  }
};

module.exports = mongoose.model("SupplierESGReport", SupplierESGReportSchema);
