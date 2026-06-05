/**
 * Resilient API client: short timeouts, fallback hosts, session cache of last good base URL.
 */
import {
  formatApiBaseUrl,
  getApiBaseUrlCandidates,
  getActiveApiBaseUrl,
  setActiveApiBaseUrl,
} from "../config";
import logger from "../utils/log";

const CACHE_KEY = "optisupply-active-api-base";
// Render free tier can take up to 60s to wake from sleep — use generous timeouts.
const DEFAULT_TIMEOUT_MS = 45_000;
const HEALTH_TIMEOUT_MS = 60_000;

function buildUrl(base: string, path: string): string {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  return `${base}/${cleanPath}`;
}

export function initApiBaseFromCache(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached && getApiBaseUrlCandidates().includes(cached)) {
      setActiveApiBaseUrl(cached);
    }
  } catch {
    /* ignore */
  }
}

function rememberWorkingBase(base: string): void {
  setActiveApiBaseUrl(base);
  try {
    sessionStorage.setItem(CACHE_KEY, base);
  } catch {
    /* ignore */
  }
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timer);
  }
}

function orderedBases(): string[] {
  const candidates = getApiBaseUrlCandidates();
  const active = getActiveApiBaseUrl();
  if (!active) return candidates;
  return [active, ...candidates.filter((b) => b !== active)];
}

export type ApiFetchOptions = {
  timeoutMs?: number;
  /** If true, try every candidate even after a non-OK response (default: stop after first reachable host). */
  retryOnHttpError?: boolean;
};

/**
 * Fetch from API with timeout. Tries configured base URLs in order until one responds.
 */
export async function apiFetch(
  path: string,
  init?: RequestInit,
  options?: ApiFetchOptions,
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retryOnHttpError = options?.retryOnHttpError ?? false;
  let lastError: unknown;

  for (const base of orderedBases()) {
    const url = buildUrl(base, path);
    try {
      const response = await fetchWithTimeout(url, init, timeoutMs);

      if (response.ok) {
        rememberWorkingBase(base);
        return response;
      }

      if (retryOnHttpError && response.status < 500) {
        lastError = new Error(`HTTP ${response.status} from ${base}`);
        logger.warn(`API ${path} returned ${response.status} on ${base}, trying next host`);
        continue;
      }

      lastError = new Error(`HTTP ${response.status} from ${base}`);
      logger.warn(`API ${path} returned ${response.status} on ${base}`);
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`API unreachable at ${base} (${path}): ${msg}`);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All API hosts failed");
}

/** Probe all configured hosts in parallel; returns true if any health-check succeeds. */
export async function checkApiConnection(): Promise<boolean> {
  const bases = getApiBaseUrlCandidates();
  const probes = bases.map(async (base) => {
    try {
      const url = buildUrl(base, "health-check");
      const response = await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
        HEALTH_TIMEOUT_MS,
      );
      if (response.ok) {
        rememberWorkingBase(base);
        return true;
      }
    } catch {
      /* try next */
    }
    return false;
  });

  const results = await Promise.all(probes);
  return results.some(Boolean);
}
