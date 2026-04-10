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
  {
    id: "sdny",
    name: "S.D.N.Y. (Southern District of New York)",
    type: "federal",
    state: "NY",
    hasStandingOrder: true,
    disclosure:
      "Multiple individual judges have standing orders. Judge Dale E. Ho requires AI disclosure. Judge Rakoff ruled AI-generated docs not protected by attorney-client privilege (Feb 2026).",
    verification:
      "Rule 11 applies — all citations must be independently verified.",
    notes: "Home of Mata v. Avianca, the landmark AI sanctions case.",
    caseCount: 2,
  },
  {
    id: "cdca",
    name: "C.D. Cal. (Central District of California)",
    type: "federal",
    state: "CA",
    hasStandingOrder: true,
    disclosure:
      "Individual judges have standing orders requiring AI disclosure.",
    verification:
      "Lacey v. State Farm ($31,100 sanction) originated here — K&L Gates and Ellis George sanctioned.",
    notes:
      "Ninth Circuit courts are among the most active in AI enforcement.",
    caseCount: 1,
  },
  {
    id: "ndtx",
    name: "N.D. Tex. (Northern District of Texas)",
    type: "federal",
    state: "TX",
    hasStandingOrder: true,
    disclosure:
      "Judge Brantley Starr issued the FIRST AI disclosure standing order (2023). Requires certification that no AI was used OR that all AI content was human-verified.",
    verification:
      "Attorneys must certify AI content has been checked by a human.",
    notes:
      "The order that started the nationwide wave of 300+ disclosure requirements.",
    caseCount: 0,
  },
  {
    id: "edtx",
    name: "E.D. Tex. (Eastern District of Texas)",
    type: "federal",
    state: "TX",
    hasStandingOrder: true,
    disclosure:
      "Local rule amendment effective Dec 1, 2023. Attorneys using AI must review and verify all computer-generated content per Rule 11.",
    verification: "Mandatory verification of all AI output before filing.",
    notes:
      "One of the first districts to amend local rules rather than rely on individual judge orders.",
    caseCount: 0,
  },
  {
    id: "daz",
    name: "D. Ariz. (District of Arizona)",
    type: "federal",
    state: "AZ",
    hasStandingOrder: true,
    disclosure:
      "Chief Judge G. Murray Snow's order in Montes v. Suns was forwarded to every district and magistrate judge in the district.",
    verification:
      "Wright/Montes sanctions included mandatory AI ethics training. Court expects verification protocols.",
    notes:
      "Judge Snow is setting district-wide precedent through individual case sanctions.",
    caseCount: 1,
  },
  {
    id: "6th-circuit",
    name: "6th Circuit (Federal Appellate)",
    type: "federal",
    state: "Multi",
    hasStandingOrder: false,
    disclosure:
      "No circuit-wide rule, but the 6th Circuit issued the first published circuit-level sanctions opinion for AI hallucinations (March 2026).",
    verification:
      "Whiting v. Athens: $30,000+ in sanctions. United States v. Farris: CJA fees denied for CoCounsel misuse.",
    notes:
      "First federal circuit to impose monetary sanctions for AI hallucinations. Sets precedent for all circuits.",
    caseCount: 2,
  },
  {
    id: "9th-circuit",
    name: "9th Circuit (Federal Appellate)",
    type: "federal",
    state: "Multi",
    hasStandingOrder: false,
    disclosure:
      "No circuit-wide rule. Individual district courts within the 9th Circuit have standing orders.",
    verification:
      "Home of the $109,700 Brigandi record sanction (D. Oregon) and the $31,100 Lacey sanction (C.D. Cal.).",
    notes:
      "The most expensive sanctions have emerged from 9th Circuit district courts.",
    caseCount: 3,
  },
  {
    id: "11th-jud-fl",
    name: "11th Judicial Circuit, Florida (Miami-Dade)",
    type: "state",
    state: "FL",
    hasStandingOrder: true,
    disclosure:
      "Administrative order requires disclosure of AI use AND certification that content was independently verified. Applies to attorneys and pro se litigants. Disclosure must appear on the face of the filing.",
    verification:
      "Mandatory independent verification certification required.",
    notes:
      "One of the most comprehensive state court AI rules in the country.",
    caseCount: 0,
  },
  {
    id: "17th-jud-fl",
    name: "17th Judicial Circuit, Florida (Broward)",
    type: "state",
    state: "FL",
    hasStandingOrder: true,
    disclosure:
      "Administrative Order 2026-03-Gen (Jan 26, 2026). Requires: identification of specific tool used, verification certification. Covers attorneys and pro se.",
    verification:
      "Non-compliance sanctions: contempt, striking of pleadings, fines, attorney fees, Florida Bar referral.",
    notes:
      "Chief Judge Carol-Lisa Phillips. Among the strictest state court AI rules.",
    caseCount: 0,
  },
  {
    id: "ne-supreme",
    name: "Nebraska Supreme Court",
    type: "state",
    state: "NE",
    hasStandingOrder: false,
    disclosure:
      "No formal standing order, but Prososki v. Regan set aggressive precedent — attorney referred for discipline after denying AI use.",
    verification:
      "57 of 63 citations were defective. Oral argument stopped 37 seconds in.",
    notes:
      "Lake's denial of AI use was treated as an aggravating factor. De facto disclosure requirement via precedent.",
    caseCount: 1,
  },
  {
    id: "ga-supreme",
    name: "Georgia Supreme Court",
    type: "state",
    state: "GA",
    hasStandingOrder: false,
    disclosure:
      "No formal rule. The Hannah Payne murder appeal incident (2026) involved a prosecutor's AI-generated brief discovered during oral argument.",
    verification:
      "District Attorney apologized to Chief Justice. Internal discipline + Bar referral.",
    notes:
      "The 'quiet, rolling thunder' incident. Strongest signal that state supreme courts are watching.",
    caseCount: 2,
  },
  {
    id: "d-kansas",
    name: "D. Kan. (District of Kansas)",
    type: "federal",
    state: "KS",
    hasStandingOrder: false,
    disclosure:
      "No standing order, but Judge Julie Robinson imposed $12,000 sanctions and ordered lead attorney removed + self-report to disciplinary authorities.",
    verification:
      "All signing attorneys held personally liable. Lexos Media v. Overstock (2026).",
    notes:
      "Sanctions split among 4 attorneys — establishes shared liability precedent.",
    caseCount: 1,
  },
  {
    id: "nd-al",
    name: "N.D. Ala. (Northern District of Alabama)",
    type: "federal",
    state: "AL",
    hasStandingOrder: false,
    disclosure:
      "Johnson v. Dunn resulted in disqualification of three Butler Snow attorneys + referral to Alabama State Bar.",
    verification:
      "Practice group leader's failure to review was called 'particularly egregious.'",
    notes:
      "Career-ending severity. Established that firm leadership bears supervisory responsibility.",
    caseCount: 1,
  },
  {
    id: "d-oregon",
    name: "D. Or. (District of Oregon)",
    type: "federal",
    state: "OR",
    hasStandingOrder: false,
    disclosure:
      "No standing order, but home of the $109,700 Brigandi record sanction — largest in U.S. history.",
    verification:
      "Court found 'sustained campaign of deception.' Case dismissed with prejudice.",
    notes:
      "Magistrate Judge Mark Clarke. The case that proved sanctions can exceed $100K.",
    caseCount: 1,
  },
  {
    id: "ca-state-bar",
    name: "California State Bar (Pending Rules)",
    type: "state",
    state: "CA",
    hasStandingOrder: false,
    disclosure:
      "Rules amendments addressing AI competence, confidentiality, candor, and supervision approved for comment through May 4, 2026.",
    verification:
      "Noland v. Land of the Free ($10K, 21/23 citations fabricated) is the precedent case.",
    notes:
      "State-level mandatory framework likely post-comment period. Will apply to all CA-barred attorneys.",
    caseCount: 1,
  },
];

