export type ToolLogoKey =
  | "openai"
  | "anthropic"
  | "deepseek"
  | "gemini"
  | "google"
  | "grammarly"
  | "notebooklm"
  | "perplexity";

export type ToolCatalogEntry = {
  provider: string;
  category: string;
  description: string;
  officialUrl?: string;
  mark: string;
  accent: string;
  logoKey?: ToolLogoKey;
  trademarkNote?: string;
};

const TOOL_CATALOG: Record<string, ToolCatalogEntry> = {
  chatgpt: {
    provider: "OpenAI",
    category: "General-purpose AI assistant",
    description: "A conversational AI assistant used for drafting, analysis, research support, and other natural-language tasks.",
    officialUrl: "https://openai.com/chatgpt/overview/",
    mark: "GPT",
    accent: "#111827",
    logoKey: "openai",
    trademarkNote:
      "OpenAI and ChatGPT marks are the property of OpenAI and are used only to identify the product named in the public record.",
  },
  claude: {
    provider: "Anthropic",
    category: "General-purpose AI assistant",
    description: "An AI assistant from Anthropic used for analysis, writing, question answering, coding, and document work.",
    officialUrl: "https://www.anthropic.com/claude",
    mark: "CL",
    accent: "#c15f3c",
    logoKey: "anthropic",
  },
  cocounsel: {
    provider: "Thomson Reuters",
    category: "Legal AI assistant",
    description: "A professional legal AI assistant designed for research, analysis, drafting, and document-centered legal workflows.",
    officialUrl: "https://legal.thomsonreuters.com/en/products/cocounsel-legal",
    mark: "CC",
    accent: "#e05a33",
  },
  "google-gemini": {
    provider: "Google",
    category: "General-purpose AI assistant",
    description: "Google’s multimodal AI assistant and model experience for reasoning, writing, research, and connected tasks.",
    officialUrl: "https://gemini.google.com/",
    mark: "GM",
    accent: "#4f72e8",
    logoKey: "gemini",
  },
  "microsoft-copilot": {
    provider: "Microsoft",
    category: "AI productivity assistant",
    description: "Microsoft’s AI assistant family for search, writing, analysis, and work across Microsoft products.",
    officialUrl: "https://copilot.microsoft.com/",
    mark: "CP",
    accent: "#6d5bd0",
  },
  copilot: {
    provider: "Provider varies in the recorded source",
    category: "AI assistant label",
    description: "A generic Copilot label recorded in the source material without enough product detail to assign one vendor conclusively.",
    mark: "CP",
    accent: "#64748b",
  },
  grok: {
    provider: "xAI / SpaceXAI",
    category: "General-purpose AI assistant",
    description: "An AI assistant for question answering, research, coding, and knowledge work, including access through the X ecosystem.",
    officialUrl: "https://grok.com/",
    mark: "G",
    accent: "#111827",
  },
  "lexis-ai": {
    provider: "LexisNexis",
    category: "Legal research AI",
    description: "A generative AI experience for legal research, drafting, summarization, and analysis within the Lexis ecosystem.",
    officialUrl: "https://www.lexisnexis.com/en-us/products/lexis-plus-ai.page",
    mark: "L+",
    accent: "#c9232c",
  },
  perplexity: {
    provider: "Perplexity AI",
    category: "AI answer engine",
    description: "A web-grounded answer engine that researches online sources and returns synthesized answers with citations.",
    officialUrl: "https://www.perplexity.ai/",
    mark: "PX",
    accent: "#20808d",
    logoKey: "perplexity",
  },
  "vlex-fastcase": {
    provider: "vLex",
    category: "Legal research platform",
    description: "A legal research product label associated with the vLex and Fastcase legal information ecosystem.",
    officialUrl: "https://vlex.com/",
    mark: "vL",
    accent: "#ef5b35",
  },
  "centient-ai": {
    provider: "Provider identity not conclusively established",
    category: "Recorded AI product label",
    description: "An AI product name recorded in the public source; the current corpus does not establish enough vendor detail for a stronger attribution.",
    mark: "CA",
    accent: "#53657d",
  },
  "eve-legal": {
    provider: "Eve",
    category: "Legal AI platform",
    description: "A legal AI product used for litigation-oriented analysis, drafting, and case-work workflows.",
    officialUrl: "https://www.eve.legal/",
    mark: "E",
    accent: "#7047eb",
  },
  "google-bard": {
    provider: "Google",
    category: "Legacy AI assistant label",
    description: "Google’s former Bard assistant label, retained because that is how the product appears in the underlying public record.",
    officialUrl: "https://gemini.google.com/",
    mark: "B",
    accent: "#4285f4",
    logoKey: "google",
  },
  grammarly: {
    provider: "Grammarly",
    category: "AI writing assistant",
    description: "A writing assistance platform providing editing, rewriting, tone, and generative drafting features.",
    officialUrl: "https://www.grammarly.com/",
    mark: "G",
    accent: "#15a085",
    logoKey: "grammarly",
  },
  leap: {
    provider: "LEAP Legal Software",
    category: "Legal practice platform",
    description: "A legal practice management platform with AI-enabled drafting and workflow capabilities.",
    officialUrl: "https://www.leap.us/",
    mark: "LP",
    accent: "#ed1c24",
  },
  "mobioffice-ai-assistant": {
    provider: "MobiSystems",
    category: "Office productivity AI",
    description: "An AI assistant embedded in the MobiOffice productivity suite for writing and document tasks.",
    officialUrl: "https://www.mobisystems.com/",
    mark: "MO",
    accent: "#4c61d8",
  },
  "westlaw-ai": {
    provider: "Thomson Reuters",
    category: "Legal research AI",
    description: "An AI product label recorded in connection with the Westlaw legal research ecosystem.",
    officialUrl: "https://legal.thomsonreuters.com/en/products/westlaw",
    mark: "W",
    accent: "#e05a33",
  },
  "westlaw-precision": {
    provider: "Thomson Reuters",
    category: "Legal research platform",
    description: "A Westlaw legal research product designed for precision search, authority review, and litigation research workflows.",
    officialUrl: "https://legal.thomsonreuters.com/en/products/westlaw",
    mark: "WP",
    accent: "#e05a33",
  },
  "google-ai-overview": {
    provider: "Google",
    category: "AI search feature",
    description: "An AI-generated overview feature presented within Google Search.",
    officialUrl: "https://www.google.com/search/howsearchworks/",
    mark: "AO",
    accent: "#4285f4",
    logoKey: "google",
  },
  notebooklm: {
    provider: "Google",
    category: "Source-grounded research assistant",
    description: "A Google research and note-taking assistant that answers questions and generates outputs from user-provided sources.",
    officialUrl: "https://notebooklm.google/",
    mark: "NL",
    accent: "#4f72e8",
    logoKey: "notebooklm",
  },
  deepseek: {
    provider: "DeepSeek",
    category: "General-purpose AI assistant",
    description: "An AI assistant and model platform used for reasoning, writing, coding, and question answering.",
    officialUrl: "https://www.deepseek.com/",
    mark: "DS",
    accent: "#4d6bfe",
    logoKey: "deepseek",
  },
  "paxton-ai": {
    provider: "Paxton AI",
    category: "Legal AI assistant",
    description: "A legal AI assistant for research, drafting, document analysis, and legal workflow support.",
    officialUrl: "https://www.paxton.ai/",
    mark: "PA",
    accent: "#173a67",
  },
  clearbrief: {
    provider: "Clearbrief",
    category: "Legal writing and verification AI",
    description: "A legal writing platform used to connect factual and legal assertions to supporting source material.",
    officialUrl: "https://clearbrief.com/",
    mark: "CB",
    accent: "#2e69d1",
  },
  prowritingaid: {
    provider: "Orpheus Technology",
    category: "AI writing assistant",
    description: "A writing and editing assistant providing style, grammar, rewriting, and drafting support.",
    officialUrl: "https://prowritingaid.com/",
    mark: "PW",
    accent: "#ed694b",
  },
  opencase: {
    provider: "OpenCase",
    category: "Recorded legal technology label",
    description: "A legal technology product label recorded in the underlying source material.",
    mark: "OC",
    accent: "#2867b2",
  },
  courtaid: {
    provider: "CourtAid",
    category: "Recorded legal AI label",
    description: "A court- or litigation-oriented AI product label recorded in the underlying public source.",
    mark: "CA",
    accent: "#1f4f83",
  },
  "amicus-casemine": {
    provider: "CaseMine",
    category: "Legal research AI",
    description: "An AI legal research assistant associated with the CaseMine research platform.",
    officialUrl: "https://www.casemine.com/",
    mark: "AM",
    accent: "#26547c",
  },
  "archie-smokeball": {
    provider: "Smokeball",
    category: "Legal practice AI",
    description: "An AI product associated with Smokeball’s legal practice management platform.",
    officialUrl: "https://www.smokeball.com/",
    mark: "AR",
    accent: "#f15a29",
  },
  "athena-ai": {
    provider: "Provider identity not conclusively established",
    category: "Recorded AI product label",
    description: "An AI product name recorded in one public matter; vendor attribution remains limited by the source.",
    mark: "AT",
    accent: "#53657d",
  },
  chaton: {
    provider: "AIBY",
    category: "General-purpose AI assistant",
    description: "A mobile and web AI assistant used for chat, writing, summarization, and related content tasks.",
    officialUrl: "https://chaton.ai/",
    mark: "CH",
    accent: "#7357ff",
  },
  clearpoint: {
    provider: "Provider identity not conclusively established",
    category: "Recorded technology label",
    description: "A product name recorded in the source material without enough context to assign a specific vendor safely.",
    mark: "CP",
    accent: "#53657d",
  },
  eyelevel: {
    provider: "EyeLevel.ai",
    category: "AI platform",
    description: "An AI platform label recorded in the underlying public matter.",
    officialUrl: "https://www.eyelevel.ai/",
    mark: "EL",
    accent: "#5548c8",
  },
  "federally-lawyer": {
    provider: "Federally",
    category: "Legal AI product",
    description: "A legal AI product label recorded in the public source under the name Federally Lawyer.",
    mark: "FL",
    accent: "#173a67",
  },
  "first-drafts": {
    provider: "Provider identity not conclusively established",
    category: "AI drafting product",
    description: "An AI drafting product label recorded in one public matter.",
    mark: "FD",
    accent: "#53657d",
  },
  "ghostwriter-legal": {
    provider: "Ghostwriter Legal",
    category: "Legal AI drafting product",
    description: "A legal drafting product label recorded in the underlying public source.",
    mark: "GL",
    accent: "#313c52",
  },
  "google-ai": {
    provider: "Google",
    category: "General Google AI label",
    description: "A broad Google AI label used where the public record does not identify a narrower Google product.",
    officialUrl: "https://ai.google/",
    mark: "G",
    accent: "#4285f4",
    logoKey: "google",
  },
  "legal-genius": {
    provider: "Legal Genius",
    category: "Recorded legal AI product",
    description: "A legal AI product label recorded in the underlying public matter.",
    mark: "LG",
    accent: "#294c7a",
  },
  "lexis-nexis-s-ai": {
    provider: "LexisNexis",
    category: "Legal research AI label",
    description: "A source-specific LexisNexis AI label retained as recorded; it may overlap with other Lexis AI product naming.",
    officialUrl: "https://www.lexisnexis.com/en-us/products/lexis-plus-ai.page",
    mark: "LN",
    accent: "#c9232c",
  },
  "lexisnexis-ai": {
    provider: "LexisNexis",
    category: "Legal research AI label",
    description: "A broad LexisNexis AI label recorded where the source does not identify a narrower product edition.",
    officialUrl: "https://www.lexisnexis.com/en-us/products/lexis-plus-ai.page",
    mark: "LN",
    accent: "#c9232c",
  },
  "lexisnexis-protege": {
    provider: "LexisNexis",
    category: "Legal AI assistant",
    description: "A personalized legal AI assistant within the LexisNexis ecosystem for research, drafting, and workflow support.",
    officialUrl: "https://www.lexisnexis.com/en-us/products/lexis-plus-ai.page",
    mark: "PR",
    accent: "#c9232c",
  },
  mx2law: {
    provider: "MX2.law",
    category: "Legal AI product",
    description: "A legal AI product label recorded in the underlying public source.",
    officialUrl: "https://mx2.law/",
    mark: "M2",
    accent: "#152e4d",
  },
  tachdinai: {
    provider: "Tachdin.AI",
    category: "Recorded legal AI product",
    description: "A legal AI product label recorded in one public matter.",
    mark: "TA",
    accent: "#53657d",
  },
  vistoai: {
    provider: "Visto.AI",
    category: "Recorded AI product",
    description: "An AI product label recorded in the underlying public matter.",
    mark: "VA",
    accent: "#53657d",
  },
  "westlaw-and-others-unidentified": {
    provider: "Thomson Reuters and unidentified providers",
    category: "Mixed recorded tool label",
    description: "A mixed source label indicating Westlaw plus other tools that the current public record does not identify individually.",
    mark: "W+",
    accent: "#64748b",
  },
  "westlaw-quick-check": {
    provider: "Thomson Reuters",
    category: "Legal research verification tool",
    description: "A Westlaw feature used to review citations, authorities, and legal-document research context.",
    officialUrl: "https://legal.thomsonreuters.com/en/products/westlaw",
    mark: "WQ",
    accent: "#e05a33",
  },
};

export function getToolCatalogEntry(slug: string, label: string): ToolCatalogEntry {
  return TOOL_CATALOG[slug] || {
    provider: "Provider not verified from the current corpus",
    category: "Recorded AI product label",
    description: `${label} is a product label found in the linked public record. AI Vortex has not added vendor claims beyond what is currently verifiable.`,
    mark: label
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AI",
    accent: "#53657d",
  };
}
