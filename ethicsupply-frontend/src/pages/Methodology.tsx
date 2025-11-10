import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BeakerIcon,
  ChartBarIcon,
  ScaleIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  CalculatorIcon,
  LightBulbIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { getBands, getDatasetMeta, BandsMap, DatasetMeta } from "../services/api";
import { useThemeColors } from "../theme/useThemeColors";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.45 } }),
};

const Block = ({ id, title, icon: Icon, children, gradient }: { id?: string; title: string; icon: any; children: React.ReactNode; gradient?: string }) => {
  const colors = useThemeColors() as any;
  return (
    <motion.div 
      id={id} 
      variants={fadeUp} 
      initial="hidden" 
      animate="show" 
      className="rounded-xl border p-5 md:p-6 scroll-mt-24 relative overflow-hidden"
      style={{ 
        backgroundColor: colors.panel, 
        borderColor: colors.accent + "40",
      }}
    >
      {gradient && (
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: gradient }}
        />
      )}
      <div className="relative z-10">
        <div className="flex items-center mb-3">
          <div className="p-2 rounded-lg mr-3" style={{ backgroundColor: colors.accent + "20" }}>
            <Icon className="h-5 w-5" style={{ color: colors.primary }} />
          </div>
          <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
        </div>
        <div className="text-sm md:text-base" style={{ color: colors.text }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

const FormulaBox = ({ formula, description }: { formula: string; description?: string }) => {
  const colors = useThemeColors() as any;
  return (
    <div className="mt-3 p-4 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
      <code className="text-sm font-mono block mb-2" style={{ color: colors.primary }}>
        {formula}
      </code>
      {description && (
        <p className="text-xs mt-2" style={{ color: colors.textMuted }}>{description}</p>
      )}
    </div>
  );
};

const Methodology: React.FC = () => {
  const [bands, setBands] = useState<BandsMap | null>(null);
  const [datasetMeta, setDatasetMeta] = useState<DatasetMeta | null>(null);
  const industries = useMemo(() => (bands ? Object.keys(bands) : []), [bands]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");

  useEffect(() => {
    (async () => {
      const [b, m] = await Promise.all([getBands(), getDatasetMeta()]);
      if (b) setBands(b);
      if (m) setDatasetMeta(m);
    })();
  }, []);

  useEffect(() => {
    if (industries.length && !selectedIndustry) setSelectedIndustry(industries[0]);
  }, [industries, selectedIndustry]);

  const direction: Record<string, "lower" | "higher" | "special" | "bool"> = {
    emission_intensity: "lower",
    renewable_pct: "higher",
    water_intensity: "lower",
    waste_intensity: "lower",
    injury_rate: "lower",
    training_hours: "higher",
    wage_ratio: "special",
    diversity_pct: "higher",
    board_diversity: "higher",
    board_independence: "higher",
    transparency_score: "higher",
  };

  const colors = useThemeColors() as any;
  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        backgroundImage:
          "radial-gradient(circle at 10% 20%, rgba(0, 240, 255, 0.04) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(77, 91, 255, 0.05) 0%, transparent 40%)",
      }}
    >
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative overflow-hidden rounded-xl border p-6 md:p-8 mb-8"
        style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
      >
        <motion.div 
          className="absolute -inset-24 blur-3xl opacity-20" 
          style={{ background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})` }} 
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} 
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <BeakerIcon className="h-6 w-6" style={{ color: colors.primary }} />
            <span className="text-sm px-2 py-0.5 rounded-full border" style={{ borderColor: colors.accent + "40", color: colors.textMuted }}>
              Scoring Methodology
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Methodology</h1>
          <p className="mt-2 text-base md:text-lg" style={{ color: colors.textMuted }}>
            Complete documentation of the ESG scoring system, including formulas, weights, risk calculations, and scenario analysis methods.
          </p>
          {datasetMeta && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 rounded-full border" style={{ color: colors.textMuted, borderColor: colors.accent + "40" }}>
                Version: {String(datasetMeta.version || "synthetic-v1")} {datasetMeta.seed ? `(seed ${datasetMeta.seed})` : ""}
              </span>
              <span className="text-xs px-2 py-1 rounded-full border" style={{ color: colors.textMuted, borderColor: colors.accent + "40" }}>
                Bands: {datasetMeta.bandsVersion || "v1"}
              </span>
              {datasetMeta.generatedAt && (
                <span className="text-xs px-2 py-1 rounded-full border" style={{ color: colors.textMuted, borderColor: colors.accent + "40" }}>
                  Generated: {new Date(datasetMeta.generatedAt).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left (main) column */}
        <div className="space-y-4 md:space-y-6 lg:col-span-2">
          {/* Metric Normalization */}
          <Block 
            id="normalization" 
            title="Metric Normalization" 
            icon={AdjustmentsHorizontalIcon}
            gradient="linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))"
          >
            <p className="mb-3" style={{ color: colors.textMuted }}>
              All metrics are normalized to a 0-1 scale using industry-specific bands. This ensures fair comparison across different industries with varying baseline performance.
            </p>
            <ul className="list-disc list-inside space-y-2 mb-3">
              <li><strong>Lower-is-better metrics:</strong> Emission intensity, water intensity, waste intensity, injury rate</li>
              <li><strong>Higher-is-better metrics:</strong> Renewable %, training hours, diversity %, board metrics, transparency</li>
              <li><strong>Special handling:</strong> Wage ratio centered at parity (≈1.0), with saturation bounds [0.6, 1.2]</li>
              <li><strong>Missing values:</strong> Imputed with industry average for normalization, tracked for completeness</li>
            </ul>
            <FormulaBox 
              formula="normalize_lower(x) = (max − clamp(x, min, max)) / (max − min)"
              description="For metrics where lower values are better (e.g., emissions, waste)"
            />
            <FormulaBox 
              formula="normalize_higher(x) = (clamp(x, min, max) − min) / (max − min)"
              description="For metrics where higher values are better (e.g., renewable %, diversity)"
            />
            <FormulaBox 
              formula="Emission Intensity = emissions_tco2e / revenue_musd (tCO₂e per MUSD)"
              description="Intensity metrics normalize environmental impact by revenue scale"
            />
          </Block>

          {/* Pillar Scores */}
          <Block 
            id="pillars" 
            title="Pillar Scores (0–100)" 
            icon={ChartBarIcon}
            gradient="linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))"
          >
            <p className="mb-3" style={{ color: colors.textMuted }}>
              Each ESG pillar is computed as a weighted average of normalized metrics, scaled to 0-100.
            </p>
            
            <div className="space-y-4">
              <div className="p-3 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#10b981" }} />
                  Environmental Score
                </h3>
                <FormulaBox 
                  formula="E = 100 × (0.4·emission_intensity + 0.2·renewable_pct + 0.2·water_intensity + 0.2·waste_intensity)"
                  description="Weights sum to 1.0: Emission intensity (40%), Renewable energy (20%), Water intensity (20%), Waste intensity (20%)"
                />
              </div>

              <div className="p-3 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#3b82f6" }} />
                  Social Score
                </h3>
                <FormulaBox 
                  formula="S = 100 × (0.3·injury_rate + 0.2·training_hours + 0.2·wage_ratio + 0.3·diversity_pct)"
                  description="Weights sum to 1.0: Injury rate (30%), Training hours (20%), Wage ratio (20%), Diversity (30%)"
                />
              </div>

              <div className="p-3 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#8b5cf6" }} />
                  Governance Score
                </h3>
                <FormulaBox 
                  formula="G = 100 × (0.25·board_diversity + 0.25·board_independence + 0.2·anti_corruption + 0.3·transparency)"
                  description="Weights sum to 1.0: Board diversity (25%), Board independence (25%), Anti-corruption (20%), Transparency (30%)"
                />
              </div>
            </div>
          </Block>

          {/* Composite & Risk */}
          <Block 
            id="composite" 
            title="Composite Score & Risk Penalty" 
            icon={ScaleIcon}
            gradient="linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(239, 68, 68, 0.1))"
          >
            <p className="mb-3" style={{ color: colors.textMuted }}>
              The composite score combines all three pillars, then a risk penalty is applied based on geopolitical, climate, and labor risks.
            </p>
            
            <FormulaBox 
              formula="Composite = 0.4·E + 0.3·S + 0.3·G"
              description="Default weights: Environmental (40%), Social (30%), Governance (30%)"
            />

            <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
              <h3 className="font-semibold mb-2 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" style={{ color: colors.primary }} />
                Risk Penalty Calculation
              </h3>
              <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
                Risk penalty is computed from three risk dimensions with configurable weights and threshold:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm mb-3" style={{ color: colors.textMuted }}>
                <li><strong>Geopolitical Risk:</strong> Weight = 0.33 (default)</li>
                <li><strong>Climate Risk:</strong> Weight = 0.33 (default)</li>
                <li><strong>Labor Dispute Risk:</strong> Weight = 0.34 (default)</li>
              </ul>
              <FormulaBox 
                formula="risk_raw = weighted_mean(available_risks)"
                description="Weighted average of available risk values (0-1 scale), weights renormalized if some risks missing"
              />
              <FormulaBox 
                formula="risk_excess = max(0, risk_raw − T) where T = 0.3 (threshold)"
                description="Only excess risk above 30% threshold contributes to penalty"
              />
              <FormulaBox 
                formula="penalty = λ × risk_excess × 100 where λ = 15.0 (lambda)"
                description="Penalty scaled to 0-100 space. Default lambda = 15.0 for visible impact"
              />
              <FormulaBox 
                formula="Final Score = clamp(Composite − penalty, 0, 100)"
                description="Final score is composite minus risk penalty, clamped to [0, 100]"
              />
            </div>

            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: colors.accent + "10" }}>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                <strong>Risk Levels:</strong> &lt;0.2 = Low, &lt;0.4 = Medium, &lt;0.6 = High, ≥0.6 = Critical
              </p>
            </div>
          </Block>

          {/* Data Completeness */}
          <Block 
            id="completeness" 
            title="Data Completeness Safeguard" 
            icon={ShieldExclamationIcon}
            gradient="linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(251, 146, 60, 0.1))"
          >
            <p className="mb-3" style={{ color: colors.textMuted }}>
              To ensure scoring reliability, suppliers with insufficient data are penalized.
            </p>
            <FormulaBox 
              formula="completeness_ratio = (#present_metrics) / (total_considered_metrics)"
              description="Anti-corruption counts as present only if explicitly true"
            />
            <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                <strong>Completeness Threshold:</strong> If completeness &lt; 70%, Final Score is capped at 50.
              </p>
            </div>
          </Block>

          {/* Scenario Analysis */}
          <Block 
            id="scenarios" 
            title="Scenario Analysis (S1-S4)" 
            icon={LightBulbIcon}
            gradient="linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))"
          >
            <p className="mb-3" style={{ color: colors.textMuted }}>
              Four analytical scenarios test the robustness and fairness of the scoring system:
            </p>
            
            <div className="space-y-4">
              <div className="p-3 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="text-lg mr-2">S1</span> Utility Analysis
                </h3>
                <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
                  Tests supplier selection with margin constraints. Ranks suppliers by Emission Intensity (ascending), 
                  tie-breaking with Final Score (descending). Filters suppliers by minimum margin threshold (default: 15%).
                </p>
                <FormulaBox 
                  formula="Objective = mean(Emission Intensity) for suppliers passing margin constraint"
                  description="Lower objective = better (reduced emissions per revenue unit)"
                />
                <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
                  <strong>Output:</strong> CSV with Rank, Emission Intensity, Margin %, Margin Source, Constraint Applied
                </p>
              </div>

              <div className="p-3 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="text-lg mr-2">S2</span> Sensitivity Analysis
                </h3>
                <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
                  Tests ranking stability by perturbing environmental weight by ±10% and ±20%. 
                  Measures rank correlation using Kendall's Tau (τ).
                </p>
                <FormulaBox 
                  formula="τ = rank_correlation(baseline_ranking, perturbed_ranking)"
                  description="τ ≈ 1.0 indicates robust rankings (minimal rank shifts)"
                />
                <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
                  <strong>Output:</strong> 4 CSVs (s2p10, s2m10, s2p20, s2m20) with rank shift statistics
                </p>
              </div>

              <div className="p-3 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="text-lg mr-2">S3</span> Missingness Analysis
                </h3>
                <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
                  Tests scoring robustness with missing data. Injects 5% or 10% MCAR (Missing Completely At Random) 
                  missingness, then imputes using Industry Mean or KNN (k=5).
                </p>
                <FormulaBox 
                  formula="MAE = mean(|predicted_score − actual_score|)"
                  description="Lower MAE = better imputation accuracy"
                />
                <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
                  <strong>Output:</strong> CSV with imputation method, MAE, top-K preservation rate
                </p>
              </div>

              <div className="p-3 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="text-lg mr-2">S4</span> Fairness/Ablation Analysis
                </h3>
                <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
                  Tests fairness by comparing rankings with industry normalization ON vs OFF. 
                  Measures disparity (D) across industries.
                </p>
                <FormulaBox 
                  formula="D = max(industry_mean_scores) − min(industry_mean_scores)"
                  description="Lower D = more fair (reduced industry bias)"
                />
                <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
                  <strong>Output:</strong> CSV with normalization mode, disparity metric, Kendall's Tau
                </p>
              </div>
            </div>
          </Block>

          {/* Industry Bands Viewer */}
          <Block id="bands" title="Industry Bands Viewer" icon={InformationCircleIcon}>
            <p className="mb-3" style={{ color: colors.textMuted }}>
              Inspect per-industry bands that drive normalization. These define expected ranges (min/avg/max) per metric.
            </p>
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <label className="text-sm" style={{ color: colors.textMuted }}>Industry</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-3 py-2 rounded-md border bg-transparent"
                style={{ borderColor: colors.accent + "40", color: colors.text }}
              >
                {industries.map((ind) => (
                  <option key={ind} value={ind} style={{ color: "#000" }}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
            {!bands || !selectedIndustry ? (
              <div className="text-sm" style={{ color: colors.textMuted }}>Loading bands…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs md:text-sm">
                  <thead style={{ color: colors.textMuted }}>
                    <tr>
                      <th className="px-2 py-1">Metric</th>
                      <th className="px-2 py-1">Direction</th>
                      <th className="px-2 py-1">Min</th>
                      <th className="px-2 py-1">Avg</th>
                      <th className="px-2 py-1">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(bands[selectedIndustry] || {}).map(([metric, v]: any) => (
                      <tr key={metric} className="border-t" style={{ borderColor: colors.accent + "20" }}>
                        <td className="px-2 py-1" style={{ color: colors.text }}>{metric}</td>
                        <td className="px-2 py-1" style={{ color: colors.textMuted }}>
                          {direction[metric] === "lower" ? (
                            <span className="flex items-center">
                              <ArrowTrendingDownIcon className="h-3 w-3 mr-1 text-green-500" />
                              lower→better
                            </span>
                          ) : direction[metric] === "higher" ? (
                            <span className="flex items-center">
                              <ArrowTrendingUpIcon className="h-3 w-3 mr-1 text-blue-500" />
                              higher→better
                            </span>
                          ) : direction[metric] === "bool" ? (
                            "boolean"
                          ) : (
                            "parity≈1.0"
                          )}
                        </td>
                        <td className="px-2 py-1" style={{ color: colors.textMuted }}>{v?.min ?? "—"}</td>
                        <td className="px-2 py-1" style={{ color: colors.textMuted }}>{v?.avg ?? "—"}</td>
                        <td className="px-2 py-1" style={{ color: colors.textMuted }}>{v?.max ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Block>

          {/* Code References */}
          <Block id="references" title="Code References" icon={DocumentTextIcon}>
            <ul className="list-disc list-inside space-y-1">
              <li>Backend scoring: <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: colors.accent + "20" }}>ethicsupply-node-backend/src/utils/esgScoring.js</code></li>
              <li>Risk penalty: <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: colors.accent + "20" }}>ethicsupply-node-backend/src/risk/penalty.js</code></li>
              <li>Scenario runner: <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: colors.accent + "20" }}>ethicsupply-node-backend/src/scenarios/ScenarioRunner.js</code></li>
              <li>Bands data: <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: colors.accent + "20" }}>ethicsupply-node-backend/data/bands_v1.json</code></li>
              <li>Settings model: <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: colors.accent + "20" }}>ethicsupply-node-backend/src/models/ScoringSettings.js</code></li>
            </ul>
          </Block>
        </div>

        {/* Right column - Sticky TOC */}
        <div className="space-y-4 md:space-y-6 lg:sticky lg:top-20 h-max">
          <motion.div 
            variants={fadeUp} 
            initial="hidden" 
            animate="show" 
            className="rounded-xl border p-4 md:p-5"
            style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
          >
            <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center">
              <CogIcon className="h-4 w-4 mr-2" style={{ color: colors.primary }} />
              Quick Navigation
            </h3>
            <ul className="text-sm space-y-1" style={{ color: colors.textMuted }}>
              <li><a href="#normalization" className="hover:underline flex items-center"><span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }} />Metric Normalization</a></li>
              <li><a href="#pillars" className="hover:underline flex items-center"><span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }} />Pillar Scores</a></li>
              <li><a href="#composite" className="hover:underline flex items-center"><span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }} />Composite & Risk</a></li>
              <li><a href="#completeness" className="hover:underline flex items-center"><span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }} />Completeness</a></li>
              <li><a href="#scenarios" className="hover:underline flex items-center"><span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }} />Scenarios</a></li>
              <li><a href="#bands" className="hover:underline flex items-center"><span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }} />Industry Bands</a></li>
              <li><a href="#references" className="hover:underline flex items-center"><span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }} />References</a></li>
            </ul>
          </motion.div>

          <Block title="Quick Weights Reference" icon={CalculatorIcon}>
            <div className="text-sm space-y-3" style={{ color: colors.textMuted }}>
              <div>
                <span className="font-semibold block mb-1" style={{ color: colors.text }}>Environmental</span>
                <div className="text-xs">Emission: 0.4 | Renewable: 0.2 | Water: 0.2 | Waste: 0.2</div>
              </div>
              <div>
                <span className="font-semibold block mb-1" style={{ color: colors.text }}>Social</span>
                <div className="text-xs">Injury: 0.3 | Training: 0.2 | Wage: 0.2 | Diversity: 0.3</div>
              </div>
              <div>
                <span className="font-semibold block mb-1" style={{ color: colors.text }}>Governance</span>
                <div className="text-xs">Board Div: 0.25 | Board Ind: 0.25 | Anti-Corr: 0.2 | Trans: 0.3</div>
              </div>
              <div>
                <span className="font-semibold block mb-1" style={{ color: colors.text }}>Composite</span>
                <div className="text-xs">E: 0.4 | S: 0.3 | G: 0.3</div>
              </div>
            </div>
          </Block>

          <Block title="Risk Parameters" icon={ExclamationTriangleIcon}>
            <div className="text-sm space-y-2" style={{ color: colors.textMuted }}>
              <div>
                <span className="font-semibold" style={{ color: colors.text }}>Threshold (T):</span> 0.3
              </div>
              <div>
                <span className="font-semibold" style={{ color: colors.text }}>Lambda (λ):</span> 15.0
              </div>
              <div>
                <span className="font-semibold" style={{ color: colors.text }}>Weights:</span> Geo 0.33, Climate 0.33, Labor 0.34
              </div>
            </div>
          </Block>

          <Block title="Explore" icon={BeakerIcon}>
            <div className="flex flex-col gap-2 text-sm">
              <Link 
                to="/dashboard" 
                className="px-3 py-2 rounded-md text-center border hover:opacity-90 transition-opacity" 
                style={{ color: colors.primary, borderColor: colors.primary + "40", backgroundColor: colors.background }}
              >
                Dashboard
              </Link>
              <Link 
                to="/scenarios" 
                className="px-3 py-2 rounded-md text-center border hover:opacity-90 transition-opacity" 
                style={{ color: colors.accent, borderColor: colors.accent + "40", backgroundColor: colors.background }}
              >
                Scenarios
              </Link>
              <Link 
                to="/about" 
                className="px-3 py-2 rounded-md text-center border hover:opacity-90 transition-opacity" 
                style={{ color: colors.accent, borderColor: colors.accent + "40", backgroundColor: colors.background }}
              >
                About
              </Link>
            </div>
          </Block>
        </div>
      </div>
    </div>
  );
};

export default Methodology;
