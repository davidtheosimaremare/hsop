import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";

export default function GlobalLoading() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pointer-events-none">
            <SiteHeader />

            <main className="flex-1 w-full relative flex items-center justify-center min-h-[50vh]">
                {/* Visual loading indicator (Top Bar) */}
                <div className="absolute top-0 left-0 w-full h-1">
                    <div className="h-full bg-red-600 animate-[loading-bar_1.5s_ease-in-out_infinite]" style={{ transformOrigin: '0% 50%' }}></div>
                </div>

                {/* Center Loading Spinner */}
                <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-red-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 animate-pulse">Memuat halaman, mohon tunggu...</p>
                </div>

                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes loading-bar {
                        0% { transform: scaleX(0); opacity: 1; }
                        50% { transform: scaleX(1); opacity: 1; }
                        100% { transform: scaleX(1); opacity: 0; }
                    }
                `}} />
            </main>

            <Footer />
        </div>
    );
}
