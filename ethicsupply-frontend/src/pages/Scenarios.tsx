import React, { useState } from "react";
import { runScenario } from "../services/api";
import { useThemeColors } from "../theme/useThemeColors";

// Helper to get API endpoint (same logic as api.ts)
const getApiEndpoint = (path: string) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://optisupply.onrender.com/api";
  const formatUrl = (url: string) => url.replace(/\/+$/, "").replace(/([^:]\/)\/+/g, "$1");
  const API_URL = formatUrl(API_BASE_URL);
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  return `${API_URL}/${cleanPath}`;
};

export default function Scenarios() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [s1Info, setS1Info] = useState<{ base?: string; s1?: string } | null>(null);
  const [s1MarginThreshold, setS1MarginThreshold] = useState<number>(15);
  const [dataCoverage, setDataCoverage] = useState<any>(null);
  const [loadingCoverage, setLoadingCoverage] = useState(false);
  const colors = useThemeColors() as any;

  // Fetch data coverage statistics
  const fetchDataCoverage = async () => {
    setLoadingCoverage(true);
    try {
      const response = await fetch(getApiEndpoint("scenarios/coverage"), {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDataCoverage(data);
      }
    } catch (err) {
      console.error("Failed to fetch data coverage:", err);
    } finally {
      setLoadingCoverage(false);
    }
  };

  // Load coverage on mount
  React.useEffect(() => {
    fetchDataCoverage();
  }, []);

  const handleRun = async (
    type: "s1" | "s2" | "s3" | "s4",
    params: any = {},
    filename?: string
  ) => {
    setLoading(type);
    setError(null);
    setS1Info(null);
    
    try {
      // For S1, use the margin threshold from state
      if (type === "s1") {
        const s1Params = { ...params, minMarginPct: s1MarginThreshold };
        const response = await fetch(getApiEndpoint("scenarios/run"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ type, params: s1Params }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to run scenario ${type}: ${response.status} ${errorText}`);
        }

        // Read headers BEFORE blob()
        const base = response.headers.get("X-Baseline-Objective");
        const s1 = response.headers.get("X-S1-Objective");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "s1_ranking.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Set S1 info for display
        if (base || s1) {
          setS1Info({ base: base ?? undefined, s1: s1 ?? undefined });
        }
      } else {
        // For other scenarios, use the existing runScenario function
        await runScenario(type, params, filename);
      }
    } catch (err: any) {
      setError(err.message || `Failed to run ${type}`);
      console.error(`Error running ${type}:`, err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" style={{ color: colors.text }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
          Scenario Analysis (Chapter 4)
        </h1>
        <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
          Run S1-S4 scenarios to generate CSV exports for Chapter 4 evaluation
        </p>

        {error && (
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{
              backgroundColor: colors.error + "20",
              borderColor: colors.error,
              color: colors.error,
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* S1: Utility */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
              S1: Utility Analysis
            </h2>
            <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
              Minimize emission intensity with margin constraint
            </p>
            
            {/* Margin Threshold Input */}
            <div className="mb-4">
              <label className="block text-sm mb-2" style={{ color: colors.text }}>
                Margin Threshold (%):
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={s1MarginThreshold}
                  onChange={(e) => setS1MarginThreshold(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-md border"
                  style={{
                    backgroundColor: colors.panel,
                    borderColor: colors.accent + "40",
                    color: colors.text,
                  }}
                />
                <button
                  onClick={() => setS1MarginThreshold(5)}
                  className="px-3 py-2 text-xs rounded-md border"
                  style={{
                    backgroundColor: s1MarginThreshold === 5 ? colors.accent + "20" : colors.panel,
                    borderColor: colors.accent + "40",
                    color: colors.text,
                  }}
                >
                  5%
                </button>
                <button
                  onClick={() => setS1MarginThreshold(10)}
                  className="px-3 py-2 text-xs rounded-md border"
                  style={{
                    backgroundColor: s1MarginThreshold === 10 ? colors.accent + "20" : colors.panel,
                    borderColor: colors.accent + "40",
                    color: colors.text,
                  }}
                >
                  10%
                </button>
                <button
                  onClick={() => setS1MarginThreshold(15)}
                  className="px-3 py-2 text-xs rounded-md border"
                  style={{
                    backgroundColor: s1MarginThreshold === 15 ? colors.accent + "20" : colors.panel,
                    borderColor: colors.accent + "40",
                    color: colors.text,
                  }}
                >
                  15%
                </button>
              </div>
            </div>

            <button
              onClick={() => handleRun("s1", {}, `s1_ranking_margin${s1MarginThreshold}.csv`)}
              disabled={loading !== null}
              className="w-full px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: loading === "s1" ? colors.accent + "80" : colors.accent,
                color: "#fff",
              }}
            >
              {loading === "s1" ? "Running..." : `Run S1 (≥${s1MarginThreshold}%) → Download CSV`}
            </button>
            {s1Info && (
              <div className="mt-3 text-sm space-y-1" style={{ color: colors.textMuted }}>
                {s1Info.base && (
                  <div>
                    Baseline Objective: <b style={{ color: colors.text }}>{Number(s1Info.base).toFixed(4)}</b>
                  </div>
                )}
                {s1Info.s1 && (
                  <div>
                    S1 Objective: <b style={{ color: colors.text }}>{Number(s1Info.s1).toFixed(4)}</b>
                  </div>
                )}
                {s1Info.base && s1Info.s1 && (
                  <div className="pt-1 border-t" style={{ borderColor: colors.accent + "30" }}>
                    Δ%: <b style={{ color: colors.primary }}>
                      {(((Number(s1Info.base) - Number(s1Info.s1)) / Number(s1Info.base)) * 100).toFixed(2)}%
                    </b>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* S2: Sensitivity */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
              S2: Sensitivity Analysis
            </h2>
            <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
              Weight perturbations ±10% and ±20% → 4 CSVs (ZIP)
            </p>
            <button
              onClick={() => handleRun("s2", {}, "s2_bundle.zip")}
              disabled={loading !== null}
              className="w-full px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: loading === "s2" ? colors.accent + "80" : colors.accent,
                color: "#fff",
              }}
            >
              {loading === "s2" ? "Running..." : "Run S2 → Download ZIP"}
            </button>
          </div>

          {/* S3: Missingness */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
              S3: Missingness Analysis
            </h2>
            <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
              MCAR 5% & 10% × Mean/KNN imputation → 4 CSVs (ZIP)
            </p>
            <button
              onClick={() => handleRun("s3", {}, "s3_bundle.zip")}
              disabled={loading !== null}
              className="w-full px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: loading === "s3" ? colors.accent + "80" : colors.accent,
                color: "#fff",
              }}
            >
              {loading === "s3" ? "Running..." : "Run S3 → Download ZIP"}
            </button>
          </div>

          {/* S4: Ablation */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.accent + "40",
            }}
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
              S4: Ablation Analysis
            </h2>
            <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
              Normalization OFF vs ON → 2 CSVs (ZIP)
            </p>
            <button
              onClick={() => handleRun("s4", {}, "s4_bundle.zip")}
              disabled={loading !== null}
              className="w-full px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: loading === "s4" ? colors.accent + "80" : colors.accent,
                color: "#fff",
              }}
            >
              {loading === "s4" ? "Running..." : "Run S4 → Download ZIP"}
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: colors.panel + "80" }}>
          <h3 className="font-semibold mb-2" style={{ color: colors.text }}>
            CSV Columns
          </h3>
          <ul className="text-sm space-y-1" style={{ color: colors.textMuted }}>
            <li>• <strong>All Scenarios:</strong> SupplierID, Rank, Name, Industry</li>
            <li>• Environmental Score, Social Score, Governance Score</li>
            <li>• Composite Score, Risk Penalty, Final Score</li>
            <li>• <strong>S1 Only:</strong> Emission Intensity, Margin %, Margin Source, Constraint Applied</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

