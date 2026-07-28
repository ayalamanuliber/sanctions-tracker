import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INPUT = path.join(
  ROOT,
  "data",
  "local-judge-candidates",
  "primary-documents-v1.jsonl",
);
const OUTPUT = path.join(ROOT, "data", "judge-enrichment.json");
const MANIFEST = `${INPUT}.manifest.json`;

const NAME_OVERRIDES = new Map([
  ["Kelley Hon. Angel Kelley", "Angel Kelley"],
  ["Robert E. Payne Senior", "Robert E. Payne"],
  ["Colleen Kollar-kotelly", "Colleen Kollar-Kotelly"],
  ["Micah W.j. Smith", "Micah W.J. Smith"],
]);

const ROLE_OVERRIDES = new Map([
  ["Robert E. Payne Senior", "Senior United States District Judge"],
]);

function readJsonl(file) {
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

if (!fs.existsSync(INPUT)) {
  throw new Error(`Missing audited judge-candidate artifact: ${INPUT}`);
}

const records = {};
for (const row of readJsonl(INPUT)) {
  const high = (row.candidates || []).filter(
    (candidate) =>
      candidate.confidence === "high" &&
      candidate.pattern === "signature-plus-role" &&
      candidate.ambiguity_flags?.length === 0,
  );
  if (high.length !== 1) continue;
  const candidate = high[0];
  records[row.id] = {
    judge: NAME_OVERRIDES.get(candidate.name) || candidate.name,
    judge_role: ROLE_OVERRIDES.get(candidate.name) || candidate.role,
    evidence: {
      locator: candidate.locator,
      quote: candidate.quote,
      source_url: row.source_manifest.final_url,
      source_sha256: row.source_manifest.body_sha256,
      extraction_sha256: row.source_manifest.extraction_sha256,
    },
    verification_status: "primary-document-signature",
    verification_method:
      "Exact signature marker and explicit judicial role in a hash-verified primary document; not represented as a human editorial review.",
  };
}

const output = {
  version: 1,
  source: path.relative(ROOT, INPUT),
  source_sha256: fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")).output_sha256
    : null,
  record_count: Object.keys(records).length,
  records,
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      output: path.relative(ROOT, OUTPUT),
      record_count: output.record_count,
      verification_status: "primary-document-signature",
    },
    null,
    2,
  ),
);
