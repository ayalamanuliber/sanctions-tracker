/** Upstream database license only; this does not license AI Vortex code or third-party documents. */
export const UPSTREAM_DATABASE = Object.freeze({
  title: "AI Hallucination Cases Database",
  creator: "Damien Charlotin",
  url: "https://www.damiencharlotin.com/hallucinations/",
  license: "CC BY 4.0",
  license_url: "https://creativecommons.org/licenses/by/4.0/",
  copyright_notice: "© 2026 Damien Charlotin",
  modifications: "AI Vortex imports, normalizes, classifies, enriches, and presents the underlying records, and adds search, analysis, and review workflows.",
  endorsement: "No endorsement or partnership by Damien Charlotin is implied.",
  scope: "The license identifies the underlying database. It does not automatically license linked third-party documents or AI Vortex software. Primary-source verification and other applicable rights remain the user's responsibility.",
});

export function dataAttribution(): string {
  return `Underlying data: ${UPSTREAM_DATABASE.title}, ${UPSTREAM_DATABASE.creator}; ${UPSTREAM_DATABASE.copyright_notice}.
Source: ${UPSTREAM_DATABASE.url}
License: ${UPSTREAM_DATABASE.license} ${UPSTREAM_DATABASE.license_url}
${UPSTREAM_DATABASE.modifications} ${UPSTREAM_DATABASE.endorsement}`;
}
