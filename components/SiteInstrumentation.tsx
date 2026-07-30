"use client";

import { Analytics } from "@vercel/analytics/next";
import { track as trackVercel } from "@vercel/analytics";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { useEffect } from "react";

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-3NT67L5FK9";
const SESSION_EVENT_KEY = "aivortex_tracker_session_started";

type EventValue = string | number | boolean;
type EventProperties = Record<string, EventValue | undefined>;

declare global {
  interface Window {
    aivortexAnalyticsQueue?: Array<
      [name: string, properties: Record<string, EventValue>]
    >;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    aivortexGaInitialized?: boolean;
  }
}

function pageCategory(pathname: string) {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  if (path.endsWith("/legal-ai-risk") || path === "/") return "tracker_home";
  if (path.includes("/cases/") && path.endsWith("/brief")) return "case_brief";
  if (path.includes("/cases/")) return "case_detail";
  if (path.endsWith("/cases")) return "case_directory";
  if (path.includes("/judges/") && path.endsWith("/report")) return "judge_report";
  if (path.includes("/judges/")) return "judge_profile";
  if (path.endsWith("/judges")) return "judge_directory";
  if (path.includes("/courts/") && path.endsWith("/report")) return "court_report";
  if (path.includes("/courts/")) return "court_profile";
  if (path.endsWith("/courts")) return "court_directory";
  if (path.includes("/tools/") && path.endsWith("/report")) return "tool_report";
  if (path.includes("/tools/")) return "tool_profile";
  if (path.endsWith("/tools")) return "tool_directory";
  if (path.includes("/countries/")) return "country_profile";
  if (path.endsWith("/countries")) return "country_directory";
  if (path.includes("/states/")) return "state_profile";
  if (path.endsWith("/states")) return "state_directory";
  if (path.includes("/failure-modes/")) return "failure_mode_profile";
  if (path.includes("/consequences/")) return "consequence_profile";
  if (path.endsWith("/analytics/print")) return "analytics_report";
  if (path.endsWith("/analytics")) return "analytics";
  if (path.endsWith("/map")) return "map";
  if (path.includes("/artifact/print")) return "artifact_report";
  if (path.includes("/workflows/")) return "workflow_tool";
  if (path.endsWith("/workflows")) return "workflow_directory";
  return "tracker_page";
}

function referrerType() {
  const source = (() => {
    try {
      const utm = new URLSearchParams(window.location.search)
        .get("utm_source")
        ?.toLowerCase();
      return utm || document.referrer.toLowerCase();
    } catch {
      return "";
    }
  })();

  if (!source) return "direct";
  if (
    [
      "chatgpt",
      "openai",
      "perplexity",
      "claude",
      "anthropic",
      "copilot",
      "gemini",
      "bard",
      "notebooklm",
    ].some((name) => source.includes(name))
  ) {
    return "ai";
  }
  if (
    ["google", "bing", "duckduckgo", "yahoo", "brave"].some((name) =>
      source.includes(name),
    )
  ) {
    return "search";
  }
  if (source.includes("linkedin")) return "linkedin";
  return "referral";
}

function deviceType() {
  if (window.matchMedia("(max-width: 640px)").matches) return "mobile";
  if (window.matchMedia("(max-width: 1024px)").matches) return "tablet";
  return "desktop";
}

function cleanProperties(properties: EventProperties) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 100) : value,
      ]),
  ) as Record<string, EventValue>;
}

function eventContext(properties: EventProperties = {}) {
  return cleanProperties({
    page_category: pageCategory(window.location.pathname),
    source_path: window.location.pathname,
    device_type: deviceType(),
    referrer_type: referrerType(),
    ...properties,
  });
}

export function trackProductEvent(
  name: string,
  properties: EventProperties = {},
) {
  if (typeof window === "undefined") return;
  const payload = eventContext(properties);
  if (window.location.hostname === "localhost") {
    document.documentElement.dataset.lastAnalyticsEvent = name;
  }

  try {
    if (window.gtag) {
      window.gtag("event", name, payload);
    } else {
      window.aivortexAnalyticsQueue =
        window.aivortexAnalyticsQueue || [];
      window.aivortexAnalyticsQueue.push([name, payload]);
    }
  } catch {
    // Analytics must never interrupt the product experience.
  }

  try {
    trackVercel(name, payload);
  } catch {
    // Vercel Analytics can be unavailable in local development or blocked.
  }
}

function sanitizedEvent<T extends { url: string }>(event: T): T {
  try {
    const url = new URL(event.url, window.location.origin);
    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    return event;
  }
}

function destinationDetails(rawHref: string) {
  try {
    const url = new URL(rawHref, window.location.href);
    return {
      destination_path: url.origin === window.location.origin ? url.pathname : undefined,
      destination_host:
        url.origin === window.location.origin ? undefined : url.hostname,
      is_external: url.origin !== window.location.origin,
      url,
    };
  } catch {
    return {
      destination_path: undefined,
      destination_host: undefined,
      is_external: false,
      url: null,
    };
  }
}

