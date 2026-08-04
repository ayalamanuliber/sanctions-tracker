import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const publicDir = path.join(root, "public");
const background = path.join(publicDir, "legal-ai-risk-social.png");
const logo = path.join(publicDir, "av-logo-white.png");
const output = path.join(publicDir, "legal-ai-risk-social-v2.png");

const overlay = Buffer.from(`
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#06172c" stop-opacity="0.99"/>
      <stop offset="0.48" stop-color="#071a32" stop-opacity="0.95"/>
      <stop offset="0.72" stop-color="#071a32" stop-opacity="0.36"/>
      <stop offset="1" stop-color="#071a32" stop-opacity="0.04"/>
    </linearGradient>
    <linearGradient id="bottom" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#071a32" stop-opacity="0"/>
      <stop offset="1" stop-color="#06172c" stop-opacity="0.84"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#shade)"/>
  <rect y="470" width="1200" height="160" fill="url(#bottom)"/>
  <rect x="68" y="154" width="238" height="32" rx="16" fill="#0e2b4d" stroke="#2e5b87"/>
  <circle cx="87" cy="170" r="5" fill="#35d98a"/>
  <text x="101" y="175" fill="#d6e5f4" font-family="Arial, Helvetica, sans-serif" font-size="12.5" font-weight="700" letter-spacing="1.5">PUBLIC EVIDENCE LAYER</text>

  <text x="68" y="258" fill="#f7fafc" font-family="Georgia, 'Times New Roman', serif" font-size="55" font-weight="700">Prepare your next move</text>
  <text x="68" y="325" fill="#f2a51a" font-family="Georgia, 'Times New Roman', serif" font-size="55" font-weight="700">with evidence you can trace.</text>

  <text x="70" y="382" fill="#c3d1df" font-family="Arial, Helvetica, sans-serif" font-size="22">Search cases. Inspect sources. Compare courts. Share the record.</text>

  <g font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" letter-spacing="1.2">
    <rect x="68" y="428" width="102" height="34" rx="6" fill="#0b2441" stroke="#31597d"/>
    <text x="89" y="450" fill="#d7e4f1">CASES</text>
    <rect x="182" y="428" width="108" height="34" rx="6" fill="#0b2441" stroke="#31597d"/>
    <text x="201" y="450" fill="#d7e4f1">COURTS</text>
    <rect x="302" y="428" width="120" height="34" rx="6" fill="#0b2441" stroke="#31597d"/>
    <text x="321" y="450" fill="#d7e4f1">SOURCES</text>
    <rect x="434" y="428" width="130" height="34" rx="6" fill="#0b2441" stroke="#31597d"/>
    <text x="452" y="450" fill="#d7e4f1">PATTERNS</text>
  </g>

  <line x1="68" x2="1132" y1="532" y2="532" stroke="#33506d" stroke-opacity="0.7"/>
  <text x="68" y="577" fill="#f4f7fa" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="1">aivortex.io/legal-ai-risk</text>
  <text x="1132" y="577" text-anchor="end" fill="#9bb0c5" font-family="Arial, Helvetica, sans-serif" font-size="15">Source-linked legal AI intelligence</text>
</svg>`);

await sharp(background)
  .resize(1200, 630, { fit: "cover" })
  .composite([
    { input: overlay, left: 0, top: 0 },
    {
      input: await sharp(logo).resize({ width: 62, height: 51, fit: "contain" }).png().toBuffer(),
      left: 68,
      top: 58,
    },
    {
      input: Buffer.from(`
        <svg width="330" height="70" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="27" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="800" letter-spacing="2.4">AI VORTEX</text>
          <text x="0" y="52" fill="#f2a51a" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700" letter-spacing="2.2">LEGAL AI RISK INTELLIGENCE</text>
        </svg>`),
      left: 145,
      top: 60,
    },
  ])
  .png({ compressionLevel: 9, palette: false })
  .toFile(output);

console.log(output);
