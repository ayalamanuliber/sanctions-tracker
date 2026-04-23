"use client";

import { useState, useRef, useEffect } from "react";

interface Jurisdiction {
  id: string;
  name: string;
  type: "federal" | "state";
  state: string;
  hasStandingOrder: boolean;
  disclosure: string;
  verification: string;
  notes: string;
  caseCount: number;
}

const JURISDICTIONS: Jurisdiction[] = [
  { id: "sdny", name: "S.D.N.Y. (Southern District of New York)", type: "federal", state: "NY", hasStandingOrder: true,
    disclosure: "Multiple individual judges have standing orders. Judge Dale E. Ho requires AI disclosure. Judge Rakoff ruled AI-generated docs not protected by attorney-client privilege (Feb 2026).",
    verification: "Rule 11 applies — all citations must be independently verified.",
    notes: "Home of Mata v. Avianca, the landmark AI sanctions case.", caseCount: 2 },
  { id: "cdca", name: "C.D. Cal. (Central District of California)", type: "federal", state: "CA", hasStandingOrder: true,
    disclosure: "Individual judges have standing orders requiring AI disclosure.",
    verification: "Lacey v. State Farm ($31,100 sanction) originated here — K&L Gates and Ellis George sanctioned.",
    notes: "Ninth Circuit courts are among the most active in AI enforcement.", caseCount: 1 },
  { id: "ndtx", name: "N.D. Tex. (Northern District of Texas)", type: "federal", state: "TX", hasStandingOrder: true,
    disclosure: "Judge Brantley Starr issued the FIRST AI disclosure standing order (2023). Requires certification that no AI was used OR that all AI content was human-verified.",
    verification: "Attorneys must certify AI content has been checked by a human.",
    notes: "The order that started the nationwide wave of 300+ disclosure requirements.", caseCount: 0 },
  { id: "edtx", name: "E.D. Tex. (Eastern District of Texas)", type: "federal", state: "TX", hasStandingOrder: true,
    disclosure: "Local rule amendment effective Dec 1, 2023. Attorneys using AI must review and verify all computer-generated content per Rule 11.",
    verification: "Mandatory verification of all AI output before filing.",
    notes: "One of the first districts to amend local rules rather than rely on individual judge orders.", caseCount: 0 },
  { id: "daz", name: "D. Ariz. (District of Arizona)", type: "federal", state: "AZ", hasStandingOrder: true,
    disclosure: "Chief Judge G. Murray Snow's order in Montes v. Suns was forwarded to every district and magistrate judge in the district.",
    verification: "Wright/Montes sanctions included mandatory AI ethics training. Court expects verification protocols.",
    notes: "Judge Snow is setting district-wide precedent through individual case sanctions.", caseCount: 1 },
  { id: "6th-circuit", name: "6th Circuit (Federal Appellate)", type: "federal", state: "Multi", hasStandingOrder: false,
    disclosure: "No circuit-wide rule, but the 6th Circuit issued the first published circuit-level sanctions opinion for AI hallucinations (March 2026).",
    verification: "Whiting v. Athens: $30,000+ in sanctions. United States v. Farris: CJA fees denied for CoCounsel misuse.",
    notes: "First federal circuit to impose monetary sanctions for AI hallucinations. Sets precedent for all circuits.", caseCount: 2 },
  { id: "9th-circuit", name: "9th Circuit (Federal Appellate)", type: "federal", state: "Multi", hasStandingOrder: false,
    disclosure: "No circuit-wide rule. Individual district courts within the 9th Circuit have standing orders.",
    verification: "Home of the $109,700 Brigandi record sanction (D. Oregon) and the $31,100 Lacey sanction (C.D. Cal.).",
    notes: "The most expensive sanctions have emerged from 9th Circuit district courts.", caseCount: 3 },
  { id: "11th-jud-fl", name: "11th Judicial Circuit, Florida (Miami-Dade)", type: "state", state: "FL", hasStandingOrder: true,
    disclosure: "Administrative order requires disclosure of AI use AND certification that content was independently verified. Applies to attorneys and pro se litigants. Disclosure must appear on the face of the filing.",
    verification: "Mandatory independent verification certification required.",
    notes: "One of the most comprehensive state court AI rules in the country.", caseCount: 0 },
  { id: "17th-jud-fl", name: "17th Judicial Circuit, Florida (Broward)", type: "state", state: "FL", hasStandingOrder: true,
    disclosure: "Administrative Order 2026-03-Gen (Jan 26, 2026). Requires: identification of specific tool used, verification certification. Covers attorneys and pro se.",
    verification: "Non-compliance sanctions: contempt, striking of pleadings, fines, attorney fees, Florida Bar referral.",
    notes: "Chief Judge Carol-Lisa Phillips. Among the strictest state court AI rules.", caseCount: 0 },
  { id: "ne-supreme", name: "Nebraska Supreme Court", type: "state", state: "NE", hasStandingOrder: false,
    disclosure: "No formal standing order, but Prososki v. Regan set aggressive precedent — attorney referred for discipline after denying AI use.",
    verification: "57 of 63 citations were defective. Oral argument stopped 37 seconds in.",
    notes: "Lake's denial of AI use was treated as an aggravating factor. De facto disclosure requirement via precedent.", caseCount: 1 },
  { id: "ga-supreme", name: "Georgia Supreme Court", type: "state", state: "GA", hasStandingOrder: false,
    disclosure: "No formal rule. The Hannah Payne murder appeal incident (2026) involved a prosecutor's AI-generated brief discovered during oral argument.",
    verification: "District Attorney apologized to Chief Justice. Internal discipline + Bar referral.",
    notes: "The 'quiet, rolling thunder' incident. Strongest signal that state supreme courts are watching.", caseCount: 2 },
  { id: "d-kansas", name: "D. Kan. (District of Kansas)", type: "federal", state: "KS", hasStandingOrder: false,
    disclosure: "No standing order, but Judge Julie Robinson imposed $12,000 sanctions and ordered lead attorney removed + self-report to disciplinary authorities.",
    verification: "All signing attorneys held personally liable. Lexos Media v. Overstock (2026).",
    notes: "Sanctions split among 4 attorneys — establishes shared liability precedent.", caseCount: 1 },
  { id: "nd-al", name: "N.D. Ala. (Northern District of Alabama)", type: "federal", state: "AL", hasStandingOrder: false,
    disclosure: "Johnson v. Dunn resulted in disqualification of three Butler Snow attorneys + referral to Alabama State Bar.",
    verification: "Practice group leader's failure to review was called 'particularly egregious.'",
    notes: "Career-ending severity. Established that firm leadership bears supervisory responsibility.", caseCount: 1 },
  { id: "d-oregon", name: "D. Or. (District of Oregon)", type: "federal", state: "OR", hasStandingOrder: false,
    disclosure: "No standing order, but home of the $109,700 Brigandi record sanction — largest in U.S. history.",
    verification: "Court found 'sustained campaign of deception.' Case dismissed with prejudice.",
    notes: "Magistrate Judge Mark Clarke. The case that proved sanctions can exceed $100K.", caseCount: 1 },
  { id: "ca-state-bar", name: "California State Bar (Pending Rules)", type: "state", state: "CA", hasStandingOrder: false,
    disclosure: "Rules amendments addressing AI competence, confidentiality, candor, and supervision approved for comment through May 4, 2026.",
    verification: "Noland v. Land of the Free ($10K, 21/23 citations fabricated) is the precedent case.",
    notes: "State-level mandatory framework likely post-comment period. Will apply to all CA-barred attorneys.", caseCount: 1 },
];

