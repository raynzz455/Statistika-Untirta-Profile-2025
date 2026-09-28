import type { NextConfig } from "next";

/**
 * Next.js Configuration for Statistika '25 Untirta Profile
 *
 * Key settings:
 * - output: "standalone" — produces self-contained build for Vercel/Docker
 * - typescript.ignoreBuildErrors: false — fail build on TS errors (was true)
 * - reactStrictMode: true — was false
 * - headers: security headers (CSP, X-Frame-Options, HSTS, etc.)
 *
 * Reference: SECURITY_AUDIT.md (V-05, V-06, V-07)
 */
const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // V-06 FIX: was true — TypeScript errors should fail production build
    ignoreBuildErrors: false,
  },
  // V-07 FIX: was false — Strict mode catches unsafe lifecycle, deprecated APIs
  reactStrictMode: true,
  // Async headers function — security headers applied to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // === Security Headers (per SECURITY_AUDIT.md V-05) ===
          // Prevent clickjacking — don't allow this site to be embedded in iframes
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-sniffing — browser must respect declared Content-Type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Only send origin for cross-origin requests (not full URL)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable device access (camera, mic, geolocation)
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // HTTPS Strict Transport Security — 2 years, include subdomains, ready for preload list
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Content Security Policy — restricts where resources can load from
          // Adjust connect-src to allow Supabase + Vercel analytics
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Allow inline scripts/styles (Next.js needs them for hydration)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              // Allow images from self, data:, and https: (Supabase storage)
              "img-src 'self' data: https:",
              // Allow fonts from self and data:
              "font-src 'self' data:",
              // Allow XHR/fetch to self and Supabase API
              "connect-src 'self' https://*.supabase.co https://api.supabase.com",
              // Allow form submissions only to self
              "form-action 'self'",
              // Allow base tag only from self
              "base-uri 'self'",
              // Block object/embed tags
              "object-src 'none'",
              // Frame-ancestors none = same as X-Frame-Options: DENY
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      // === Public uploads — set caching headers ===
      {
        source: "/uploads/(.*)",
        headers: [
          // Cache for 1 year (immutable static assets)
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;

