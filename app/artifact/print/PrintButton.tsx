"use client";

export default function PrintButton() {
  return (
    <button
      className="print-button"
      style={{ border: "1px solid #111827", background: "#111827", color: "#fff", padding: "9px 12px", fontWeight: 800 }}
      onClick={() => window.print()}
    >
      Print / Save PDF
    </button>
  );
}
