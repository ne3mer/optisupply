const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ScoringSettingsSchema = new Schema(
  {
    // Normalization settings
    useIndustryBands: {
      type: Boolean,
      default: true,
      description: "If true, use industry-specific bands; if false, use global min/max",
    },

    // Composite ESG weights (E, S, G)
    environmentalWeight: {
      type: Number,
      default: 0.4,
      min: 0,
      max: 1,
    },
    socialWeight: {
      type: Number,
      default: 0.3,
      min: 0,
      max: 1,
    },
    governanceWeight: {
      type: Number,
      default: 0.3,
      min: 0,
      max: 1,
    },

    // Environmental metric weights
    emissionIntensityWeight: { type: Number, default: 0.4, min: 0, max: 1 },
    renewableShareWeight: { type: Number, default: 0.2, min: 0, max: 1 },
    waterIntensityWeight: { type: Number, default: 0.2, min: 0, max: 1 },
    wasteIntensityWeight: { type: Number, default: 0.2, min: 0, max: 1 },

    // Social metric weights
    injuryRateWeight: { type: Number, default: 0.3, min: 0, max: 1 },
    trainingHoursWeight: { type: Number, default: 0.2, min: 0, max: 1 },
    wageRatioWeight: { type: Number, default: 0.2, min: 0, max: 1 },
    diversityWeight: { type: Number, default: 0.3, min: 0, max: 1 },

    // Governance metric weights
    boardDiversityWeight: { type: Number, default: 0.25, min: 0, max: 1 },
    boardIndependenceWeight: { type: Number, default: 0.25, min: 0, max: 1 },
    antiCorruptionWeight: { type: Number, default: 0.2, min: 0, max: 1 },
    transparencyWeight: { type: Number, default: 0.3, min: 0, max: 1 },

    // Risk settings
    riskPenaltyEnabled: {
      type: Boolean,
      default: true,
    },
    defaultRiskFactor: {
      type: Number,
      default: 0.15,
      min: 0,
      max: 1,
    },
    // Risk penalty weights (must sum to ~1.0)
    riskWeightGeopolitical: {
      type: Number,
      default: 0.33,
      min: 0,
      max: 1,
    },
    riskWeightClimate: {
      type: Number,
      default: 0.33,
      min: 0,
      max: 1,
    },
    riskWeightLabor: {
      type: Number,
      default: 0.34,
      min: 0,
      max: 1,
    },
    // Risk penalty threshold T (0-1)
    riskThreshold: {
      type: Number,
      default: 0.3,
      min: 0,
      max: 1,
    },
    // Risk penalty lambda (scaling factor, > 0)
    riskLambda: {
      type: Number,
      default: 1.0,
      min: 0.01,
    },

    // Metadata
    isDefault: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Ensure only one default settings exists
ScoringSettingsSchema.statics.getDefault = async function () {
  let settings = await this.findOne({ isDefault: true });
  if (!settings) {
    settings = await this.create({
      isDefault: true,
      useIndustryBands: true,
      environmentalWeight: 0.4,
      socialWeight: 0.3,
      governanceWeight: 0.3,
      // ... other defaults from schema
    });
  }
  return settings;
};

ScoringSettingsSchema.statics.updateDefault = async function (updates) {
  const settings = await this.getDefault();
  Object.assign(settings, updates);
  await settings.save();
  return settings;
};

module.exports = mongoose.model("ScoringSettings", ScoringSettingsSchema);

