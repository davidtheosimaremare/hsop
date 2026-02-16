"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getSiteSetting, updateSiteSetting } from "@/app/actions/settings";

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
            alert("Pengaturan footer tersimpan!");
        } catch (error) {
            console.error("Failed to save", error);
            alert("Gagal menyimpan pengaturan.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan Footer</h1>
                <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Simpan Perubahan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contacts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Kontak & Alamat</CardTitle>
                        <CardDescription>Informasi kontak yang tampil di footer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Whatsapp</Label>
                            <Input value={config.contacts.whatsapp} onChange={(e) => handleChange("contacts", "whatsapp", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Call Center</Label>
                            <Input value={config.contacts.call_center} onChange={(e) => handleChange("contacts", "call_center", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={config.contacts.email} onChange={(e) => handleChange("contacts", "email", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Alamat Lengkap</Label>
                            <Textarea className="h-24" value={config.contacts.address} onChange={(e) => handleChange("contacts", "address", e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Social Media */}
                <Card>
                    <CardHeader>
                        <CardTitle>Social Media</CardTitle>
                        <CardDescription>Link ke akun sosial media Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Instagram URL</Label>
                            <Input placeholder="https://instagram.com/..." value={config.socials.instagram} onChange={(e) => handleChange("socials", "instagram", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Facebook URL</Label>
                            <Input placeholder="https://facebook.com/..." value={config.socials.facebook} onChange={(e) => handleChange("socials", "facebook", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>LinkedIn URL</Label>
                            <Input placeholder="https://linkedin.com/in/..." value={config.socials.linkedin} onChange={(e) => handleChange("socials", "linkedin", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>TikTok URL</Label>
                            <Input placeholder="https://tiktok.com/@..." value={config.socials.tiktok} onChange={(e) => handleChange("socials", "tiktok", e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Links Management */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(["umum", "informasi", "ketentuan"] as const).map((section) => (
                    <Card key={section}>
                        <CardHeader className="pb-3">
                            <CardTitle className="capitalize">Menu {section}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {config.links[section].map((link, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <div className="space-y-1 flex-1">
                                        <Input
                                            value={link.name}
                                            onChange={(e) => handleLinkChange(section, idx, "name", e.target.value)}
                                            placeholder="Nama Link"
                                            className="h-8 text-xs"
                                        />
                                        <Input
                                            value={link.href}
                                            onChange={(e) => handleLinkChange(section, idx, "href", e.target.value)}
                                            placeholder="/url-tujuan"
                                            className="h-8 text-xs font-mono text-gray-500"
                                        />
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeLink(section, idx)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => addLink(section)}>
                                <Plus className="w-3 h-3 mr-2" /> Tambah Link
                            </Button>
                        </CardContent>
                    </Card>
                ))}


            </div>
        </div>
    );
}
