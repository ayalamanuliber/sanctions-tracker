"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ThreatStats from "@/components/ThreatStats";
import SanctionsMap from "@/components/SanctionsMap";
import EscalationCurve from "@/components/EscalationCurve";
import RiskAssessment from "@/components/RiskAssessment";
import ResultsMirror from "@/components/ResultsMirror";
import Insights from "@/components/Insights";
import PolicyRecommendations from "@/components/PolicyRecommendations";
import JurisdictionRequirements from "@/components/JurisdictionRequirements";
import CaseEvidence from "@/components/CaseEvidence";
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

  // Decode shared results from URL hash
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

  // Update URL hash when answers change
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
      <Hero />
      <ThreatStats />
      <SanctionsMap onStateClick={(st) => {
        setStateFilter(st);
        setTimeout(() => {
          document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }} />
      <EscalationCurve />
      <RiskAssessment answers={answers} setAnswers={setAnswers} />
      <ResultsMirror answers={answers} />
      <Insights />
      <PolicyRecommendations answers={answers} />
      <JurisdictionRequirements />
      <CaseEvidence answers={answers} stateFilter={stateFilter} onClearStateFilter={() => setStateFilter(null)} />
      <Footer />
    </div>
  );
}
