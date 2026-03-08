"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
    Loader2, 
    CheckCircle2, 
    Mail, 
    MessageCircle, 
    Bell, 
    ShieldCheck, 
    Smartphone, 
    Info, 
    Save,
    Settings2,
    MessageSquareMore
} from "lucide-react";
import { getSiteSetting, updateSiteSetting } from "@/app/actions/settings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
    const [notifEmail, setNotifEmail] = useState("modibiid@gmail.com");
    const [salesPhone, setSalesPhone] = useState("081249009899");

    // WhatsApp Widget Config
    const [whatsappNumber, setWhatsappNumber] = useState("6281234567890");
    const [whatsappMessage, setWhatsappMessage] = useState("Halo Admin, saya mau tanya...");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            // Load Notification settings
            const notifResult = await getSiteSetting("notification_email") as Record<string, string> | null;
            if (notifResult?.email) setNotifEmail(notifResult.email);
            if (notifResult?.phone) setSalesPhone(notifResult.phone);

            // Load WhatsApp Widget settings
            const waResult = await getSiteSetting("whatsapp_config") as Record<string, string> | null;
            if (waResult?.number) setWhatsappNumber(waResult.number);
            if (waResult?.message) setWhatsappMessage(waResult.message);

        } catch (e) { /* use defaults */ }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save Notification Settings
            await updateSiteSetting("notification_email", {
                email: notifEmail,
                phone: salesPhone,
            });

            // Save WhatsApp Widget Settings
            await updateSiteSetting("whatsapp_config", {
                number: whatsappNumber,
                message: whatsappMessage,
            });

            toast.success("Pengaturan berhasil disimpan");
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
                <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Memuat Pengaturan...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Bell className="w-7 h-7 text-red-600" />
                        Pusat Notifikasi & Chat
                    </h1>
                    <p className="text-sm text-slate-500 font-medium ml-10">Konfigurasi ke mana informasi sistem dan interaksi pelanggan diarahkan.</p>
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
                {/* Notification Routing */}
                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white flex flex-col">
                    <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900 tracking-tight uppercase">Tujuan Notifikasi Sistem</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Rute email & WhatsApp untuk Admin/Sales</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8 flex-1">
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-amber-800 leading-relaxed italic">
                                Setiap kali ada penawaran (RFQ) baru atau permintaan upgrade, sistem akan mengirimkan detailnya ke kontak di bawah ini.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-red-500" /> Email Sales / Admin
                                </label>
                                <Input
                                    type="email"
                                    value={notifEmail}
                                    onChange={(e) => setNotifEmail(e.target.value)}
                                    placeholder="sales@hokiindo.co.id"
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-red-500/20 font-bold text-slate-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Smartphone className="w-3 h-3 text-red-500" /> No. WhatsApp Notifikasi
                                </label>
                                <Input
                                    type="tel"
                                    value={salesPhone}
                                    onChange={(e) => setSalesPhone(e.target.value)}
                                    placeholder="0812xxxxxxxx"
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-red-500/20 font-bold text-slate-900"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* WhatsApp Widget Config */}
                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white flex flex-col">
                    <CardHeader className="bg-emerald-50/50 border-b border-emerald-50 p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900 tracking-tight uppercase">Widget Chat Pengunjung</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Atur tombol bantuan di halaman depan</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8 flex-1">
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                            <MessageSquareMore className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-emerald-800 leading-relaxed italic">
                                Pengaturan ini mengontrol tombol WhatsApp melayang yang dilihat oleh pengunjung website di pojok kanan bawah.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Smartphone className="w-3 h-3 text-emerald-500" /> Nomor WhatsApp Tujuan
                                </label>
                                <Input
                                    type="tel"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                    placeholder="6281234567890"
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-emerald-500/20 font-bold text-slate-900"
                                />
                                <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">
                                    Gunakan kode negara (628...) tanpa tanda + atau spasi.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquareMore className="w-3 h-3 text-emerald-500" /> Template Pesan Pembuka
                                </label>
                                <Input
                                    value={whatsappMessage}
                                    onChange={(e) => setWhatsappMessage(e.target.value)}
                                    placeholder="Halo Admin, saya ingin bertanya..."
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-emerald-500/20 font-bold text-slate-900"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Status / Help */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <ShieldCheck className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-black tracking-tight mb-2 uppercase italic">Keamanan & Privasi Data</h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl">
                            Seluruh nomor kontak dan alamat email yang Anda masukkan di sini hanya digunakan secara internal oleh sistem untuk pengiriman notifikasi transaksi dan tidak akan disebarluaskan ke pihak ketiga.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
