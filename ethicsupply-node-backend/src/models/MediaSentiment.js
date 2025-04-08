const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MediaSentimentSchema = new Schema(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
      enum: ["news", "social_media", "employee_reviews"],
    },
    sentiment_score: {
      type: Number,
      min: -1.0,
      max: 1.0,
      required: true,
    },
    source_url: {
      type: String,
      trim: true,
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    publication_date: {
      type: Date,
      default: Date.now,
    },
    title: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    impact_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 1.0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Index for faster queries
MediaSentimentSchema.index({ supplier: 1, source: 1, publication_date: -1 });

// Calculate average sentiment for a supplier
MediaSentimentSchema.statics.getAverageSentiment = async function (
  supplierId,
  source = null
) {
  const match = { supplier: supplierId };
  if (source) {
    match.source = source;
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        averageSentiment: { $avg: "$sentiment_score" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return { averageSentiment: 0, count: 0 };
  }

  return {
    averageSentiment: result[0].averageSentiment,
    count: result[0].count,
  };
};

module.exports = mongoose.model("MediaSentiment", MediaSentimentSchema);