export default function JurisdictionRequirements() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Jurisdiction | null>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = JURISDICTIONS.filter(
    (j) => j.name.toLowerCase().includes(query.toLowerCase()) || j.state.toLowerCase().includes(query.toLowerCase()) || j.id.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(j: Jurisdiction) {
    setSelected(j);
    setQuery(j.name);
    setIsOpen(false);
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    padding: "16px 16px 16px 48px",
    color: "var(--text-100)",
    fontFamily: "var(--font-main)",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <section id="jurisdiction" className="section subtle">
      <div className="wrap">
        <div className="section-head" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto", borderLeft: "none", padding: "0", maxWidth: "720px" }}>
          <div className="section-label blue" style={{ justifyContent: "center" }}>
            <span className="tick blue"></span>
            Jurisdiction Lookup
          </div>
          <h2 className="section-heading" style={{ textAlign: "center" }}>
            What does your <span className="blue-em">court</span> require?
          </h2>
          <p className="section-sub" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            Select your jurisdiction to see its specific AI disclosure rules, verification requirements, and sanctions history.
          </p>
        </div>

        <div style={{ maxWidth: "780px", margin: "48px auto 0" }}>
          {/* Search */}
          <div ref={dropdownRef} style={{ position: "relative", marginBottom: "24px" }}>
            <div style={{ position: "relative" }}>
              <svg
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-500)", pointerEvents: "none" }}
                width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                  if (!e.target.value) setSelected(null);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search by court name, state, or abbreviation..."
                style={inputStyle}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                onFocusCapture={(e) => (e.currentTarget.style.borderColor = "var(--blue)")}
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setSelected(null); setIsOpen(false); }}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-500)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {isOpen && filtered.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 50,
                  width: "100%",
                  marginTop: "8px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  maxHeight: "340px",
                  overflowY: "auto",
                  boxShadow: "0 24px 60px -20px rgba(0,0,0,0.7)",
                }}
              >
                {filtered.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => handleSelect(j)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "14px 18px",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border-soft)",
                      cursor: "pointer",
                      color: "var(--text-300)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "background 0.15s",
                      fontFamily: "var(--font-main)",
                      fontSize: "13px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>{j.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginLeft: "14px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "9px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.22em",
                          padding: "3px 8px",
                          color: j.type === "federal" ? "var(--blue)" : "var(--amber)",
                          border: `1px solid ${j.type === "federal" ? "rgba(0,102,255,0.25)" : "rgba(245,158,11,0.25)"}`,
                        }}
                      >
                        {j.type}
                      </span>
                      {j.hasStandingOrder && <span style={{ width: "7px", height: "7px", background: "#22c55e" }} />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isOpen && query && filtered.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 50,
                  width: "100%",
                  marginTop: "8px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "var(--text-500)", fontSize: "13px" }}>No matching jurisdictions found.</p>
              </div>
            )}
          </div>

          {/* Result */}
          {selected ? (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div
                style={{
                  padding: "24px 28px",
                  borderBottom: "1px solid var(--border-soft)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "14px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "20px",
                      fontWeight: 500,
                      color: "var(--text-100)",
                      letterSpacing: "-0.02em",
                      marginBottom: "4px",
                    }}
                  >
                    {selected.name}
                  </h3>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-500)", letterSpacing: "0.1em" }}>
                    {selected.state}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.22em",
                      padding: "5px 10px",
                      color: selected.type === "federal" ? "var(--blue)" : "var(--amber)",
                      border: `1px solid ${selected.type === "federal" ? "rgba(0,102,255,0.3)" : "rgba(245,158,11,0.3)"}`,
                    }}
                  >
                    {selected.type === "federal" ? "Federal" : "State"}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.22em",
                      padding: "5px 10px",
                      color: selected.hasStandingOrder ? "#22c55e" : "var(--amber)",
                      border: `1px solid ${selected.hasStandingOrder ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                    }}
                  >
                    {selected.hasStandingOrder ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Standing Order
                      </>
                    ) : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        No Formal Rule
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div style={{ padding: "28px" }}>
                {[
                  { label: "Disclosure Requirements", body: selected.disclosure },
                  { label: "Verification Requirements", body: selected.verification },
                  { label: "Notable Cases / Notes", body: selected.notes },
                ].map((row) => (
                  <div key={row.label} style={{ marginBottom: "22px" }}>
                    <h4
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.22em",
                        color: "var(--blue)",
                        marginBottom: "10px",
                      }}
                    >
                      {row.label}
                    </h4>
                    <p style={{ color: "var(--text-300)", fontSize: "14px", lineHeight: 1.7, fontWeight: 300 }}>{row.body}</p>
                  </div>
                ))}

                <div style={{ paddingTop: "20px", borderTop: "1px solid var(--border-soft)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text-500)",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                    }}
                  >
                    Sanctions cases in tracker
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "18px",
                      fontWeight: 500,
                      fontStyle: "italic",
                      letterSpacing: "-0.02em",
                      color: selected.caseCount > 0 ? "var(--red-muted)" : "var(--text-500)",
                    }}
                  >
                    {selected.caseCount}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: "var(--bg-card)", border: "1px dashed var(--border)", padding: "48px 24px", textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--text-500)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                ◆ Select your jurisdiction to see requirements
              </p>
            </div>
          )}

          {/* Notify CTA */}
          <div
            style={{
              marginTop: "32px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              padding: "28px 28px 32px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--text-500)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Don't see your jurisdiction?
            </p>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "18px",
                fontWeight: 500,
                color: "var(--text-100)",
                letterSpacing: "-0.015em",
                marginBottom: "20px",
                fontStyle: "italic",
              }}
            >
              We're tracking 300+ courts with AI rules.
            </p>
            {submitted ? (
              <p
                style={{
                  color: "#22c55e",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                }}
              >
                You're on the list. We'll notify you when your court is added.
              </p>
            ) : (
              <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxWidth: "440px", margin: "0 auto" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@lawfirm.com"
                  required
                  style={{
                    flex: 1,
                    minWidth: "220px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    padding: "12px 14px",
                    color: "var(--text-100)",
                    fontSize: "13px",
                    fontFamily: "var(--font-main)",
                    outline: "none",
                  }}
                />
                <button type="submit" className="hero-btn-blue" style={{ padding: "12px 22px", fontSize: "10px" }}>
                  Get Notified
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
