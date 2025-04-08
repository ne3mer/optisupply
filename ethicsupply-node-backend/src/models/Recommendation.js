const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RecommendationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["environmental", "social", "governance", "other"],
      default: "other",
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },
    ai_explanation: {
      reasoning: String,
      impact_assessment: String,
      implementation_difficulty: String,
      timeframe: String,
      comparative_insights: [String],
    },
    estimated_impact: {
      score_improvement: Number,
      cost_savings: Number,
      implementation_time: Number,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Recommendation", RecommendationSchema);
