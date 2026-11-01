import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js"],
  // Pass images are rendered with these fonts on the server (read from disk, not served).
  outputFileTracingIncludes: { "/*": ["./public/fonts/*.ttf"] },
};

export default nextConfig;
