export type Industry =
  | "Energy"
  | "Manufacturing"
  | "Retail"
  | "Technology"
  | "Healthcare"
  | "Other";

export interface SupplierESGInput {
  // Identifiers
  supplierId: string;
  name: string;
  country: string;
  industry: Industry;
  fiscalYear: number;

  // Scale metrics
  revenueUSDm: number | null; // Revenues in millions USD
  employees: number | null;

  // Environmental raw metrics (nullable to represent “not disclosed”)
  ghgScope1_tCO2e: number | null;
  ghgScope2_tCO2e: number | null;
  energyRenewable_pct: number | null;
  waterUse_megaliters: number | null;
  waste_tonnes: number | null;

  // Social metrics
  injuryRate_per200kHrs: number | null;
  trainingHours_perEmployee: number | null;
  wageRatio_vsLivingWage: number | null;
  workforceDiversity_pct: number | null;

  // Governance metrics
  boardDiversity_pct: number | null;
  boardIndependence_pct: number | null;
  antiCorruptionPolicy: boolean | null;
  transparencyScore_0to100: number | null;

  // Risk indicators (0–1)
  climateRisk_0to1: number | null;
  geopoliticalRisk_0to1: number | null;
  laborRisk_0to1: number | null;

  // Metadata
  externallyAssured: boolean | null;
  notes?: string | null;
}
