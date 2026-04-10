"use client";

import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <nav className="border-b border-white/[0.06] bg-[#050B14]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="https://www.aivortex.io/legal" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#004ACC] flex items-center justify-center shadow-lg shadow-[#0066FF]/20">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
              <path d="M8 5L11 7V11L8 13L5 11V7L8 5Z" fill="white" fillOpacity="0.3"/>
            </svg>
          </div>
          <Image
            src="/av-logo-white.png"
            alt="AI Vortex"
            width={24}
            height={19}
            className="opacity-60"
          />
          <span className="font-bold text-[13px] text-white/40 tracking-[0.05em]">AI VORTEX</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-[13px] text-white/40">
          <a href="#map" className="hover:text-white/80 transition-colors">Map</a>
          <a href="#assessment" className="hover:text-white/80 transition-colors">Assessment</a>
          <a href="#insights" className="hover:text-white/80 transition-colors">Insights</a>
          <a href="#jurisdiction" className="hover:text-white/80 transition-colors">Courts</a>
          <a href="#evidence" className="hover:text-white/80 transition-colors">Evidence</a>
        </div>
        <Link
          href="https://www.aivortex.io/legal"
          className="text-[13px] text-white/40 hover:text-white/80 transition-colors hidden sm:block"
        >
          aivortex.io &rarr;
        </Link>
      </div>
    </nav>
  );
}
