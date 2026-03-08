"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { updateSiteSetting } from "@/app/actions/settings";
import { uploadFile } from "@/app/actions/upload";
import { 
    Loader2, 
    Save, 
    Mail, 
    Type, 
    Palette, 
    LayoutTemplate,
    Upload,
    X,
    ImageIcon,
    ShieldCheck,
    Eye,
    MessageSquare
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmailTemplate {
    headerBgColor: string;
    headerTextColor: string;
    logoUrl: string | null;
    footerText: string;
    footerBgColor: string;
    footerTextColor: string;
}

interface EmailTemplateFormProps {
    initialData: EmailTemplate | null;
}

export function EmailTemplateForm({ initialData }: EmailTemplateFormProps) {
    const [formData, setFormData] = useState<EmailTemplate>(initialData || {
        headerBgColor: "#dc2626",
        headerTextColor: "#ffffff",
        logoUrl: null,
        footerText: "© 2026 Hokiindo Shop. All rights reserved.",
        footerBgColor: "#f9fafb",
        footerTextColor: "#9ca3af",
    });

    const [isPending, startTransition] = useTransition();
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleColorChange = (name: keyof EmailTemplate, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingLogo(true);
        try {
            const uploadData = new FormData();
            uploadData.append("file", file);
            const res = await uploadFile(uploadData);

            if (res.success && res.url) {
                setFormData(prev => ({ ...prev, logoUrl: res.url }));
                toast.success("Logo email berhasil diunggah");
            } else {
                toast.error(res.error || "Gagal mengunggah logo");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat mengunggah logo");
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateSiteSetting("email_template", formData);
            if (res.success) {
                toast.success("Tampilan email berhasil diperbarui");
            } else {
                toast.error(res.error || "Gagal menyimpan perubahan");
            }
        });
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-20">
            {/* Left Column: Settings */}
            <div className="xl:col-span-5 space-y-6">
                {/* Header Settings */}
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm">
                                <LayoutTemplate className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-black text-slate-900 tracking-tight">Desain Header</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bagian atas email notifikasi</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {/* Logo Upload */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon className="w-3 h-3 text-red-500" /> Logo Header (Opsional)
                            </label>
                            <div className="relative aspect-[4/1] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group">
                                {formData.logoUrl ? (
                                    <>
                                        <img src={formData.logoUrl} alt="Email Logo" className="max-h-[60%] max-w-[80%] object-contain" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="destructive" size="icon" onClick={() => setFormData(p => ({ ...p, logoUrl: null }))} className="rounded-full w-10 h-10">
                                                <X className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">SVG/PNG Transparan</p>
                                    </div>
                                )}
                                {isUploadingLogo && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            <Button 
                                variant="outline" 
                                size="sm"
                                className="w-full h-10 rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-widest"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={isUploadingLogo}
                            >
                                {isUploadingLogo ? "MENGUPLOAD..." : "UNGGAH LOGO BARU"}
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Palette className="w-3 h-3 text-red-500" /> Warna Background
                                </label>
                                <div className="flex gap-2">
                                    <div 
                                        className="w-10 h-10 rounded-xl border border-slate-200 shrink-0 shadow-sm" 
                                        style={{ backgroundColor: formData.headerBgColor }}
                                    />
                                    <Input 
                                        value={formData.headerBgColor}
                                        onChange={(e) => handleColorChange("headerBgColor", e.target.value)}
                                        className="h-10 rounded-xl border-slate-100 font-mono text-xs font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Type className="w-3 h-3 text-red-500" /> Warna Teks
                                </label>
                                <div className="flex gap-2">
                                    <div 
                                        className="w-10 h-10 rounded-xl border border-slate-200 shrink-0 shadow-sm" 
                                        style={{ backgroundColor: formData.headerTextColor }}
                                    />
                                    <Input 
                                        value={formData.headerTextColor}
                                        onChange={(e) => handleColorChange("headerTextColor", e.target.value)}
                                        className="h-10 rounded-xl border-slate-100 font-mono text-xs font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Settings */}
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-black text-slate-900 tracking-tight">Desain Footer</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bagian bawah email notifikasi</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Type className="w-3 h-3 text-blue-500" /> Teks Hak Cipta
                            </label>
                            <Textarea 
                                name="footerText"
                                value={formData.footerText}
                                onChange={handleInputChange}
                                placeholder="&copy; 2026 Perusahaan Anda..."
                                className="min-h-[80px] rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-500/20 font-bold text-slate-900 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Palette className="w-3 h-3 text-blue-500" /> Background
                                </label>
                                <div className="flex gap-2">
                                    <div 
                                        className="w-10 h-10 rounded-xl border border-slate-200 shrink-0 shadow-sm" 
                                        style={{ backgroundColor: formData.footerBgColor }}
                                    />
                                    <Input 
                                        value={formData.footerBgColor}
                                        onChange={(e) => handleColorChange("footerBgColor", e.target.value)}
                                        className="h-10 rounded-xl border-slate-100 font-mono text-xs font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Type className="w-3 h-3 text-blue-500" /> Warna Teks
                                </label>
                                <div className="flex gap-2">
                                    <div 
                                        className="w-10 h-10 rounded-xl border border-slate-200 shrink-0 shadow-sm" 
                                        style={{ backgroundColor: formData.footerTextColor }}
                                    />
                                    <Input 
                                        value={formData.footerTextColor}
                                        onChange={(e) => handleColorChange("footerTextColor", e.target.value)}
                                        className="h-10 rounded-xl border-slate-100 font-mono text-xs font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <Button 
                    onClick={handleSave}
                    disabled={isPending}
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 text-sm tracking-widest flex items-center justify-center gap-2 group transition-all"
                >
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                            SIMPAN TAMPILAN EMAIL
                        </>
                    )}
                </Button>
            </div>

            {/* Right Column: Live Preview */}
            <div className="xl:col-span-7 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-slate-400" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Live Preview Email</h3>
                    </div>
                    <Badge className="bg-emerald-500 text-white border-none rounded-lg text-[9px] font-black tracking-widest uppercase">Responsif</Badge>
                </div>

                <div className="bg-slate-200 rounded-[2.5rem] p-4 md:p-10 shadow-inner min-h-[600px] flex items-center justify-center border border-slate-300">
                    {/* Simulated Email Container */}
                    <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in-95 duration-500">
                        {/* Header */}
                        <div 
                            style={{ backgroundColor: formData.headerBgColor }} 
                            className="p-8 text-center transition-colors duration-300"
                        >
                            {formData.logoUrl && (
                                <img src={formData.logoUrl} alt="Logo" className="max-h-10 mx-auto mb-3" />
                            )}
                            <h1 
                                style={{ color: formData.headerTextColor }} 
                                className="text-xl font-black tracking-tight m-0"
                            >
                                Hokiindo Shop
                            </h1>
                        </div>

                        {/* Content Placeholder */}
                        <div className="p-10 space-y-6">
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-slate-100 rounded-full" />
                                <div className="h-3 w-full bg-slate-50 rounded-full" />
                                <div className="h-3 w-full bg-slate-50 rounded-full" />
                                <div className="h-3 w-2/3 bg-slate-50 rounded-full" />
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center gap-4">
                                <div className="w-full h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-slate-300 tracking-[0.5em]">ABC-123456</span>
                                </div>
                                <div className="h-10 w-40 bg-red-600 rounded-xl" />
                            </div>

                            <div className="space-y-2">
                                <div className="h-3 w-full bg-slate-50 rounded-full" />
                                <div className="h-3 w-1/2 bg-slate-50 rounded-full mx-auto" />
                            </div>
                        </div>

                        {/* Footer */}
                        <div 
                            style={{ backgroundColor: formData.footerBgColor }} 
                            className="p-6 text-center border-top border-slate-100 transition-colors duration-300"
                        >
                            <p 
                                style={{ color: formData.footerTextColor }} 
                                className="text-[10px] font-bold m-0"
                            >
                                {formData.footerText}
                            </p>
                            <div className="mt-4 flex justify-center gap-3 opacity-30 grayscale">
                                <div className="w-6 h-6 rounded-full bg-slate-400" />
                                <div className="w-6 h-6 rounded-full bg-slate-400" />
                                <div className="w-6 h-6 rounded-full bg-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-black text-amber-900 uppercase mb-1">Catatan Penting</p>
                        <p className="text-[11px] font-bold text-amber-700/80 leading-relaxed italic">
                            Tampilan preview di atas adalah simulasi. Email asli mungkin sedikit berbeda tergantung pada aplikasi pembaca email (Outlook, Gmail, Apple Mail) yang digunakan oleh pelanggan.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
