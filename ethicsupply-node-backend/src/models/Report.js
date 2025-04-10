const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReportSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      required: true,
      enum: ["supplier", "category", "industry", "compliance", "custom"],
      default: "supplier",
    },
    status: {
      type: String,
      required: true,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    content: {
      summary: String,
      sections: [
        {
          title: String,
          content: String,
          charts: [
            {
              type: String,
              data: Schema.Types.Mixed,
              options: Schema.Types.Mixed,
            },
          ],
        },
      ],
      conclusions: String,
      recommendations: [
        {
          type: Schema.Types.ObjectId,
          ref: "Recommendation",
        },
      ],
    },
    metadata: {
      generated_by: {
        type: String,
        enum: ["system", "user", "ai"],
        default: "system",
      },
      source_data: {
        time_period: {
          start: Date,
          end: Date,
        },
        suppliers: [
          {
            type: Schema.Types.ObjectId,
            ref: "Supplier",
          },
        ],
        industries: [String],
        countries: [String],
        data_sources: [String],
      },
      publish_date: Date,
      expiry_date: Date,
      is_template: {
        type: Boolean,
        default: false,
      },
      tags: [String],
      version: {
        type: String,
        default: "1.0",
      },
      shared_with: [String], // User IDs or email addresses
    },
    export_options: {
      formats: [
        {
          type: String,
          enum: ["pdf", "csv", "json", "html", "xlsx"],
        },
      ],
      include_charts: {
        type: Boolean,
        default: true,
      },
      include_raw_data: {
        type: Boolean,
        default: false,
      },
    },
    access_control: {
      visibility: {
        type: String,
        enum: ["private", "internal", "public"],
        default: "private",
      },
      require_authentication: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Report", ReportSchema);
