"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    Save,
    Search,
    BarChart3,
    Code2,
    ExternalLink,
    Globe,
    Info,
    CheckCircle2,
    Copy
} from "lucide-react";
import { getSiteSetting, updateSiteSetting } from "@/app/actions/settings";
import { toast } from "sonner";

export default function AdminSeoPage() {
    // SEO Verification
    const [googleVerification, setGoogleVerification] = useState("");
    const [bingVerification, setBingVerification] = useState("");

    // Analytics
    const [gaId, setGaId] = useState("");
    const [gtmId, setGtmId] = useState("");
    const [customHeadScript, setCustomHeadScript] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const seoResult = await getSiteSetting("seo_verification") as Record<string, string> | null;
            if (seoResult?.google) setGoogleVerification(seoResult.google);
            if (seoResult?.bing) setBingVerification(seoResult.bing);

            const analyticsResult = await getSiteSetting("analytics_config") as Record<string, string> | null;
            if (analyticsResult?.gaId) setGaId(analyticsResult.gaId);
            if (analyticsResult?.gtmId) setGtmId(analyticsResult.gtmId);
            if (analyticsResult?.customHeadScript) setCustomHeadScript(analyticsResult.customHeadScript);
        } catch (e) { /* use defaults */ }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSiteSetting("seo_verification", {
                google: googleVerification,
                bing: bingVerification,
            });

            await updateSiteSetting("analytics_config", {
                gaId,
                gtmId,
                customHeadScript,
            });

            toast.success("Pengaturan SEO & Analytics berhasil disimpan");
        } catch (error) {
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Memuat Pengaturan SEO...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Globe className="w-7 h-7 text-red-600" />
                        SEO & Analytics
                    </h1>
                    <p className="text-sm text-slate-500 font-medium ml-10">Kelola kode verifikasi mesin pencari dan tracking pengunjung.</p>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 transition-all gap-2"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    SIMPAN SEMUA PERUBAHAN
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SEO Verification */}
                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white flex flex-col">
                    <CardHeader className="bg-blue-50/50 border-b border-blue-50 p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                                <Search className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900 tracking-tight uppercase">Verifikasi Mesin Pencari</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Google Search Console & Bing Webmaster</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8 flex-1">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="text-xs font-bold text-blue-800 leading-relaxed">
                                <p className="italic mb-2">Masukkan kode verifikasi dari Google Search Console agar website Anda terindeks di Google.</p>
                                <p className="text-blue-600 font-medium">Langkah: Buka <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google Search Console</a> → Tambah Properti → Pilih &quot;HTML Tag&quot; → Copy kode <code className="bg-blue-100 px-1 rounded">content=&quot;...&quot;</code> saja.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-blue-500" /> Google Site Verification
                                </label>
                                <Input
                                    value={googleVerification}
                                    onChange={(e) => setGoogleVerification(e.target.value)}
                                    placeholder="Contoh: abc123xyz..."
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-500/20 font-mono text-sm text-slate-900"
                                />
                                <p className="text-[9px] font-bold text-slate-400 uppercase">
                                    Hanya isi bagian content saja, bukan seluruh tag HTML.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-blue-500" /> Bing Webmaster Verification (Opsional)
                                </label>
                                <Input
                                    value={bingVerification}
                                    onChange={(e) => setBingVerification(e.target.value)}
                                    placeholder="Kode verifikasi Bing..."
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-500/20 font-mono text-sm text-slate-900"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Analytics Tracking */}
                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white flex flex-col">
                    <CardHeader className="bg-amber-50/50 border-b border-amber-50 p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900 tracking-tight uppercase">Tracking Analytics</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Google Analytics & Tag Manager</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8 flex-1">
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                            <BarChart3 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-amber-800 leading-relaxed italic">
                                Masukkan Measurement ID dari Google Analytics 4 untuk melacak seluruh pengunjung website Anda secara otomatis. Gratis dari Google.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <BarChart3 className="w-3 h-3 text-amber-500" /> Google Analytics 4 (Measurement ID)
                                </label>
                                <Input
                                    value={gaId}
                                    onChange={(e) => setGaId(e.target.value)}
                                    placeholder="G-XXXXXXXXXX"
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-amber-500/20 font-mono text-sm text-slate-900"
                                />
                                <p className="text-[9px] font-bold text-slate-400 uppercase">
                                    Dapatkan di <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">analytics.google.com</a> → Admin → Data Streams → Measurement ID.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Code2 className="w-3 h-3 text-amber-500" /> Google Tag Manager ID (Opsional)
                                </label>
                                <Input
                                    value={gtmId}
                                    onChange={(e) => setGtmId(e.target.value)}
                                    placeholder="GTM-XXXXXXX"
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-amber-500/20 font-mono text-sm text-slate-900"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Custom Head Script */}
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-violet-50/50 border-b border-violet-50 p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 shadow-inner">
                            <Code2 className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black text-slate-900 tracking-tight uppercase">Script Kustom (Head)</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Facebook Pixel, Hotjar, dan tracking lainnya</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-violet-800 leading-relaxed italic">
                            Tempelkan kode script tracking pihak ketiga di sini. Kode akan otomatis dimasukkan ke bagian {'<head>'} setiap halaman website. Pastikan kode ditulis dengan benar agar tidak mengganggu tampilan website.
                        </p>
                    </div>
                    <Textarea
                        value={customHeadScript}
                        onChange={(e) => setCustomHeadScript(e.target.value)}
                        placeholder={'<!-- Contoh Facebook Pixel -->\n<script>\n  !function(f,b,e,v,n,t,s)...\n</script>'}
                        rows={8}
                        className="font-mono text-xs rounded-xl border-slate-100 bg-slate-50/50 focus:ring-violet-500/20 text-slate-900"
                    />
                </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <h3 className="text-xl font-black tracking-tight mb-6 uppercase italic flex items-center gap-3">
                        <ExternalLink className="w-6 h-6 text-red-500" />
                        Link Penting Dashboard
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="https://search.google.com/search-console"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all group"
                        >
                            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <Search className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">Google Search Console</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Pantau Indexing & SEO</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-500 ml-auto" />
                        </a>

                        <a
                            href={gaId ? `https://analytics.google.com/analytics/web/#/p${gaId.replace('G-', '')}/realtime/overview` : "https://analytics.google.com"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all group"
                        >
                            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Google Analytics</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Lihat Pengunjung Real-time</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-500 ml-auto" />
                        </a>

                        <a
                            href="https://www.bing.com/webmasters"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all group"
                        >
                            <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
                                <Globe className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors">Bing Webmaster</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Indexing di Bing & Yahoo</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-500 ml-auto" />
                        </a>
                    </div>

                    {gaId && (
                        <div className="mt-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <p className="text-sm font-bold text-emerald-300">
                                Google Analytics aktif dengan ID: <code className="bg-white/10 px-2 py-0.5 rounded-md text-white font-mono text-xs">{gaId}</code>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
