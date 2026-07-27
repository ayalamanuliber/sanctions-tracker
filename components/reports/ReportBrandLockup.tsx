import Image from "next/image";
import { assetUrl } from "@/lib/site";
import { Scale } from "lucide-react";

import { REPORT_BRANDS, type ReportBrand, type ReportTier } from "@/lib/reporting";
import styles from "./report-brand-lockup.module.css";

export function ReportBrandLockup({
  brand,
  tier,
}: {
  brand: ReportBrand;
  tier: ReportTier;
}) {
  if (tier === "free") {
    return (
      <div className={styles.lockup}>
        <Image className={styles.vortexLogo} src={assetUrl("/av-logo-nav.png")} alt="AI Vortex" width={42} height={42} />
        <div>
          <strong>AI VORTEX</strong>
          <span>LEGAL AI RISK INTELLIGENCE</span>
        </div>
      </div>
    );
  }

  if (brand === "personal") {
    return (
      <div className={`${styles.lockup} ${styles.clean}`}>
        <span>CONFIDENTIAL WORKING COPY</span>
        <strong>Client-ready report</strong>
      </div>
    );
  }

  const profile = REPORT_BRANDS[brand];

  return (
    <div className={styles.lockup}>
      {brand === "firm" ? (
        <div className={`${styles.sampleMark} ${styles.firmMark}`} aria-hidden="true">HP</div>
      ) : (
        <div className={`${styles.sampleMark} ${styles.chambersMark}`} aria-hidden="true"><Scale size={23} /></div>
      )}
      <div>
        <strong>{profile.name}</strong>
        <span>{profile.descriptor}</span>
        <em>{brand === "firm" ? "Illustrative firm identity" : "Illustrative chambers identity"}</em>
      </div>
    </div>
  );
}
