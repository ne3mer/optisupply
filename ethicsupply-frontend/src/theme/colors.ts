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

// Dark: deep true-black with a single lime accent — no blue, no purple
const darkColors: ThemeColors = {
  background: "#0A0A0A",
  panel: "rgba(17, 17, 17, 0.90)",
  card: "#111111",
  primary: "#C8F05A",
  secondary: "#E84545",
  accent: "#C8F05A",
  text: "#F5F5F0",
  textMuted: "#808080",
  success: "#4ADE80",
  warning: "#FBBF24",
  error: "#E84545",
  grid: "rgba(200, 240, 90, 0.08)",
  tooltipBg: "rgba(10, 10, 10, 0.97)",
  inputBg: "#1A1A1A",
};

// Light: warm paper tone, single lime accent — no generic slate-blue
const lightColors: ThemeColors = {
  background: "#F5F5F0",
  panel: "rgba(255, 255, 255, 0.94)",
  card: "#EBEBEB",
  primary: "#3D6B05",
  secondary: "#E84545",
  accent: "#3D6B05",
  text: "#0A0A0A",
  textMuted: "#555555",
  success: "#15803D",
  warning: "#B45309",
  error: "#E84545",
  grid: "rgba(61, 107, 5, 0.10)",
  tooltipBg: "rgba(245, 245, 240, 0.98)",
  inputBg: "#E5E5E0",
};

export function getThemeColors(darkMode: boolean): ThemeColors {
  return darkMode ? darkColors : lightColors;
}