export default function JurisdictionRequirements() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Jurisdiction | null>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = JURISDICTIONS.filter(
    (j) =>
      j.name.toLowerCase().includes(query.toLowerCase()) ||
      j.state.toLowerCase().includes(query.toLowerCase()) ||
      j.id.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
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

  return (
    <section id="jurisdiction" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-[#0A1628]/70 border border-white/[0.08] px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/50 tracking-wide uppercase mb-6">
            Jurisdiction Lookup
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What Does Your Court Require?
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Select your jurisdiction to see its specific AI disclosure rules,
            verification requirements, and sanctions history.
          </p>
        </div>

        {/* Search / Dropdown */}
        <div className="relative mb-8" ref={dropdownRef}>
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
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
              className="w-full bg-[#0A1628]/70 border border-white/[0.08] rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF]/50 focus:ring-1 focus:ring-[#0066FF]/20 transition-all text-base"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setSelected(null);
                  setIsOpen(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown */}
          {isOpen && filtered.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-[#0A1628]/70 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 max-h-80 overflow-y-auto">
              {filtered.map((j) => (
                <button
                  key={j.id}
                  onClick={() => handleSelect(j)}
                  className="w-full text-left px-5 py-3.5 hover:bg-white/[0.04] transition-colors flex items-center justify-between group"
                >
                  <div>
                    <span className="text-white/90 text-sm font-medium group-hover:text-white transition-colors">
                      {j.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        j.type === "federal"
                          ? "bg-[#0066FF]/10 text-[#0066FF]/80"
                          : "bg-amber-500/10 text-amber-400/80"
                      }`}
                    >
                      {j.type}
                    </span>
                    {j.hasStandingOrder && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {isOpen && query && filtered.length === 0 && (
            <div className="absolute z-50 w-full mt-2 bg-[#0A1628]/70 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 px-5 py-6 text-center">
              <p className="text-white/40 text-sm">
                No matching jurisdictions found.
              </p>
            </div>
          )}
        </div>

        {/* Result Card or Prompt */}
        {selected ? (
          <div className="bg-[#0A1628]/70 border border-white/[0.08] rounded-2xl overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {selected.name}
                </h3>
                <span className="text-white/40 text-sm">{selected.state}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
                    selected.type === "federal"
                      ? "bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {selected.type === "federal" ? "Federal" : "State"}
                </span>
                {selected.hasStandingOrder ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Standing Order
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
                      />
                    </svg>
                    No Formal Rule
                  </span>
                )}
              </div>
            </div>

            {/* Card Body */}
            <div className="px-6 py-6 space-y-6">
              {/* Disclosure */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#0066FF] mb-2">
                  Disclosure Requirements
                </h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  {selected.disclosure}
                </p>
              </div>

              {/* Verification */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#0066FF] mb-2">
                  Verification Requirements
                </h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  {selected.verification}
                </p>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#0066FF] mb-2">
                  Notable Cases / Notes
                </h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  {selected.notes}
                </p>
              </div>

              {/* Case Count */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-sm">
                    Sanctions cases in tracker:
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      selected.caseCount > 0
                        ? "text-red-400"
                        : "text-white/30"
                    }`}
                  >
                    {selected.caseCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0A1628]/70 border border-white/[0.08] rounded-2xl px-6 py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#0066FF]/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[#0066FF]/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                />
              </svg>
            </div>
            <p className="text-white/40 text-sm">
              Select your jurisdiction to see specific requirements
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 bg-[#0A1628]/70 border border-white/[0.08] rounded-2xl px-6 py-8 text-center">
          <p className="text-white/50 text-sm mb-1">
            Don&apos;t see your jurisdiction?
          </p>
          <p className="text-white/70 text-sm font-medium mb-5">
            We&apos;re tracking 300+ courts with AI rules.
          </p>
          {submitted ? (
            <p className="text-emerald-400 text-sm font-medium">
              You&apos;re on the list. We&apos;ll notify you when your court is
              added.
            </p>
          ) : (
            <form
              onSubmit={handleEmailSubmit}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@lawfirm.com"
                required
                className="w-full sm:flex-1 bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#0066FF]/50 focus:ring-1 focus:ring-[#0066FF]/20 transition-all"
              />
              <button
                type="submit"
                className="w-full sm:w-auto bg-[#0066FF] hover:bg-[#0055DD] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shrink-0"
              >
                Get Notified
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
