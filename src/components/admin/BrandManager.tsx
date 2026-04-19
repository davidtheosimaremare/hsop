"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { syncBrandsFromAccurate, updateBrand } from "@/app/actions/brand";
import { Loader2, RefreshCw, CloudDownload, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Brand {
    id: string;
    name: string;
    alias: string | null;
    isVisible: boolean;
    accurateId: number | null;
}

interface BrandManagerProps {
    initialBrands: Brand[];
}

export function BrandManager({ initialBrands }: BrandManagerProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSyncAccurate = () => {
        if (!confirm("Ini akan mengambil semua brand dari Accurate dan menyimpannya ke database. Lanjutkan?")) return;

        startTransition(async () => {
            const res = await syncBrandsFromAccurate();
            if (res.success) {
                toast.success(`Berhasil sinkronisasi! Menambahkan/update ${res.count} brand.`);
                router.refresh();
            } else {
                toast.error(`Gagal sinkronisasi: ${res.error}`);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Tag className="w-5 h-5" /> Daftar Brand ({initialBrands.length})
                </h2>
                <Button onClick={handleSyncAccurate} disabled={isPending} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
                    Sync dari Accurate
                </Button>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-700">Nama Asli (Accurate)</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Alias (Tampilan)</th>
                            <th className="px-4 py-3 font-semibold text-gray-700 w-24 text-center">Tampilkan</th>
                            <th className="px-4 py-3 font-semibold text-gray-700 w-32 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {initialBrands.map((brand) => (
                            <BrandRow key={brand.id} brand={brand} />
                        ))}
                        {initialBrands.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                    Belum ada data brand. Silakan klik Sync dari Accurate.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function BrandRow({ brand }: { brand: Brand }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(brand.name);
    const [alias, setAlias] = useState(brand.alias || "");
    const [isVisible, setIsVisible] = useState(brand.isVisible);

    const [isSaving, startTransition] = useTransition();
    const router = useRouter();

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateBrand(brand.id, {
                name,
                alias: alias.trim() === "" ? "" : alias.trim(),
                isVisible,
            });
            if (res.success) {
                setIsEditing(false);
                toast.success("Brand berhasil diperbarui");
                router.refresh();
            } else {
                toast.error("Gagal update brand");
            }
        });
    };

    return (
        <tr className={`hover:bg-gray-50 transition-colors ${!isVisible && "bg-gray-50/50"}`}>
            <td className="px-4 py-3">
                {isEditing ? (
                    <Input className="h-8" value={name} onChange={(e) => setName(e.target.value)} />
                ) : (
                    <span className={`font-medium ${!isVisible && "text-gray-400"}`}>{brand.name}</span>
                )}
            </td>
            <td className="px-4 py-3">
                {isEditing ? (
                    <Input className="h-8" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Nama Alias" />
                ) : (
                    <span className="text-blue-600 font-medium">{brand.alias || "-"}</span>
                )}
            </td>
            <td className="px-4 py-3 text-center">
                <Switch 
                    checked={isVisible} 
                    onCheckedChange={(checked) => {
                        setIsVisible(checked);
                        if (!isEditing) {
                            startTransition(async () => {
                                await updateBrand(brand.id, { isVisible: checked });
                                router.refresh();
                            });
                        }
                    }} 
                />
            </td>
            <td className="px-4 py-3 text-right">
                {isEditing ? (
                    <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>Simpan</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Batal</Button>
                    </div>
                ) : (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                )}
            </td>
        </tr>
    );
}
