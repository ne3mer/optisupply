const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AnalysisResultSchema = new Schema(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    analysis_type: {
      type: String,
      required: true,
      enum: [
        "ethical",
        "environmental",
        "social",
        "governance",
        "comprehensive",
      ],
      default: "comprehensive",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "in_progress", "completed", "failed"],
      default: "pending",
    },
    scores: {
      overall: {
        type: Number,
        min: 0,
        max: 100,
      },
      environmental: {
        type: Number,
        min: 0,
        max: 100,
      },
      social: {
        type: Number,
        min: 0,
        max: 100,
      },
      governance: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    factors: [
      {
        name: String,
        value: Number,
        weight: Number,
        description: String,
      },
    ],
    benchmarks: {
      industry_average: Number,
      industry_best: Number,
      industry_worst: Number,
      global_average: Number,
    },
    insights: [
      {
        type: String,
        text: String,
        severity: {
          type: String,
          enum: ["positive", "neutral", "negative"],
        },
        impact_score: Number,
      },
    ],
    methodology: {
      version: String,
      description: String,
      data_sources: [String],
    },
    processed_by: {
      type: String,
      enum: ["ai", "human", "hybrid"],
      default: "ai",
    },
    confidence_score: {
      type: Number,
      min: 0,
      max: 1,
    },
    raw_data: Schema.Types.Mixed,
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("AnalysisResult", AnalysisResultSchema);
