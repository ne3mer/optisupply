// Configuration variables for the OptiEthic frontend application

export const formatApiBaseUrl = (url: string) =>
  url.replace(/\/+$/, "").replace(/([^:]\/)\/+/g, "$1");

const isLocalhost =
  typeof window !== "undefined" && window.location.hostname === "localhost";

/** Build ordered list of API roots (deduped). First entry is the default until a host succeeds. */
export function getApiBaseUrlCandidates(): string[] {
  const urls: string[] = [];

  const primary = import.meta.env.VITE_API_URL;
  if (primary && String(primary).trim()) {
    urls.push(formatApiBaseUrl(String(primary)));
  }

  const fallback = import.meta.env.VITE_API_FALLBACK_URL;
  if (fallback && String(fallback).trim()) {
    urls.push(formatApiBaseUrl(String(fallback)));
  }

  if (isLocalhost) {
    urls.push("http://localhost:8080/api");
  }

  // Public Render deployment (verified health-check). Used when Leapcell/custom host is down.
  urls.push("https://optisupply.onrender.com/api");

  return [...new Set(urls)];
}

let activeApiBaseUrl =
  getApiBaseUrlCandidates()[0] ?? "https://optisupply.onrender.com/api";

export function getActiveApiBaseUrl(): string {
  return activeApiBaseUrl;
}

export function setActiveApiBaseUrl(url: string): void {
  activeApiBaseUrl = formatApiBaseUrl(url);
}

/** Current API root (updates after a successful request via apiClient). */
export const API_BASE_URL = formatApiBaseUrl(
  getApiBaseUrlCandidates()[0] ?? "https://optisupply.onrender.com/api",
);

/** Same as active base at call time — prefer for new code. */
export function getApiBaseUrl(): string {
  return getActiveApiBaseUrl();
}

export function apiEndpoint(path: string): string {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  return `${getActiveApiBaseUrl()}/${cleanPath}`;
}

/**
 * Feature flags to enable/disable certain features
 */
export const FEATURES = {
  ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA === "true" || false,
  ENABLE_ANALYTICS: true,
  ENABLE_ML_FEATURES: true,
};

/** @deprecated Use getApiBaseUrl() — kept for older imports. */
export const API_URL = API_BASE_URL;

/**
 * Application-wide constants
 */
export const APP_CONSTANTS = {
  DEFAULT_PAGINATION_LIMIT: 10,
  CHART_COLORS: [
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#EF4444",
  ],
  MAP_CENTER: [0, 20],
  MAP_ZOOM: 2,
};
