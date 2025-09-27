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
  background: "#0D0F1A",
  panel: "rgba(25, 28, 43, 0.8)",
  card: "rgba(22, 28, 45, 0.6)",
  primary: "#00F0FF",
  secondary: "#FF00FF",
  accent: "#4D5BFF",
  text: "#E0E0FF",
  textMuted: "#8A94C8",
  success: "#00FF8F",
  warning: "#FFD700",
  error: "#FF4D4D",
  grid: "rgba(77, 91, 255, 0.1)",
  tooltipBg: "rgba(13, 15, 26, 0.95)",
  inputBg: "rgba(40, 44, 66, 0.9)",
};

const lightColors: ThemeColors = {
  // Soft, airy light theme tuned for readability
  background: "#F7FAFC", // slate-50-ish
  panel: "rgba(255,255,255,0.8)",
  card: "#FFFFFF",
  primary: "#0EA5E9", // sky-500
  secondary: "#8B5CF6", // violet-500
  accent: "#2563EB", // blue-600
  text: "#111827", // gray-900
  textMuted: "#4B5563", // gray-600
  success: "#16A34A", // green-600
  warning: "#D97706", // amber-600
  error: "#DC2626", // red-600
  grid: "rgba(37, 99, 235, 0.12)",
  tooltipBg: "rgba(255,255,255,0.95)",
  inputBg: "#F3F4F6",
};

export function getThemeColors(darkMode: boolean): ThemeColors {
  return darkMode ? darkColors : lightColors;
}