function linkEvent(element: HTMLElement, href: string) {
  const normalizedText = [
    element.textContent || "",
    element.getAttribute("aria-label") || "",
    element.getAttribute("title") || "",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const { url } = destinationDetails(href);
  const path = url?.pathname.toLowerCase() || "";
  const host = url?.hostname.toLowerCase() || "";

  if (href.startsWith("mailto:") || normalizedText.includes("email")) {
    return "email_contact";
  }
  if (host.includes("linkedin.com")) return "linkedin_click";
  if (
    normalizedText.includes("upgrade") ||
    normalizedText.includes("request access") ||
    href.includes("#subscribe")
  ) {
    return "upgrade_click";
  }
  if (
    path.includes("/brief") ||
    path.includes("/report") ||
    path.includes("/artifact/print") ||
    path.includes("/analytics/print")
  ) {
    return "report_open";
  }
  if (/\/cases\/[^/]+/.test(path)) return "case_open";
  if (/\/judges\/[^/]+/.test(path)) return "judge_open";
  if (/\/courts\/[^/]+/.test(path)) return "court_open";
  if (/\/tools\/[^/]+/.test(path)) return "ai_tool_open";
  if (
    /\/(countries|states|failure-modes|consequences)\/[^/]+/.test(path)
  ) {
    return "entity_open";
  }
  if (
    normalizedText.includes("source") ||
    normalizedText.includes("docket") ||
    normalizedText.includes("order") ||
    normalizedText.includes("opinion") ||
    normalizedText.includes("filing") ||
    host.includes("courtlistener") ||
    host.includes("uscourts") ||
    host.includes("gov")
  ) {
    return "source_open";
  }
  if (normalizedText.includes("download")) return "artifact_download";
  if (url && url.origin !== window.location.origin) return "external_link_click";
  return null;
}

function buttonEvent(element: HTMLElement) {
  const text = [
    element.textContent || "",
    element.getAttribute("aria-label") || "",
    element.getAttribute("title") || "",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (text.includes("print") || text.includes("save pdf")) return null;
  if (
    text.includes("share") ||
    text.includes("send for review") ||
    text.includes("copy view link") ||
    text.includes("copy shareable link") ||
    text.includes("copy link")
  ) {
    return "report_share";
  }
  if (text.includes("download")) return "artifact_download";
  if (text.includes("email")) return "email_contact";
  if (text.includes("upgrade") || text.includes("request access")) {
    return "upgrade_click";
  }
  if (
    text.includes("apply filter") ||
    element.closest('[aria-label*="filter" i]')
  ) {
    return "filter_apply";
  }
  if (text.includes("search") && element.getAttribute("type") !== "submit") {
    return "search_entry_click";
  }
  if (
    element.closest('[aria-label*="map" i]') ||
    element.closest("svg[aria-labelledby*='map']")
  ) {
    return "map_select";
  }
  if (element.getAttribute("aria-pressed") !== null) {
    return "view_option_change";
  }
  return null;
}

function explicitEvent(element: HTMLElement) {
  return (
    element.getAttribute("data-analytics-event") ||
    element.getAttribute("data-aivx-event")
  );
}

function activeFilterCount(form: HTMLFormElement) {
  const ignored = new Set(["q", "page", "sort", "order"]);
  const defaults = new Set(["", "all"]);
  let count = 0;

  new FormData(form).forEach((rawValue, key) => {
    if (ignored.has(key) || typeof rawValue !== "string") return;
    const value = rawValue.trim().toLowerCase();
    if (!defaults.has(value)) count += 1;
  });

  return count;
}

function initializeGoogleAnalytics() {
  if (window.aivortexGaInitialized) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      // Google Analytics expects its command arguments object in dataLayer.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    anonymize_ip: true,
  });
  (window.aivortexAnalyticsQueue || []).forEach(([name, properties]) => {
    window.gtag?.("event", name, properties);
  });
  window.aivortexAnalyticsQueue = [];
  window.aivortexGaInitialized = true;
  if (window.location.hostname === "localhost") {
    document.documentElement.dataset.analyticsReady = "ga4-vercel";
  }
}

export default function SiteInstrumentation() {
  useEffect(() => {
    initializeGoogleAnalytics();

    try {
      if (!sessionStorage.getItem(SESSION_EVENT_KEY)) {
        sessionStorage.setItem(SESSION_EVENT_KEY, "1");
        trackProductEvent("tracker_session_start", {
          entry_category: pageCategory(window.location.pathname),
        });
      }
    } catch {
      trackProductEvent("tracker_session_start", {
        entry_category: pageCategory(window.location.pathname),
      });
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const element = target.closest<HTMLElement>(
        "[data-analytics-event], [data-aivx-event], a, button, [role='button']",
      );
      if (!element) return;

      const explicit = explicitEvent(element);
      const href = element.getAttribute("href") || "";
      const name = explicit || (href ? linkEvent(element, href) : buttonEvent(element));
      if (!name) return;

      const destination = href ? destinationDetails(href) : null;
      trackProductEvent(name, {
        target_type:
          element.getAttribute("data-analytics-target") ||
          (href ? "link" : "button"),
        destination_path: destination?.destination_path,
        destination_host: destination?.destination_host,
        is_external: destination?.is_external,
      });
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const formData = new FormData(form);
      const hasQuery = Boolean(String(formData.get("q") || "").trim());
      const filters = activeFilterCount(form);
      trackProductEvent(hasQuery ? "search_submit" : "filter_apply", {
        has_query: hasQuery,
        filter_count: filters,
      });
    };

    let lastPrintAt = 0;
    const handlePrint = () => {
      const now = Date.now();
      if (now - lastPrintAt < 1500) return;
      lastPrintAt = now;
      trackProductEvent("report_print", {
        report_type: pageCategory(window.location.pathname),
      });
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("beforeprint", handlePrint);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("beforeprint", handlePrint);
    };
  }, []);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={initializeGoogleAnalytics}
        onReady={initializeGoogleAnalytics}
      />
      <Analytics beforeSend={sanitizedEvent} />
      <SpeedInsights beforeSend={sanitizedEvent} />
    </>
  );
}
