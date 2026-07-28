"use client";

import { useMemo, useState } from "react";

import styles from "@/components/workflows/WorkflowTools.module.css";

export type CorrectionContext = {
  caseId: string;
  caseSlug: string;
  recordUrl: string;
  caseName: string;
  court: string;
};

export default function SubmitForm({
  context,
}: {
  context: CorrectionContext;
}) {
  const [type, setType] = useState("Correction");
  const [name, setName] = useState(context.caseName);
  const [court, setCourt] = useState(context.court);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [attested, setAttested] = useState(false);
  const hasCaseContext = Boolean(
    context.caseId || context.caseSlug || context.recordUrl,
  );
  const href = useMemo(() => {
    if (!attested) return undefined;
    const recordContext = hasCaseContext
      ? `\n\nTracker record context:\nCase ID: ${context.caseId || "not supplied"}\nCase slug: ${context.caseSlug || "not supplied"}\nCurrent tracker URL: ${context.recordUrl || "not supplied"}`
      : "";
    const body = `Submission type: ${type}\nRecord: ${name}\nCourt / jurisdiction: ${court}\nSupporting public source: ${url}${recordContext}\n\nReview notes:\n${notes}\n\nSubmitter confirmed that this email contains no confidential client information.`;
    return `mailto:manuel@aivortex.io?subject=${encodeURIComponent(`AI Vortex ${type}: ${name || context.caseSlug || "public record"}`)}&body=${encodeURIComponent(body)}`;
  }, [
    attested,
    context.caseId,
    context.caseSlug,
    context.recordUrl,
    court,
    hasCaseContext,
    name,
    notes,
    type,
    url,
  ]);

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Public correction channel</span>
            <h1>Submit a record or correction</h1>
            <p>
              Send a case, correction, court AI rule, judge order, or source
              link for manual review before publication.
            </p>
          </div>
        </header>
        <div className={styles.grid}>
          <section className={styles.panel}>
            <div className={styles.notice}>
              <strong>Public information only.</strong> Do not send privileged
              material, sealed records, personal data, or confidential client
              information.
            </div>
            {hasCaseContext && (
              <div className={styles.notice}>
                <strong>Correction context preserved.</strong>
                <br />
                This submission is linked to the tracker record below. Add a
                separate public source that supports the requested change.
              </div>
            )}
            {hasCaseContext && (
              <div className={styles.fieldRow} style={{ marginTop: 14 }}>
                <label className={styles.field}>
                  Tracker case ID
                  <input value={context.caseId || "Not supplied"} readOnly />
                </label>
                <label className={styles.field}>
                  Tracker case slug
                  <input value={context.caseSlug || "Not supplied"} readOnly />
                </label>
              </div>
            )}
            {context.recordUrl && (
              <label className={styles.field} style={{ marginTop: 14 }}>
                Current tracker record
                <input value={context.recordUrl} readOnly />
              </label>
            )}
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                Submission type
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  <option>Correction</option>
                  <option>New case</option>
                  <option>Court AI rule</option>
                  <option>Judge order</option>
                  <option>Source link</option>
                </select>
              </label>
              <label className={styles.field}>
                Record or rule name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Case name or rule title"
                />
              </label>
            </div>
            <label className={styles.field}>
              Court / jurisdiction
              <input
                value={court}
                onChange={(event) => setCourt(event.target.value)}
                placeholder="Court, state, country, or judge"
              />
            </label>
            <label className={styles.field} style={{ marginTop: 14 }}>
              Supporting public source URL
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://..."
              />
            </label>
            <label className={styles.field} style={{ marginTop: 14 }}>
              What should be reviewed?
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Describe the correction or why this public record should be added."
              />
            </label>
            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                marginTop: 16,
                color: "#475569",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <input
                type="checkbox"
                checked={attested}
                onChange={(event) => setAttested(event.target.checked)}
                style={{ marginTop: 3 }}
              />
              I confirm that this submission contains only public,
              non-confidential information.
            </label>
            <div className={styles.buttonRow}>
              {href ? (
                <a className={styles.primary} href={href}>
                  Open email submission
                </a>
              ) : (
                <button className={styles.primary} disabled>
                  Confirm public-information statement
                </button>
              )}
            </div>
          </section>
          <aside>
            <section className={styles.panel}>
              <h2>Review standard</h2>
              <div className={styles.actionsList}>
                <div className={styles.action}>
                  <strong>1. Source check</strong>
                  <p>
                    The linked public record must support the proposed addition
                    or correction.
                  </p>
                </div>
                <div className={styles.action}>
                  <strong>2. Status check</strong>
                  <p>
                    Allegations, warnings, show-cause orders, and final outcomes
                    stay distinct.
                  </p>
                </div>
                <div className={styles.action}>
                  <strong>3. Classification</strong>
                  <p>
                    Court, date, jurisdiction, outcome, attribution, and
                    editorial-impact labels are checked.
                  </p>
                </div>
                <div className={styles.action}>
                  <strong>4. Publication</strong>
                  <p>Accepted changes appear in a later corpus snapshot.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
