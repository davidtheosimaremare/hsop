"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { updateSiteSetting } from "@/app/actions/settings";
import { HidePriceRules } from "@/lib/pricing";

export default function HidePriceClient({ initialRules }: { initialRules: HidePriceRules }) {
    const [rules, setRules] = useState<HidePriceRules>({
        brands: initialRules?.brands || [],
        categories: initialRules?.categories || [],
        contactPhone: initialRules?.contactPhone || "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const [newBrand, setNewBrand] = useState("");
    const [newCategory, setNewCategory] = useState("");

    const handleAddBrand = () => {
        if (!newBrand.trim()) return;
        if (!rules.brands.includes(newBrand.trim())) {
            setRules(prev => ({ ...prev, brands: [...prev.brands, newBrand.trim()] }));
        }
        setNewBrand("");
    };

    const handleRemoveBrand = (index: number) => {
        setRules(prev => ({
            ...prev,
            brands: prev.brands.filter((_, i) => i !== index)
        }));
    };

    const handleAddCategory = () => {
        if (!newCategory.trim()) return;
        if (!rules.categories.includes(newCategory.trim())) {
            setRules(prev => ({ ...prev, categories: [...prev.categories, newCategory.trim()] }));
        }
        setNewCategory("");
    };

    const handleRemoveCategory = (index: number) => {
        setRules(prev => ({
            ...prev,
            categories: prev.categories.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updateSiteSetting("hide_price_rules", rules);
            if (res.success) {
                toast.success("Aturan sembunyikan harga berhasil disimpan.");
            } else {
                toast.error(res.error || "Gagal menyimpan aturan.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat menyimpan.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Pengaturan Kontak Sales</CardTitle>
                    <CardDescription>
                        Nomor WhatsApp yang akan dihubungi saat tombol "Hubungi Sales" diklik.
                        <br />
                        Gunakan format internasional (contoh: 628123456789).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label>Nomor WhatsApp</Label>
                        <Input 
                            placeholder="628123456789" 
                            value={rules.contactPhone}
                            onChange={(e) => setRules(prev => ({ ...prev, contactPhone: e.target.value }))}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sembunyikan Berdasarkan Brand</CardTitle>
                    <CardDescription>
                        Daftar brand yang harganya akan disembunyikan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Nama Brand" 
                            value={newBrand}
                            onChange={(e) => setNewBrand(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddBrand()}
                        />
                        <Button onClick={handleAddBrand} variant="secondary">
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {rules.brands.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">Belum ada aturan brand.</p>
                        ) : (
                            rules.brands.map((brand, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                    <span className="font-semibold text-sm">{brand}</span>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleRemoveBrand(i)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sembunyikan Berdasarkan Kategori</CardTitle>
                    <CardDescription>
                        Daftar kategori yang harganya akan disembunyikan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Nama Kategori" 
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                        />
                        <Button onClick={handleAddCategory} variant="secondary">
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {rules.categories.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">Belum ada aturan kategori.</p>
                        ) : (
                            rules.categories.map((cat, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                    <span className="font-semibold text-sm">{cat}</span>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleRemoveCategory(i)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Simpan Pengaturan
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
