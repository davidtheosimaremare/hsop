import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer', 'puppeteer-core'],
  experimental: {
    serverActions: {
      // 50MB is sufficient for bulk product imports. 1024mb was dangerously high.
      bodySizeLimit: '50mb',
    },
    staleTimes: {
      // dynamic: 0 prevents stale auth state. static: 30 caches public pages
      // in the client router for 30s, improving navigation speed.
      dynamic: 0,
      static: 30,
    },
  },
  images: {
    unoptimized: process.env.NODE_ENV === "development", // Menonaktifkan optimasi di lokal (development) untuk mencegah TimeoutError, tetapi mengaktifkannya di server production agar website customer super kencang!
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.hokiindo.co.id',
      },
    ],
  },
  async headers() {
    return [
      {
        // Private/authenticated routes — never cache
        source: '/(admin|vendor|dashboard|api|masuk|daftar|keranjang|lupa-password|reset-password|verifikasi)(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        // Public pages (products, categories, news, homepage) — allow Google to cache
        // s-maxage=60: CDN caches for 60s, stale-while-revalidate=300: serve stale for 5min while refreshing
        source: '/((?!admin|vendor|dashboard|api|masuk|daftar|keranjang|lupa-password|reset-password|verifikasi|_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
          // Security headers
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/product/:slug',
        destination: '/produk/:slug',
        permanent: true,
      },
      {
        source: '/product/:slug/',
        destination: '/produk/:slug',
        permanent: true,
      },
      {
        source: '/cart',
        destination: '/keranjang',
        permanent: true,
      },
      {
        source: '/cart/',
        destination: '/keranjang',
        permanent: true,
      },
      {
        source: '/checkout',
        destination: '/keranjang',
        permanent: true,
      },
      {
        source: '/checkout/',
        destination: '/keranjang',
        permanent: true,
      },
      {
        source: '/checkout-2',
        destination: '/keranjang',
        permanent: true,
      },
      {
        source: '/checkout-2/',
        destination: '/keranjang',
        permanent: true,
      },
      {
        source: '/my-account',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/my-account/',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/shop',
        destination: '/pencarian',
        permanent: true,
      },
      {
        source: '/shop/',
        destination: '/pencarian',
        permanent: true,
      },
      {
        source: '/shop-2',
        destination: '/pencarian',
        permanent: true,
      },
      {
        source: '/shop-2/',
        destination: '/pencarian',
        permanent: true,
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
