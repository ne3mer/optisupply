const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GeoRiskAlertSchema = new Schema(
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
    type: {
      type: String,
      required: true,
      enum: [
        "political",
        "environmental",
        "socialEthical",
        "conflict",
        "regulatory",
      ],
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    impact_suppliers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Supplier",
      },
    ],
    source: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("GeoRiskAlert", GeoRiskAlertSchema);
