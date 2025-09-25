import React from "react";
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
} from "@heroicons/react/24/outline";

const colors = {
  background: "#0D0F1A",
  panel: "rgba(25, 28, 43, 0.8)",
  primary: "#00F0FF",
  secondary: "#FF00FF",
  accent: "#4D5BFF",
  text: "#E0E0FF",
  textMuted: "#8A94C8",
  success: "#00FF8F",
  warning: "#FFD700",
  error: "#FF4D4D",
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.45 } }),
};

const Block = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border p-5 md:p-6" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
    <div className="flex items-center mb-3">
      <Icon className="h-5 w-5 mr-2" style={{ color: colors.primary }} />
      <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
    </div>
    <div className="text-sm md:text-base" style={{ color: colors.text }}>
      {children}
    </div>
  </motion.div>
);

const Methodology: React.FC = () => {
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
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-xl border p-6 md:p-8 mb-8" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
        <motion.div className="absolute -inset-24 blur-3xl opacity-20" style={{ background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})` }} animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <BeakerIcon className="h-6 w-6" style={{ color: colors.primary }} />
            <span className="text-sm px-2 py-0.5 rounded-full border" style={{ borderColor: colors.accent+"40", color: colors.textMuted }}>
              Scoring Methodology
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Methodology</h1>
          <p className="mt-2 text-base md:text-lg" style={{ color: colors.textMuted }}>
            This page documents the exact formulas, weights, and safeguards used to compute Environmental, Social, Governance, and final Ethical scores.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left (main) column */}
        <div className="space-y-4 md:space-y-6 lg:col-span-2">
          <Block title="Metric Normalization" icon={AdjustmentsHorizontalIcon}>
            <ul className="list-disc list-inside space-y-1">
              <li>Per-industry bands define ranges: min, avg, max (see <code>bands_v1.json</code>).</li>
              <li>Lower-is-better metrics: emissions, water, waste intensities; injury rate.</li>
              <li>Higher-is-better metrics: renewable %, training hours, diversity %, board diversity, board independence, transparency.</li>
              <li>Wage ratio centered at parity (≈1.0), rewarding values ≥ 1.0 and penalizing &lt; 1.0 with saturation.</li>
              <li>Missing values are imputed with the industry average for normalization only and tracked for completeness.</li>
            </ul>
            <div className="mt-3 text-sm" style={{ color: colors.textMuted }}>
              Formulas:
              <div className="mt-2">
                <div>normalize_lower(x) = (max − clamp(x,min,max)) / (max − min)</div>
                <div>normalize_higher(x) = (clamp(x,min,max) − min) / (max − min)</div>
                <div>intensities (if revenue &gt; 0): emission = total_emissions / revenue; water = water_usage / revenue; waste = waste_generated / revenue</div>
                <div>wage ratio: piecewise around 1.0 with bounds extended to [0.6, 1.2] to avoid extremes</div>
              </div>
            </div>
          </Block>

          <Block title="Pillar Scores (0–100)" icon={ChartBarIcon}>
            <p className="mb-2" style={{ color: colors.textMuted }}>Weights inside each pillar sum to 1.0.</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Environmental = 100 × (0.4·emission_intensity + 0.2·renewable_pct + 0.2·water_intensity + 0.2·waste_intensity)</li>
              <li>Social = 100 × (0.3·injury_rate + 0.2·training_hours + 0.2·wage_ratio + 0.3·diversity_pct)</li>
              <li>Governance = 100 × (0.25·board_diversity + 0.25·board_independence + 0.2·anti_corruption + 0.3·transparency_score)</li>
            </ul>
            <div className="mt-3 text-sm" style={{ color: colors.textMuted }}>
              Metric directions: lower-is-better for intensities and injury_rate; others higher-is-better except anti_corruption which is boolean (true → 1, false → 0).
            </div>
          </Block>

          <Block title="Composite & Ethical Score" icon={ScaleIcon}>
            <ul className="list-disc list-inside space-y-1">
              <li>Composite = 0.4·Environmental + 0.3·Social + 0.3·Governance</li>
              <li>Risk factor = average of present risks (climate_risk, geopolitical_risk, labor_dispute_risk), default 0.2 when missing</li>
              <li>Risk level thresholds: &lt;0.2 low; &lt;0.4 medium; &lt;0.6 high; otherwise critical</li>
              <li>Ethical Score = Composite × (1 − Risk Factor)</li>
            </ul>
          </Block>

          <Block title="Data Completeness Safeguard" icon={ShieldExclamationIcon}>
            <ul className="list-disc list-inside space-y-1">
              <li>Completeness ratio = (#present metrics) / (total considered metrics). Anti‑corruption counts as present only if true.</li>
              <li>If completeness &lt; 70%, Ethical Score is capped at 50.</li>
            </ul>
          </Block>

          <Block title="References (Code)" icon={InformationCircleIcon}>
            <ul className="list-disc list-inside space-y-1">
              <li>Backend scoring: <code>ethicsupply-node-backend/src/utils/esgScoring.js</code></li>
              <li>Bands data: <code>ethicsupply-node-backend/data/bands_v1.json</code></li>
              <li>Dataset meta API: <code>ethicsupply-node-backend/src/controllers/datasetController.js</code></li>
              <li>Dashboard aggregation: <code>ethicsupply-node-backend/src/controllers/supplierController.js</code></li>
            </ul>
          </Block>
        </div>

        {/* Right column */}
        <div className="space-y-4 md:space-y-6">
          <Block title="Quick Weights" icon={DocumentTextIcon}>
            <div className="text-sm space-y-2" style={{ color: colors.textMuted }}>
              <div><span className="font-semibold" style={{ color: colors.text }}>Environmental</span>: emission_intensity 0.4; renewable_pct 0.2; water_intensity 0.2; waste_intensity 0.2</div>
              <div><span className="font-semibold" style={{ color: colors.text }}>Social</span>: injury_rate 0.3; training_hours 0.2; wage_ratio 0.2; diversity_pct 0.3</div>
              <div><span className="font-semibold" style={{ color: colors.text }}>Governance</span>: board_diversity 0.25; board_independence 0.25; anti_corruption 0.2; transparency 0.3</div>
              <div><span className="font-semibold" style={{ color: colors.text }}>Composite</span>: E 0.4; S 0.3; G 0.3</div>
            </div>
          </Block>

          <Block title="Explore" icon={BeakerIcon}>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/dashboard" className="px-3 py-2 rounded-md text-center border hover:opacity-90" style={{ color: colors.primary, borderColor: colors.primary+"40", backgroundColor: colors.background }}>
                Dashboard
              </Link>
              <Link to="/about" className="px-3 py-2 rounded-md text-center border hover:opacity-90" style={{ color: colors.accent, borderColor: colors.accent+"40", backgroundColor: colors.background }}>
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

