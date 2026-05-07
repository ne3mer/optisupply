export type ThemeColors = {
  background: string;
  panel: string;
  card?: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
  grid?: string;
  tooltipBg?: string;
  inputBg?: string;
};

const darkColors: ThemeColors = {
  // Deep slate dark theme with restrained saturation
  background: "#0B1020",
  panel: "rgba(17, 24, 39, 0.86)",
  card: "rgba(20, 29, 48, 0.72)",
  primary: "#38BDF8",
  secondary: "#A78BFA",
  accent: "#3B82F6",
  text: "#E6ECFF",
  textMuted: "#93A4C4",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#F87171",
  grid: "rgba(59, 130, 246, 0.12)",
  tooltipBg: "rgba(11, 16, 32, 0.96)",
  inputBg: "rgba(30, 41, 59, 0.85)",
};

const lightColors: ThemeColors = {
  // Neutral professional light theme with cool accents
  background: "#F5F7FB",
  panel: "rgba(255, 255, 255, 0.88)",
  card: "#FFFFFF",
  primary: "#0284C7",
  secondary: "#7C3AED",
  accent: "#1D4ED8",
  text: "#0F172A",
  textMuted: "#475569",
  success: "#15803D",
  warning: "#B45309",
  error: "#B91C1C",
  grid: "rgba(29, 78, 216, 0.10)",
  tooltipBg: "rgba(255, 255, 255, 0.98)",
  inputBg: "#EEF2F7",
};

export function getThemeColors(darkMode: boolean): ThemeColors {
  return darkMode ? darkColors : lightColors;
}

