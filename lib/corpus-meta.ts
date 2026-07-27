import metaRaw from "@/data/meta.json";

type CorpusMeta = {
  last_checked?: string;
  last_updated: string;
  latest_record_date?: string;
};

const meta = metaRaw as CorpusMeta;

export const LAST_CHECKED = meta.last_checked || meta.last_updated;
export const LATEST_RECORD_DATE = meta.latest_record_date || LAST_CHECKED;

export function formatCorpusDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}
