const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ControversySchema = new Schema(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    title: {
      type: String,
      required: [true, "A controversy must have a title"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    description: {
      type: String,
      required: [true, "A controversy must have a description"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["environmental", "social", "governance", "other"],
      default: "other",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: [true, "Severity level is required"],
    },
    occurrence_date: {
      type: Date,
      required: [true, "An occurrence date is required"],
    },
    status: {
      type: String,
      enum: ["open", "investigating", "resolved", "closed"],
      default: "open",
    },
    impact_score: {
      type: Number,
      required: [true, "Impact score is required"],
      min: 0,
      max: 100,
    },
    source: {
      type: String,
      required: [true, "Source is required"],
      trim: true,
    },
    evidence: {
      type: String,
      trim: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
ControversySchema.index({ supplier: 1, category: 1, occurrence_date: -1 });

// Calculate weighted impact of all controversies for a supplier
ControversySchema.statics.calculateImpact = async function (supplierId) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const controversies = await this.find({
    supplier: supplierId,
    occurrence_date: { $gte: oneYearAgo },
  });

  if (controversies.length === 0) {
    return { score: 0, count: 0 };
  }

  // Calculate impact score with time decay
  let totalImpact = 0;
  const now = new Date();

  controversies.forEach((controversy) => {
    // Apply time decay factor - more recent controversies have higher impact
    const monthsAgo =
      (now - controversy.occurrence_date) / (30 * 24 * 60 * 60 * 1000);
    const timeFactor = Math.max(0.5, 1 - monthsAgo / 12); // 50% impact after 1 year

    // If resolved, reduce impact by 50%
    const resolutionFactor = controversy.status === 'resolved' ? 0.5 : 1.0;

    // Final impact calculation
    const impact =
      (controversy.severity === 'critical' ? 10 : controversy.severity === 'high' ? 7 : controversy.severity === 'medium' ? 4 : 1) *
      controversy.impact_score *
      timeFactor *
      resolutionFactor;
    totalImpact += impact;
  });

  // Normalize the total impact to 0-1 range, with diminishing returns for multiple controversies
  const normalizedImpact = Math.min(
    1,
    totalImpact / (1 + Math.log(controversies.length))
  );

  return {
    score: normalizedImpact,
    count: controversies.length,
  };
};

// Update the updated_at field before saving
ControversySchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

// Check if the model already exists and only create it if it doesn't
module.exports = mongoose.models.Controversy || mongoose.model("Controversy", ControversySchema);
