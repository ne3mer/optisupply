export type Targets = {
  renewablePct: number; // % of energy from renewables
  injuryRate: number;   // incidents per 200k hours (or chosen rate)
};

export const defaultTargets: Targets = {
  renewablePct: 60,
  injuryRate: 2.0,
};

