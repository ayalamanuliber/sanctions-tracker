"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

export default function CopyViewButton() {
  const [copied, setCopied] = useState(false);

  async function copyView() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      data-analytics-event="report_share"
      data-analytics-target="copy_view"
      onClick={copyView}
      aria-live="polite"
    >
      {copied ? <Check /> : <Link2 />}
      {copied ? "Link copied" : "Copy view link"}
    </button>
  );
}
