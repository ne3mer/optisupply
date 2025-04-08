/**
 * Get ML service status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMLStatus = async (req, res) => {
  try {
    // Mock ML service status for now
    const status = {
      status: "operational",
      last_updated: new Date().toISOString(),
      services: {
        ethical_score: {
          status: "operational",
          last_run: new Date().toISOString(),
          accuracy: 0.92,
        },
        risk_assessment: {
          status: "operational",
          last_run: new Date().toISOString(),
          accuracy: 0.88,
        },
        anomaly_detection: {
          status: "operational",
          last_run: new Date().toISOString(),
          accuracy: 0.85,
        },
      },
    };

    res.status(200).json(status);
  } catch (error) {
    console.error("Error fetching ML status:", error);
    res.status(500).json({ error: error.message });
  }
};
