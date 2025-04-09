const { GeoRiskAlert } = require("../models");
const Supplier = require("../models/Supplier");

/**
 * Get all geo risk alerts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getGeoRiskAlerts = async (req, res) => {
  try {
    // Get all alerts, sorted by date descending (most recent first)
    const alerts = await GeoRiskAlert.find()
      .sort({ date: -1 })
      .populate("impact_suppliers", "name country industry");

    res.status(200).json(alerts);
  } catch (error) {
    console.error("Error fetching geo risk alerts:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a geo risk alert by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getGeoRiskAlertById = async (req, res) => {
  try {
    const alert = await GeoRiskAlert.findById(req.params.id).populate(
      "impact_suppliers",
      "name country industry"
    );

    if (!alert) {
      return res.status(404).json({ error: "Geo risk alert not found" });
    }

    res.status(200).json(alert);
  } catch (error) {
    console.error("Error fetching geo risk alert:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new geo risk alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createGeoRiskAlert = async (req, res) => {
  try {
    const alert = new GeoRiskAlert(req.body);

    // If country is specified, find suppliers in that country and add them to impact_suppliers
    if (req.body.country && !req.body.impact_suppliers) {
      const suppliersInCountry = await Supplier.find({
        country: req.body.country,
      });
      alert.impact_suppliers = suppliersInCountry.map(
        (supplier) => supplier._id
      );
    }

    const savedAlert = await alert.save();
    res.status(201).json(savedAlert);
  } catch (error) {
    console.error("Error creating geo risk alert:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Update a geo risk alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateGeoRiskAlert = async (req, res) => {
  try {
    const alert = await GeoRiskAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: "Geo risk alert not found" });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      alert[key] = req.body[key];
    });

    const updatedAlert = await alert.save();
    res.status(200).json(updatedAlert);
  } catch (error) {
    console.error("Error updating geo risk alert:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete a geo risk alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteGeoRiskAlert = async (req, res) => {
  try {
    const alert = await GeoRiskAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: "Geo risk alert not found" });
    }

    await alert.deleteOne();

    res.status(200).json({ message: "Geo risk alert deleted successfully" });
  } catch (error) {
    console.error("Error deleting geo risk alert:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark a geo risk alert as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.markAsRead = async (req, res) => {
  try {
    const alert = await GeoRiskAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: "Geo risk alert not found" });
    }

    alert.read = true;
    const updatedAlert = await alert.save();

    res.status(200).json(updatedAlert);
  } catch (error) {
    console.error("Error marking geo risk alert as read:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get alerts by country
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAlertsByCountry = async (req, res) => {
  try {
    const { country } = req.params;

    const alerts = await GeoRiskAlert.find({ country })
      .sort({ date: -1 })
      .populate("impact_suppliers", "name country industry");

    res.status(200).json(alerts);
  } catch (error) {
    console.error("Error fetching geo risk alerts by country:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get alerts by type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAlertsByType = async (req, res) => {
  try {
    const { type } = req.params;

    const alerts = await GeoRiskAlert.find({ type })
      .sort({ date: -1 })
      .populate("impact_suppliers", "name country industry");

    res.status(200).json(alerts);
  } catch (error) {
    console.error("Error fetching geo risk alerts by type:", error);
    res.status(500).json({ error: error.message });
  }
};
