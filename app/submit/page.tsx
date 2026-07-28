import ResearchShell from "@/components/ResearchShell";
import SubmitForm, { type CorrectionContext } from "./SubmitForm";

type SearchParams = Record<string, string | string[] | undefined>;

function first(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function publicValue(value: string, maxLength = 500) {
  return value.trim().slice(0, maxLength);
}

export default async function SubmitPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) || {};
  const context: CorrectionContext = {
    caseId: publicValue(first(params, "case_id"), 180),
    caseSlug: publicValue(first(params, "case_slug"), 180),
    recordUrl: publicValue(first(params, "record_url")),
    caseName: publicValue(first(params, "case_name"), 300),
    court: publicValue(first(params, "court"), 300),
  };

  return (
    <ResearchShell>
      <SubmitForm context={context} />
    </ResearchShell>
  );
}
