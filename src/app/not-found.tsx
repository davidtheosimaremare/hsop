import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import { getSiteSetting } from "@/app/actions/settings";

export default async function NotFound() {
    // Ambil konfigurasi WhatsApp dinamis untuk kebutuhan link bantuan sekunder
    const waConfig = await getSiteSetting("whatsapp_config") as Record<string, string> | null;
    const waNumber = waConfig?.number || "+628111223344";
    const waMessage = waConfig?.message || "Halo Hokiindo Raya, saya mengalami kendala link terputus (404) di website dan membutuhkan bantuan.";
    const waUrl = `https://wa.me/${waNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waMessage)}`;

    return (
        <div className="flex flex-col min-h-screen bg-white text-slate-800">
            {/* Header Utama */}
            <SiteHeader />

            {/* Konten Utama 404 (Sesuai Referensi Gambar) */}
            <main className="flex-grow flex items-center justify-center px-6 py-12 md:py-24">
                <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
                    
                    {/* SISI KIRI (Atas di Mobile): Ilustrasi Kabel Putus (Sesuai Referensi) */}
                    <div className="w-full max-w-[280px] md:max-w-[360px] flex justify-center items-center">
                        <div className="relative w-full aspect-square flex items-center justify-center">
                            
                            <svg 
                                viewBox="0 0 240 240" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="w-full h-full text-slate-800"
                            >
                                {/* Background Lingkaran Lembut Merah Muda (FEF2F2) */}
                                <circle cx="120" cy="120" r="50" fill="#FEF2F2" />
                                
                                {/* Kabel Atas & Kepala Socket (Female Plug) */}
                                <path 
                                    d="M 20,40 C 20,95 120,50 120,98" 
                                    stroke="#1E293B" 
                                    strokeWidth="4" 
                                    strokeLinecap="round" 
                                />
                                {/* Detail kepala socket */}
                                <rect x="110" y="98" width="20" height="12" rx="3" fill="#1E293B" />
                                <rect x="114" y="110" width="12" height="4" rx="1" fill="#475569" />
                                
                                {/* Kabel Bawah & Kepala Steker (Male Plug) */}
                                <path 
                                    d="M 20,210 C 20,210 10,180 40,180 C 80,180 120,175 120,142" 
                                    stroke="#1E293B" 
                                    strokeWidth="4" 
                                    strokeLinecap="round" 
                                />
                                {/* Detail kepala steker */}
                                <rect x="113" y="130" width="14" height="12" rx="2.5" fill="#1E293B" />
                                {/* Kaki colokan (Prongs) */}
                                <rect x="115" y="124" width="2.5" height="6" rx="0.5" fill="#94A3B8" />
                                <rect x="122.5" y="124" width="2.5" height="6" rx="0.5" fill="#94A3B8" />
                            </svg>

                        </div>
                    </div>

                    {/* SISI KANAN (Bawah di Mobile): Informasi & Aksi Utama (Sesuai Referensi) */}
                    <div className="w-full max-w-md text-center md:text-left space-y-6">
                        <div className="space-y-2">
                            {/* Angka Giant 404 Merah */}
                            <h1 className="text-7xl md:text-8xl font-black text-red-600 tracking-tight leading-none">
                                404
                            </h1>
                            {/* Page Not Found Title */}
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                                Halaman Tidak Ditemukan
                            </h2>
                            {/* Desrkipsi Subtitle */}
                            <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed max-w-sm md:max-w-none">
                                Maaf, halaman yang Anda cari tidak dapat ditemukan. Silakan kembali ke halaman beranda.
                            </p>
                        </div>

                        {/* Tombol GO HOME - Desain Kapsul Sesuai Referensi */}
                        <div className="pt-2 flex flex-col md:flex-row items-center gap-4">
                            <Link 
                                href="/" 
                                className="w-full md:w-auto inline-flex items-center justify-center px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs tracking-widest uppercase transition-all duration-300 shadow-lg shadow-red-600/10 active:scale-95"
                            >
                                GO HOME
                            </Link>
                            
                            {/* Link Alternatif Sekunder yang Rapi & Minimalis */}
                            <Link 
                                href="/pencarian" 
                                className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors uppercase tracking-wider underline underline-offset-4"
                            >
                                Cari di Katalog
                            </Link>
                        </div>

                        {/* Footer mini / Info bantuan WhatsApp jika membutuhkan */}
                        <div className="pt-6 border-t border-slate-100 text-xs text-slate-400">
                            Mengalami kendala mencari produk? Hubungi tim sales kami via {" "}
                            <a 
                                href={waUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="font-semibold text-red-600 hover:text-red-700 transition-colors underline"
                            >
                                WhatsApp Support
                            </a>
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer Utama */}
            <Footer />
        </div>
    );
}
