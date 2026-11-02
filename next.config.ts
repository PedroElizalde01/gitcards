import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js"],
  // Pass images are rendered with these fonts on the server (read from disk, not served).
  outputFileTracingIncludes: { "/*": ["./public/fonts/*.ttf"] },
  // No framing anywhere: stops clickjacking of "Delete my data" and the Wallet button.
  headers: async () => [{ source: "/:path*", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" }, { key: "X-Frame-Options", value: "DENY" }] }],
};

export default nextConfig;
