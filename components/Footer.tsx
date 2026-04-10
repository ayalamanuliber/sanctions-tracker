import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <>
    {/* Author CTA */}
    <section className="px-6 py-16 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#0A1628]/70 border border-white/[0.06] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="shrink-0">
            <Image
              src="/manuel.webp"
              alt="Manu Ayala"
              width={96}
              height={96}
              className="rounded-full"
            />
          </div>
          <div>
            <div className="text-[#0066FF] text-[11px] font-semibold tracking-widest uppercase mb-2">From Manuel Ayala</div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              I&apos;m Manu Ayala. I spent five years doing legal investigations for a US law firm. Now I run AI Vortex, where I help firms figure out where they actually stand on AI and build the infrastructure to get to where they need to be. I write about what I find at{" "}
              <a href="https://www.aivortex.io/legal" className="text-[#0066FF] hover:underline">aivortex.io/legal</a>.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#004ACC] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Book a Call
              </a>
              <a
                href="mailto:manuel@aivortex.io"
                className="inline-flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] text-white/70 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border border-white/[0.06]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Email
              </a>
              <a
                href="https://www.linkedin.com/in/aivortex/"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center w-10 h-10 bg-white/[0.05] hover:bg-white/[0.08] rounded-xl border border-white/[0.06] transition-colors"
                aria-label="LinkedIn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer className="bg-[#02050A] border-t border-white/[0.04] py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
          <div>
            <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-white/50 mb-4">
              Directories
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="https://www.aivortex.io/legal/ai-disclosure/"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                AI Disclosure Rules (94)
              </Link>
              <Link
                href="https://www.aivortex.io/legal/ai-regulation/"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                State AI Regulation (51)
              </Link>
              <Link
                href="https://www.aivortex.io/legal/ai-case-law/"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                AI Case Law (23)
              </Link>
              <Link
                href="https://www.aivortex.io/legal/ai-tools/"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                AI Tools for Lawyers (15)
              </Link>
              <Link
                href="https://www.aivortex.io/legal/ai-by-practice/"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                AI by Practice Area (10)
              </Link>
              <Link
                href="/"
                className="text-[13px] text-[#FF5E1A] hover:text-[#ff8a54] transition-colors font-semibold"
              >
                AI Sanctions Tracker
              </Link>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-white/50 mb-4">
              Articles
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="https://www.aivortex.io/legal/claude-mythos/"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                Claude Mythos &amp; Law Firms
              </Link>
              <Link
                href="https://www.aivortex.io/legal/5-levels/"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                5 Levels of Legal AI
              </Link>
              <Link
                href="https://www.aivortex.io/legal/sequoia-line/"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                Sequoia&apos;s Revenue Line
              </Link>
              <Link
                href="https://www.aivortex.io/legal/paralegal-split/"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                The Paralegal Split
              </Link>
              <Link
                href="https://www.aivortex.io/legal/next-lawyer/"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                The Next Lawyer
              </Link>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-white/50 mb-4">
              Connect
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:manuel@aivortex.io"
                className="text-[15px] font-bold text-[#0066FF] hover:text-[#4d94ff] transition-colors flex items-center gap-2"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                manuel@aivortex.io
              </a>
              <a
                href="https://www.linkedin.com/in/aivortex/"
                target="_blank"
                rel="noopener"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit"
                target="_blank"
                rel="noopener"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                Book a Call
              </a>
              <Link
                href="https://www.aivortex.io/legal/sitemap/"
                className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center border-t border-white/[0.06] pt-5 gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/av-logo-white.png" alt="AV" width={20} height={16} className="opacity-40" />
            <span className="text-[13px] font-bold text-white/40 tracking-[0.05em]">
              AI VORTEX
            </span>
          </div>
          <div className="text-[12px] text-white/20">
            &copy; 2026 AI Vortex by Manu Ayala. Data:{" "}
            <a
              href="https://www.damiencharlotin.com/hallucinations/"
              target="_blank"
              rel="noopener"
              className="hover:text-white/40 transition-colors underline"
            >
              Charlotin Tracker
            </a>{" "}
            + public records.
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
