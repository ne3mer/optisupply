const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AlertSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["info", "warning", "error", "success"],
      default: "info",
    },
    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "resolved", "dismissed"],
      default: "active",
    },
    read: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      required: true,
      default: "system",
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },
    relatedData: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    expiresAt: {
      type: Date,
    },
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

module.exports = mongoose.model("Alert", AlertSchema);
