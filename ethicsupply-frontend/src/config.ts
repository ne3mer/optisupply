// Configuration variables for the OptiEthic frontend application

const formatApiBaseUrl = (url: string) =>
  url.replace(/\/+$/, "").replace(/([^:]\/)\/+/g, "$1");

/**
 * Base URL for API requests (normalized, no trailing slash).
 * Use `apiEndpoint()` for paths so slashes stay consistent.
 *
 * Priority: `VITE_API_URL` → local dev → production Render API.
 * (Previously the non-local default pointed at a different host than `api.ts`,
 * which made dashboard vs other pages hit different backends.)
 */
const rawApiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8080/api"
    : "https://optisupply.onrender.com/api");

export const API_BASE_URL = formatApiBaseUrl(String(rawApiBaseUrl));

/** Same as API_BASE_URL; kept for call sites that prefer the name `API_URL`. */
export const API_URL = API_BASE_URL;

export function apiEndpoint(path: string): string {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  return `${API_BASE_URL}/${cleanPath}`;
}

/**
 * Feature flags to enable/disable certain features
 */
export const FEATURES = {
  ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA === "true" || false, // When true, fallback to mock data if API fails
  ENABLE_ANALYTICS: true, // Analytics features
  ENABLE_ML_FEATURES: true, // Machine learning features
};

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
  MAP_CENTER: [0, 20], // Default map center [lat, lng]
  MAP_ZOOM: 2, // Default map zoom level
};
