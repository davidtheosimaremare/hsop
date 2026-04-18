import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer', 'puppeteer-core'],
  experimental: {
    serverActions: {
      bodySizeLimit: '1024mb',
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    localPatterns: [
      {
        pathname: '/api/image',
        search: '?url=**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.hokiindo.co.id',
      },
    ],
  },
};

export default nextConfig;
