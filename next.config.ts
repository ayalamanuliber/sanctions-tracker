import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? "/legal-ai-risk";

const nextConfig: NextConfig = {
  basePath,
  poweredByHeader: false,
  async redirects() {
    return [{
      source: "/cases/2026-07-16",
      destination: "/cases/badash-v-ohana-2026-07-16",
      permanent: true,
    }];
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self' mailto:",
          ].join("; "),
        },
      ],
    }];
  },
};

export default nextConfig;
