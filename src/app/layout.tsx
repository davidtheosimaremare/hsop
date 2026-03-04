import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import ChatWidget from "@/components/chat/ChatWidget";

import "./globals.css";
import "@/styles/nprogress.css";
import { CartProvider } from "@/lib/useCart";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { AuthProvider } from "@/components/auth/CanAccess";


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shop Hokiindo - Distributor Siemens Electrical Indonesia",
  description: "Shop Hokiindo adalah distributor resmi produk Siemens Electrical di Indonesia. Temukan berbagai produk electrical berkualitas tinggi untuk kebutuhan proyek Anda.",
};

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
            {children}
            <ChatWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
