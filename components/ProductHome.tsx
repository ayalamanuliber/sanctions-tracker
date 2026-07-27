"use client";

import Image from "next/image";
import { assetUrl, publicUrl } from "@/lib/site";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Copy,
  ExternalLink,
  FileCheck2,
  FileSearch,
  FolderPlus,
  Gavel,
  Globe2,
  Landmark,
  Map,
  Menu,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import SanctionsMapV2 from "@/components/SanctionsMapV2";
import CorpusIntelligence from "@/components/CorpusIntelligence";
import { getCaseSlugById } from "@/lib/cases";
import {
  homepageSummary,
  homepageEvidenceSummary,
  recentSignificantCases,
  searchHomepageCases,
  searchHomepageSources,
  type HomepageCase,
} from "@/lib/homepage";
import type { LegalRiskCase } from "@/lib/cases";
import styles from "./ProductHome.module.css";

const caseSuggestions = ["Mata v. Avianca", "D.N.J.", "fabricated quotations", "CoCounsel", "Rule 11"];
const sourceSuggestions = ["CourtListener", "Damien Charlotin", "uscourts.gov", "Memorandum and Order"];

const workflows = [
  { icon: FileSearch, label: "Pre-filing review", href: "/filing-gate" },
  { icon: FileCheck2, label: "Filing integrity review", href: "/filing-integrity-scanner" },
  { icon: ShieldCheck, label: "Sanctions risk assessment", query: "monetary bar referral" },
  { icon: Map, label: "Jurisdiction check", href: "/map" },
  { icon: Landmark, label: "Court-ready source review", href: "/sources" },
  { icon: FolderPlus, label: "Build review packet", href: "/artifact/print?type=report&title=Legal+AI+Risk+Review+Packet&audience=legal_professional" },
];

