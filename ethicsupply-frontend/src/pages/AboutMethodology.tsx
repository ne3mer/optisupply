import React from "react";

const AboutMethodology: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex justify-center px-4 py-10 bg-gray-900 text-gray-100">
      <article className="max-w-3xl">
        <h1>Methodology & Notes</h1>

        <h2>Purpose &amp; Scope</h2>
        <p>
          This prototype demonstrates an ethical supply chain analytics stack: a
          React frontend + Node/Express API + MongoDB, with an explainable ESG
          scoring pipeline. It is intended for thesis evaluation and discussion,
          not for investment decisions.
        </p>

        <h2 className="mt-8">Scoring Math (formulas)</h2>
        <p>
          Metric normalization (0–1) then pillar composition (0–100):
        </p>
        <ul>
          <li>
            Environmental = 100 × (0.4·emissions_intensity + 0.2·renewable +
            0.2·water_intensity + 0.2·waste_intensity)
          </li>
          <li>
            Social = 100 × (0.3·injury_rate + 0.2·training_hours +
            0.2·wage_ratio + 0.3·diversity)
          </li>
          <li>
            Governance = 100 × (0.25·board_diversity + 0.25·board_independence +
            0.2·anti_corruption + 0.3·transparency)
          </li>
          <li>
            Composite = 0.4·Environmental + 0.3·Social + 0.3·Governance
          </li>
        </ul>

        <h2 className="mt-8">Normalization</h2>
        <p>
          For each metric with industry band [min,max], value x:
        </p>
        <ul>
          <li>Lower-is-better: n = (max − x) / (max − min)</li>
          <li>Higher-is-better: n = (x − min) / (max − min)</li>
          <li>
            wage_ratio piecewise: above 1 (parity+) saturates to 1; below 1
            decays linearly to 0.
          </li>
        </ul>

        <h2 className="mt-8">Risk Adjustment &amp; Levels</h2>
        <p>
          Ethical = Composite × (1 − RiskFactor), where RiskFactor is the
          average of climate/geopolitical/labor risks in [0,1]. Levels: low
          (&lt;0.2), medium (&lt;0.4), high (&lt;0.6), critical (≥0.6).
        </p>

        <h2 className="mt-8">Completeness Ratio &amp; 50 Cap</h2>
        <p>
          We track data completeness across inputs; if coverage &lt; 70%, the
          ethical score is capped at 50 to avoid overconfidence on sparse data.
        </p>

        <h2 className="mt-8">Data Source &amp; Synthetic Generation</h2>
        <p>
          Synthetic data is generated per-industry with realistic ranges and
          correlations (e.g., more renewables → lower emissions intensity; more
          training → lower injury rate). Bands constrain ranges, optional
          anchors nudge means with a small blending factor (alpha = 0.2). The
          dataset is versioned (e.g., Synthetic v1) and seeded for reproducible
          runs.
        </p>

        <h2 className="mt-8">Limitations &amp; Ethics</h2>
        <ul>
          <li>Synthetic dataset for demonstration; do not use as investment advice.</li>
          <li>Imputation uses industry/global averages, which can bias results.</li>
          <li>Model weights are defaults and should be reviewed per context.</li>
        </ul>

        <h2>Reproducibility</h2>
        <ul>
          <li>Scripts: tools/generate_synthetic_esg.js</li>
          <li>Calibration: reports/calibration_note.md</li>
          <li>Assets export: tools/export_thesis_assets.js</li>
          <li>Seed and bands recorded in data/bands_v1.json and /api/dataset/meta</li>
        </ul>
      </article>
    </div>
  );
};

export default AboutMethodology;
