"use client";

import { ArrowLeft, Check, Printer, Share2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ReportBrand, ReportTier } from "@/lib/reporting";
import styles from "./report-preview.module.css";

interface ReportPreviewToolbarProps {
  backHref: string;
  backLabel?: string;
  tier: ReportTier;
  title: string;
}

export function ReportPreviewToolbar({
  backHref,
  backLabel = "Back",
  tier,
  title,
}: ReportPreviewToolbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  function setTier(nextTier: ReportTier) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tier", nextTier);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setBrand(nextBrand: ReportBrand) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tier", "premium");
    params.set("brand", nextBrand);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const brand = (searchParams.get("brand") || "personal") as ReportBrand;

  async function shareReport() {
    const shareData = { title, url: window.location.href };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className={styles.toolbar}>
      <Link className={styles.backLink} href={backHref}>
        <ArrowLeft size={16} />
        {backLabel}
      </Link>

      <div className={styles.actions}>
        <div className={styles.tierToggle} aria-label="Report packaging preview">
          <span>Preview</span>
          <button
            aria-pressed={tier === "free"}
            className={tier === "free" ? styles.activeTier : undefined}
            onClick={() => setTier("free")}
            type="button"
          >
            Free
          </button>
          <button
            aria-pressed={tier === "premium"}
            className={tier === "premium" ? styles.activeTier : undefined}
            onClick={() => setTier("premium")}
            type="button"
          >
            Pro
          </button>
        </div>

        {tier === "premium" && (
          <div className={styles.brandToggle} aria-label="Pro branding example">
            <span>Pro example</span>
            {(["personal", "firm", "chambers"] as ReportBrand[]).map((option) => (
              <button
                aria-pressed={brand === option}
                className={brand === option ? styles.activeTier : undefined}
                key={option}
                onClick={() => setBrand(option)}
                type="button"
              >
                {option === "personal" ? "Clean" : option === "firm" ? "Firm" : "Chambers"}
              </button>
            ))}
          </div>
        )}

        <button className={styles.secondaryAction} onClick={shareReport} type="button">
          {copied ? <Check size={16} /> : <Share2 size={16} />}
          {copied ? "Link copied" : "Send for review"}
        </button>
        <button className={styles.primaryAction} onClick={() => window.print()} type="button">
          <Printer size={16} />
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}
