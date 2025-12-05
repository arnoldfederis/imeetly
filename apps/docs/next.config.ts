import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["aimeetly.dev", "*.aimeetly.dev"],
  reactCompiler: true,
  transpilePackages: ["@shared/web-ui", "@shared/rpc"],
};

export default nextConfig;
