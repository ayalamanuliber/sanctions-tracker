import {
  attributionStatus,
  countValues,
  humanize,
  type CountedOption,
} from "@/lib/corpus-analytics";
import {
  type CorpusEntity,
} from "@/lib/entity-pages";

export type IntelligenceRow = CountedOption & {
  percentage: number;
  href: string;
};

export type EntityIntelligence = {
  question: string;
  summary: string;
  failures: IntelligenceRow[];
  consequences: IntelligenceRow[];
  parties: IntelligenceRow[];
  practiceAreas: IntelligenceRow[];
  attribution: IntelligenceRow[];
  severity: IntelligenceRow[];
  years: IntelligenceRow[];
  monetary: {
    signaled: number;
    known: number;
    unquantified: number;
    total: number;
    median: number;
    maximum: number;
    href: string;
  };
  earliest: string;
  latest: string;
  sampleNote: string | null;
  faqs: Array<{ question: string; answer: string }>;
};

const FAILURE_VALUES = [
  "fake-citations",
  "fabricated-quotes",
  "misrepresented-authority",
] as const;

const ATTRIBUTION_LABELS: Record<string, string> = {
  "named-tool-recorded": "Named AI tool recorded",
  "ai-implied-unspecified": "AI implied or unspecified",
  "tool-unidentified": "Tool not identified",
  "allegation-only": "Allegation-only record",
};

function entityScopeParams(entity: CorpusEntity) {
  const params = new URLSearchParams();
  if (entity.kind === "court") {
    params.set("court", entity.label);
    params.set("court_match", "exact");
  }
  if (entity.kind === "judge") params.set("judge", entity.label);
  if (entity.kind === "country") params.set("country", entity.label);
  if (entity.kind === "state") {
    const state = entity.records[0]?.state;
    if (state) params.set("state", state);
  }
  if (entity.kind === "tool") params.set("tool", entity.label);
  if (entity.kind === "failure") params.set("failure", entity.slug);
  if (entity.kind === "consequence") params.set("sanction", entity.slug);
  return params;
}

function scopedCasesHref(
  entity: CorpusEntity,
  additions: Record<string, string> = {},
) {
  const params = entityScopeParams(entity);
  for (const [key, value] of Object.entries(additions)) {
    if (value) params.set(key, value);
  }
  if (!params.has("sort")) params.set("sort", "date");
  return `/cases?${params.toString()}`;
}

function percentage(count: number, total: number) {
  return total ? Math.round((count / total) * 1000) / 10 : 0;
}

function rows(
  entity: CorpusEntity,
  options: CountedOption[],
  key: string,
  limit = 5,
) {
  return options.slice(0, limit).map((option) => ({
    ...option,
    percentage: percentage(option.count, entity.records.length),
    href: scopedCasesHref(entity, { [key]: option.value }),
  }));
}

function exactMedian(values: number[]) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[midpoint]
    : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function readableList(options: IntelligenceRow[], limit = 3) {
  const entries = options
    .slice(0, limit)
    .map((item) => `${item.label} (${item.count.toLocaleString()})`);
  if (!entries.length) return "no classified pattern";
  if (entries.length === 1) return entries[0];
  return `${entries.slice(0, -1).join(", ")} and ${entries.at(-1)}`;
}

function entitySubject(entity: CorpusEntity) {
  const count = entity.records.length.toLocaleString();
  const recordWord = entity.records.length === 1 ? "matter" : "matters";
  if (entity.kind === "judge")
    return `${count} source-linked public ${recordWord} that record ${entity.label} as a decision-maker`;
  if (entity.kind === "court")
    return `${count} source-linked public ${recordWord} associated with ${entity.label}`;
  if (entity.kind === "state" || entity.kind === "country")
    return `${count} source-linked public ${recordWord} associated with ${entity.label}`;
  if (entity.kind === "tool")
    return `${count} source-linked public ${recordWord} that identify ${entity.label}`;
  if (entity.kind === "failure")
    return `${count} source-linked public ${recordWord} classified with ${entity.label}`;
  return `${count} source-linked public ${recordWord} that record ${entity.label}`;
}

function intelligenceQuestion(entity: CorpusEntity) {
  if (entity.kind === "judge")
    return `What does the public record show in matters involving ${entity.label}?`;
  if (entity.kind === "court")
    return `What kinds of legal AI issues and responses appear in ${entity.label}?`;
  if (entity.kind === "state" || entity.kind === "country")
    return `What patterns appear in the public records associated with ${entity.label}?`;
  if (entity.kind === "tool")
    return `What issues and consequences appear in records that identify ${entity.label}?`;
  if (entity.kind === "failure")
    return `Where does ${entity.label} appear and what responses are recorded?`;
  return `What issues appear in matters recording ${entity.label}?`;
}

