"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f9fc", color: "#183451", textAlign: "center" }}><div><strong>AI Vortex could not load this view.</strong><p style={{ color: "#64748b", margin: "10px 0 18px" }}>No conclusion should be drawn from an unavailable result.</p><button onClick={reset} style={{ border: 0, background: "#08264d", color: "white", padding: "10px 16px", fontWeight: 800 }}>Try again</button></div></main>;
}
