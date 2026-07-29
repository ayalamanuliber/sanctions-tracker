import {
  BadgeAlert,
  Banknote,
  BookX,
  CircleOff,
  FileQuestion,
  FileWarning,
  FileX2,
  MessageSquareQuote,
  Scale,
  ShieldAlert,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { StateOutline } from "@/components/StateOutline";
import type { CorpusEntity } from "@/lib/entity-pages";
import { hasStateOutline } from "@/lib/us-states";

const FAILURE_ICONS: Readonly<Record<string, LucideIcon>> = {
  "fake-citations": BookX,
  "fabricated-quotes": MessageSquareQuote,
  "misrepresented-authority": Scale,
};

const CONSEQUENCE_ICONS: Readonly<Record<string, LucideIcon>> = {
  warning: ShieldAlert,
  "none-adjudicated": CircleOff,
  monetary: Banknote,
  "bar-referral": Scale,
  professional: BadgeAlert,
  "case-dismissed": FileX2,
  "ordered-to-show-cause": FileWarning,
  "struck-filing": FileX2,
  "ordered-to-explain": FileQuestion,
  disqualification: UserX,
};

export function EntityVisualMark({
  entity,
  decorative = false,
}: {
  entity: CorpusEntity;
  decorative?: boolean;
}) {
  if (entity.kind === "state") {
    const code = entity.records[0]?.state || entity.slug.toUpperCase();
    if (hasStateOutline(code)) {
      return <StateOutline state={code} decorative={decorative} />;
    }
    return (
      <strong
        data-entity-mark="state-code"
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : `${entity.label} jurisdiction code`}
      >
        {code}
      </strong>
    );
  }

  const Icon =
    entity.kind === "failure"
      ? FAILURE_ICONS[entity.slug] || ShieldAlert
      : entity.kind === "consequence"
        ? CONSEQUENCE_ICONS[entity.slug] || Scale
        : null;
  if (!Icon) return null;

  return (
    <Icon
      data-entity-mark={entity.kind}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${entity.label} symbol`}
    />
  );
}
