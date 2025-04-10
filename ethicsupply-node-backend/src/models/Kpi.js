const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const KpiSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "environmental",
        "social",
        "governance",
        "financial",
        "operational",
      ],
      default: "environmental",
    },
    unit: {
      type: String,
      required: true,
      default: "score",
    },
    target_value: {
      type: Number,
    },
    current_value: {
      type: Number,
    },
    baseline_value: {
      type: Number,
    },
    calculation_method: {
      type: String,
      default: "simple_average",
    },
    data_source: {
      type: String,
    },
    improvement_direction: {
      type: String,
      enum: ["increase", "decrease"],
      default: "increase",
    },
    weight: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 10,
    },
    display_options: {
      chart_type: {
        type: String,
        enum: ["line", "bar", "gauge", "pie"],
        default: "gauge",
      },
      color: {
        type: String,
        default: "#34D399", // emerald-400
      },
      decimals: {
        type: Number,
        default: 1,
      },
      show_on_dashboard: {
        type: Boolean,
        default: true,
      },
    },
    history: [
      {
        value: Number,
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
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Kpi", KpiSchema);
