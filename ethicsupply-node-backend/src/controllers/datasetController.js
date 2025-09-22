const path = require("path");
const fs = require("fs");
const { getDatasetMeta } = require("../utils/esgScoring");

exports.getDatasetMeta = async (req, res) => {
  try {
    const meta = getDatasetMeta();
    // Ensure required fields per spec
    const response = {
      version: "synthetic-v1",
      seed: meta.seed || null,
      generatedAt: meta.generatedAt || null,
      bandsVersion: meta.bandsVersion || "v1",
    };
    return res.status(200).json(response);
  } catch (err) {
    console.error("Error getting dataset meta:", err);
    return res.status(500).json({ error: "Failed to load dataset metadata" });
  }
};

