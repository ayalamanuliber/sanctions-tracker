import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpDown, Banknote, Bot, CalendarDays, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Gavel, Landmark, Search } from "lucide-react";

import CorpusDirectoryNav from "@/components/CorpusDirectoryNav";
import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import { COUNTRIES_TRACKED, LEGAL_RISK_CASES, formatCaseDate, getCaseFallbacks, getCaseMatchReason, queryCases } from "@/lib/cases";
import { FILTER_COUNTS, optionLabel } from "@/lib/corpus-analytics";
import { publicUrl } from "@/lib/site";
import styles from "./cases.module.css";

type Params = Record<string, string | string[] | undefined>;
const PAGE_SIZE = 25;

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}): Promise<Metadata> {
  const params = (await searchParams) || {};
  const hasFilters = Object.values(params).some((entry) =>
    Array.isArray(entry) ? entry.some(Boolean) : Boolean(entry),
  );

  return {
    title: "Search Legal AI Risk Cases | AI Vortex",
    description:
      "Search the complete AI Vortex corpus by case, court, judge, jurisdiction, AI tool, failure mode, and outcome.",
    alternates: { canonical: publicUrl("/cases") },
    robots: hasFilters
      ? { index: false, follow: true }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  };
}

function value(params: Params, key: string) {
  const entry = params[key];
  return Array.isArray(entry) ? entry[0] || "" : entry || "";
}

function pageHref(params: Params, page: number) {
  const next = new URLSearchParams();
  for (const [key, entry] of Object.entries(params)) {
    const v = Array.isArray(entry) ? entry[0] : entry;
    if (v && key !== "page") next.set(key, v);
  }
  if (page > 1) next.set("page", String(page));
  return `/cases${next.size ? `?${next}` : ""}`;
}

function sortHref(params: Params, sort: string) {
  const next = new URLSearchParams();
  for (const [key, entry] of Object.entries(params)) {
    const v = Array.isArray(entry) ? entry[0] : entry;
    if (v && key !== "page" && key !== "sort") next.set(key, v);
  }
  next.set("sort", sort);
  return `/cases?${next}`;
}

