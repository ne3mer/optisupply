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
  // Editorial dark theme: neutral base + bold lime/amber accents
  background: "#0A0A0A",
  panel: "rgba(22, 22, 24, 0.86)",
  card: "rgba(30, 30, 33, 0.74)",
  primary: "#A3E635",
  secondary: "#F59E0B",
  accent: "#84CC16",
  text: "#F4F4F5",
  textMuted: "#A1A1AA",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#F87171",
  grid: "rgba(132, 204, 22, 0.12)",
  tooltipBg: "rgba(10, 10, 10, 0.96)",
  inputBg: "rgba(39, 39, 42, 0.9)",
};

const lightColors: ThemeColors = {
  // Warm-neutral paper tone for less templated look
  background: "#FAFAF8",
  panel: "rgba(255, 255, 255, 0.92)",
  card: "#FFFFFF",
  primary: "#4D7C0F",
  secondary: "#B45309",
  accent: "#3F6212",
  text: "#0F172A",
  textMuted: "#52525B",
  success: "#15803D",
  warning: "#B45309",
  error: "#B91C1C",
  grid: "rgba(77, 124, 15, 0.10)",
  tooltipBg: "rgba(255, 255, 255, 0.98)",
  inputBg: "#F4F4F5",
};

export function getThemeColors(darkMode: boolean): ThemeColors {
  return darkMode ? darkColors : lightColors;
}

