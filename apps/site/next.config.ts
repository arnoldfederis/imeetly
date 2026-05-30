import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["imeetly.dev", "*.imeetly.dev"],
  output: "standalone",
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.producthunt.com" },
      { protocol: "https", hostname: "**.imeetly.app" },
    ],
  },
};

export default nextConfig;