export default async function CasesPage({ searchParams }: { searchParams?: Promise<Params> }) {
  const params = (await searchParams) || {};
  const query = {
    q: value(params, "q"), country: value(params, "country"), state: value(params, "state"),
    court: value(params, "court"), severity: value(params, "severity"), tool: value(params, "tool"),
    failure: value(params, "failure"), status: (value(params, "status") || "all") as "all" | "non-alleged" | "adjudicated" | "alleged",
    sort: (value(params, "sort") || undefined) as "relevance" | "date" | "severity" | "amount" | undefined,
    order: (value(params, "order") || "desc") as "asc" | "desc",
  };
  const results = queryCases(query);
  const fallbacks = results.length ? [] : getCaseFallbacks(query);
  const requestedPage = Math.max(1, Number.parseInt(value(params, "page") || "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return <ResearchShell>
    <main className={shell.main}>
      <div className={shell.breadcrumbs}><Link href="/">Home</Link><span>/</span><span>Cases</span></div>
      <header className={shell.pageHead}>
        <div><span className={shell.eyebrow}>Complete corpus</span><h1>Search legal AI risk records</h1><p>Find cases, orders, courts, tools, and failure patterns. Results cover the complete global corpus; use status filters to separate allegation-only records. Judge search is available only where a judge is recorded.</p></div>
        <div className={shell.headActions}><Link className={shell.buttonSecondary} href="/courts"><Landmark size={15} />Browse courts</Link><Link className={shell.buttonSecondary} href="/judges"><Gavel size={15} />Browse judges</Link><Link className={shell.buttonSecondary} href="/map">Open map</Link></div>
      </header>

      <CorpusDirectoryNav />

      <form className={`${shell.card} ${styles.searchPanel}`} method="get">
        <div className={styles.searchRow}>
          <div className={`${styles.field} ${styles.queryField}`}><label htmlFor="q">Search</label><div className={styles.inputWithIcon}><Search size={16} aria-hidden="true"/><input id="q" name="q" defaultValue={query.q} placeholder="Case, citation, court, judge, tool, or issue" /></div></div>
          <div className={styles.field}><label htmlFor="country">Country</label><select id="country" name="country" defaultValue={query.country}><option value="">All {COUNTRIES_TRACKED} countries ({LEGAL_RISK_CASES.length.toLocaleString()})</option>{FILTER_COUNTS.countries.map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
          <div className={styles.field}><label htmlFor="state">US state</label><select id="state" name="state" defaultValue={query.state}><option value="">All US states</option>{FILTER_COUNTS.states.map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
          <div className={styles.field}><label htmlFor="severity">Editorial impact</label><select id="severity" name="severity" defaultValue={query.severity}><option value="">All impact levels ({LEGAL_RISK_CASES.length.toLocaleString()})</option>{FILTER_COUNTS.severities.map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
          <button className={styles.submit} type="submit"><Search size={16} /> Search</button>
        </div>
        <div className={styles.advanced}>
          <div className={styles.field}><label htmlFor="court">Court</label><input id="court" name="court" defaultValue={query.court} placeholder="e.g. D.N.J." list="court-options"/><datalist id="court-options">{FILTER_COUNTS.courts.slice(0,40).map((item)=><option key={item.value} value={item.value}>{item.count} records</option>)}</datalist></div>
          <div className={styles.field}><label htmlFor="tool">AI tool</label><select id="tool" name="tool" defaultValue={query.tool}><option value="">All recorded tools</option>{FILTER_COUNTS.tools.slice(0,40).map((item)=><option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
          <div className={styles.field}><label htmlFor="failure">Failure mode</label><select id="failure" name="failure" defaultValue={query.failure}><option value="">All failure modes</option>{FILTER_COUNTS.failures.map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
          <div className={styles.field}><label htmlFor="status">Record status</label><select id="status" name="status" defaultValue={query.status}><option value="all">All tracked records</option><option value="non-alleged">Exclude allegation-only</option><option value="alleged">Allegation-only records</option></select></div>
        </div>
        <div className={styles.scope}><span><strong>Search scope:</strong> {LEGAL_RISK_CASES.length.toLocaleString()} public matters across the global corpus.</span><Link href="/cases">Clear all filters</Link></div>
      </form>

      <div className={styles.toolbar}><div><h2>{results.length.toLocaleString()} matching matters</h2><p>Showing {results.length ? (page - 1) * PAGE_SIZE + 1 : 0}-{Math.min(page * PAGE_SIZE, results.length)} · Page {page} of {totalPages}</p></div><form method="get">{Object.entries(params).filter(([k,v]) => k !== "sort" && k !== "order" && k !== "page" && v).map(([k,v]) => <input key={k} type="hidden" name={k} value={Array.isArray(v) ? v[0] : v} />)}<div className={styles.field}><label htmlFor="sort">Sort by</label><select id="sort" name="sort" defaultValue={query.sort || (query.q ? "relevance" : "date")}><option value="relevance">Best match</option><option value="date">Decision date</option><option value="severity">Editorial impact</option><option value="amount">Known amount</option></select></div><div className={styles.field}><label htmlFor="order">Direction</label><select id="order" name="order" defaultValue={query.order}><option value="desc">High to low / newest</option><option value="asc">Low to high / oldest</option></select></div><button className={styles.submit} type="submit"><ArrowUpDown size={15}/> Apply</button></form></div>

      <section className={`${shell.card} ${styles.tableCard}`} aria-label="Case results">
        {visible.length > 0 && <div className={styles.tableHead}><span>Public matter</span><span>Court / jurisdiction</span><Link href={sortHref(params,"date")}>Date</Link><span>Recorded AI tool</span><Link href={sortHref(params,"amount")}>Amount</Link><Link href={sortHref(params,"severity")}>Impact</Link><span /></div>}
        {visible.length ? visible.map((item) => <Link className={styles.caseRow} key={item.slug} href={`/cases/${item.slug}`}>
          <span className={styles.identity}><strong>{item.case_name}</strong><small>{item.tags.slice(0,3).map((tag) => tag.replaceAll("-", " ")).join(" · ") || "Tracked legal AI matter"}</small><b className={styles.matchReason}>{getCaseMatchReason(item, query)}</b>{item.alleged && <em className={styles.alleged}>Allegation</em>}</span>
          <span className={styles.meta}><Landmark aria-hidden="true" />{item.court}<small>{item.state || item.country} · {item.jurisdiction}</small></span>
          <span className={styles.meta}><CalendarDays aria-hidden="true" />{formatCaseDate(item.date)}</span>
          <span className={styles.meta}><Bot aria-hidden="true" />{item.ai_tool_used || "Unidentified"}</span>
          <span className={styles.amount}><Banknote aria-hidden="true" />{item.amount ? item.amount_display : "—"}</span>
          <span className={styles.severity} data-value={item.severity}>{item.severity.replace("-", " ")}</span>
          <ChevronRight size={17} aria-hidden="true" />
        </Link>) : <div className={styles.empty}><span>Transparent fallback</span><h2>No exact matches for every selected condition.</h2><p>AI Vortex did not silently substitute other results. These broader searches preserve the closest useful part of your request:</p><div className={styles.fallbacks}>{fallbacks.map((fallback) => <Link key={fallback.href} href={fallback.href}><strong>{fallback.label}</strong><small>{fallback.explanation}</small><b>{fallback.count.toLocaleString()} records <ChevronRight /></b></Link>)}</div></div>}
      </section>

      {totalPages > 1 && <nav className={styles.pagination} aria-label="Results pages">
        {page > 1 && <><Link className={styles.edgePage} href={pageHref(params, 1)} aria-label="First page"><ChevronFirst /> First</Link><Link href={pageHref(params, page - 1)} aria-label="Previous page"><ChevronLeft /> Prev</Link></>}
        {Array.from({length: Math.min(5,totalPages)}, (_, index) => Math.max(1, Math.min(totalPages - 4, page - 2)) + index).map((n) => n <= totalPages && <Link className={n === page ? styles.current : ""} key={n} href={pageHref(params,n)} aria-current={n === page ? "page" : undefined}>{n}</Link>)}
        {page < totalPages && <><Link href={pageHref(params, page + 1)} aria-label="Next page">Next <ChevronRight /></Link><Link className={styles.edgePage} href={pageHref(params, totalPages)} aria-label="Last page">Last <ChevronLast /></Link></>}
      </nav>}
    </main>
  </ResearchShell>;
}
