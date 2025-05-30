import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const NotFound: React.FC = () => {
  // Define colors for the dark theme to match other pages
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

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 lg:p-8"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-lg"
      >
        <h1
          className="text-6xl md:text-8xl font-bold mb-4"
          style={{ color: colors.primary }}
        >
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">
          Page Not Found
        </h2>
        <p className="mb-8 text-lg" style={{ color: colors.textMuted }}>
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-md transition-colors duration-200"
          style={{
            backgroundColor: colors.primary,
            color: "white",
          }}
        >
          Return to Dashboard
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
