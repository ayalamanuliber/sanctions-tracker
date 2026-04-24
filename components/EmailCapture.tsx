"use client";

import { useState } from "react";

interface Props {
  answers: Record<string, boolean>;
}

export default function EmailCapture({ answers }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (Object.keys(answers).length < 3) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Enter a valid email");
      return;
    }
    // Placeholder: store client-side until backend is wired.
    // Replace with real POST (Kit / Beehiiv / Mailchimp / custom endpoint) later.
    try {
      const existing = JSON.parse(localStorage.getItem("sv_captures") || "[]") as string[];
      if (!existing.includes(trimmed)) existing.push(trimmed);
      localStorage.setItem("sv_captures", JSON.stringify(existing));
      localStorage.setItem("sv_last_email", trimmed);
    } catch {}
    setSubmitted(true);
    setError(null);
  }

  return (
    <section className="section">
      <div className="wrap">
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--blue)",
            padding: "40px 44px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--blue)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ width: "5px", height: "5px", background: "var(--blue)" }}></span>
            Intelligence Feed
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 500,
              color: "var(--text-100)",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              marginBottom: "14px",
            }}
          >
            Get your audit + <span style={{ fontStyle: "italic", color: "var(--blue)" }}>future sanction alerts</span>.
          </h2>
          <p
            style={{
              color: "var(--text-400)",
              fontSize: "14px",
              lineHeight: 1.65,
              fontWeight: 300,
              maxWidth: "520px",
              margin: "0 auto 24px",
            }}
          >
            New sanctions hit the docket weekly. We send a short note the moment a ruling lands in your jurisdiction or matches one of your gaps. No spam.
          </p>

          {submitted ? (
            <div
              style={{
                padding: "18px 22px",
                border: "1px solid rgba(34,197,94,0.3)",
                background: "rgba(34,197,94,0.06)",
                color: "#22c55e",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              ✓ You&rsquo;re on the list.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                gap: "8px",
                maxWidth: "480px",
                margin: "0 auto",
                flexWrap: "wrap",
              }}
            >
              <input
                type="email"
                placeholder="attorney@firm.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                required
                style={{
                  flex: 1,
                  minWidth: "220px",
                  padding: "14px 16px",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                  color: "var(--text-100)",
                  fontFamily: "var(--font-main)",
                  fontSize: "14px",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blue)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <button
                type="submit"
                className="hero-btn-primary"
                style={{ padding: "14px 22px", fontSize: "11px", border: "none", cursor: "pointer" }}
              >
                Get Alerts
                <span className="arrow-line"></span>
              </button>
            </form>
          )}

          {error && !submitted && (
            <div
              style={{
                marginTop: "12px",
                color: "var(--red-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.08em",
              }}
            >
              {error}
            </div>
          )}

          {!submitted && (
            <p
              style={{
                marginTop: "18px",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--text-600)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Free &middot; Unsubscribe anytime
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
