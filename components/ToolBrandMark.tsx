import {
  siAnthropic,
  siDeepseek,
  siGoogle,
  siGooglegemini,
  siGrammarly,
  siNotebooklm,
  siPerplexity,
} from "simple-icons/icons";

import { getToolCatalogEntry, type ToolLogoKey } from "@/lib/tool-catalog";

const LOGOS = {
  anthropic: siAnthropic,
  deepseek: siDeepseek,
  gemini: siGooglegemini,
  google: siGoogle,
  grammarly: siGrammarly,
  notebooklm: siNotebooklm,
  perplexity: siPerplexity,
} satisfies Record<ToolLogoKey, { path: string; title: string }>;

export function ToolBrandMark({
  slug,
  label,
  decorative = false,
}: {
  slug: string;
  label: string;
  decorative?: boolean;
}) {
  const profile = getToolCatalogEntry(slug, label);
  const logo = profile.logoKey ? LOGOS[profile.logoKey] : null;
  if (!logo) {
    return (
      <span
        data-tool-brand="monogram"
        style={{ color: profile.accent }}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : `${label} product mark`}
      >
        {profile.mark}
      </span>
    );
  }
  return (
    <svg
      data-tool-brand="logo"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${label} logo`}
      viewBox="0 0 24 24"
      fill={profile.accent}
    >
      {!decorative && <title>{logo.title}</title>}
      <path d={logo.path} />
    </svg>
  );
}
