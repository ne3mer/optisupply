const mongoose = require("mongoose");

/**
 * Calculation Trace Schema
 * Stores the step-by-step calculation process for each supplier scoring
 * Used for transparency and auditability
 */
const CalculationTraceSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    settingsSnapshot: {
      type: Object,
      required: true,
      description: "Snapshot of scoring settings used",
    },
    steps: [
      {
        name: {
          type: String,
          required: true,
          enum: ["raw", "normalized", "weighted", "composite"],
        },
        description: String,
        values: {
          type: Object,
          required: true,
        },
        metadata: {
          type: Object,
          default: {},
        },
      },
    ],
    finalScore: {
      type: Number,
      required: true,
    },
    pillarScores: {
      environmental: Number,
      social: Number,
      governance: Number,
    },
    riskPenalty: Number,
    completeness: Number,
    version: {
      type: String,
      default: "1.0",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
CalculationTraceSchema.index({ supplierId: 1, timestamp: -1 });

// Static method to create trace from scoring breakdown
CalculationTraceSchema.statics.createFromBreakdown = async function (
  supplierId,
  supplierName,
  breakdown,
  settings
) {
  const steps = [];

  // Step 1: Raw values
  const rawValues = {};
  Object.keys(breakdown.normalizedMetrics).forEach((metric) => {
    rawValues[metric] = breakdown.normalizedMetrics[metric].raw;
  });
  steps.push({
    name: "raw",
    description: "Raw metric values from supplier data",
    values: rawValues,
  });

  // Step 2: Normalized values
  const normalizedValues = {};
  Object.keys(breakdown.normalizedMetrics).forEach((metric) => {
    normalizedValues[metric] = breakdown.normalizedMetrics[metric].normalized;
  });
  steps.push({
    name: "normalized",
    description: "Industry-band normalized values (0-1 scale)",
    values: normalizedValues,
    metadata: {
      useIndustryBands: settings?.useIndustryBands,
      imputedCount: Object.values(breakdown.normalizedMetrics).filter(
        (m) => m.imputed
      ).length,
    },
  });

  // Step 3: Weighted pillar scores
  steps.push({
    name: "weighted",
    description: "Weighted aggregation into pillar scores",
    values: {
      environmental: breakdown.pillarScores.environmental,
      social: breakdown.pillarScores.social,
      governance: breakdown.pillarScores.governance,
    },
    metadata: {
      weights: {
        environmental: settings?.environmentalWeight,
        social: settings?.socialWeight,
        governance: settings?.governanceWeight,
      },
    },
  });

  // Step 4: Composite score
  steps.push({
    name: "composite",
    description: "Final composite score with risk penalty applied",
    values: {
      baseComposite: breakdown.compositeScore,
      riskPenalty: breakdown.riskPenalty || 0,
      finalScore: breakdown.finalScore,
    },
    metadata: {
      riskPenaltyEnabled: settings?.riskPenaltyEnabled,
    },
  });

  return await this.create({
    supplierId,
    supplierName,
    settingsSnapshot: settings,
    steps,
    finalScore: breakdown.finalScore,
    pillarScores: breakdown.pillarScores,
    riskPenalty: breakdown.riskPenalty,
    completeness: breakdown.completenessRatio,
  });
};

// Static method to get latest trace for supplier
CalculationTraceSchema.statics.getLatestForSupplier = async function (
  supplierId
) {
  return await this.findOne({ supplierId })
    .sort({ timestamp: -1 })
    .lean();
};

// Static method to get traceability rate (% with complete traces)
CalculationTraceSchema.statics.getTraceabilityRate = async function () {
  const totalSuppliers = await mongoose.model("Supplier").countDocuments();
  if (totalSuppliers === 0) return 0;

  const suppliersWithTraces = await this.distinct("supplierId");
  return (suppliersWithTraces.length / totalSuppliers) * 100;
};

// Static method to get mean steps count
CalculationTraceSchema.statics.getMeanStepsCount = async function () {
  const result = await this.aggregate([
    {
      $group: {
        _id: "$supplierId",
        latestTrace: { $last: "$$ROOT" },
      },
    },
    {
      $project: {
        stepsCount: { $size: "$latestTrace.steps" },
      },
    },
    {
      $group: {
        _id: null,
        meanSteps: { $avg: "$stepsCount" },
      },
    },
  ]);

  return result.length > 0 ? result[0].meanSteps : 0;
};

module.exports = mongoose.model("CalculationTrace", CalculationTraceSchema);