export function buildEntityIntelligence(
  entity: CorpusEntity,
): EntityIntelligence {
  const total = entity.records.length;
  const failureCounts = FAILURE_VALUES.map((value) => ({
    value,
    label: humanize(value),
    count: entity.records.filter((record) => record.tags.includes(value)).length,
  }))
    .filter((item) => item.count)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const consequenceCounts = countValues(
    entity.records.flatMap((record) => record.sanction_types || []),
    { "none-adjudicated": "No adjudicated consequence recorded" },
  );
  const partyCounts = countValues(
    entity.records.map((record) => record.party || "Not classified"),
  ).filter((item) => item.value !== "Not classified");
  const practiceCounts = countValues(
    entity.records.map(
      (record) => record.legal_field_primary || "Not classified",
    ),
  ).filter((item) => item.value !== "Not classified");
  const attributionCounts = countValues(
    entity.records.map(attributionStatus),
    ATTRIBUTION_LABELS,
  );
  const severityCounts = countValues(
    entity.records.map((record) => record.severity),
  );
  const yearCounts = countValues(
    entity.records.map((record) => record.date.slice(0, 4)),
  ).sort((a, b) => b.value.localeCompare(a.value));

  const failures = rows(entity, failureCounts, "failure");
  const consequences = rows(entity, consequenceCounts, "sanction", 6);
  const parties = rows(entity, partyCounts, "party", 4);
  const practiceAreas = rows(entity, practiceCounts, "practice", 5);
  const attribution = rows(entity, attributionCounts, "attribution", 4);
  const severity = rows(entity, severityCounts, "severity", 4);
  const years = rows(entity, yearCounts, "year", 6);

  const monetarySignals = entity.records.filter(
    (record) =>
      (record.amount || 0) > 0 || record.sanction_types.includes("monetary"),
  );
  const knownAmounts = entity.records
    .map((record) => record.amount || 0)
    .filter((amount) => amount > 0);
  const monetaryTotal = knownAmounts.reduce((sum, amount) => sum + amount, 0);
  const earliest = entity.records.reduce(
    (value, record) => (!value || record.date < value ? record.date : value),
    "",
  );
  const latest = entity.records.reduce(
    (value, record) => (record.date > value ? record.date : value),
    "",
  );

  const subject = entitySubject(entity);
  const summary = `AI Vortex currently links ${subject}. The most frequently recorded issue signals are ${readableList(failures)}. Recorded responses and outcomes include ${readableList(consequences)}. Categories can overlap within the same matter, and these counts describe this public corpus rather than the overall behavior or sanction rate of the ${entity.kind === "judge" ? "decision-maker" : entity.kind}.`;
  const moneyAnswer = knownAmounts.length
    ? `${knownAmounts.length.toLocaleString()} ${knownAmounts.length === 1 ? "record contains" : "records contain"} a known numeric amount, totaling ${formatCurrency(monetaryTotal)}. Records with unquantified, pending, or unrecorded amounts are excluded from that total.`
    : `No known numeric monetary amount is recorded in this subset. That does not establish that no costs, fees, or other consequences occurred.`;

  const question = intelligenceQuestion(entity);
  const issueAnswer = `${summary} ${moneyAnswer}`;
  const boundaryAnswer = `No. This page describes ${total.toLocaleString()} source-linked public ${total === 1 ? "record" : "records"} in the AI Vortex corpus. It is not an incidence rate, a complete history of every proceeding, or a prediction about future decisions.`;

  return {
    question,
    summary,
    failures,
    consequences,
    parties,
    practiceAreas,
    attribution,
    severity,
    years,
    monetary: {
      signaled: monetarySignals.length,
      known: knownAmounts.length,
      unquantified: Math.max(0, monetarySignals.length - knownAmounts.length),
      total: monetaryTotal,
      median: exactMedian(knownAmounts),
      maximum: Math.max(...knownAmounts, 0),
      href: scopedCasesHref(entity, {
        monetary: "known",
        sort: "amount",
        order: "desc",
      }),
    },
    earliest,
    latest,
    sampleNote:
      total < 3
        ? `This profile currently contains only ${total} source-linked ${total === 1 ? "record" : "records"}. Patterns are displayed for transparency but are not a stable basis for comparison.`
        : null,
    faqs: [
      { question, answer: issueAnswer },
      {
        question: `What monetary consequences are recorded for ${entity.label}?`,
        answer: moneyAnswer,
      },
      {
        question: `Does this page establish how ${entity.label} generally behaves?`,
        answer: boundaryAnswer,
      },
    ],
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function entityIntelligenceDescription(entity: CorpusEntity) {
  const intelligence = buildEntityIntelligence(entity);
  return `${intelligence.question} ${intelligence.summary}`;
}
