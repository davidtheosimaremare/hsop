"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
    Plus, 
    Trash2, 
    Loader2, 
    Save, 
    LayoutTemplate, 
    Mail, 
    Phone, 
    MessageCircle, 
    MapPin, 
    Instagram, 
    Facebook, 
    Linkedin, 
    Link as LinkIcon,
    Info,
    ExternalLink,
    Globe,
    Zap
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { getSiteSetting, updateSiteSetting } from "@/app/actions/settings";
import { cn } from "@/lib/utils";

const defaultFooterConfig = {
    contacts: {
        whatsapp: "+62 812 6222 0021",
        call_center: "(021) 385 7057",
        email: "sales@hokiindo.com",
        address: "Jl. Cideng Timur No. 66\nPetojo Selatan, Jakarta Pusat",
    },
    socials: {
        instagram: "",
        facebook: "",
        linkedin: "",
        tiktok: "",
    },
    links: {
        umum: [
            { name: "Berita Juragan", href: "#" },
            { name: "Tentang Kami", href: "#" },
            { name: "Hubungi Kami", href: "#" },
            { name: "Karir", href: "#" },
        ],
        informasi: [
            { name: "FAQ", href: "#" },
            { name: "Kemitraan", href: "#" },
            { name: "Brand Terdaftar", href: "#" },
        ],
        ketentuan: [
            { name: "Syarat & Ketentuan", href: "#" },
            { name: "Kebijakan Privasi", href: "#" },
        ],
    },
};

