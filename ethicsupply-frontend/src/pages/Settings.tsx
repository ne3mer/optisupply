import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useThemeColors } from "../theme/useThemeColors";
import {
  getScoringSettings,
  updateScoringSettings,
  resetScoringSettings,
  exportSuppliersCSV,
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
  const [activeTab, setActiveTab] = useState<"general" | "normalization" | "weights" | "export">("general");

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
        <div className="text-center">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: colors.background, color: colors.text }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 tracking-tight"
      >
        <span style={{ color: colors.primary }}>Settings</span>
      </motion.h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: colors.accent + "30" }}>
        {(["general", "normalization", "weights", "export"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 capitalize transition-colors"
            style={{
              borderBottom: activeTab === tab ? `2px solid ${colors.primary}` : "2px solid transparent",
              color: activeTab === tab ? colors.primary : colors.textMuted,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="h-full" style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
              <CardHeader>
                <CardTitle className="text-lg" style={{ color: colors.primary }}>
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <div
                    className="w-12 h-6 flex items-center rounded-full p-1 cursor-pointer"
                    onClick={toggleDarkMode}
                    style={{
                      backgroundColor: darkMode ? colors.accent : colors.textMuted,
                    }}
                  >
                    <div
                      className="bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out"
                      style={{
                        transform: darkMode ? "translateX(100%)" : "translateX(0)",
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="h-full" style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
              <CardHeader>
                <CardTitle className="text-lg" style={{ color: colors.primary }}>
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium" htmlFor="api-endpoint">
                      API Endpoint
                    </label>
                    <input
                      id="api-endpoint"
                      type="text"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      className="w-full p-2 rounded-md border focus:ring-2 focus:ring-blue-500 outline-none"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.accent + "40",
                        color: colors.text,
                      }}
                    />
                  </div>
                  <button
                    onClick={saveApiEndpoint}
                    className="px-4 py-2 rounded-md transition-colors duration-200"
                    style={{
                      backgroundColor: colors.primary,
                      color: "white",
                    }}
                  >
                    Save
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Normalization Settings */}
      {activeTab === "normalization" && settings && (
        <div className="space-y-6">
          <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: colors.primary }}>
                Normalization Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Use Industry Bands</div>
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    {settings.useIndustryBands
                      ? "Normalizing using industry-specific min/max bands"
                      : "Normalizing using global min/max bands"}
                  </div>
                </div>
                <div
                  className="w-12 h-6 flex items-center rounded-full p-1 cursor-pointer"
                  onClick={() => updateSetting("useIndustryBands", !settings.useIndustryBands)}
                  style={{
                    backgroundColor: settings.useIndustryBands ? colors.accent : colors.textMuted,
                  }}
                >
                  <div
                    className="bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out"
                    style={{
                      transform: settings.useIndustryBands ? "translateX(100%)" : "translateX(0)",
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Risk Penalty</div>
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    Apply risk factor to final score
                  </div>
                </div>
                <div
                  className="w-12 h-6 flex items-center rounded-full p-1 cursor-pointer"
                  onClick={() => updateSetting("riskPenaltyEnabled", !settings.riskPenaltyEnabled)}
                  style={{
                    backgroundColor: settings.riskPenaltyEnabled ? colors.accent : colors.textMuted,
                  }}
                >
                  <div
                    className="bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out"
                    style={{
                      transform: settings.riskPenaltyEnabled ? "translateX(100%)" : "translateX(0)",
                    }}
                  />
                </div>
              </div>

              {settings.riskPenaltyEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium">Risk Weights (must sum to ~1.0)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: colors.textMuted }}>Geopolitical</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={settings.riskWeightGeopolitical ?? 0.33}
                          onChange={(e) => updateSetting("riskWeightGeopolitical", parseFloat(e.target.value) || 0.33)}
                          className="w-full p-2 rounded-md border text-sm"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.accent + "40",
                            color: colors.text,
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: colors.textMuted }}>Climate</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={settings.riskWeightClimate ?? 0.33}
                          onChange={(e) => updateSetting("riskWeightClimate", parseFloat(e.target.value) || 0.33)}
                          className="w-full p-2 rounded-md border text-sm"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.accent + "40",
                            color: colors.text,
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: colors.textMuted }}>Labor</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={settings.riskWeightLabor ?? 0.34}
                          onChange={(e) => updateSetting("riskWeightLabor", parseFloat(e.target.value) || 0.34)}
                          className="w-full p-2 rounded-md border text-sm"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.accent + "40",
                            color: colors.text,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                      Sum: {((settings.riskWeightGeopolitical ?? 0.33) + (settings.riskWeightClimate ?? 0.33) + (settings.riskWeightLabor ?? 0.34)).toFixed(2)}
                      {Math.abs(((settings.riskWeightGeopolitical ?? 0.33) + (settings.riskWeightClimate ?? 0.33) + (settings.riskWeightLabor ?? 0.34)) - 1.0) > 0.1 && (
                        <span className="ml-2" style={{ color: colors.warning }}>
                          (Should be ~1.0)
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium">Threshold T (0-1)</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.riskThreshold ?? 0.3}
                      onChange={(e) => updateSetting("riskThreshold", parseFloat(e.target.value) || 0.3)}
                      className="w-full p-2 rounded-md border"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.accent + "40",
                        color: colors.text,
                      }}
                    />
                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                      Penalty applies only when risk exceeds this threshold
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium">Lambda λ (scaling factor, &gt; 0)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.1"
                      value={settings.riskLambda ?? 1.0}
                      onChange={(e) => updateSetting("riskLambda", parseFloat(e.target.value) || 1.0)}
                      className="w-full p-2 rounded-md border"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.accent + "40",
                        color: colors.text,
                      }}
                    />
                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                      Penalty = λ × max(0, risk_raw - T) × 100
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-4 py-2 rounded-md transition-colors duration-200"
                  style={{
                    backgroundColor: colors.primary,
                    color: "white",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
                <button
                  onClick={handleResetSettings}
                  className="px-4 py-2 rounded-md border transition-colors duration-200"
                  style={{
                    borderColor: colors.accent + "40",
                    color: colors.text,
                  }}
                >
                  Reset to Defaults
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weight Configuration */}
      {activeTab === "weights" && settings && (
        <div className="space-y-6">
          <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: colors.primary }}>
                Composite ESG Weights (E, S, G)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Environmental Weight</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.environmentalWeight}
                  onChange={(e) => updateSetting("environmentalWeight", parseFloat(e.target.value) || 0.4)}
                  className="w-full p-2 rounded-md border"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.accent + "40",
                    color: colors.text,
                  }}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Social Weight</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.socialWeight}
                  onChange={(e) => updateSetting("socialWeight", parseFloat(e.target.value) || 0.3)}
                  className="w-full p-2 rounded-md border"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.accent + "40",
                    color: colors.text,
                  }}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Governance Weight</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.governanceWeight}
                  onChange={(e) => updateSetting("governanceWeight", parseFloat(e.target.value) || 0.3)}
                  className="w-full p-2 rounded-md border"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.accent + "40",
                    color: colors.text,
                  }}
                />
              </div>
              <div className="text-sm" style={{ color: colors.textMuted }}>
                Sum: {(settings.environmentalWeight + settings.socialWeight + settings.governanceWeight).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: colors.primary }}>
                Metric Weights (Advanced)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Emission Intensity</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.emissionIntensityWeight}
                    onChange={(e) => updateSetting("emissionIntensityWeight", parseFloat(e.target.value) || 0.4)}
                    className="w-full p-2 rounded-md border"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.accent + "40",
                      color: colors.text,
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">Renewable Share</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.renewableShareWeight}
                    onChange={(e) => updateSetting("renewableShareWeight", parseFloat(e.target.value) || 0.2)}
                    className="w-full p-2 rounded-md border"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.accent + "40",
                      color: colors.text,
                    }}
                  />
                </div>
                {/* Add more metric weight inputs as needed */}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 rounded-md transition-colors duration-200"
              style={{
                backgroundColor: colors.primary,
                color: "white",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            <button
              onClick={handleResetSettings}
              className="px-4 py-2 rounded-md border transition-colors duration-200"
              style={{
                borderColor: colors.accent + "40",
                color: colors.text,
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* Export */}
      {activeTab === "export" && (
        <Card style={{ backgroundColor: colors.card, borderColor: colors.accent + "30" }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: colors.primary }}>
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-medium mb-2">Export Supplier Rankings</div>
              <div className="text-sm mb-4" style={{ color: colors.textMuted }}>
                Download all suppliers with their ESG scores and rankings as CSV
              </div>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-md transition-colors duration-200"
                style={{
                  backgroundColor: colors.primary,
                  color: "white",
                }}
              >
                Export CSV
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;
