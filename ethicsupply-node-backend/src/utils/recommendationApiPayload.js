/**
 * Recommendation payloads formatted for ethicsupply-frontend (snake_case, nested supplier).
 * Derives pillar focus and copy from actual supplier metric fields — fixes 0–100 scores
 * being clamped to 1 in older controller logic.
 */

const PILLARS = ["environmental", "social", "governance"];

/** @returns {number|null} 0..1 */
function toUnitInterval(v) {
  if (v === undefined || v === null || Number.isNaN(Number(v))) return null;
  const x = Number(v);
  if (x > 1) return Math.min(Math.max(x / 100, 0), 1);
  return Math.min(Math.max(x, 0), 1);
}

function mean(nums) {
  const n = nums.filter((z) => z !== null && z !== undefined && !Number.isNaN(z));
  if (!n.length) return null;
  return n.reduce((a, b) => a + b, 0) / n.length;
}

function environmentalStrength(s, score01) {
  const ren = toUnitInterval(s.renewable_energy_percent);
  const waste = toUnitInterval(s.waste_management_score);
  const ee = toUnitInterval(s.energy_efficiency);
  const pol = toUnitInterval(s.pollution_control);
  if (ren !== null && ren < 0.38)
    return `renewable electricity share is roughly ${Math.round(
      ren * 100
    )}% versus peers targeting 60–90%`;
  if (ee !== null && ee < score01 + 0.05 && ee <= 0.45)
    return "energy intensity and efficiency signals trail the portfolio median";
  if (pol !== null && pol <= 0.45)
    return "pollution controls and fugitive emission controls need tighter verification";
  if (waste !== null && waste <= 0.45)
    return "waste and circularity metrics lag relative to procurement expectations";
  return "environmental KPI mix trails social and governance balance for this supplier";
}

function socialStrength(s, score01) {
  const wf = toUnitInterval(s.wage_fairness);
  const hr = toUnitInterval(s.human_rights_index);
  const ws = toUnitInterval(s.worker_safety);
  const di = toUnitInterval(s.diversity_inclusion_score);
  if (wf !== null && wf <= 0.52)
    return "wage fairness and living-wage adherence show the largest gap versus benchmarks";
  if (ws !== null && ws <= 0.55)
    return "worker safety and training depth are below the level implied by operational scale";
  if (di !== null && di <= 0.5)
    return "diversity, equity, and inclusion programme maturity is behind stated targets";
  if (hr !== null && hr <= 0.55)
    return "human rights due diligence coverage is thinner on high-risk spend categories";
  return "social performance is the weakest pillar relative to environmental and governance";
}

function governanceStrength(s, score01) {
  const tr = toUnitInterval(s.transparency_score);
  const trc = toUnitInterval(s.traceability);
  const comp = toUnitInterval(s.compliance_systems);
  const eth = toUnitInterval(s.ethics_program);
  if (trc !== null && trc <= 0.55)
    return "traceability and chain-of-custody evidence is inconsistent across SKUs";
  if (tr !== null && tr <= 0.55)
    return "transparency and disclosure cadence are behind what audits now expect";
  if (comp !== null && comp <= 0.52)
    return "compliance control testing frequency is light given geographic exposure";
  if (eth !== null && eth <= 0.52)
    return "ethics programme operating evidence (training, speak-up) needs hardening";
  return "governance and controls are the relative weak point in the ESG stack";
}

function pillarLabel(p) {
  if (p === "environmental") return "environmental";
  if (p === "social") return "social / labor";
  return "governance";
}

