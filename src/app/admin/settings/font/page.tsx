"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Save,
    Type,
    Check,
    RotateCcw,
    ExternalLink
} from "lucide-react";
import { getSiteSetting, updateSiteSetting } from "@/app/actions/settings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Daftar font yang populer dan cocok untuk e-commerce - semuanya sudah dioptimalkan Google Fonts
const FONT_OPTIONS = [
    { name: "Inter", category: "Sans-serif", description: "Modern, bersih, sangat terbaca. Default web profesional.", weights: "400;500;600;700;800;900" },
    { name: "Plus Jakarta Sans", category: "Sans-serif", description: "Font Indonesia modern, elegan untuk brand premium.", weights: "400;500;600;700;800" },
    { name: "Poppins", category: "Sans-serif", description: "Geometris, ramah, cocok untuk e-commerce.", weights: "400;500;600;700;800;900" },
    { name: "Outfit", category: "Sans-serif", description: "Minimalis, futuristik, sangat premium.", weights: "400;500;600;700;800;900" },
    { name: "DM Sans", category: "Sans-serif", description: "Geometris rendah kontras, bersih dan profesional.", weights: "400;500;600;700" },
    { name: "Nunito Sans", category: "Sans-serif", description: "Lembut dan ramah, cocok untuk toko retail.", weights: "400;500;600;700;800;900" },
    { name: "Roboto", category: "Sans-serif", description: "Standar Google, terbaca di semua perangkat.", weights: "400;500;600;700;800;900" },
    { name: "Lato", category: "Sans-serif", description: "Hangat dan stabil, cocok untuk situs korporat.", weights: "400;700;900" },
    { name: "Open Sans", category: "Sans-serif", description: "Netral dan mudah dibaca, klasik web.", weights: "400;500;600;700;800" },
    { name: "Montserrat", category: "Sans-serif", description: "Geometris tebal, cocok untuk heading bold.", weights: "400;500;600;700;800;900" },
    { name: "Raleway", category: "Sans-serif", description: "Elegan, tipis, cocok untuk desain mewah.", weights: "400;500;600;700;800;900" },
    { name: "Work Sans", category: "Sans-serif", description: "Optimal untuk layar, simpel dan fungsional.", weights: "400;500;600;700;800;900" },
    { name: "Nunito", category: "Sans-serif", description: "Bulat dan ramah, karakter playful.", weights: "400;500;600;700;800;900" },
    { name: "Manrope", category: "Sans-serif", description: "Modern semi-geometris, sangat bersih.", weights: "400;500;600;700;800" },
    { name: "Space Grotesk", category: "Sans-serif", description: "Teknis, cocok untuk brand teknologi.", weights: "400;500;600;700" },
    { name: "Figtree", category: "Sans-serif", description: "Baru dan segar, ringan tapi berkarakter.", weights: "400;500;600;700;800;900" },
];

