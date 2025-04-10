const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RiskSchema = new Schema(
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
    risk_type: {
      type: String,
      required: true,
      enum: [
        "environmental",
        "social",
        "governance",
        "geo_political",
        "market",
        "supply_chain",
        "operational",
        "financial",
        "regulatory",
        "reputational",
        "other",
      ],
      default: "other",
    },
    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.5,
    },
    impact: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      default: 5,
    },
    risk_score: {
      type: Number,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      required: true,
      enum: ["identified", "assessed", "monitored", "mitigated", "resolved"],
      default: "identified",
    },
    affected_suppliers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Supplier",
      },
    ],
    affected_regions: [String],
    affected_industries: [String],
    mitigation_plan: {
      strategy: String,
      actions: [
        {
          description: String,
          deadline: Date,
          responsible: String,
          status: {
            type: String,
            enum: ["pending", "in_progress", "completed"],
            default: "pending",
          },
        },
      ],
      effectiveness: {
        type: Number,
        min: 0,
        max: 1,
      },
    },
    time_horizon: {
      type: String,
      enum: ["immediate", "short_term", "medium_term", "long_term"],
      default: "medium_term",
    },
    source: {
      type: String,
      enum: ["ai", "human", "third_party", "news", "regulatory"],
      default: "ai",
    },
    tags: [String],
    history: [
      {
        status: String,
        severity: String,
        probability: Number,
        impact: Number,
        risk_score: Number,
        date: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Virtual field for calculating risk score
RiskSchema.pre("save", function (next) {
  // Risk score is typically probability * impact
  if (this.probability !== undefined && this.impact !== undefined) {
    this.risk_score = Math.round(this.probability * this.impact * 10);
  }
  next();
});

module.exports = mongoose.model("Risk", RiskSchema);
