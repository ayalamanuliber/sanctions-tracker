"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ThreatStats from "@/components/ThreatStats";
import SanctionsMap from "@/components/SanctionsMap";
import EscalationCurve from "@/components/EscalationCurve";
import RiskAssessment from "@/components/RiskAssessment";
import ResultsMirror from "@/components/ResultsMirror";
import Insights from "@/components/Insights";
import PolicyRecommendations from "@/components/PolicyRecommendations";
import CaseEvidence from "@/components/CaseEvidence";
import Footer from "@/components/Footer";

export default function SanctionsTracker() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <Hero />
      <ThreatStats />
      <SanctionsMap />
      <EscalationCurve />
      <RiskAssessment answers={answers} setAnswers={setAnswers} />
      <ResultsMirror answers={answers} />
      <Insights />
      <PolicyRecommendations />
      <CaseEvidence />
      <Footer />
    </div>
  );
}
