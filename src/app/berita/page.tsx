// Berita list: Suspense handles loading state, no need for force-dynamic

import { Suspense } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import NewsContent from "./NewsContent";

export default function NewsPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1">
                <Suspense fallback={
                    <div className="min-h-screen bg-white flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-500">Memuat berita...</p>
                        </div>
                    </div>
                }>
                    <NewsContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
