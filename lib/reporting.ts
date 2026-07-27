export type ReportTier = "free" | "premium";
export type ReportBrand = "personal" | "firm" | "chambers";

export const REPORT_BRANDS: Record<
  ReportBrand,
  { eyebrow: string; name: string; descriptor: string; shortName: string }
> = {
  personal: {
    eyebrow: "AI VORTEX PRO",
    name: "Manu Ayala",
    descriptor: "Legal AI Risk Intelligence",
    shortName: "MA",
  },
  firm: {
    eyebrow: "SAMPLE FIRM-BRANDED EXPORT",
    name: "Hartwell & Pierce LLP",
    descriptor: "Litigation Risk & Knowledge",
    shortName: "HP",
  },
  chambers: {
    eyebrow: "SAMPLE CHAMBERS EXPORT",
    name: "Chambers of Hon. Elena R. Marsh",
    descriptor: "Neutral Public-Record Brief",
    shortName: "EM",
  },
};

export function readReportBrand(value: string | undefined): ReportBrand {
  return value === "firm" || value === "chambers" ? value : "personal";
}

export function createReportId(prefix: string, input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const value = (hash >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
  return `${prefix}-${value}`;
}
