import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors, type ThemeColors } from "./colors";

export function useThemeColors(): ThemeColors {
  const { darkMode } = useTheme();
  return getThemeColors(darkMode);
}