function pillarScores(supplier) {
  const envDirect = toUnitInterval(supplier.environmental_score);
  const envFallback = mean([
    toUnitInterval(supplier.waste_management_score),
    toUnitInterval(supplier.energy_efficiency),
    toUnitInterval(supplier.pollution_control),
    toUnitInterval(supplier.renewable_energy_percent),
  ]);
  const environmental = envDirect ?? envFallback ?? 0.55;

  const socDirect = toUnitInterval(supplier.social_score);
  const socFallback = mean([
    toUnitInterval(supplier.wage_fairness),
    toUnitInterval(supplier.human_rights_index),
    toUnitInterval(supplier.community_engagement),
    toUnitInterval(supplier.diversity_inclusion_score),
    toUnitInterval(supplier.worker_safety),
  ]);
  const social = socDirect ?? socFallback ?? 0.55;

  const govDirect = toUnitInterval(supplier.governance_score);
  const govFallback = mean([
    toUnitInterval(supplier.transparency_score),
    toUnitInterval(supplier.corruption_risk),
    toUnitInterval(supplier.board_diversity),
    toUnitInterval(supplier.ethics_program),
    toUnitInterval(supplier.compliance_systems),
    toUnitInterval(supplier.quality_control_score),
    toUnitInterval(supplier.supplier_diversity),
    toUnitInterval(supplier.traceability),
  ]);
  const governance = govDirect ?? govFallback ?? 0.55;

  return {
    environmental: Math.min(Math.max(environmental, 0), 1),
    social: Math.min(Math.max(social, 0), 1),
    governance: Math.min(Math.max(governance, 0), 1),
  };
}

function priorityFromScore01(v) {
  if (v < 0.36) return "high";
  if (v < 0.62) return "medium";
  return "low";
}

function impactFromPriority(p) {
  if (p === "high") return "High";
  if (p === "medium") return "Medium";
  return "Low";
}

function timeframeFromPriority(p) {
  if (p === "high") return "3 months";
  if (p === "medium") return "6 months";
  return "12 months";
}

function implementationDays(p) {
  if (p === "high") return 92;
  if (p === "medium") return 168;
  return 270;
}

function difficultyFrom(pillar, priority) {
  if (priority === "high") return "Medium";
  if (pillar === "governance") return "Medium";
  return "Low";
}

function actionLine(pillar) {
  if (pillar === "environmental")
    return "Deploy a 90-day environmental remediation sprint with verified baselines";
  if (pillar === "social")
    return "Stand up a living-wage and safety assurance programme with supplier sign-off";
  return "Institutionalise traceability, policy attestation, and audit-ready evidence packs";
}

function detailsLine(pillar, supplierName) {
  if (pillar === "environmental")
    return `Sequence changes by site: baseline → quick wins on energy and waste → third-party verification. Align milestones with ${supplierName}'s reporting cycle.`;
  if (pillar === "social")
    return `Use tiered remediation: training and hotline coverage first, then joint audits on highest-risk spend. Document closure evidence for procurement.`;
  return `Map controls to a lightweight SOC for ESG: owners, testing frequency, exception handling, and board-facing summaries.`;
}

function insightForPillar(pillar, supplier, score01) {
  if (pillar === "environmental")
    return environmentalStrength(supplier, score01);
  if (pillar === "social") return socialStrength(supplier, score01);
  return governanceStrength(supplier, score01);
}

/**
 * Single recommendation payload for one supplier × pillar (snake_case, frontend-aligned).
 */
