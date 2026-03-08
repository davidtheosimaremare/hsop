"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { updateSiteSetting } from "@/app/actions/settings";
import { uploadFile } from "@/app/actions/upload";
import { 
    Loader2, 
    Save, 
    Building2, 
    Mail, 
    Phone, 
    MapPin, 
    Globe, 
    Instagram, 
    Facebook, 
    Linkedin,
    Upload,
    X,
    Info,
    ImageIcon,
    ShieldCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CompanyDetails {
    name: string;
    siteTitle?: string;
    siteTagline?: string;
    email: string;
    phone: string;
    address: string;
    description: string;
    favicon: string | null;
    logo: string | null;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    website?: string;
}

interface CompanySettingsFormProps {
    initialData: CompanyDetails | null;
}

export function CompanySettingsForm({ initialData }: CompanySettingsFormProps) {
    const [formData, setFormData] = useState<CompanyDetails>(initialData || {
        name: "",
        siteTitle: "",
        siteTagline: "",
        email: "",
        phone: "",
        address: "",
        description: "",
        favicon: null,
        logo: null,
        instagram: "",
        facebook: "",
        linkedin: "",
        website: "",
    });

    const [isPending, startTransition] = useTransition();
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
    
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isLogo = type === 'logo';
        if (isLogo) setIsUploadingLogo(true);
        else setIsUploadingFavicon(true);

        try {
            const uploadData = new FormData();
            uploadData.append("file", file);
            const res = await uploadFile(uploadData);

            if (res.success && res.url) {
                setFormData(prev => ({ ...prev, [type]: res.url }));
                toast.success(`${isLogo ? 'Logo' : 'Favicon'} berhasil diunggah`);
            } else {
                toast.error(res.error || `Gagal mengunggah ${type}`);
            }
        } catch (error) {
            toast.error(`Terjadi kesalahan saat mengunggah ${type}`);
        } finally {
            if (isLogo) setIsUploadingLogo(false);
            else setIsUploadingFavicon(false);
        }
    };

    const handleSave = () => {
        if (!formData.name) {
            toast.error("Nama perusahaan wajib diisi");
            return;
        }

        startTransition(async () => {
            const res = await updateSiteSetting("company_details", formData);
            if (res.success) {
                toast.success("Profil perusahaan berhasil diperbarui");
            } else {
                toast.error(res.error || "Gagal menyimpan perubahan");
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
            {/* Left Column: Main Info */}
            <div className="lg:col-span-8 space-y-8">
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Informasi Dasar</CardTitle>
                                <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Detail utama identitas perusahaan</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-red-500" /> Title Situs Utama
                                </label>
                                <Input 
                                    name="siteTitle"
                                    value={formData.siteTitle}
                                    onChange={handleInputChange}
                                    placeholder="Hokiindoshop"
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-red-500/20 font-bold text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Info className="w-3 h-3 text-red-500" /> Tagline / Slogan
                                </label>
                                <Input 
                                    name="siteTagline"
                                    value={formData.siteTagline}
                                    onChange={handleInputChange}
                                    placeholder="Sustainable Solutions, Built on Trust"
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-red-500/20 font-bold text-slate-900"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-3 h-3 text-red-500" /> Nama Resmi Perusahaan
                            </label>
                            <Input 
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Contoh: PT Hokiindo Jaya Makmur"
                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-red-500/20 font-bold text-slate-900"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-red-500" /> Email Utama
                                </label>
                                <Input 
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="info@hokiindo.co.id"
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-red-500/20 font-bold text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-red-500" /> Nomor Telepon
                                </label>
                                <Input 
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+62 21 XXXX XXXX"
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-red-500/20 font-bold text-slate-900"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-red-500" /> Alamat Kantor
                            </label>
                            <Textarea 
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Jl. Raya Serpong No. 123..."
                                className="min-h-[100px] rounded-xl border-slate-100 bg-slate-50/50 focus:ring-red-500/20 font-bold text-slate-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-3 h-3 text-red-500" /> Deskripsi Singkat
                            </label>
                            <Textarea 
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Jelaskan bidang usaha perusahaan anda..."
                                className="min-h-[120px] rounded-xl border-slate-100 bg-slate-50/50 focus:ring-red-500/20 font-bold text-slate-900 leading-relaxed"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Social Media */}
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Sosial Media & Website</CardTitle>
                                <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Link akun resmi perusahaan</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Globe className="w-3 h-3 text-blue-500" /> Website URL
                            </label>
                            <Input 
                                name="website"
                                value={formData.website}
                                onChange={handleInputChange}
                                placeholder="https://www.hokiindo.co.id"
                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-500/20 font-bold text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Instagram className="w-3 h-3 text-pink-500" /> Instagram
                            </label>
                            <Input 
                                name="instagram"
                                value={formData.instagram}
                                onChange={handleInputChange}
                                placeholder="https://instagram.com/hokiindo"
                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-pink-500/20 font-bold text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Facebook className="w-3 h-3 text-blue-700" /> Facebook
                            </label>
                            <Input 
                                name="facebook"
                                value={formData.facebook}
                                onChange={handleInputChange}
                                placeholder="https://facebook.com/hokiindo"
                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-700/20 font-bold text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Linkedin className="w-3 h-3 text-blue-600" /> LinkedIn
                            </label>
                            <Input 
                                name="linkedin"
                                value={formData.linkedin}
                                onChange={handleInputChange}
                                placeholder="https://linkedin.com/company/hokiindo"
                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-600/20 font-bold text-slate-900"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Visual Assets */}
            <div className="lg:col-span-4 space-y-8">
                {/* Logo Section */}
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-red-500" /> Logo Perusahaan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="relative aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group">
                            {formData.logo ? (
                                <>
                                    <img src={formData.logo} alt="Logo" className="max-h-[80%] max-w-[80%] object-contain" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button variant="destructive" size="icon" onClick={() => setFormData(p => ({ ...p, logo: null }))} className="rounded-full w-10 h-10">
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Logo (SVG/PNG)</p>
                                </div>
                            )}
                            {isUploadingLogo && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                                </div>
                            )}
                        </div>
                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                        <Button 
                            variant="outline" 
                            className="w-full h-11 rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploadingLogo}
                        >
                            {isUploadingLogo ? "MENGUPLOAD..." : "GANTI LOGO"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Favicon Section */}
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" /> Favicon (Icon Tab)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                {formData.favicon ? (
                                    <img src={formData.favicon} alt="Favicon" className="w-10 h-10 object-contain" />
                                ) : (
                                    <ImageIcon className="w-6 h-6 text-slate-200" />
                                )}
                                {isUploadingFavicon && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input type="file" ref={faviconInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} />
                                <Button 
                                    variant="outline" 
                                    className="w-full h-10 rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-widest"
                                    onClick={() => faviconInputRef.current?.click()}
                                    disabled={isUploadingFavicon}
                                >
                                    GANTI FAVICON
                                </Button>
                                <p className="text-[10px] font-medium text-slate-400 italic">Rekomendasi: 32x32px (.ico / .png)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Panel */}
                <div className="sticky top-24 space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-black text-emerald-900 uppercase">Status Sistem</span>
                        </div>
                        <p className="text-xs font-bold text-emerald-700 leading-relaxed italic">
                            Semua data yang disimpan akan langsung diterapkan pada seluruh halaman publik dan layout dashboard.
                        </p>
                    </div>
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
                                SIMPAN PERUBAHAN
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
