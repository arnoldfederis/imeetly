import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["imeetly.dev", "*.imeetly.dev"],
  images: {
    remotePatterns: [new URL("https://lh3.googleusercontent.com/**")],
  },
  output: "standalone",
  reactCompiler: true,
};

export default nextConfig;
