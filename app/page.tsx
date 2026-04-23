"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ThreatStats from "@/components/ThreatStats";
import SanctionsMapV2 from "@/components/SanctionsMapV2";
import EscalationCurve from "@/components/EscalationCurve";
import RiskAssessment from "@/components/RiskAssessment";
import ResultsMirror from "@/components/ResultsMirror";
import AuditExport from "@/components/AuditExport";
import PolicyRecommendations from "@/components/PolicyRecommendations";
import Insights from "@/components/Insights";
import ProductLayer from "@/components/ProductLayer";
import ScarcityStrip from "@/components/ScarcityStrip";
import JurisdictionRequirements from "@/components/JurisdictionRequirements";
import CaseEvidence from "@/components/CaseEvidence";
import FinalClose from "@/components/FinalClose";
import Footer from "@/components/Footer";

function decodeHash(hash: string): Record<string, boolean> {
  try {
    const ids = [
      "written-ai-policy", "citation-verification", "paid-tool-verification",
      "attorney-training", "supervision-protocol", "ai-disclosure-protocol",
      "engagement-letter-ai", "approved-tools-list", "audit-trail", "incident-response",
    ];
    const decoded: Record<string, boolean> = {};
    const bits = hash.replace(/^#?r=/, "");
    if (bits.length !== ids.length) return {};
    ids.forEach((id, i) => {
      if (bits[i] === "1") decoded[id] = true;
      else if (bits[i] === "0") decoded[id] = false;
    });
    return decoded;
  } catch {
    return {};
  }
}

export default function SanctionsTracker() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [stateFilter, setStateFilter] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("r=")) {
      const decoded = decodeHash(window.location.hash);
      if (Object.keys(decoded).length > 0) {
        setAnswers(decoded);
        setTimeout(() => {
          document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" });
        }, 500);
      }
    }
  }, []);

  useEffect(() => {
    const ids = [
      "written-ai-policy", "citation-verification", "paid-tool-verification",
      "attorney-training", "supervision-protocol", "ai-disclosure-protocol",
      "engagement-letter-ai", "approved-tools-list", "audit-trail", "incident-response",
    ];
    const answeredCount = Object.keys(answers).length;
    if (answeredCount === ids.length) {
      const bits = ids.map((id) => (answers[id] ? "1" : "0")).join("");
      window.history.replaceState(null, "", `#r=${bits}`);
    }
  }, [answers]);

  return (
    <div className="min-h-screen">
      <Header />

      {/* 1 — HERO: immediate threat */}
      <Hero />

      {/* 2 — CONTEXT: what's happening */}
      <ThreatStats />

      {/* 3 — CREDIBILITY: this is real, here's where */}
      <SanctionsMapV2
        onStateClick={(st) => {
          setStateFilter(st);
          setTimeout(() => {
            document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }}
      />
      <EscalationCurve />

      {/* 4 — COURT SIMULATION (assessment) */}
      <RiskAssessment answers={answers} setAnswers={setAnswers} />

      {/* 5 — RESULTS + DECISION MOMENT (3-option force choice) */}
      <ResultsMirror answers={answers} />

      {/* 6 — AUDIT EXPORT: compliance document */}
      <AuditExport answers={answers} />

      {/* 7 — EXPOSURE BREAKDOWN (policy recs, per-card CTAs) */}
      <PolicyRecommendations answers={answers} />

      {/* 8 — INTELLIGENCE LAYER (what courts enforce) */}
      <Insights />

      {/* 9 — PRODUCT LAYER: tiered offers tied to gaps */}
      <ProductLayer answers={answers} />

      {/* 10 — SCARCITY */}
      <ScarcityStrip />

      {/* Proof / Reference layer */}
      <JurisdictionRequirements />
      <CaseEvidence answers={answers} stateFilter={stateFilter} onClearStateFilter={() => setStateFilter(null)} />

      {/* 11 — FINAL CLOSE */}
      <FinalClose />

      <Footer />
    </div>
  );
}
