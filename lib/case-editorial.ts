import type { LegalRiskCase } from "@/lib/cases";

export interface CaseEditorial {
  directAnswer: string;
  whyCourtCared: string;
  whyItMatters: string;
  attributionStatus: "admitted" | "identified-by-court" | "reported" | "not-established";
  attributionBasis: string;
  proceduralPosture: string;
  correctionBehavior: string;
  limitations: string;
  reviewedForPublication: boolean;
}

const EDITORIAL: Record<string, CaseEditorial> = {
  "mata-v-avianca-inc-2023-06-22": {
    directAnswer: "Counsel filed authorities generated through ChatGPT that did not exist, then submitted purported copies after the problem was raised. The court imposed a $5,000 sanction and required notice to the client and judges whose names appeared on the fabricated opinions.",
    whyCourtCared: "The sanction was driven by counsel's gatekeeping failure and the decision to stand behind false material after receiving notice, not simply by the use of a generative tool.",
    whyItMatters: "Mata is the operational anchor for citation verification, prompt correction, and supervising-attorney signoff. A recoverable research error became a sanctions matter because the filing and response process failed.",
    attributionStatus: "admitted",
    attributionBasis: "Counsel disclosed use of ChatGPT in the sanctions record; the linked court order describes the resulting fabricated authorities.",
    proceduralPosture: "Post-filing sanctions proceeding in the Southern District of New York.",
    correctionBehavior: "Counsel initially defended the citations and supplied generated copies rather than promptly withdrawing or correcting them.",
    limitations: "This record summarizes the sanctions order and is not a substitute for the complete docket, subsequent history, or jurisdiction-specific advice.",
    reviewedForPublication: true,
  },
  "withers-v-city-of-aberdeen-2026-06-08": {
    directAnswer: "The court identified multiple authorities and quoted propositions it could not verify in filings from both sides. The recorded outcome includes monetary sanctions, pro hac vice consequences, disqualification, and bar referrals.",
    whyCourtCared: "The discrepancies affected material presented as legal authority and persisted across filings, requiring the court to spend time verifying propositions counsel was responsible for checking.",
    whyItMatters: "The matter shows that verification controls must apply to every side, every tool, and every filing. A tool label is less important than a documented source-checking process.",
    attributionStatus: "reported",
    attributionBasis: "The tracked source describes hallucinatory authorities and attributes use to First Drafts; inspect the linked order for the court's exact findings.",
    proceduralPosture: "Federal trial-court sanctions and attorney-qualification proceedings in the Northern District of Mississippi.",
    correctionBehavior: "The record reflects post-show-cause review and additional discrepancies; the precise response of each lawyer should be read from the underlying order.",
    limitations: "The current public link is a publisher-hosted copy. Confirm the official docket and any later orders before relying on the outcome.",
    reviewedForPublication: true,
  },
  "liza-gardner-v-sean-combs-et-al-2025-12-15": {
    directAnswer: "Counsel cited a nonexistent authority and later acknowledged that an AI system produced it without independent verification. The tracked outcome includes a $6,000 sanction, a bar referral, and notice to the client.",
    whyCourtCared: "The failure involved a nonexistent case presented as authority, despite prior sanctions and training that should have made verification duties unmistakable.",
    whyItMatters: "Training alone is not a control. Firms need a filing gate that records who checked existence, quoted language, proposition support, and unresolved exceptions.",
    attributionStatus: "admitted",
    attributionBasis: "The tracked order records counsel's admission that AI produced the citation and that it was not verified before filing.",
    proceduralPosture: "Sanctions proceeding in the District of New Jersey.",
    correctionBehavior: "The source should be consulted for the timing and sufficiency of counsel's correction and explanation.",
    limitations: "The current public link is a publisher-hosted copy. Verify the docket and any disciplinary follow-up independently.",
    reviewedForPublication: true,
  },
};

export const CURATED_CASE_SLUGS = Object.freeze(Object.keys(EDITORIAL));

export function getCaseEditorial(item: LegalRiskCase): CaseEditorial {
  return EDITORIAL[item.slug] || {
    directAnswer: item.summary,
    whyCourtCared: item.lesson || "The record was included because it contains a public signal about citation, quotation, authority, disclosure, or supervision risk.",
    whyItMatters: "Use the source to assess whether the observed pattern is relevant to the court, matter, and workflow you are reviewing.",
    attributionStatus: item.ai_tool_used && item.ai_tool_used !== "Unidentified" ? "reported" : "not-established",
    attributionBasis: item.ai_tool_used && item.ai_tool_used !== "Unidentified"
      ? `${item.ai_tool_used} is recorded in the source dataset; confirm the basis in the linked document.`
      : "The current record does not establish a specific AI tool. Do not infer AI use beyond the source.",
    proceduralPosture: item.outcome || "Procedural posture is not separately recorded in the current dataset.",
    correctionBehavior: "Correction behavior is not separately verified in the current record.",
    limitations: "This automatically generated record has not completed the curated publication review. Use the linked source and docket before relying.",
    reviewedForPublication: false,
  };
}

export function isCuratedCase(slug: string) {
  return CURATED_CASE_SLUGS.includes(slug);
}
