import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import ChatWidget from "@/components/chat/ChatWidget";

import "./globals.css";
import "@/styles/nprogress.css";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";
import { CartProvider } from "@/lib/useCart";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/layout/NavigationProgress";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shop Hokiindo - Distributor Siemens Electrical Indonesia",
  description: "Shop Hokiindo adalah distributor resmi produk Siemens Electrical di Indonesia. Temukan berbagai produk electrical berkualitas tinggi untuk kebutuhan proyek Anda.",
  icons: {
    icon: "/logo-H.png",
    shortcut: "/logo-H.png",
    apple: "/logo-H.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <NextTopLoader color="#dc2626" showSpinner={false} />
        <Toaster position="top-right" richColors />
        <CartProvider>
          {children}
          <FloatingWhatsApp />
          <ChatWidget />
        </CartProvider>
      </body>
    </html>
  );
}
