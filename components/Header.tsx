"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 120 && y > lastY) setHidden(true);
      else setHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav className={`nav ${hidden ? "hidden" : ""}`}>
        <div className="nav-inner">
          <a className="nav-brand" href="https://www.aivortex.io/legal">
            <span className="nav-monogram-wrap">
              <img src="/av-logo-white.png" alt="AI Vortex" className="nav-monogram" />
            </span>
            <span className="nav-brand-name">AI Vortex</span>
          </a>
          <div className="nav-links">
            <a className="nav-link" href="#map">Map</a>
            <a className="nav-link" href="#assessment">Assessment</a>
            <a className="nav-link" href="#insights">Insights</a>
            <a className="nav-link" href="#jurisdiction">Courts</a>
            <a className="nav-link" href="#evidence">Evidence</a>
            <a
              className="nav-link"
              href="https://www.linkedin.com/in/aivortex/"
              target="_blank"
              rel="noopener"
              aria-label="LinkedIn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a className="nav-cta" href="https://www.aivortex.io/legal#subscribe">Subscribe</a>
          </div>
          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
        <a href="#map" onClick={() => setMobileOpen(false)}>Map</a>
        <a href="#assessment" onClick={() => setMobileOpen(false)}>Assessment</a>
        <a href="#insights" onClick={() => setMobileOpen(false)}>Insights</a>
        <a href="#jurisdiction" onClick={() => setMobileOpen(false)}>Courts</a>
        <a href="#evidence" onClick={() => setMobileOpen(false)}>Evidence</a>
        <a href="https://www.linkedin.com/in/aivortex/" target="_blank" rel="noopener">LinkedIn</a>
        <a className="nav-cta" href="https://www.aivortex.io/legal#subscribe" onClick={() => setMobileOpen(false)}>Subscribe</a>
      </div>
    </>
  );
}
