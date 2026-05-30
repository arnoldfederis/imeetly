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
        source: "/integrations/:provider/callback",
        destination: `${process.env.NEXT_PUBLIC_APP_SERVER_URL}/integrations/:provider/callback`,
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
