import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  InformationCircleIcon,
  ChartBarIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import { useThemeColors } from "../theme/useThemeColors";

const useColors = () => useThemeColors() as any;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: 0.1 * i, duration: 0.5 } }),
};

const AboutMethodology: React.FC = () => {
  const colors = useColors();
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
      {/* Hero */}
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
            <SparklesIcon className="h-6 w-6" style={{ color: colors.primary }} />
            <span className="text-sm px-2 py-0.5 rounded-full border" style={{ borderColor: colors.accent+"40", color: colors.textMuted }}>
              Ethical Supply Intelligence
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            About <span style={{ color: colors.primary }}>OptiSupply</span>
          </h1>
          <p className="mt-2 text-base md:text-lg" style={{ color: colors.textMuted }}>
            A transparent, explainable approach to evaluating suppliers on Environmental, Social, and Governance pillars.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-full border" style={{ color: colors.textMuted, borderColor: colors.accent+"40" }}>Synthetic v1</span>
            <span className="text-xs px-2 py-1 rounded-full border" style={{ color: colors.textMuted, borderColor: colors.accent+"40" }}>Risk-adjusted</span>
            <span className="text-xs px-2 py-1 rounded-full border" style={{ color: colors.textMuted, borderColor: colors.accent+"40" }}>Data completeness aware</span>
          </div>
        </div>
      </motion.div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left column */}
        <div className="space-y-4 md:space-y-6 lg:col-span-2">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border p-5 md:p-6" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
            <div className="flex items-center mb-3">
              <InformationCircleIcon className="h-5 w-5 mr-2" style={{ color: colors.primary }} />
              <h2 className="text-lg md:text-xl font-semibold">Purpose & Scope</h2>
            </div>
            <p className="text-sm md:text-base" style={{ color: colors.textMuted }}>
              This prototype showcases an ethical supply chain analytics stack (React + Node/Express + MongoDB) with an explainable ESG scoring pipeline. It is for thesis evaluation and discussion, not investment advice.
            </p>
          </motion.div>

          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border p-5 md:p-6" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
            <div className="flex items-center mb-3">
              <ChartBarIcon className="h-5 w-5 mr-2" style={{ color: colors.secondary }} />
              <h2 className="text-lg md:text-xl font-semibold">Scoring Math</h2>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm md:text-base" style={{ color: colors.text }}>
              <li>Environmental = 100 × (0.4·emissions_intensity + 0.2·renewable + 0.2·water_intensity + 0.2·waste_intensity)</li>
              <li>Social = 100 × (0.3·injury_rate + 0.2·training_hours + 0.2·wage_ratio + 0.3·diversity)</li>
              <li>Governance = 100 × (0.25·board_diversity + 0.25·board_independence + 0.2·anti_corruption + 0.3·transparency)</li>
              <li>Composite = 0.4·Environmental + 0.3·Social + 0.3·Governance</li>
            </ul>
          </motion.div>

          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border p-5 md:p-6" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
            <div className="flex items-center mb-3">
              <BeakerIcon className="h-5 w-5 mr-2" style={{ color: colors.primary }} />
              <h2 className="text-lg md:text-xl font-semibold">Normalization</h2>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm md:text-base" style={{ color: colors.text }}>
              <li>Lower-is-better: n = (max − x) / (max − min)</li>
              <li>Higher-is-better: n = (x − min) / (max − min)</li>
              <li>wage_ratio: ≥ 1 saturates to 1; below 1 decays linearly to 0</li>
            </ul>
          </motion.div>

          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border p-5 md:p-6" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
            <div className="flex items-center mb-3">
              <ShieldExclamationIcon className="h-5 w-5 mr-2" style={{ color: colors.warning }} />
              <h2 className="text-lg md:text-xl font-semibold">Risk Adjustment</h2>
            </div>
            <p className="text-sm md:text-base" style={{ color: colors.textMuted }}>
              Ethical = Composite × (1 − RiskFactor), where RiskFactor is the average of climate, geopolitical, and labor risks in [0,1]. Levels: low (&lt;0.2), medium (&lt;0.4), high (&lt;0.6), critical (≥0.6).
            </p>
          </motion.div>

          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border p-5 md:p-6" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
            <div className="flex items-center mb-3">
              <DocumentTextIcon className="h-5 w-5 mr-2" style={{ color: colors.accent }} />
              <h2 className="text-lg md:text-xl font-semibold">Completeness & Cap</h2>
            </div>
            <p className="text-sm md:text-base" style={{ color: colors.textMuted }}>
              We track data completeness; if coverage falls below 70%, the ethical score is capped at 50 to avoid overconfidence on sparse data.
            </p>
          </motion.div>

          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border p-5 md:p-6" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
            <div className="flex items-center mb-3">
              <GlobeAltIcon className="h-5 w-5 mr-2" style={{ color: colors.success }} />
              <h2 className="text-lg md:text-xl font-semibold">Synthetic Data</h2>
            </div>
            <p className="text-sm md:text-base" style={{ color: colors.textMuted }}>
              Data is generated per industry with realistic ranges and correlations (e.g., renewables ↘ emissions intensity; training ↘ injury). Bands constrain ranges; optional anchors nudge means (α = 0.2). Versioned and seeded for reproducibility.
            </p>
          </motion.div>

          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border p-5 md:p-6" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
            <div className="flex items-center mb-3">
              <AcademicCapIcon className="h-5 w-5 mr-2" style={{ color: colors.secondary }} />
              <h2 className="text-lg md:text-xl font-semibold">Limitations & Ethics</h2>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm md:text-base" style={{ color: colors.text }}>
              <li>Synthetic dataset for demonstration; not investment advice</li>
              <li>Imputation via industry/global averages may bias results</li>
              <li>Default weights should be reviewed per use-case</li>
            </ul>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-4 md:space-y-6">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border p-5 md:p-6" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
            <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2" style={{ color: colors.primary }} />
              What’s inside
            </h3>
            <ul className="text-sm space-y-1" style={{ color: colors.textMuted }}>
              <li>Transparent math and weights</li>
              <li>Risk-aware adjustments</li>
              <li>Mobile-first visualizations</li>
              <li>Data quality awareness</li>
            </ul>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border p-5 md:p-6" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
            <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center">
              <BeakerIcon className="h-5 w-5 mr-2" style={{ color: colors.secondary }} />
              Reproducibility
            </h3>
            <ul className="text-sm space-y-1" style={{ color: colors.textMuted }}>
              <li>tools/generate_synthetic_esg.js</li>
              <li>reports/calibration_note.md</li>
              <li>tools/export_thesis_assets.js</li>
              <li>data/bands_v1.json, /api/dataset/meta</li>
            </ul>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border p-5 md:p-6" style={{ backgroundColor: colors.panel, borderColor: colors.accent+"40" }}>
            <h3 className="text-base md:text-lg font-semibold mb-3">Keep exploring</h3>
            <div className="flex flex-col gap-2">
              <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm text-center border hover:opacity-90" style={{ color: colors.primary, borderColor: colors.primary+"40", backgroundColor: colors.background }}>
                Visit Dashboard
              </Link>
              <Link to="/supply-chain-graph" className="px-3 py-2 rounded-md text-sm text-center border hover:opacity-90" style={{ color: colors.accent, borderColor: colors.accent+"40", backgroundColor: colors.background }}>
                Explore Supply Chain Graph
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutMethodology;