export default function AdminFontPage() {
    const [selectedFont, setSelectedFont] = useState("Inter");
    const [savedFont, setSavedFont] = useState("Inter");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(["Inter"]));

    useEffect(() => {
        loadSettings();
    }, []);

    // Preload semua font untuk preview
    useEffect(() => {
        FONT_OPTIONS.forEach(font => {
            if (!loadedFonts.has(font.name)) {
                const link = document.createElement("link");
                link.href = `https://fonts.googleapis.com/css2?family=${font.name.replace(/ /g, "+")}:wght@${font.weights}&display=swap`;
                link.rel = "stylesheet";
                document.head.appendChild(link);
                setLoadedFonts(prev => new Set([...prev, font.name]));
            }
        });
    }, [loadedFonts]);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const fontConfig = await getSiteSetting("font_config") as Record<string, string> | null;
            if (fontConfig?.fontFamily) {
                setSelectedFont(fontConfig.fontFamily);
                setSavedFont(fontConfig.fontFamily);
            }
        } catch (e) { /* use default */ }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const fontData = FONT_OPTIONS.find(f => f.name === selectedFont);
            await updateSiteSetting("font_config", {
                fontFamily: selectedFont,
                weights: fontData?.weights || "400;500;600;700",
            });
            setSavedFont(selectedFont);
            toast.success(
                `Font berhasil diubah ke "${selectedFont}"! Halaman publik akan otomatis menggunakan font baru.`,
                { duration: 5000 }
            );
        } catch (error) {
            toast.error("Gagal menyimpan pengaturan font");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setSelectedFont("Inter");
    };

    const hasChanges = selectedFont !== savedFont;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Memuat Pengaturan Font...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Type className="w-7 h-7 text-red-600" />
                        Pengaturan Font
                    </h1>
                    <p className="text-sm text-slate-500 font-medium ml-10">Pilih font Google Fonts untuk tampilan website publik.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        className="h-12 px-6 rounded-2xl font-bold text-slate-600 gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset ke Default
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className={cn(
                            "h-12 px-8 text-white font-black rounded-2xl shadow-lg transition-all gap-2",
                            hasChanges
                                ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                                : "bg-slate-300 cursor-not-allowed shadow-none"
                        )}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        SIMPAN FONT
                    </Button>
                </div>
            </div>

            {/* Preview */}
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-black tracking-tight uppercase">Preview Font Terpilih</CardTitle>
                            <CardDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Contoh tampilan font di website</CardDescription>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-xl">
                            <span className="text-sm font-bold text-white">{selectedFont}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8" style={{ fontFamily: `"${selectedFont}", sans-serif` }}>
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Distributor Resmi Siemens Indonesia</h2>
                            <p className="text-lg text-slate-600 font-medium">Menyediakan produk berkualitas tinggi untuk kebutuhan industri Anda.</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <p className="text-2xl font-black text-red-600">21.000+</p>
                                <p className="text-sm font-semibold text-slate-500">Produk Tersedia</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <p className="text-2xl font-black text-red-600">Rp 1.250.000</p>
                                <p className="text-sm font-semibold text-slate-500">Contoh Harga</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <p className="text-2xl font-black text-red-600">12 - 16</p>
                                <p className="text-sm font-semibold text-slate-500">Minggu Indent</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm" style={{ fontFamily: `"${selectedFont}", sans-serif` }}>
                                Tambah ke Keranjang
                            </button>
                            <button className="border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm" style={{ fontFamily: `"${selectedFont}", sans-serif` }}>
                                Minta Penawaran
                            </button>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Harga dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu. Stok barang terbatas, hubungi sales kami untuk informasi lebih lanjut.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Font Grid */}
            <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                    <Type className="w-5 h-5 text-red-600" />
                    Pilih Font
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {FONT_OPTIONS.map((font) => {
                        const isSelected = selectedFont === font.name;
                        const isSaved = savedFont === font.name;
                        return (
                            <button
                                key={font.name}
                                onClick={() => setSelectedFont(font.name)}
                                className={cn(
                                    "relative text-left p-6 rounded-2xl border-2 transition-all duration-200 group hover:shadow-md",
                                    isSelected
                                        ? "border-red-500 bg-red-50/50 shadow-md shadow-red-500/10"
                                        : "border-slate-100 bg-white hover:border-slate-200"
                                )}
                            >
                                {/* Selected indicator */}
                                {isSelected && (
                                    <div className="absolute top-3 right-3 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                                {isSaved && !isSelected && (
                                    <div className="absolute top-3 right-3 text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        Aktif
                                    </div>
                                )}

                                {/* Font name */}
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{font.category}</p>
                                <h4
                                    className="text-xl font-bold text-slate-900 mb-1"
                                    style={{ fontFamily: `"${font.name}", sans-serif` }}
                                >
                                    {font.name}
                                </h4>

                                {/* Sample text */}
                                <p
                                    className="text-sm text-slate-500 mb-3 leading-relaxed"
                                    style={{ fontFamily: `"${font.name}", sans-serif` }}
                                >
                                    Hokiindo Shop — Rp 1.250.000
                                </p>

                                {/* Description */}
                                <p className="text-[10px] font-medium text-slate-400 leading-snug">
                                    {font.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Info */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <h3 className="text-xl font-black tracking-tight mb-4 uppercase italic flex items-center gap-3">
                        <Type className="w-6 h-6 text-red-500" />
                        Tentang Pengaturan Font
                    </h3>
                    <div className="space-y-3 text-sm text-slate-300 font-medium leading-relaxed">
                        <p>• Font yang dipilih akan langsung berlaku di seluruh halaman publik website (produk, pencarian, beranda, dll).</p>
                        <p>• Halaman admin tetap menggunakan font Inter agar tampilan dashboard tetap konsisten.</p>
                        <p>• Semua font dimuat dari <span className="text-white font-bold">Google Fonts</span> (gratis, cepat, dan dioptimalkan untuk performa).</p>
                        <p>• Jika Bapak ingin font lain yang belum tersedia di daftar, silakan hubungi developer.</p>
                    </div>
                    <a
                        href="https://fonts.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-6 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl px-5 py-3 transition-all text-sm font-bold text-white"
                    >
                        Jelajahi Google Fonts
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