function buildPayload(supplier, pillar, score01, batchIndex = 1) {
  const sid = supplier._id != null ? String(supplier._id) : String(supplier.id ?? "unknown");
  const name = supplier.name || "Supplier";
  let ethical;
  if (supplier.ethical_score !== undefined && supplier.ethical_score !== null) {
    const n = Number(supplier.ethical_score);
    ethical = n <= 1 && n >= 0 ? Math.round(n * 100) : Math.round(n);
  } else {
    ethical = Math.round(score01 * 100);
  }

  const priority = priorityFromScore01(score01);
  const impact = impactFromPriority(priority);
  const timeframe = timeframeFromPriority(priority);
  const pillarHuman = pillarLabel(pillar);
  const insight = insightForPillar(pillar, supplier, score01);

  const scorePct = Math.round(score01 * 1000) / 10;
  const title = `Improve ${pillarHuman} performance for ${name}${batchIndex > 1 ? ` (Focus ${batchIndex})` : ""}`;

  const description = `${name}'s modeled ${pillar} pillar sits near ${scorePct}% relative strength. ${insight.charAt(0).toUpperCase()}${insight.slice(1)}.`;

  const reasoning = `${insight} Normalised ${pillar} score ~${scorePct} versus portfolio targets; this becomes the sequencing anchor for remediation.`;
  const impactAssessment = `Closing this gap lifts composite ESG readiness and lowers audit/findings risk on the next sourcing review — expected programme impact tier: ${impact}.`;

  const recId = `rec-${sid}-${pillar}${batchIndex > 1 ? `-${batchIndex}` : ""}`;
  const now = new Date().toISOString();

  const bump = priority === "high" ? 6 : priority === "medium" ? 4 : 2;
  const scoreImprovement = Math.min(22, bump + Math.round((1 - score01) * 12));
  const costBand = priority === "high" ? 180000 + Math.round(score01 * 40000) : 75000 + Math.round(score01 * 50000);

  return {
    _id: recId,
    id: recId,
    action: actionLine(pillar),
    impact,
    difficulty: difficultyFrom(pillar, priority),
    timeframe,
    details: detailsLine(pillar, name),
    title,
    description,
    category: pillar,
    priority,
    status: "pending",
    urgency: priority === "high" ? "High" : priority === "medium" ? "Medium" : "Low",
    supplier_id: sid,
    supplier_name: name,
    supplier: {
      name,
      country: supplier.country ?? "",
      industry: supplier.industry ?? "",
      ethical_score: ethical,
    },
    ai_explanation: {
      reasoning,
      impact_assessment: impactAssessment,
      implementation_difficulty: difficultyFrom(pillar, priority),
      timeframe,
      comparative_insights: [
        `Industry leaders in ${pillarHuman} typical land 12–25 pts higher on the same KPI bundle within two reporting cycles.`,
        `Prioritising this pillar reduces the probability of cascading findings in audits tied to tier-2 spend.`,
      ],
      urgency:
        priority === "high"
          ? "Escalate to executive sponsor within 30 days"
          : priority === "medium"
          ? "Route to category owner inside the quarter"
          : "Maintain in BAU governance rhythm",
    },
    estimated_impact: {
      score_improvement: scoreImprovement,
      cost_savings: costBand,
      implementation_time: implementationDays(priority),
    },
    created_at: supplier.created_at
      ? new Date(supplier.created_at).toISOString()
      : now,
    updated_at: supplier.updated_at ? new Date(supplier.updated_at).toISOString() : now,
    isMockData: false,
  };
}

/**
 * @param {object} supplier — plain Mongoose doc or POJO
 * @returns {object[]}
 */
function buildRecommendationPayloadsForSupplier(supplier) {
  if (!supplier) return [];
  const scores = pillarScores(supplier);
  const ranked = Object.entries(scores).sort((a, b) => a[1] - b[1]);

  /** @type {{pillar: string, score01: number, batchIndex: number}[]} */
  const picks = [];
  picks.push({
    pillar: ranked[0][0],
    score01: ranked[0][1],
    batchIndex: 1,
  });

  const second = ranked[1];
  const firstScore = ranked[0][1];
  if (second) {
    const gap = second[1] - firstScore;
    const materiallyClose = gap <= 0.16;
    const stillWeakSecond = second[1] < 0.74;
    if (materiallyClose || stillWeakSecond) {
      picks.push({
        pillar: second[0],
        score01: second[1],
        batchIndex: 2,
      });
    }
  }

  return picks.map((p) =>
    buildPayload(supplier, p.pillar, p.score01, p.batchIndex)
  );
}

/**
 * @param {object[]} suppliers
 * @returns {object[]}
 */
function flattenRecommendationPayloads(suppliers) {
  if (!Array.isArray(suppliers) || suppliers.length === 0) return [];
  return suppliers.flatMap((s) => buildRecommendationPayloadsForSupplier(s));
}

module.exports = {
  pillarScores,
  buildPayload,
  buildRecommendationPayloadsForSupplier,
  flattenRecommendationPayloads,
  PILLARS,
};