const roles = [
  { icon: BriefcaseBusiness, label: "Litigation team", title: "Check a filing before it leaves the firm", body: "Run a citation, quotation, proposition-support, and disclosure review with a reusable verification record.", href: "/filing-gate", action: "Open the filing gate" },
  { icon: Scale, label: "Court or chambers", title: "Inspect the record without inferring AI use", body: "Separate demonstrated discrepancies from attribution, preserve source links, and compare similar public matters.", href: "/filing-integrity-scanner", action: "Open neutral review" },
  { icon: BookOpenCheck, label: "Research and knowledge", title: "Trace a pattern across courts and sources", body: "Search the global corpus, inspect the denominator, and open the underlying public evidence before relying.", href: "/topics", action: "Explore risk topics" },
  { icon: Bot, label: "Legal tech and risk", title: "Bring the evidence into an existing workflow", body: "Use the read-only MCP, dashboards, and structured artifacts as a shared intelligence layer.", href: "/use-with-ai", action: "Review integration paths" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function severityLabel(value: string) {
  return value === "career-ending" ? "Career impact" : value.charAt(0).toUpperCase() + value.slice(1);
}

function sourcePublisher(url: string, fallback: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (hostname.includes("courtlistener.com")) return "CourtListener / RECAP";
    if (hostname.includes("damiencharlotin.com")) return "Damien Charlotin case archive";
    if (hostname.includes("uscourts.gov")) return "United States Courts";
    if (hostname.includes("supremecourt.gov")) return "Supreme Court of the United States";
    return hostname || fallback;
  } catch {
    return fallback || "Linked primary source";
  }
}

function CaseResult({ item, compact = false, sourceMode = false }: { item: HomepageCase; compact?: boolean; sourceMode?: boolean }) {
  return (
    <Link className={`${styles.caseResult} ${compact ? styles.caseResultCompact : ""}`} href={`/cases/${getCaseSlugById(item.id)}`}>
      <span className={styles.caseIdentity}>
        <strong>{item.case_name}</strong>
        <small>{item.court} · {formatDate(item.date)}</small>
      </span>
      {!compact && <span className={styles.failure}>{sourceMode ? sourcePublisher(item.source_url, item.source_name) : item.tags.slice(0, 2).map((tag) => tag.replaceAll("-", " ")).join(" / ") || "Tracked legal AI issue"}</span>}
      <span className={`${styles.severity} ${styles[`severity_${item.severity.replace("-", "_")}`]}`}>
        <i />{severityLabel(item.severity)}
      </span>
      <span className={styles.sanction}>{item.amount_display || item.sanction_types[0]?.replaceAll("-", " ") || "Review"}</span>
      <ChevronRight size={16} aria-hidden="true" />
    </Link>
  );
}

function SourceResult({ item }: { item: HomepageCase }) {
  return (
    <article className={styles.sourceResult}>
      <div>
        <span>{sourcePublisher(item.source_url, item.source_name)}</span>
        <strong>{item.case_name}</strong>
        <small>{item.court} · {formatDate(item.date)}</small>
      </div>
      <a href={item.source_url} target="_blank" rel="noreferrer">Open source <ExternalLink size={14} /></a>
      <Link href={`/cases/${getCaseSlugById(item.id)}`}>Case record <ChevronRight size={14} /></Link>
    </article>
  );
}

export default function ProductHome() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"cases" | "sources">("cases");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [mapSelection, setMapSelection] = useState<{ state: string; cases: LegalRiskCase[] } | null>(null);
  const [mapIndex, setMapIndex] = useState(0);
  const modalCloseRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!installOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    modalCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInstallOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      previous?.focus();
    };
  }, [installOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileMenuOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", closeOnEscape); menuButton?.focus(); };
  }, [mobileMenuOpen]);

  const results = useMemo(
    () => submittedQuery ? (searchMode === "sources" ? searchHomepageSources(submittedQuery, 10) : searchHomepageCases(submittedQuery, 10)) : [],
    [searchMode, submittedQuery],
  );
  const featured = recentSignificantCases[0];
  const searchSuggestions = useMemo(() => query.trim().length > 1
    ? (searchMode === "sources" ? searchHomepageSources(query, 5) : searchHomepageCases(query, 5))
    : [], [query, searchMode]);
  const mapCase = mapSelection?.cases[mapIndex] || featured;

  const runSearch = (value = query) => {
    const next = value.trim();
    setQuery(next);
    setSubmittedQuery(next);
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
    if (next) requestAnimationFrame(() => document.getElementById("search-results")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const copyMcp = async () => {
    await navigator.clipboard.writeText(publicUrl("/mcp"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.navbar}>
          <a href="#top" className={styles.brand} aria-label="AI Vortex Legal AI Risk home">
            <Image src={assetUrl("/av-logo-white.png")} width={36} height={30} alt="" priority />
            <span><strong>AI VORTEX</strong><small>LEGAL AI RISK</small></span>
          </a>
          <nav className={styles.desktopNav} aria-label="Primary navigation">
            <Link href="/cases">Search</Link><Link href="/map">Map</Link><Link href="/analytics">Analytics</Link><Link href="/courts">Courts</Link><Link href="/topics">Topics</Link><Link href="/workflows">Workflows</Link><a href="#use-with-ai">Use with AI</a><a href="#pricing">Pricing</a>
          </nav>
          <div className={styles.navActions}>
            <a href="mailto:manuel@aivortex.io?subject=AI%20Vortex%20access">Get access</a>
            <a className={styles.amberButton} href="#search">Use free</a>
            <button ref={menuButtonRef} className={styles.menuButton} onClick={() => setMobileMenuOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={mobileMenuOpen} aria-controls="home-mobile-menu">
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && <nav className={styles.mobileMenu} id="home-mobile-menu" aria-label="Mobile navigation">
          <Link href="/cases" onClick={() => setMobileMenuOpen(false)}>Search</Link><Link href="/map" onClick={() => setMobileMenuOpen(false)}>Map</Link><Link href="/analytics" onClick={() => setMobileMenuOpen(false)}>Analytics</Link><Link href="/courts" onClick={() => setMobileMenuOpen(false)}>Courts</Link><Link href="/topics" onClick={() => setMobileMenuOpen(false)}>Topics</Link><Link href="/resources" onClick={() => setMobileMenuOpen(false)}>Resources</Link><Link href="/workflows" onClick={() => setMobileMenuOpen(false)}>Workflows</Link><a href="#use-with-ai" onClick={() => setMobileMenuOpen(false)}>Use with AI</a><a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
        </nav>}
        <div className={styles.statusBar}>
          <span className={styles.live}><i /> LIVE</span>
          <span>
            Evidence checked {formatDate(homepageSummary.lastChecked)} · Latest decision{" "}
            {formatDate(homepageSummary.latestRecordDate)}
          </span>
          <span className={styles.statusCounts}>{homepageSummary.totalCases.toLocaleString()} records <b>·</b> {homepageSummary.courts.toLocaleString()} US courts <b>·</b> {homepageSummary.jurisdictions} US jurisdictions</span>
          <Link href="/sources">Methodology <ExternalLink size={12} /></Link>
        </div>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroMap} aria-label="Interactive map of tracked United States legal AI matters">
          <SanctionsMapV2 embedded showIntro={false} showControls={false} showSideRail={false} onStateChange={(state, cases) => { setMapSelection(state ? { state, cases } : null); setMapIndex(0); }} />
        </div>
        <div className={styles.heroShade} />
        <div className={styles.heroContent}>
          <h1>Search legal AI risk<br />precedent. Run the review.<br /><em>Share the record.</em></h1>
          <p>Source-linked legal AI risk records across cases, courts, and jurisdictions. Built for responsible review and defensible preparation.</p>

          <div className={styles.searchCard} id="search">
            <div className={styles.searchTabs} role="tablist" aria-label="Search mode">
              <button role="tab" aria-selected={searchMode === "cases"} className={searchMode === "cases" ? styles.activeTab : ""} onClick={() => { setSearchMode("cases"); setSubmittedQuery(""); setQuery(""); }}>Search cases</button>
              <button role="tab" aria-selected={searchMode === "sources"} className={searchMode === "sources" ? styles.activeTab : ""} onClick={() => { setSearchMode("sources"); setSubmittedQuery(""); setQuery(""); }}>Search sources</button>
            </div>
            <form className={styles.searchForm} onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
              <Search size={18} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setSuggestionsOpen(true); setActiveSuggestion(-1); }}
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
                onKeyDown={(event) => {
                  if (!searchSuggestions.length) return;
                  if (event.key === "ArrowDown") { event.preventDefault(); setActiveSuggestion((value) => Math.min(searchSuggestions.length - 1, value + 1)); }
                  if (event.key === "ArrowUp") { event.preventDefault(); setActiveSuggestion((value) => Math.max(0, value - 1)); }
                  if (event.key === "Escape") setSuggestionsOpen(false);
                  if (event.key === "Enter" && activeSuggestion >= 0) { event.preventDefault(); const item = searchSuggestions[activeSuggestion]; runSearch(searchMode === "sources" ? sourcePublisher(item.source_url, item.source_name) : item.case_name); }
                }}
                placeholder={searchMode === "cases" ? "Case, citation, court, judge, jurisdiction, AI tool, or issue" : "Source publisher, document title, court, or URL"}
                aria-label="Search legal AI risk evidence"
                role="combobox"
                aria-expanded={suggestionsOpen && searchSuggestions.length > 0}
                aria-controls="home-search-suggestions"
                aria-autocomplete="list"
              />
              <button type="submit"><Search size={20} /><span>Search</span></button>
            </form>
            {suggestionsOpen && searchSuggestions.length > 0 && <div className={styles.autocomplete} id="home-search-suggestions" role="listbox">
              <div className={styles.autocompleteLabel}>{searchMode === "cases" ? "Matching matters" : "Matching source records"}<span>Top {searchSuggestions.length}</span></div>
              {searchSuggestions.map((item, index) => <button key={`${item.id}-${index}`} role="option" aria-selected={activeSuggestion === index} className={activeSuggestion === index ? styles.activeSuggestion : ""} onMouseDown={(event) => event.preventDefault()} onClick={() => runSearch(searchMode === "sources" ? sourcePublisher(item.source_url, item.source_name) : item.case_name)}>
                <span><strong>{searchMode === "sources" ? sourcePublisher(item.source_url, item.source_name) : item.case_name}</strong><small>{searchMode === "sources" ? item.case_name : `${item.court} · ${formatDate(item.date)}`}</small></span><ChevronRight size={14} />
              </button>)}
            </div>}
            <button className={styles.chatGptButton} onClick={() => setInstallOpen(true)}><Bot size={17} /> Use in ChatGPT</button>
            <div className={styles.suggestions}><span>Try a search:</span>{(searchMode === "cases" ? caseSuggestions : sourceSuggestions).map((item) => <button key={item} onClick={() => runSearch(item)}>{item}</button>)}</div>
          </div>
        </div>
        {mapCase && <article className={styles.featuredCase} aria-live="polite">
          <div className={styles.mapCardHeader}><span>{mapSelection ? `${mapSelection.state} · ${mapSelection.cases.length} tracked records` : "Recent significant record"}</span>{mapSelection && <button aria-label="Clear map selection" onClick={() => setMapSelection(null)}><X size={15} /></button>}</div>
          <Link className={styles.featuredRecord} href={`/cases/${getCaseSlugById(mapCase.id)}`}>
            <strong>{mapCase.case_name}</strong><small>{mapCase.court} · {formatDate(mapCase.date)}</small>
            <div>{mapCase.tags.slice(0, 3).map((tag) => <span key={tag}>{tag.replaceAll("-", " ")}</span>)}</div>
            <p>{mapCase.summary}</p>
            <b>{mapCase.amount_display ? `Recorded amount: ${mapCase.amount_display}` : severityLabel(mapCase.severity)}</b>
            <i>Open case record <ArrowRight size={14} /></i>
          </Link>
          {mapSelection && <div className={styles.mapCardControls}><button disabled={mapIndex === 0} onClick={() => setMapIndex((value) => Math.max(0, value - 1))}><ChevronLeft size={15} /> Previous</button><span>{mapIndex + 1} of {mapSelection.cases.length}</span><button disabled={mapIndex >= mapSelection.cases.length - 1} onClick={() => setMapIndex((value) => Math.min(mapSelection.cases.length - 1, value + 1))}>Next <ChevronRight size={15} /></button><Link href={`/cases?country=US&state=${mapSelection.state}`}>Search all {mapSelection.state}</Link></div>}
        </article>}
        <div className={styles.mapPurpose}>{mapSelection ? `${mapSelection.state} selected · the card and record set now reflect that state` : "United States view · select a state cluster, or search the global directory"}<Link href="/cases">Global directory <ArrowRight /></Link></div>
        {mapSelection && mapCase && <div className={styles.mobileMapSelection} aria-live="polite">
          <Link href={`/cases/${getCaseSlugById(mapCase.id)}`}><span>{mapSelection.state} · {mapIndex + 1} of {mapSelection.cases.length}</span><strong>{mapCase.case_name}</strong></Link>
          <div><button aria-label="Previous selected case" disabled={mapIndex === 0} onClick={() => setMapIndex((value) => Math.max(0, value - 1))}><ChevronLeft /></button><button aria-label="Next selected case" disabled={mapIndex >= mapSelection.cases.length - 1} onClick={() => setMapIndex((value) => Math.min(mapSelection.cases.length - 1, value + 1))}><ChevronRight /></button><button aria-label="Clear map selection" onClick={() => setMapSelection(null)}><X /></button></div>
        </div>}
      </section>

      {submittedQuery && <section className={styles.searchResults} id="search-results" aria-live="polite">
        <div className={styles.sectionHeadingRow}>
          <div><span>{searchMode === "sources" ? "Linked-source metadata search" : "Case search"}</span><h2>{results.length ? `${results.length} relevant matches for “${submittedQuery}”` : `No exact match for “${submittedQuery}”`}</h2>{searchMode === "sources" && <p>Searches recorded publisher, URL, case title, and court fields. It does not search inside source-document text.</p>}</div>
          <button onClick={() => { setSubmittedQuery(""); setQuery(""); }}><X size={16} /> Clear</button>
        </div>
        {results.length ? <><div className={styles.resultList}>{results.map((item) => searchMode === "sources" ? <SourceResult key={getCaseSlugById(item.id)} item={item} /> : <CaseResult key={getCaseSlugById(item.id)} item={item} />)}</div><Link className={styles.viewAll} href={`/cases?q=${encodeURIComponent(submittedQuery)}`}>Open and share the full result set <ArrowRight /></Link></> : <div className={styles.emptyResult}><CircleAlert /><div><strong>No exact tracked result.</strong><p>AI Vortex will not invent a case or silently substitute a different query. Open the directory to use transparent broader searches.</p><Link href={`/cases?q=${encodeURIComponent(submittedQuery)}`}>Review fallback options</Link></div></div>}
      </section>}

      <section className={styles.channelSection} id="use-with-ai">
        <h2>One intelligence layer. Three ways to use it.</h2>
        <div className={styles.channelGrid}>
          <article><Globe2 /><div><strong>Web</strong><p>Discover, search, and inspect source-linked records in the public tracker.</p><a href="#search">Start searching <ArrowRight /></a></div></article>
          <article><Bot /><div><strong>AI app / MCP</strong><p>Ask questions and turn evidence into citations, summaries, controls, and review-ready packets.</p><button onClick={() => setInstallOpen(true)}>Connect your AI <ArrowRight /></button></div></article>
          <article id="extension"><Sparkles /><div><strong>Chrome Extension</strong><p>Use the same intelligence beside the case, opinion, filing, or court page you are reading.</p><a href="mailto:manuel@aivortex.io?subject=AI%20Vortex%20Chrome%20extension%20early%20access">Join early access <ArrowRight /></a></div></article>
        </div>
      </section>

      <section className={styles.roleSection} aria-labelledby="role-title">
        <div className={styles.roleHeading}><span>Start from the work</span><h2 id="role-title">Built around the decision you need to make.</h2><p>The same public record should behave differently for a filing team, chambers, a researcher, or a product operator. Choose the workflow closest to yours.</p></div>
        <div className={styles.roleGrid}>{roles.map(({ icon: Icon, label, title, body, href, action }) => <Link key={label} href={href}><Icon /><span>{label}</span><h3>{title}</h3><p>{body}</p><strong>{action} <ArrowRight /></strong></Link>)}</div>
      </section>

      <section className={styles.workspace} id="matters">
        <aside className={styles.workflows}>
          <h3>Common workflows</h3>
          {workflows.map(({ icon: Icon, label, query: workflowQuery, href }) => href ? <Link key={label} href={href}><Icon />{label}<ChevronRight /></Link> : <button key={label} onClick={() => { runSearch(workflowQuery || ""); document.getElementById("search")?.scrollIntoView({ behavior: "smooth" }); }}><Icon />{label}<ChevronRight /></button>)}
          <Link className={styles.viewAll} href="/workflows">View all workflows <ArrowRight /></Link>
        </aside>

        <section className={styles.mattersPanel}>
          <div className={styles.panelTitle}><h3>Recent &amp; significant records</h3><Link href="/cases">View all records <ArrowRight /></Link></div>
          <div className={styles.caseList}>{recentSignificantCases.slice(0, 6).map((item) => <CaseResult key={item.id} item={item} />)}</div>
        </section>

        <aside className={styles.packetPanel}>
          <div className={styles.panelTitle}><h3>Review packet preview</h3></div>
          <div className={styles.paperStack}><span /><span /><div><small>AI VORTEX · REVIEW PACKET</small><strong>{featured?.case_name || "Legal AI Risk Review"}</strong><p>Source-linked evidence, analysis, review controls, and citations.</p></div></div>
          <strong>{featured?.case_name || "Review-ready packet"}</strong><p>{featured?.court} · PDF-ready</p>
          <Link href={`/artifact/print?type=report${featured ? `&case_id=${encodeURIComponent(featured.id)}` : ""}&title=${encodeURIComponent(featured?.case_name || "Legal AI Risk Review Packet")}&audience=legal_professional`}>Open preview <ExternalLink /></Link>
        </aside>

        <aside className={styles.evidencePanel}>
          <div className={styles.panelTitle}><h3>Evidence at a glance</h3></div>
          <dl>
            <div><dt>Corpus records</dt><dd>{homepageSummary.totalCases.toLocaleString()}</dd></div>
            <div><dt>Normalized case names</dt><dd>{homepageEvidenceSummary.uniqueMatterNames.toLocaleString()}</dd></div>
            <div><dt>Non-alleged records</dt><dd>{homepageEvidenceSummary.nonAllegedRecords.toLocaleString()}</dd></div>
            <div><dt>Any source link</dt><dd>{homepageSummary.sourceCoveragePct}%</dd></div>
            <div><dt>Source-linked records</dt><dd>{homepageSummary.sourceCoverageCount.toLocaleString()}</dd></div>
          </dl>
          <Link href="/sources">Inspect the evidence <ArrowRight /></Link>
        </aside>
      </section>

      <div className={styles.corpusSection}>
        <CorpusIntelligence compact />
      </div>

      <section className={styles.trustBand} aria-labelledby="trust-title"><div><ShieldCheck /><span>Trust boundary</span><h2 id="trust-title">Every answer should show where the evidence ends.</h2></div><div><p><strong>Source-linked, not source-equivalent.</strong> A link establishes traceability; it does not make a summary a substitute for the order or docket.</p><p><strong>Observed incidents, not failure rates.</strong> Counts are not adjusted for product usage, filing volume, or reporting bias.</p><p><strong>Neutral attribution.</strong> A discrepancy is not proof that AI was used. AI Vortex states the recorded basis and flags what remains unknown.</p><Link href="/sources">Inspect methodology, coverage, and limitations <ArrowRight /></Link></div></section>

      <section className={styles.pricing} id="pricing">
        <div className={styles.pricingIntro}><span>PUBLIC INTELLIGENCE STAYS FREE</span><h2>Pay for saved time, not access to precedent.</h2><p>Research the full public record, inspect sources, and use the MCP for free. The Pro pilot removes packaging friction when you need clean, branded work for a client, court, committee, or team.</p></div>
        <div className={styles.pricingGrid}>
          <article><small>Public research</small><h3>$0 <span>/ always</span></h3><ul><li><Check />Search every public matter and source link</li><li><Check />Use the case directory, map, workflows, and MCP</li><li><Check />Generate review artifacts with AI Vortex attribution</li><li><Check />No account required for public intelligence</li></ul><a href="#search">Search free</a></article>
          <article className={styles.proCard}><div className={styles.popular}>CONCIERGE PILOT</div><small>Workflow Pro</small><h3>$19 <span>/ person / month during pilot</span></h3><ul><li><Check />Remove AI Vortex attribution from requested exports</li><li><Check />Add your firm or organization branding</li><li><Check />Get report formatting and packet setup help</li><li><Check />Direct onboarding and product feedback access</li></ul><a href="mailto:manuel@aivortex.io?subject=AI%20Vortex%20Workflow%20Pro%20pilot">Request Pro access</a><p>Need team seats, procurement support, or a firm-wide pilot? Email for organization pricing.</p></article>
        </div>
      </section>

      <footer className={styles.footer}>
        <div><Image src={assetUrl("/av-logo-white.png")} width={28} height={24} alt="" /><span><strong>AI VORTEX</strong><small>LEGAL AI RISK</small></span></div>
        <p>AI Vortex is an independent publisher of public legal AI risk intelligence. Verify primary sources before relying. Not legal advice.</p>
        <nav><a href="mailto:manuel@aivortex.io">About</a><Link href="/sources">Methodology</Link><Link href="/resources">Resources</Link><Link href="/feed">Data updates</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
      </footer>

      <nav className={styles.mobileDock} aria-label="Mobile navigation">
        <a href="#search"><Search /><span>Search</span></a><Link href="/map"><Map /><span>Map</span></Link><Link href="/courts"><Gavel /><span>Courts</span></Link><button onClick={() => setInstallOpen(true)}><Bot /><span>Use with AI</span></button><button onClick={() => setMobileMenuOpen(true)}><Menu /><span>Menu</span></button>
      </nav>

      {installOpen && <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setInstallOpen(false)}>
        <section className={styles.installModal} role="dialog" aria-modal="true" aria-labelledby="connect-title" onMouseDown={(event) => event.stopPropagation()}>
          <button ref={modalCloseRef} className={styles.modalClose} onClick={() => setInstallOpen(false)} aria-label="Close"><X /></button>
          <div className={styles.modalIcon}><Bot /></div>
          <span>AI VORTEX CONNECTOR</span><h2 id="connect-title">Bring the tracker into your AI workspace.</h2>
          <p>Connect the read-only MCP endpoint in ChatGPT developer mode, Claude, Codex, or another MCP-compatible client.</p>
          <div className={styles.endpoint}><code>{publicUrl("/mcp")}</code><button onClick={copyMcp}>{copied ? <Check /> : <Copy />}<span>{copied ? "Copied" : "Copy"}</span></button></div>
          <ol><li><b>1</b> Open your AI app’s connector or MCP settings.</li><li><b>2</b> Add a custom server using the URL above.</li><li><b>3</b> Ask for a jurisdiction brief, case search, or pre-filing packet.</li></ol>
          <a href="mailto:manuel@aivortex.io?subject=Help%20connecting%20AI%20Vortex">Get connection help <ArrowRight /></a>
        </section>
      </div>}
    </main>
  );
}
