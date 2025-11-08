import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useThemeColors } from "../theme/useThemeColors";
import {
  getScoringSettings,
  updateScoringSettings,
  resetScoringSettings,
  exportSuppliersCSV,
  recomputeAllSuppliers,
  type ScoringSettings,
} from "../services/api";

const Settings: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const colors = useThemeColors();
  const [apiEndpoint, setApiEndpoint] = useState<string>(
    localStorage.getItem("apiEndpoint") || "http://localhost:8000"
  );
  const [settings, setSettings] = useState<ScoringSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getScoringSettings();
      setSettings(data);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = (): string | null => {
    if (!settings) return "Settings not loaded";
    
    // Validate risk weights sum to ~1.0
    if (settings.riskPenaltyEnabled) {
      const weightSum = (settings.riskWeightGeopolitical ?? 0.33) + 
                       (settings.riskWeightClimate ?? 0.33) + 
                       (settings.riskWeightLabor ?? 0.34);
      if (Math.abs(weightSum - 1.0) > 0.1) {
        return `Risk weights sum to ${weightSum.toFixed(2)}, should be ~1.0`;
      }
      
      // Validate threshold T ∈ [0,1]
      const threshold = settings.riskThreshold ?? 0.3;
      if (threshold < 0 || threshold > 1) {
        return "Threshold T must be between 0 and 1";
      }
      
      // Validate lambda λ > 0
      const lambda = settings.riskLambda ?? 1.0;
      if (lambda <= 0) {
        return "Lambda λ must be greater than 0";
      }
    }
    
    // Validate composite weights sum to ~1.0
    const compositeSum = (settings.environmentalWeight ?? 0.4) + 
                        (settings.socialWeight ?? 0.3) + 
                        (settings.governanceWeight ?? 0.3);
    if (Math.abs(compositeSum - 1.0) > 0.1) {
      return `Composite weights sum to ${compositeSum.toFixed(2)}, should be ~1.0`;
    }
    
    return null;
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    const validationError = validateSettings();
    if (validationError) {
      alert(`Validation error: ${validationError}`);
      return;
    }
    
    try {
      setSaving(true);
      await updateScoringSettings(settings);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm("Reset all settings to defaults?")) return;
    try {
      setSaving(true);
      const reset = await resetScoringSettings();
      setSettings(reset);
      alert("Settings reset to defaults!");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      alert("Failed to reset settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportSuppliersCSV();
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export CSV. Please try again.");
    }
  };

  const saveApiEndpoint = () => {
    localStorage.setItem("apiEndpoint", apiEndpoint);
    window.location.reload();
  };

  const updateSetting = (key: keyof ScoringSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: colors.background, color: colors.text }}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
            <p className="text-lg">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: colors.background, color: colors.text }}>
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight">
            <span style={{ color: colors.primary }}>⚙️ ESG Configuration</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
            Configure scoring methodology, weights, and normalization settings
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-2 flex-wrap"
        >
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            style={{
              backgroundColor: colors.primary,
              color: "white",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "💾 Saving..." : "💾 Save All Changes"}
          </button>
          <button
            onClick={handleResetSettings}
            className="px-6 py-2.5 rounded-lg font-medium border-2 transition-all duration-200 hover:shadow-md"
            style={{
              borderColor: colors.accent,
              color: colors.text,
              backgroundColor: 'transparent',
            }}
          >
            🔄 Reset to Defaults
          </button>
        </motion.div>
      </div>

      {settings && (
        <div className="space-y-8">
          {/* Quick Settings Row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Dark Mode Card */}
            <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold mb-1">🌓 Dark Mode</div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>
                      {darkMode ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                  <div
                    className="w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors"
                    onClick={toggleDarkMode}
                    style={{
                      backgroundColor: darkMode ? colors.accent : colors.textMuted,
                    }}
                  >
                    <div
                      className="bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out"
                      style={{
                        transform: darkMode ? "translateX(100%)" : "translateX(0)",
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Industry Bands Card */}
            <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold mb-1">📊 Industry Bands</div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>
                      {(settings.useIndustryBands ?? false) ? "Industry-specific" : "Global"}
                    </div>
                  </div>
                  <div
                    className="w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors"
                    onClick={() => updateSetting("useIndustryBands", !(settings.useIndustryBands ?? false))}
                    style={{
                      backgroundColor: (settings.useIndustryBands ?? false) ? colors.accent : colors.textMuted,
                    }}
                  >
                    <div
                      className="bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out"
                      style={{
                        transform: (settings.useIndustryBands ?? false) ? "translateX(100%)" : "translateX(0)",
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Penalty Card */}
            <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold mb-1">⚠️ Risk Penalty</div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>
                      {(settings.riskPenaltyEnabled ?? true) ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                  <div
                    className="w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors"
                    onClick={() => updateSetting("riskPenaltyEnabled", !(settings.riskPenaltyEnabled ?? true))}
                    style={{
                      backgroundColor: (settings.riskPenaltyEnabled ?? true) ? colors.accent : colors.textMuted,
                    }}
                  >
                    <div
                      className="bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out"
                      style={{
                        transform: (settings.riskPenaltyEnabled ?? true) ? "translateX(100%)" : "translateX(0)",
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Grid: Weights and Risk Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: ESG Weights */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span style={{ color: colors.primary }}>🎯 Composite ESG Weights</span>
                  </CardTitle>
                  <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                    Configure Environmental, Social, and Governance pillar weights
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Environmental Weight */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <span>🌱 Environmental</span>
                      </label>
                      <span className="text-sm font-mono" style={{ color: colors.primary }}>
                        {(settings.environmentalWeight ?? 0.4).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.environmentalWeight ?? 0.4}
                      onChange={(e) => updateSetting("environmentalWeight", parseFloat(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${colors.accent} 0%, ${colors.accent} ${((settings.environmentalWeight ?? 0.4) * 100)}%, ${colors.textMuted} ${((settings.environmentalWeight ?? 0.4) * 100)}%, ${colors.textMuted} 100%)`,
                      }}
                    />
                  </div>

                  {/* Social Weight */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <span>👥 Social</span>
                      </label>
                      <span className="text-sm font-mono" style={{ color: colors.primary }}>
                        {(settings.socialWeight ?? 0.3).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.socialWeight ?? 0.3}
                      onChange={(e) => updateSetting("socialWeight", parseFloat(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${colors.accent} 0%, ${colors.accent} ${((settings.socialWeight ?? 0.3) * 100)}%, ${colors.textMuted} ${((settings.socialWeight ?? 0.3) * 100)}%, ${colors.textMuted} 100%)`,
                      }}
                    />
                  </div>

                  {/* Governance Weight */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <span>⚖️ Governance</span>
                      </label>
                      <span className="text-sm font-mono" style={{ color: colors.primary }}>
                        {(settings.governanceWeight ?? 0.3).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.governanceWeight ?? 0.3}
                      onChange={(e) => updateSetting("governanceWeight", parseFloat(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${colors.accent} 0%, ${colors.accent} ${((settings.governanceWeight ?? 0.3) * 100)}%, ${colors.textMuted} ${((settings.governanceWeight ?? 0.3) * 100)}%, ${colors.textMuted} 100%)`,
                      }}
                    />
                  </div>

                  {/* Sum Indicator */}
                  <div className="pt-3 border-t" style={{ borderColor: colors.accent + "30" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Sum</span>
                      <span 
                        className="text-sm font-mono font-bold"
                        style={{ 
                          color: Math.abs(((settings.environmentalWeight ?? 0.4) + (settings.socialWeight ?? 0.3) + (settings.governanceWeight ?? 0.3)) - 1.0) > 0.1 ? colors.warning : colors.accent 
                        }}
                      >
                        {((settings.environmentalWeight ?? 0.4) + (settings.socialWeight ?? 0.3) + (settings.governanceWeight ?? 0.3)).toFixed(2)}
                        {Math.abs(((settings.environmentalWeight ?? 0.4) + (settings.socialWeight ?? 0.3) + (settings.governanceWeight ?? 0.3)) - 1.0) > 0.1 && " ⚠️"}
                      </span>
                    </div>
                    {Math.abs(((settings.environmentalWeight ?? 0.4) + (settings.socialWeight ?? 0.3) + (settings.governanceWeight ?? 0.3)) - 1.0) > 0.1 && (
                      <p className="text-xs mt-1" style={{ color: colors.warning }}>
                        Weights should sum to ~1.0 for balanced scoring
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column: Risk Configuration */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span style={{ color: colors.primary }}>⚠️ Risk Penalty Configuration</span>
                  </CardTitle>
                  <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                    Configure risk weights, threshold, and scaling factor
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  {(settings.riskPenaltyEnabled ?? true) ? (
                    <>
                      {/* Risk Weights Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                            🌍 Geopolitical
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={settings.riskWeightGeopolitical ?? 0.33}
                            onChange={(e) => updateSetting("riskWeightGeopolitical", parseFloat(e.target.value) || 0.33)}
                            className="w-full p-2 rounded-md border text-sm font-mono text-center"
                            style={{
                              backgroundColor: colors.inputBg,
                              borderColor: colors.accent + "40",
                              color: colors.text,
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                            🌡️ Climate
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={settings.riskWeightClimate ?? 0.33}
                            onChange={(e) => updateSetting("riskWeightClimate", parseFloat(e.target.value) || 0.33)}
                            className="w-full p-2 rounded-md border text-sm font-mono text-center"
                            style={{
                              backgroundColor: colors.inputBg,
                              borderColor: colors.accent + "40",
                              color: colors.text,
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                            👷 Labor
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={settings.riskWeightLabor ?? 0.34}
                            onChange={(e) => updateSetting("riskWeightLabor", parseFloat(e.target.value) || 0.34)}
                            className="w-full p-2 rounded-md border text-sm font-mono text-center"
                            style={{
                              backgroundColor: colors.inputBg,
                              borderColor: colors.accent + "40",
                              color: colors.text,
                            }}
                          />
                        </div>
                      </div>

                      {/* Risk Weights Sum */}
                      <div className="text-xs flex items-center justify-between px-1">
                        <span style={{ color: colors.textMuted }}>Risk Weights Sum:</span>
                        <span 
                          className="font-mono font-bold"
                          style={{ 
                            color: Math.abs(((settings.riskWeightGeopolitical ?? 0.33) + (settings.riskWeightClimate ?? 0.33) + (settings.riskWeightLabor ?? 0.34)) - 1.0) > 0.1 ? colors.warning : colors.accent 
                          }}
                        >
                          {((settings.riskWeightGeopolitical ?? 0.33) + (settings.riskWeightClimate ?? 0.33) + (settings.riskWeightLabor ?? 0.34)).toFixed(2)}
                          {Math.abs(((settings.riskWeightGeopolitical ?? 0.33) + (settings.riskWeightClimate ?? 0.33) + (settings.riskWeightLabor ?? 0.34)) - 1.0) > 0.1 && " ⚠️"}
                        </span>
                      </div>

                      {/* Threshold T */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">📏 Threshold (T)</label>
                          <span className="text-sm font-mono" style={{ color: colors.primary }}>
                            {(settings.riskThreshold ?? 0.3).toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={settings.riskThreshold ?? 0.3}
                          onChange={(e) => updateSetting("riskThreshold", parseFloat(e.target.value))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${colors.accent} 0%, ${colors.accent} ${((settings.riskThreshold ?? 0.3) * 100)}%, ${colors.textMuted} ${((settings.riskThreshold ?? 0.3) * 100)}%, ${colors.textMuted} 100%)`,
                          }}
                        />
                        <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                          Penalty applies when risk exceeds this threshold
                        </p>
                      </div>

                      {/* Lambda λ */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          ⚡ Lambda (λ) - Scaling Factor
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          max="50"
                          step="0.1"
                          value={settings.riskLambda ?? 1.0}
                          onChange={(e) => updateSetting("riskLambda", parseFloat(e.target.value) || 1.0)}
                          className="w-full p-3 rounded-md border text-center font-mono text-lg"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.accent + "40",
                            color: colors.text,
                          }}
                        />
                        <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                          Controls how severely penalties are applied (must be &gt; 0)
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center" style={{ color: colors.textMuted }}>
                      <div className="text-6xl mb-4">⏸️</div>
                      <p className="text-lg font-medium mb-2">Risk Penalty Disabled</p>
                      <p className="text-sm">Enable risk penalty to configure weights and parameters</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Advanced Metric Weights */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span style={{ color: colors.primary }}>🔬 Advanced Metric Weights</span>
                </CardTitle>
                <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                  Fine-tune individual environmental metric importance
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      💨 Emission Intensity
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.emissionIntensityWeight ?? 0.4}
                      onChange={(e) => updateSetting("emissionIntensityWeight", parseFloat(e.target.value) || 0.4)}
                      className="w-full p-2 rounded-md border text-center font-mono"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.accent + "40",
                        color: colors.text,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      ♻️ Renewable Share
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.renewableShareWeight ?? 0.2}
                      onChange={(e) => updateSetting("renewableShareWeight", parseFloat(e.target.value) || 0.2)}
                      className="w-full p-2 rounded-md border text-center font-mono"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.accent + "40",
                        color: colors.text,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      💧 Water Intensity
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.waterIntensityWeight ?? 0.2}
                      onChange={(e) => updateSetting("waterIntensityWeight", parseFloat(e.target.value) || 0.2)}
                      className="w-full p-2 rounded-md border text-center font-mono"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.accent + "40",
                        color: colors.text,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      🗑️ Waste Intensity
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.wasteIntensityWeight ?? 0.2}
                      onChange={(e) => updateSetting("wasteIntensityWeight", parseFloat(e.target.value) || 0.2)}
                      className="w-full p-2 rounded-md border text-center font-mono"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.accent + "40",
                        color: colors.text,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Admin Actions Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span style={{ color: colors.primary }}>⚙️ Admin Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm mb-3" style={{ color: colors.textMuted }}>
                    Recalculate all supplier scores with current settings. This will update all suppliers' ESG scores, composite scores, risk penalties, and final scores.
                  </p>
                  <button
                    onClick={async () => {
                      if (!confirm("Recalculate all supplier scores? This may take a few moments.")) return;
                      try {
                        setRecomputing(true);
                        const result = await recomputeAllSuppliers();
                        alert(`Success! Recomputed ${result.results.successful} suppliers. ${result.results.failed > 0 ? `${result.results.failed} failed.` : ""}`);
                      } catch (error: any) {
                        alert(`Error: ${error.message || "Failed to recompute suppliers"}`);
                      } finally {
                        setRecomputing(false);
                      }
                    }}
                    disabled={recomputing || saving}
                    className="w-full px-4 py-3 rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: recomputing ? colors.accent + "80" : colors.accent,
                      color: "#fff",
                    }}
                  >
                    {recomputing ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Recalculating...
                      </>
                    ) : (
                      <>
                        🔄 Recalculate All Suppliers
                      </>
                    )}
                  </button>
                </div>
                <div className="pt-2 border-t" style={{ borderColor: colors.accent + "20" }}>
                  <Link
                    to="/scenarios"
                    className="block w-full px-4 py-3 rounded-md font-medium transition-all text-center"
                    style={{
                      backgroundColor: colors.accent + "20",
                      color: colors.accent,
                    }}
                  >
                    🧪 Run Scenarios (S1-S4) →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* API & Export Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* API Configuration */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span style={{ color: colors.primary }}>🔌 API Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium" htmlFor="api-endpoint">
                      Backend Endpoint
                    </label>
                    <input
                      id="api-endpoint"
                      type="text"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      className="w-full p-2.5 rounded-md border focus:ring-2 outline-none font-mono text-sm"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.accent + "40",
                        color: colors.text,
                        focusRingColor: colors.primary,
                      }}
                      placeholder="http://localhost:8000"
                    />
                  </div>
                  <button
                    onClick={saveApiEndpoint}
                    className="w-full px-4 py-2.5 rounded-md font-medium transition-colors"
                    style={{
                      backgroundColor: colors.accent,
                      color: colors.text,
                    }}
                  >
                    💾 Save & Reload
                  </button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Export Data */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span style={{ color: colors.primary }}>📥 Data Export</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      Export all suppliers with ESG scores and rankings
                    </p>
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2.5 rounded-md font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                      style={{
                        backgroundColor: colors.primary,
                        color: "white",
                      }}
                    >
                      📊 Export Full Dataset (CSV)
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
