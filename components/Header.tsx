"use client";

import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <nav className="border-b border-white/[0.06] bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="https://www.aivortex.io/legal" className="flex items-center gap-2.5">
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
