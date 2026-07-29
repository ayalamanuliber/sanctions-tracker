import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? "/legal-ai-risk";

const nextConfig: NextConfig = {
  basePath,
  // Keep the canonical public URLs slashless. This is explicit because the
  // tracker is deployed below a base path and shared URLs with a trailing
  // slash must resolve to the same record rather than a 404.
  trailingSlash: false,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/cases/2026-07-16",
        destination: "/cases/badash-v-ohana-2026-07-16",
        permanent: true,
      },
      {
        source: "/cases/joann-ledoux-v-outliers-inc-2026-02-04",
        destination: "/cases/joann-ledoux-v-outliers-inc-2026-07-24",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/assets/entities/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
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
      },
    ];
  },
};

export default nextConfig;
