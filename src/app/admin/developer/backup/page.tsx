"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Database, 
    Download, 
    Loader2, 
    ShieldCheck, 
    FileArchive, 
    HardDrive, 
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Info,
    ArrowRight
} from "lucide-react";
import { createSystemBackup } from "@/app/actions/backup";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function BackupPage() {
    const [isProcessing, setIsPending] = useState(false);
    const [result, setResult] = useState<{ downloadUrl: string; fileName: string; size: string } | null>(null);

    const handleBackup = async () => {
        setIsPending(true);
        setResult(null);
        
        try {
            const res = await createSystemBackup();
            if (res.success && res.downloadUrl) {
                setResult({
                    downloadUrl: res.downloadUrl,
                    fileName: res.fileName!,
                    size: res.size!
                });
                toast.success("Backup berhasil dibuat!");
            } else {
                toast.error(res.error || "Gagal membuat backup.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Database className="w-7 h-7 text-red-600" />
                        Maintenance & Backup
                    </h1>
                    <p className="text-sm text-slate-500 font-medium ml-10">Amankan data sistem dan file website Anda secara berkala.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Main Action Card */}
                <Card className="lg:col-span-7 border-none shadow-sm rounded-[2rem] overflow-hidden bg-white flex flex-col">
                    <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
                                <HardDrive className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900 tracking-tight uppercase">Buat Backup Full</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Database SQL + Project Files (Source Code)</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8 flex-1 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black text-emerald-900 uppercase">Database SQL</p>
                                        <p className="text-[11px] text-emerald-700/80 font-bold italic">Termasuk seluruh tabel, produk, dan transaksi.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black text-blue-900 uppercase">File Website</p>
                                        <p className="text-[11px] text-blue-700/80 font-bold italic">Termasuk asset gambar dan folder public.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
                                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-amber-900 uppercase tracking-wide">Pengecualian Keamanan (Excluded)</p>
                                    <p className="text-[11px] text-amber-700/80 font-bold leading-relaxed">
                                        Sistem secara otomatis mengabaikan folder <code className="bg-amber-100/50 px-1 rounded">node_modules</code>, <code className="bg-amber-100/50 px-1 rounded">.next</code>, dan file sensitif seperti <code className="bg-amber-100/50 px-1 rounded">.env</code> demi keamanan data kredensial Anda.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            {!result ? (
                                <Button 
                                    onClick={handleBackup} 
                                    disabled={isProcessing}
                                    className="w-full h-20 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] shadow-xl transition-all group overflow-hidden relative"
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-4">
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                                                <div className="text-left">
                                                    <p className="text-sm font-black uppercase tracking-widest">Memproses Backup...</p>
                                                    <p className="text-[10px] font-bold text-slate-400">Mohon tunggu, jangan tutup halaman ini.</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <RefreshCw className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-base font-black uppercase tracking-widest">Mulai Proses Backup</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Generate File .ZIP Sekarang</p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 ml-4 group-hover:translate-x-2 transition-transform" />
                                            </>
                                        )}
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-red-600/10 to-transparent" />
                                </Button>
                            ) : (
                                <div className="space-y-4 animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-4 p-6 rounded-[1.5rem] bg-emerald-50 border-2 border-emerald-100">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                            <FileArchive className="w-8 h-8" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{result.fileName}</p>
                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Siap diunduh • {result.size}</p>
                                        </div>
                                        <Button 
                                            asChild
                                            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 gap-2"
                                        >
                                            <a href={result.downloadUrl} download>
                                                <Download className="w-4 h-4" />
                                                DOWNLOAD
                                            </a>
                                        </Button>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setResult(null)}
                                        className="w-full text-xs font-black text-slate-400 uppercase tracking-widest h-10 hover:bg-slate-50 rounded-xl"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                                        Buat Backup Baru
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Info Sidebar */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-slate-900 text-white">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-red-500" />
                                <CardTitle className="text-sm font-black uppercase tracking-widest">Saran Keamanan</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-black text-xs">1</div>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed">
                                        Simpan file backup di media penyimpanan eksternal (Cloud atau Flashdisk) untuk mencegah kehilangan data jika server bermasalah.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-black text-xs">2</div>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed">
                                        Jangan membagikan file backup ini kepada siapapun karena mengandung struktur database sensitif.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-black text-xs">3</div>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed">
                                        Lakukan backup setidaknya seminggu sekali atau setelah melakukan perubahan data besar.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8 flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Butuh Restorasi Data?</h4>
                            <p className="text-[11px] font-bold text-slate-500 mt-1 leading-relaxed">
                                Untuk melakukan restore dari file backup ini, hubungi tim IT Developer atau gunakan tools database management seperti pgAdmin atau Navicat.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
