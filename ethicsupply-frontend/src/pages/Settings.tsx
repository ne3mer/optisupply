import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Switch } from "lucide-react";

const Settings: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [apiEndpoint, setApiEndpoint] = useState<string>(
    localStorage.getItem("apiEndpoint") || "http://localhost:8000"
  );

  // Define colors for the dark theme
  const colors = {
    background: "#0D0F1A",
    panel: "rgba(25, 28, 43, 0.8)",
    panelSolid: "#191C2B",
    primary: "#6366F1", // Indigo
    secondary: "#A78BFA", // Violet
    accent: "#34D399", // Emerald Green
    text: "#E0E0FF", // Light Lavender
    textMuted: "#8A94C8", // Muted Lavender
  };

  const saveApiEndpoint = () => {
    localStorage.setItem("apiEndpoint", apiEndpoint);
    window.location.reload();
  };

  return (
    <div
      className="min-h-screen p-4 md:p-6 lg:p-8"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 tracking-tight"
      >
        <span style={{ color: colors.primary }}>Settings</span>
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card
            className="h-full border-accent/30"
            style={{ backgroundColor: colors.panelSolid }}
          >
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: colors.primary }}>
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Dark Mode</span>
                <div
                  className="w-12 h-6 flex items-center bg-gray-700 rounded-full p-1 cursor-pointer"
                  onClick={toggleDarkMode}
                  style={{
                    backgroundColor: darkMode
                      ? colors.accent
                      : colors.textMuted,
                  }}
                >
                  <div
                    className="bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out"
                    style={{
                      transform: darkMode
                        ? "translateX(100%)"
                        : "translateX(0)",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card
            className="h-full border-accent/30"
            style={{ backgroundColor: colors.panelSolid }}
          >
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: colors.primary }}>
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label
                    className="block mb-2 text-sm font-medium"
                    htmlFor="api-endpoint"
                  >
                    API Endpoint
                  </label>
                  <input
                    id="api-endpoint"
                    type="text"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="w-full p-2 rounded-md border focus:ring-2 focus:ring-blue-500 outline-none"
                    style={{
                      backgroundColor: "rgba(40, 44, 68, 0.6)",
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
    </div>
  );
};

export default Settings;
