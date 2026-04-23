import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import ChatWidget from "@/components/chat/ChatWidget";
import CookieConsent from "@/components/layout/CookieConsent";
import HeadScripts from "@/components/layout/HeadScripts";
import DynamicFont from "@/components/layout/DynamicFont";

import "./globals.css";
import "@/styles/nprogress.css";
import { CartProvider } from "@/lib/useCart";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { AuthProvider } from "@/components/auth/CanAccess";


import { getSiteSetting } from "@/app/actions/settings";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const companyDetails = await getSiteSetting("company_details") as any;
  const siteTitle = companyDetails?.siteTitle || companyDetails?.name || "Hokiindoshop";
  const tagline = companyDetails?.siteTagline || "Distributor Siemens Electrical Indonesia";
  
  // Ambil verifikasi SEO
  const seoVerification = await getSiteSetting("seo_verification") as Record<string, string> | null;
  const googleVerification = seoVerification?.google || undefined;
  const bingVerification = seoVerification?.bing || undefined;
  
  return {
    metadataBase: new URL('https://shop.hokiindo.co.id'),
    title: {
      template: `%s | ${siteTitle}`,
      default: `${siteTitle} - ${tagline}`,
    },
    description: companyDetails?.description || `${siteTitle} adalah distributor resmi produk Siemens Electrical di Indonesia. Temukan berbagai produk electrical berkualitas tinggi untuk kebutuhan proyek Anda.`,
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      siteName: siteTitle,
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: [
        { url: companyDetails?.favicon || "/favicon.ico", type: "image/x-icon" },
        { url: "/logo-H.png", type: "image/png" },
      ],
      apple: [
        { url: "/apple-icon.png" },
      ],
    },
    verification: {
      google: googleVerification,
      other: bingVerification ? { 'msvalidate.01': bingVerification } : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <NextTopLoader color="#dc2626" showSpinner={false} />
        <Toaster position="top-right" richColors />
        <AuthProvider>
          <CartProvider>
            <HeadScripts />
            <DynamicFont />
            {children}
            <ChatWidget />
            <CookieConsent />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
