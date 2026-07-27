import Link from "next/link";

export default function NotFound() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#071a32", color: "white", textAlign: "center" }}><div><span style={{ color: "#f0a11a", fontWeight: 800, letterSpacing: ".12em" }}>RECORD NOT FOUND</span><h1 style={{ fontFamily: "Georgia, serif", fontSize: 44, margin: "18px 0 12px" }}>That page is not in the public corpus.</h1><p style={{ color: "#b8c6d8", maxWidth: 560 }}>The link may be outdated, or the record may not exist. Search the full corpus instead of relying on a missing result.</p><Link href="/cases" style={{ display: "inline-block", marginTop: 24, padding: "12px 18px", background: "#f0a11a", color: "#071a32", fontWeight: 800, textDecoration: "none" }}>Search public records</Link></div></main>;
}
