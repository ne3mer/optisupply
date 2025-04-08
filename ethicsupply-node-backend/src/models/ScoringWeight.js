const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ScoringWeightSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: String,
      default: "system",
      trim: true,
    },

    // Main category weights
    environmental_weight: {
      type: Number,
      default: 0.33,
    },
    social_weight: {
      type: Number,
      default: 0.33,
    },
    governance_weight: {
      type: Number,
      default: 0.34,
    },
    external_data_weight: {
      type: Number,
      default: 0.25,
    },

    // Environmental subcategory weights
    co2_weight: {
      type: Number,
      default: 0.25,
    },
    water_usage_weight: {
      type: Number,
      default: 0.25,
    },
    energy_efficiency_weight: {
      type: Number,
      default: 0.25,
    },
    waste_management_weight: {
      type: Number,
      default: 0.25,
    },

    // Social subcategory weights
    wage_fairness_weight: {
      type: Number,
      default: 0.25,
    },
    human_rights_weight: {
      type: Number,
      default: 0.25,
    },
    diversity_inclusion_weight: {
      type: Number,
      default: 0.25,
    },
    community_engagement_weight: {
      type: Number,
      default: 0.25,
    },

    // Governance subcategory weights
    transparency_weight: {
      type: Number,
      default: 0.5,
    },
    corruption_risk_weight: {
      type: Number,
      default: 0.5,
    },

    // External data subcategory weights
    social_media_weight: {
      type: Number,
      default: 0.25,
    },
    news_coverage_weight: {
      type: Number,
      default: 0.25,
    },
    worker_reviews_weight: {
      type: Number,
      default: 0.25,
    },
    controversy_weight: {
      type: Number,
      default: 0.25,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Create a default scoring weight if none exists
ScoringWeightSchema.statics.createDefault = async function () {
  const count = await this.countDocuments({ is_default: true });
  if (count === 0) {
    return this.create({
      name: "Default Scoring Weights",
      description: "System default scoring weights",
      is_default: true,
      created_by: "system",
      // All other fields will use default values defined in the schema
    });
  }
  return this.findOne({ is_default: true });
};

module.exports = mongoose.model("ScoringWeight", ScoringWeightSchema);