export default function FooterSettingsPage() {
    const [config, setConfig] = useState(defaultFooterConfig);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchConfig() {
            try {
                const data = await getSiteSetting("footer_config");
                if (data && typeof data === 'object') {
                    setConfig((prev) => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error("Failed to load footer config", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchConfig();
    }, []);

    const handleChange = (section: keyof typeof defaultFooterConfig, key: string, value: string) => {
        setConfig((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value,
            },
        }));
    };

    const handleLinkChange = (section: "umum" | "informasi" | "ketentuan", index: number, field: "name" | "href", value: string) => {
        const newLinks = [...config.links[section]];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setConfig((prev) => ({
            ...prev,
            links: {
                ...prev.links,
                [section]: newLinks,
            },
        }));
    };

    const addLink = (section: "umum" | "informasi" | "ketentuan") => {
        setConfig((prev) => ({
            ...prev,
            links: {
                ...prev.links,
                [section]: [...prev.links[section], { name: "Link Baru", href: "#" }],
            },
        }));
    };

    const removeLink = (section: "umum" | "informasi" | "ketentuan", index: number) => {
        const newLinks = config.links[section].filter((_, i) => i !== index);
        setConfig((prev) => ({
            ...prev,
            links: {
                ...prev.links,
                [section]: newLinks,
            },
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSiteSetting("footer_config", config);
            toast.success("Pengaturan footer berhasil diperbarui");
        } catch (error) {
            console.error("Failed to save", error);
            toast.error("Gagal menyimpan pengaturan.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Memuat Pengaturan Footer...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutTemplate className="w-7 h-7 text-red-600" />
                        Pengaturan Layout Footer
                    </h1>
                    <p className="text-sm text-slate-500 font-medium ml-10">Kustomisasi informasi kontak, link cepat, dan sosial media di bagian bawah website.</p>
                </div>
                
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 transition-all gap-2 shrink-0"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    SIMPAN SEMUA PERUBAHAN
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side: Contact & Socials */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Contacts Card */}
                    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6 px-8">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-black text-slate-800 uppercase tracking-tight">Kontak & Alamat</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Detail informasi kontak publik</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" /> Whatsapp
                                </label>
                                <Input 
                                    value={config.contacts.whatsapp} 
                                    onChange={(e) => handleChange("contacts", "whatsapp", e.target.value)}
                                    className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-teal-500/20 font-bold text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Call Center
                                </label>
                                <Input 
                                    value={config.contacts.call_center} 
                                    onChange={(e) => handleChange("contacts", "call_center", e.target.value)}
                                    className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-amber-500/20 font-bold text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-blue-500" /> Email Support
                                </label>
                                <Input 
                                    value={config.contacts.email} 
                                    onChange={(e) => handleChange("contacts", "email", e.target.value)}
                                    className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-500/20 font-bold text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-red-500" /> Alamat Fisik
                                </label>
                                <Textarea 
                                    className="min-h-[100px] rounded-xl border-slate-100 bg-slate-50/50 focus:ring-red-500/20 font-bold text-slate-900 leading-relaxed" 
                                    value={config.contacts.address} 
                                    onChange={(e) => handleChange("contacts", "address", e.target.value)} 
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Social Media Card */}
                    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6 px-8">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 shadow-sm">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-black text-slate-800 uppercase tracking-tight">Social Media Presence</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Link ke profil publik anda</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram URL
                                </label>
                                <Input 
                                    placeholder="https://instagram.com/hokiindo" 
                                    value={config.socials.instagram} 
                                    onChange={(e) => handleChange("socials", "instagram", e.target.value)}
                                    className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-pink-500/20 font-bold text-slate-900 text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Facebook className="w-3.5 h-3.5 text-blue-700" /> Facebook URL
                                </label>
                                <Input 
                                    placeholder="https://facebook.com/hokiindo" 
                                    value={config.socials.facebook} 
                                    onChange={(e) => handleChange("socials", "facebook", e.target.value)}
                                    className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-700/20 font-bold text-slate-900 text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn URL
                                </label>
                                <Input 
                                    placeholder="https://linkedin.com/company/hokiindo" 
                                    value={config.socials.linkedin} 
                                    onChange={(e) => handleChange("socials", "linkedin", e.target.value)}
                                    className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-600/20 font-bold text-slate-900 text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5 text-slate-900" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg> TikTok URL
                                </label>
                                <Input 
                                    placeholder="https://tiktok.com/@hokiindo" 
                                    value={config.socials.tiktok} 
                                    onChange={(e) => handleChange("socials", "tiktok", e.target.value)}
                                    className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-slate-900/20 font-bold text-slate-900 text-xs"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Links Management */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
                        <Info className="w-6 h-6 text-amber-600 shrink-0" />
                        <div>
                            <p className="text-xs font-black text-amber-900 uppercase mb-1">Informasi Struktur Link</p>
                            <p className="text-[11px] font-bold text-amber-700/80 leading-relaxed italic">
                                Anda dapat mengelola tautan cepat yang dibagi menjadi 3 kategori utama. Pastikan URL diawali dengan <code className="bg-amber-100 px-1 rounded">/</code> untuk link internal atau <code className="bg-amber-100 px-1 rounded">http</code> untuk link eksternal.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        {(["umum", "informasi", "ketentuan"] as const).map((section) => (
                            <Card key={section} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                                <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6 px-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                                                <LinkIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-black text-slate-800 uppercase tracking-tight">Kategori: {section}</CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Kelola daftar tautan menu {section}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge className="bg-blue-100 text-blue-700 border-none rounded-lg text-[10px] font-black">{config.links[section].length} LINK</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-4">
                                    <div className="space-y-3">
                                        {config.links[section].map((link, idx) => (
                                            <div key={idx} className="flex gap-3 items-start animate-in fade-in zoom-in-95 duration-200">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1">
                                                    <span className="text-[10px] font-black text-slate-400">{idx + 1}</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Label Menu</Label>
                                                        <Input
                                                            value={link.name}
                                                            onChange={(e) => handleLinkChange(section, idx, "name", e.target.value)}
                                                            placeholder="Nama Link"
                                                            className="h-9 rounded-lg border-slate-100 bg-white font-bold text-slate-900 text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">URL Tujuan</Label>
                                                        <Input
                                                            value={link.href}
                                                            onChange={(e) => handleLinkChange(section, idx, "href", e.target.value)}
                                                            placeholder="/url-tujuan"
                                                            className="h-9 rounded-lg border-slate-100 bg-white font-mono text-xs text-blue-600 font-bold"
                                                        />
                                                    </div>
                                                </div>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-10 w-10 mt-4 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all shrink-0" 
                                                    onClick={() => removeLink(section, idx)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full h-11 mt-4 rounded-xl border-dashed border-2 border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-blue-300 text-slate-500 font-black text-xs uppercase tracking-widest transition-all" 
                                        onClick={() => addLink(section)}
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Tambah Link Baru
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors", className)}>
            {children}
        </span>
    );
}
