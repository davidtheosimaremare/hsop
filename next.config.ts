import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer', 'puppeteer-core'],
  experimental: {
    serverActions: {
      bodySizeLimit: '1024mb',
    },
    staleTimes: {
      // Both set to 0: the client-side router cache will NEVER serve stale data.
      // This prevents the "spinning forever" issue after the user is idle for a while,
      // because the browser won't try to revalidate a stale cached RSC payload.
      dynamic: 0,
      static: 0,
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.hokiindo.co.id',
      },
    ],
  },
  // Prevent browser from aggressively caching HTML pages
  // while still allowing Next.js to cache static assets (JS, CSS, images)
  async headers() {
    return [
      {
        // Apply to all page routes (not static assets)
        source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif)).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
};

export default nextConfig;
