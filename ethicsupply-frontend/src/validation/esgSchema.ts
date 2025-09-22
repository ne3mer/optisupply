import { z } from "zod";
import { Industry } from "../types/esg";

const currentYear = new Date().getFullYear();

const percentSchema = z
  .number()
  .min(0, "value must be ≥ 0")
  .max(100, "value must be ≤ 100")
  .nullable();

const riskSchema = z
  .number()
  .min(0, "risk must be ≥ 0")
  .max(1, "risk must be ≤ 1")
  .nullable();

const positiveNumberNullable = z
  .number()
  .min(0)
  .nullable();

export const esgSchema = z.object({
  supplierId: z.string().min(1, "supplierId is required"),
  name: z.string().min(1, "name is required"),
  country: z.string().min(1, "country is required"),
  industry: z.enum([
    "Energy",
    "Manufacturing",
    "Retail",
    "Technology",
    "Healthcare",
    "Other",
  ] as [Industry, ...Industry[]]),
  fiscalYear: z
    .number()
    .min(2018, "fiscal year must be ≥ 2018")
    .max(currentYear, `fiscal year must be ≤ ${currentYear}`),

  revenueUSDm: z.number().positive("revenue must be > 0"),
  employees: z.number().positive("employee count must be > 0"),

  ghgScope1_tCO2e: positiveNumberNullable,
  ghgScope2_tCO2e: positiveNumberNullable,
  energyRenewable_pct: percentSchema,
  waterUse_megaliters: positiveNumberNullable,
  waste_tonnes: positiveNumberNullable,

  injuryRate_per200kHrs: positiveNumberNullable,
  trainingHours_perEmployee: positiveNumberNullable,
  wageRatio_vsLivingWage: z.number().min(0, "wage ratio must be ≥ 0").nullable(),
  workforceDiversity_pct: percentSchema,

  boardDiversity_pct: percentSchema,
  boardIndependence_pct: percentSchema,
  antiCorruptionPolicy: z.boolean().nullable(),
  transparencyScore_0to100: percentSchema,

  climateRisk_0to1: riskSchema,
  geopoliticalRisk_0to1: riskSchema,
  laborRisk_0to1: riskSchema,

  externallyAssured: z.boolean().nullable(),
  notes: z.string().nullable().optional(),
});

export type SupplierESGInputSchema = z.infer<typeof esgSchema>;
