"use client";

import Image from "next/image";
import { assetUrl } from "@/lib/site";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LAST_CHECKED, LATEST_RECORD_DATE, formatCorpusDate } from "@/lib/corpus-meta";
import styles from "./ResearchShell.module.css";

const navItems = [
  ["Cases", "/cases"],
  ["Map", "/map"],
  ["Analytics", "/analytics"],
  ["Courts", "/courts"],
  ["Judges", "/judges"],
  ["Topics", "/topics"],
  ["Sources", "/sources"],
  ["Resources", "/resources"],
];

export default function ResearchShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", close); menuButton?.focus(); };
  }, [open]);
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.nav}>
          <Link className={styles.brand} href="/">
            <Image src={assetUrl("/av-logo-white.png")} alt="" width={34} height={30} />
            <span><strong>AI VORTEX</strong><small>LEGAL AI RISK</small></span>
          </Link>
          <nav className={styles.links} aria-label="Primary navigation">
            {navItems.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
          </nav>
          <div className={styles.actions}>
            <a href="https://www.aivortex.io/diagnostic/">AI visibility</a>
            <a href="https://www.aivortex.io/consulting/">Consulting</a>
            <Link className={styles.primary} href="/cases">Search free</Link>
            <button ref={menuButtonRef} className={styles.menuButton} onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={open} aria-controls="research-mobile-nav">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {open && <nav className={styles.mobileNav} id="research-mobile-nav" aria-label="Mobile navigation">
          {navItems.map(([label, href]) => <Link key={label} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <a href="https://www.aivortex.io/diagnostic/" onClick={() => setOpen(false)}>AI visibility</a>
          <a href="https://www.aivortex.io/consulting/" onClick={() => setOpen(false)}>Consulting</a>
        </nav>}
        <div className={styles.status}>
          <span className={styles.live}>Public tracker</span>
          <span>
            Corpus refreshed {formatCorpusDate(LAST_CHECKED)} · Latest decision{" "}
            {formatCorpusDate(LATEST_RECORD_DATE)}
          </span>
          <span className={styles.statusBoundary}>Public incidents are risk signals, not usage-adjusted rates</span>
        </div>
      </header>
      {children}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>AI Vortex is an independent publisher of legal AI risk intelligence. Not legal advice.</span>
          <nav aria-label="Footer navigation"><Link href="/cases">Cases</Link><Link href="/courts">Courts</Link><Link href="/judges">Judges</Link><Link href="/tools">AI tools</Link><Link href="/dataset">Dataset</Link><Link href="/sources">Methodology</Link><Link href="/resources">Resources</Link><Link href="/about">About</Link><Link href="/submit">Corrections</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
        </div>
      </footer>
    </div>
  );
}
