import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Geolocation stays enabled on our own origin (rescue map); the rest is
  // unused by the app and denied to every frame.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  // Ignored over plain HTTP by spec, so local dev is unaffected.
  {
    key: "Strict-Transport-Security",
    value: "max-age=15552000; includeSubDomains",
  },
];

// Dev-only allowance for the public hostname (e.g. a Cloudflare tunnel), so the
// dev server serves its own assets to that origin instead of blocking them.
const siteHostname = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  allowedDevOrigins: siteHostname ? [siteHostname] : undefined,
  // The media route reads from storage/, so tracing would otherwise copy every
  // upload into .next/standalone. That copy blocks the junction made by
  // scripts/standalone.ts, so new uploads land in a folder the next build wipes.
  outputFileTracingExcludes: { "/**/*": ["./storage/**/*"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
