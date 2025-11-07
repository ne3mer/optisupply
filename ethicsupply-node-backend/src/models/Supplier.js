const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SupplierSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    revenue: {
      type: Number,
      default: 0,
      description: "Revenue in millions of dollars",
    },
    employee_count: {
      type: Number,
      default: 0,
    },
    co2_emissions: {
      type: Number,
      default: 0,
    },
    total_emissions: {
      type: Number,
      default: 0,
    },
    delivery_efficiency: {
      type: Number,
      default: 0,
    },
    wage_fairness: {
      type: Number,
      default: 0,
    },
    human_rights_index: {
      type: Number,
      default: 0,
    },
    waste_management_score: {
      type: Number,
      default: 0,
    },
    community_engagement: {
      type: Number,
      default: 0.5,
    },
    energy_efficiency: {
      type: Number,
      default: 0.5,
    },
    water_usage: {
      type: Number,
      default: 50,
    },
    renewable_energy_percent: {
      type: Number,
      default: 0,
    },
    pollution_control: {
      type: Number,
      default: 0.5,
    },
    waste_generated: {
      type: Number,
      default: 0,
    },
    injury_rate: {
      type: Number,
      default: 0,
    },
    training_hours: {
      type: Number,
      default: 0,
    },
    living_wage_ratio: {
      type: Number,
      default: 1,
    },
    diversity_inclusion_score: {
      type: Number,
      default: 0.5,
    },
    gender_diversity_percent: {
      type: Number,
      default: 0,
    },
    worker_safety: {
      type: Number,
      default: 0.5,
    },
    transparency_score: {
      type: Number,
      default: 0.5,
    },
    corruption_risk: {
      type: Number,
      default: 0.5,
    },
    board_diversity: {
      type: Number,
      default: 0.5,
    },
    board_independence: {
      type: Number,
      default: 0.5,
    },
    ethics_program: {
      type: Number,
      default: 0.5,
    },
    compliance_systems: {
      type: Number,
      default: 0.5,
    },
    quality_control_score: {
      type: Number,
      default: 0.5,
    },
    supplier_diversity: {
      type: Number,
      default: 0.5,
    },
    traceability: {
      type: Number,
      default: 0.5,
    },
    geopolitical_risk: {
      type: Number,
      default: 0.5,
    },
    climate_risk: {
      type: Number,
      default: 0.5,
    },
    labor_dispute_risk: {
      type: Number,
      default: 0.5,
    },
    anti_corruption_policy: {
      type: Boolean,
      default: false,
    },
    ethical_score: {
      type: Number,
    },
    environmental_score: {
      type: Number,
    },
    social_score: {
      type: Number,
    },
    governance_score: {
      type: Number,
    },
    risk_level: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
    },
    risk_factor: {
      type: Number,
      default: 0.5,
    },
    risk_penalty: {
      type: Number,
      default: null,
      description: "Risk penalty value (0-100) or null if disabled",
    },
    composite_score: {
      type: Number,
    },
    completeness_ratio: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting ESG reports
SupplierSchema.virtual("esg_reports", {
  ref: "SupplierESGReport",
  localField: "_id",
  foreignField: "supplier",
});

// Virtual for getting media sentiments
SupplierSchema.virtual("media_sentiments", {
  ref: "MediaSentiment",
  localField: "_id",
  foreignField: "supplier",
});

// Virtual for getting controversies
SupplierSchema.virtual("controversies", {
  ref: "Controversy",
  localField: "_id",
  foreignField: "supplier",
});

module.exports = mongoose.model("Supplier", SupplierSchema);
