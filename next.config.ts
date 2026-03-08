import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer', 'puppeteer-core'],
  experimental: {
    serverActions: {
      bodySizeLimit: '1024mb',
    },
  },
};

export default nextConfig;
