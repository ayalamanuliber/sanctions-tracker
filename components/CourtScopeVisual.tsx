import { Landmark } from "lucide-react";

import { getCourtVisual } from "@/lib/court-visual";
import type { CorpusEntity } from "@/lib/entity-pages";
import styles from "./CourtScopeVisual.module.css";

export function CourtScopeVisual({
  entity,
  variant,
  showCaption = false,
}: {
  entity: CorpusEntity;
  variant: "profile" | "directory" | "report";
  showCaption?: boolean;
}) {
  const visual = getCourtVisual(entity);
  return (
    <span
      className={`${styles.visual} ${styles[variant]}`}
      data-court-scope-visual={COURT_SCOPE_VISUAL_MARKER}
      role="img"
      aria-label={visual.ariaLabel}
    >
      <span className={styles.grid} aria-hidden="true" />
      <Landmark aria-hidden="true" />
      <strong>{visual.code}</strong>
      <span className={styles.scope}>{visual.scope}</span>
      <span className={styles.kind}>{visual.classification}</span>
      {showCaption && <small>{visual.caption}</small>}
    </span>
  );
}

export const COURT_SCOPE_VISUAL_MARKER = "structured-fallback";

