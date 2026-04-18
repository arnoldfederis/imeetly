import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["imeetly.dev", "*.imeetly.dev"],
  images: {
    remotePatterns: [new URL("https://lh3.googleusercontent.com/**")],
  },
  output: "standalone",
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
