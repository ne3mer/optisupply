const { Controversy } = require("../models");

/**
 * Get all controversies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllControversies = async (req, res) => {
  try {
    const controversies = await Controversy.find().populate(
      "supplier",
      "name country"
    );
    res.status(200).json(controversies);
  } catch (error) {
    console.error("Error fetching controversies:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get controversy by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getControversyById = async (req, res) => {
  try {
    const controversy = await Controversy.findById(req.params.id).populate(
      "supplier",
      "name country"
    );
    if (!controversy) {
      return res.status(404).json({ error: "Controversy not found" });
    }
    res.status(200).json(controversy);
  } catch (error) {
    console.error("Error fetching controversy:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new controversy
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createControversy = async (req, res) => {
  try {
    const controversy = new Controversy(req.body);
    await controversy.save();
    res.status(201).json(controversy);
  } catch (error) {
    console.error("Error creating controversy:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update a controversy
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateControversy = async (req, res) => {
  try {
    const controversy = await Controversy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("supplier", "name");

    if (!controversy) {
      return res.status(404).json({ error: "Controversy not found" });
    }
    res.status(200).json(controversy);
  } catch (error) {
    console.error("Error updating controversy:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a controversy
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteControversy = async (req, res) => {
  try {
    const controversy = await Controversy.findByIdAndDelete(req.params.id);
    if (!controversy) {
      return res.status(404).json({ error: "Controversy not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting controversy:", error);
    res.status(500).json({ error: error.message });
  }
};
