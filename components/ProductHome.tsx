"use client";

import Image from "next/image";
import { assetUrl } from "@/lib/site";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Database,
  ExternalLink,
  FileCheck2,
  FileSearch,
  FolderPlus,
  Gavel,
  Globe2,
  Landmark,
  Link2,
  Map,
  Menu,
  Scale,
  Search,
  ShieldCheck,
  Tags,
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
  { icon: Search, label: "Search every public record", href: "/cases" },
  { icon: Map, label: "Explore the evidence map", href: "/map" },
  { icon: Landmark, label: "Browse courts and jurisdictions", href: "/courts" },
  { icon: FileSearch, label: "Analyze the public corpus", href: "/analytics" },
  { icon: BookOpenCheck, label: "Inspect sources and methodology", href: "/sources" },
  { icon: FolderPlus, label: "Open the current analytics brief", href: "/analytics/print?tier=free" },
];

const roles = [
  { icon: BriefcaseBusiness, label: "Litigation team", title: "Check a filing before it leaves the firm", body: "Run a citation, quotation, proposition-support, and disclosure review with a reusable verification record.", href: "/filing-gate", action: "Open the filing gate" },
  { icon: Scale, label: "Court or chambers", title: "Inspect the record without inferring AI use", body: "Separate demonstrated discrepancies from attribution, preserve source links, and compare similar public matters.", href: "/filing-integrity-scanner", action: "Open neutral review" },
  { icon: BookOpenCheck, label: "Research and knowledge", title: "Trace a pattern across courts and sources", body: "Search the global corpus, inspect the denominator, and open the underlying public evidence before relying.", href: "/topics", action: "Explore risk topics" },
  { icon: ShieldCheck, label: "Legal tech and risk", title: "Measure the record without overstating it", body: "Inspect denominators, missing values, evidence coverage, and the records behind every displayed pattern.", href: "/analytics", action: "Open public analytics" },
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
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [mapSelection, setMapSelection] = useState<{ state: string; cases: LegalRiskCase[] } | null>(null);
  const [mapIndex, setMapIndex] = useState(0);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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
  const featuredSlug = featured ? getCaseSlugById(featured.id) : "";
  const evidenceMetrics = [
    { icon: Database, label: "Corpus records", value: homepageSummary.totalCases.toLocaleString() },
    { icon: Tags, label: "Normalized case names", value: homepageEvidenceSummary.uniqueMatterNames.toLocaleString() },
    { icon: ShieldCheck, label: "Non-alleged records", value: homepageEvidenceSummary.nonAllegedRecords.toLocaleString() },
    { icon: Link2, label: "Any source link", value: `${homepageSummary.sourceCoveragePct}%` },
    { icon: FileCheck2, label: "Source-linked records", value: homepageSummary.sourceCoverageCount.toLocaleString() },
  ];
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.navbar}>
          <a href="#top" className={styles.brand} aria-label="AI Vortex Legal AI Risk home">
            <Image src={assetUrl("/av-logo-white.png")} width={36} height={30} alt="" priority />
            <span><strong>AI VORTEX</strong><small>LEGAL AI RISK</small></span>
          </a>
          <nav className={styles.desktopNav} aria-label="Primary navigation">
            <Link href="/cases">Search</Link><Link href="/map">Map</Link><Link href="/analytics">Analytics</Link><Link href="/courts">Courts</Link><Link href="/judges">Judges</Link><Link href="/topics">Topics</Link><Link href="/sources">Sources</Link><Link href="/resources">Resources</Link>
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
          <Link href="/cases" onClick={() => setMobileMenuOpen(false)}>Search</Link><Link href="/map" onClick={() => setMobileMenuOpen(false)}>Map</Link><Link href="/analytics" onClick={() => setMobileMenuOpen(false)}>Analytics</Link><Link href="/courts" onClick={() => setMobileMenuOpen(false)}>Courts</Link><Link href="/judges" onClick={() => setMobileMenuOpen(false)}>Judges</Link><Link href="/topics" onClick={() => setMobileMenuOpen(false)}>Topics</Link><Link href="/sources" onClick={() => setMobileMenuOpen(false)}>Sources</Link><Link href="/resources" onClick={() => setMobileMenuOpen(false)}>Resources</Link>
        </nav>}
        <div className={styles.statusBar}>
          <span className={styles.live}><i /> LIVE</span>
          <span>
            Corpus refreshed {formatDate(homepageSummary.lastChecked)} · Latest decision{" "}
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

      <section className={styles.channelSection}>
        <h2>One evidence layer. Three source-backed actions.</h2>
        <div className={styles.channelGrid}>
          <article><Globe2 /><div><strong>Search the record</strong><p>Discover cases, courts, tools, consequences, and failure patterns across the public corpus.</p><a href="#search">Start searching <ArrowRight /></a></div></article>
          <article><Landmark /><div><strong>Inspect the source</strong><p>Open the recorded document, understand its source tier, and see what the available evidence cannot establish.</p><Link href="/sources">Review methodology <ArrowRight /></Link></div></article>
          <article><FileCheck2 /><div><strong>Build the review</strong><p>Turn a case or filtered analytics view into a source-complete, print-ready evidence brief.</p><Link href="/analytics">Open analytics <ArrowRight /></Link></div></article>
        </div>
      </section>

      <section className={styles.roleSection} aria-labelledby="role-title">
        <div className={styles.roleHeading}><span>Start from the work</span><h2 id="role-title">Built around the decision you need to make.</h2><p>The same public record should behave differently for a filing team, chambers, a researcher, or a product operator. Choose the workflow closest to yours.</p></div>
        <div className={styles.roleGrid}>{roles.map(({ icon: Icon, label, title, body, href, action }) => <Link key={label} href={href}><Icon /><span>{label}</span><h3>{title}</h3><p>{body}</p><strong>{action} <ArrowRight /></strong></Link>)}</div>
      </section>

      <section className={styles.workspace} id="matters">
        <aside className={styles.workflows}>
          <h3>Research paths</h3>
          {workflows.map(({ icon: Icon, label, href }) => <Link key={label} href={href}><Icon />{label}<ChevronRight /></Link>)}
          <Link className={styles.viewAll} href="/resources">View research resources <ArrowRight /></Link>
        </aside>

        <section className={styles.mattersPanel}>
          <div className={styles.panelTitle}><h3>Recent &amp; significant records</h3><Link href="/cases">View all records <ArrowRight /></Link></div>
          <div className={styles.caseList}>{recentSignificantCases.slice(0, 6).map((item) => <CaseResult key={item.id} item={item} />)}</div>
        </section>

        <aside className={styles.packetPanel}>
          <div className={styles.panelTitle}><h3>Current case brief</h3><span className={styles.currentBadge}>LIVE</span></div>
          <div className={styles.paperStack}><span /><span /><div><small>AI VORTEX · REVIEW PACKET</small><strong>{featured?.case_name || "Legal AI Risk Review"}</strong><p>Source-linked evidence, analysis, review controls, and citations.</p></div></div>
          <strong>{featured?.case_name || "Review-ready packet"}</strong><p>{featured?.court} · Live and print-ready</p>
          <Link href={featuredSlug ? `/cases/${featuredSlug}/brief?tier=free` : "/analytics/print?tier=free"}>Open current brief <ExternalLink /></Link>
          {featuredSlug && <Link className={styles.packetRecordLink} href={`/cases/${featuredSlug}`}>Inspect case record <ArrowRight /></Link>}
        </aside>

        <aside className={styles.evidencePanel}>
          <div className={styles.panelTitle}><h3>Evidence at a glance</h3></div>
          <dl>
            {evidenceMetrics.map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <dt><Icon aria-hidden="true" />{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Link href="/sources">Inspect the evidence <ArrowRight /></Link>
        </aside>
      </section>

      <div className={styles.corpusSection}>
        <CorpusIntelligence compact />
      </div>

      <section className={styles.trustBand} aria-labelledby="trust-title"><div><ShieldCheck /><span>Trust boundary</span><h2 id="trust-title">Every answer should show where the evidence ends.</h2></div><div><p><strong>Source-linked, not source-equivalent.</strong> A link establishes traceability; it does not make a summary a substitute for the order or docket.</p><p><strong>Observed incidents, not failure rates.</strong> Counts are not adjusted for product usage, filing volume, or reporting bias.</p><p><strong>Neutral attribution.</strong> A discrepancy is not proof that AI was used. AI Vortex states the recorded basis and flags what remains unknown.</p><Link href="/sources">Inspect methodology, coverage, and limitations <ArrowRight /></Link></div></section>

      <section className={styles.pricing}>
        <div className={styles.pricingIntro}><span>PUBLIC INTELLIGENCE STAYS FREE</span><h2>The record should remain open, inspectable, and useful.</h2><p>Search the complete public corpus, inspect recorded sources, open analytics, and generate AI Vortex-attributed evidence briefs without an account.</p></div>
        <div className={styles.pricingGrid}>
          <article><small>Public research</small><h3>Free <span>/ no account required</span></h3><ul><li><Check />Search every public matter and recorded source</li><li><Check />Explore courts, jurisdictions, topics, and analytics</li><li><Check />Generate source-complete briefs with AI Vortex attribution</li><li><Check />Submit corrections and inspect evidence limitations</li></ul><a href="#search">Search the public record</a></article>
          <article className={styles.proCard}><div className={styles.popular}>HELP SHAPE THE PUBLIC LAYER</div><small>Founding review group</small><h3>Review <span>/ test real records</span></h3><ul><li><Check />Test search quality and record clarity</li><li><Check />Flag missing sources or classification issues</li><li><Check />Review print briefs and evidence boundaries</li><li><Check />Influence what the public product supports next</li></ul><a href="mailto:manuel@aivortex.io?subject=AI%20Vortex%20founding%20review%20group">Join the review group</a><p>No endorsement implied. Reviewers help improve accuracy and usability.</p></article>
        </div>
      </section>

      <footer className={styles.footer}>
        <div><Image src={assetUrl("/av-logo-white.png")} width={28} height={24} alt="" /><span><strong>AI VORTEX</strong><small>LEGAL AI RISK</small></span></div>
        <p>AI Vortex is an independent publisher of public legal AI risk intelligence. Verify primary sources before relying. Not legal advice.</p>
        <nav><Link href="/about">About</Link><Link href="/sources">Methodology</Link><Link href="/resources">Resources</Link><Link href="/feed">Data updates</Link><Link href="/submit">Corrections</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
      </footer>

      <nav className={styles.mobileDock} aria-label="Mobile navigation">
        <a href="#search"><Search /><span>Search</span></a><Link href="/map"><Map /><span>Map</span></Link><Link href="/courts"><Gavel /><span>Courts</span></Link><Link href="/sources"><BookOpenCheck /><span>Sources</span></Link><button onClick={() => setMobileMenuOpen(true)}><Menu /><span>Menu</span></button>
      </nav>
    </main>
  );
}
