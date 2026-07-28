import Link from "next/link";
import {
  Bot,
  Gavel,
  Globe2,
  Landmark,
  MapPin,
  ShieldAlert,
  Tags,
  type LucideIcon,
} from "lucide-react";

import {
  entityDirectoryHref,
  getEntities,
  type EntityKind,
} from "@/lib/entity-pages";
import styles from "./CorpusDirectoryNav.module.css";

type DirectoryItem = {
  kind: EntityKind;
  label: string;
  description: string;
  icon: LucideIcon;
};

const DIRECTORIES: DirectoryItem[] = [
  { kind: "court", label: "Courts", description: "Court-level evidence", icon: Landmark },
  { kind: "judge", label: "Judges", description: "Recorded decision-makers", icon: Gavel },
  { kind: "state", label: "US states", description: "Jurisdiction profiles", icon: MapPin },
  { kind: "country", label: "Countries", description: "Global coverage", icon: Globe2 },
  { kind: "tool", label: "AI tools", description: "Recorded products", icon: Bot },
  { kind: "failure", label: "Failure modes", description: "Evidence patterns", icon: Tags },
  { kind: "consequence", label: "Consequences", description: "Recorded outcomes", icon: ShieldAlert },
];

export default function CorpusDirectoryNav({
  activeKind,
  compact = false,
}: {
  activeKind?: EntityKind;
  compact?: boolean;
}) {
  return (
    <nav
      aria-label="Browse the legal AI evidence network"
      className={`${styles.wrap} ${compact ? styles.compact : ""}`}
    >
      <div className={styles.heading}>
        <strong>Browse the evidence network</strong>
        <span>Move between the people, institutions, places, tools, and patterns connected to each record.</span>
      </div>
      <div className={styles.grid}>
        {DIRECTORIES.map(({ kind, label, description, icon: Icon }) => {
          const count = getEntities(kind).length;
          return (
            <Link
              aria-current={activeKind === kind ? "page" : undefined}
              className={styles.item}
              data-active={activeKind === kind}
              href={entityDirectoryHref(kind)}
              key={kind}
            >
              <span className={styles.icon}><Icon aria-hidden="true" size={17} /></span>
              <span className={styles.copy}>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <b>{count.toLocaleString()}</b>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
