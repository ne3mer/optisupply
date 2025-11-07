const db = require("../models");

// Get current scoring settings
exports.getSettings = async (req, res) => {
  try {
    // Check if ScoringSettings model exists
    if (!db.ScoringSettings) {
      console.error("ScoringSettings model not found");
      // Return default settings if model not available
      return res.status(200).json(getDefaultSettings());
    }
    
    try {
      const settings = await db.ScoringSettings.getDefault();
      // Convert mongoose document to plain object
      const settingsObj = settings.toObject ? settings.toObject() : settings;
      res.status(200).json(settingsObj);
    } catch (dbError) {
      // If database is not available, return default settings
      console.warn("Database not available, returning default settings:", dbError.message);
      res.status(200).json(getDefaultSettings());
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    // Return default settings as fallback
    res.status(200).json(getDefaultSettings());
  }
};

// Helper function to get default settings
function getDefaultSettings() {
  return {
    useIndustryBands: true,
    environmentalWeight: 0.4,
    socialWeight: 0.3,
    governanceWeight: 0.3,
    emissionIntensityWeight: 0.4,
    renewableShareWeight: 0.2,
    waterIntensityWeight: 0.2,
    wasteIntensityWeight: 0.2,
    injuryRateWeight: 0.3,
    trainingHoursWeight: 0.2,
    wageRatioWeight: 0.2,
    diversityWeight: 0.3,
    boardDiversityWeight: 0.25,
    boardIndependenceWeight: 0.25,
    antiCorruptionWeight: 0.2,
    transparencyWeight: 0.3,
    riskPenaltyEnabled: true,
    defaultRiskFactor: 0.15,
    riskWeightGeopolitical: 0.33,
    riskWeightClimate: 0.33,
    riskWeightLabor: 0.34,
    riskThreshold: 0.3,
    riskLambda: 1.0,
    isDefault: true,
  };
}

// Update scoring settings
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const settings = await db.ScoringSettings.updateDefault(updates);
    
    // If useIndustryBands changed, scores need to be recomputed
    // Note: This is handled on-demand when suppliers are fetched/exported
    // The scores are computed fresh each time using current settings
    // No need to bulk update stored scores - they're computed dynamically
    
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(400).json({ error: error.message });
  }
};

// Reset to defaults
exports.resetSettings = async (req, res) => {
  try {
    const defaultSettings = {
      useIndustryBands: true,
      environmentalWeight: 0.4,
      socialWeight: 0.3,
      governanceWeight: 0.3,
      emissionIntensityWeight: 0.4,
      renewableShareWeight: 0.2,
      waterIntensityWeight: 0.2,
      wasteIntensityWeight: 0.2,
      injuryRateWeight: 0.3,
      trainingHoursWeight: 0.2,
      wageRatioWeight: 0.2,
      diversityWeight: 0.3,
      boardDiversityWeight: 0.25,
      boardIndependenceWeight: 0.25,
      antiCorruptionWeight: 0.2,
      transparencyWeight: 0.3,
      riskPenaltyEnabled: true,
      defaultRiskFactor: 0.15,
      riskWeightGeopolitical: 0.33,
      riskWeightClimate: 0.33,
      riskWeightLabor: 0.34,
      riskThreshold: 0.3,
      riskLambda: 1.0,
    };
    const settings = await db.ScoringSettings.updateDefault(defaultSettings);
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error resetting settings:", error);
    res.status(500).json({ error: error.message });
  }
};

