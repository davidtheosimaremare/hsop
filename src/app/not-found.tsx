import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import { getSiteSetting } from "@/app/actions/settings";
import { Home, Search, MessageSquare, AlertTriangle } from "lucide-react";

export default async function NotFound() {
    // Ambil konfigurasi WhatsApp dinamis dari setting website
    const waConfig = await getSiteSetting("whatsapp_config") as Record<string, string> | null;
    const waNumber = waConfig?.number || "+628111223344"; // Fallback default
    const waMessage = waConfig?.message || "Halo Hokiindo Raya, saya mengalami kendala link terputus (404) di website dan membutuhkan bantuan.";
    const waUrl = `https://wa.me/${waNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waMessage)}`;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
            {/* Header Utama */}
            <SiteHeader />

            {/* Konten Utama 404 */}
            <main className="flex-grow flex items-center justify-center px-6 py-16 md:py-24">
                <div className="max-w-xl w-full text-center space-y-8 bg-white/70 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100">
                    
                    {/* Ilustrasi Kelistrikan / Lampu Tambang Kreatif */}
                    <div className="relative flex justify-center items-center">
                        {/* Glow Effect belakang */}
                        <div className="absolute w-32 h-32 bg-red-100 rounded-full filter blur-xl opacity-70 animate-pulse"></div>
                        
                        {/* Custom SVG: Broken Light Bulb (Kelistrikan theme) */}
                        <svg 
                            className="w-28 h-28 text-red-600 relative z-10 animate-bounce" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            strokeWidth={1.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8M12 3a7 7 0 00-6.9 8.1 4.5 4.5 0 002.5 4.2h8.8a4.5 4.5 0 002.5-4.2A7 7 0 0012 3zm0 11V5" />
                        </svg>

                        {/* Petir / Spark kecil melayang */}
                        <div className="absolute top-1 right-20 text-yellow-500 animate-pulse text-2xl font-bold">⚡</div>
                        <div className="absolute bottom-6 left-24 text-red-400 animate-ping text-xl">✨</div>
                    </div>

                    <div className="space-y-3">
                        <span className="text-sm font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                            Error 404 - Halaman Tidak Ditemukan
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Oops! Sambungan Terputus
                        </h1>
                        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                            Maaf, halaman yang Anda tuju tidak tersedia, telah dihapus, atau sambungan URL lama dari WordPress dipindahkan.
                        </p>
                    </div>

                    {/* Tombol Aksi Premium */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                        <Link 
                            href="/" 
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/20 text-sm"
                        >
                            <Home className="w-4 h-4" />
                            Kembali ke Home
                        </Link>

                        <Link 
                            href="/pencarian" 
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-all text-sm"
                        >
                            <Search className="w-4 h-4" />
                            Cari Produk Lain
                        </Link>

                        <a 
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-emerald-600/10 text-sm"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Hubungi WA Sales
                        </a>
                    </div>

                    {/* Footer mini bantuan */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                        Butuh bantuan mencari SKU tertentu? Sales kami siap melayani Anda.
                    </div>

                </div>
            </main>

            {/* Footer Utama */}
            <Footer />
        </div>
    );
}
