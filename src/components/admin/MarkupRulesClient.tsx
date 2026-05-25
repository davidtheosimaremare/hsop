"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    getMarkupRules, 
    createMarkupRule, 
    deleteMarkupRule, 
    applyAllMarkupRules,
    RuleType,
    MarkupType
} from "@/app/actions/markup-rules";
import { 
    Trash2, 
    Plus, 
    RefreshCw, 
    Calculator,
    Tag,
    FolderTree,
    TrendingUp
} from "lucide-react";

export default function MarkupRulesClient() {
    const { toast } = useToast();
    const [rules, setRules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    // Form state
    const [type, setType] = useState<RuleType>("BRAND");
    const [targetValue, setTargetValue] = useState("");
    const [markupType, setMarkupType] = useState<MarkupType>("PERCENTAGE");
    const [markupValue, setMarkupValue] = useState("");

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setIsLoading(true);
        const res = await getMarkupRules();
        if (res.success) {
            setRules(res.rules);
        } else {
            toast.error("Gagal memuat aturan markup.");
        }
        setIsLoading(false);
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetValue.trim() || !markupValue.trim()) {
            toast.error("Semua kolom harus diisi.");
            return;
        }

        const valueNum = parseFloat(markupValue);
        if (isNaN(valueNum) || valueNum <= 0) {
            toast.error("Nilai kenaikan harus berupa angka positif.");
            return;
        }

        setIsSubmitting(true);
        const res = await createMarkupRule({
            type,
            targetValue: targetValue.trim(),
            markupType,
            markupValue: valueNum
        });

        if (res.success) {
            toast.success("Aturan berhasil disimpan!");
            setTargetValue("");
            setMarkupValue("");
            fetchRules();
        } else {
            toast.error(res.error || "Gagal menyimpan aturan.");
        }
        setIsSubmitting(false);
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm("Hapus aturan ini? Harga produk yang sudah di-markup tidak akan kembali ke asal sampai Anda menekan tombol 'Terapkan Semua Aturan Sekarang' atau menunggu sinkronisasi besok.")) return;
        
        const res = await deleteMarkupRule(id);
        if (res.success) {
            toast.success("Aturan berhasil dihapus.");
            fetchRules();
        } else {
            toast.error(res.error || "Gagal menghapus aturan.");
        }
    };

    const handleApplyAll = async () => {
        if (!confirm("Anda yakin ingin menerapkan ulang semua harga sekarang? Ini akan memproses ribuan produk dan mungkin memakan waktu beberapa detik.")) return;
        
        setIsApplying(true);
        const res = await applyAllMarkupRules();
        if (res.success) {
            toast.success(`Berhasil! ${res.updatedCount} produk telah diubah harganya berdasarkan aturan terbaru.`);
        } else {
            toast.error(res.error || "Terjadi kesalahan saat menerapkan harga.");
        }
        setIsApplying(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1.5">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aturan Kenaikan Harga</h1>
                    <p className="text-slate-500 font-medium">Buat aturan otomatis untuk menaikkan harga dari base price Accurate berdasarkan Brand atau Kategori.</p>
                </div>
                <Button 
                    onClick={handleApplyAll} 
                    disabled={isApplying}
                    className="h-10 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shrink-0 shadow-lg shadow-red-600/20 inline-flex items-center gap-2"
                >
                    <Calculator className={`w-4 h-4 ${isApplying ? "animate-pulse" : ""}`} />
                    {isApplying ? "Menerapkan..." : "Terapkan Semua Aturan Sekarang"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tambah Aturan */}
                <Card className="col-span-1 rounded-2xl border border-slate-200 shadow-sm h-fit">
                    <CardHeader className="bg-slate-50/50 rounded-t-2xl border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Plus className="w-5 h-5 text-red-600" /> Tambah Aturan
                        </CardTitle>
                        <CardDescription>Aturan kategori akan menang (menimpa) jika ada produk dengan kategori dan brand yang sama-sama memiliki aturan.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleCreateRule} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Tipe Aturan</label>
                                <Select value={type} onValueChange={(val: RuleType) => setType(val)}>
                                    <SelectTrigger className="h-10 rounded-xl">
                                        <SelectValue placeholder="Pilih Tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BRAND">Berdasarkan Brand</SelectItem>
                                        <SelectItem value="CATEGORY">Berdasarkan Kategori</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">
                                    Nama {type === "BRAND" ? "Brand" : "Kategori"}
                                </label>
                                <Input 
                                    placeholder={type === "BRAND" ? "Cth: SIEMENS" : "Cth: Kontaktor"}
                                    value={targetValue}
                                    onChange={e => setTargetValue(e.target.value)}
                                    className="h-10 rounded-xl uppercase"
                                />
                                <p className="text-[10px] text-slate-500 font-medium">Penulisan harus persis sama (huruf besar/kecil diabaikan).</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Jenis Kenaikan</label>
                                <Select value={markupType} onValueChange={(val: MarkupType) => setMarkupType(val)}>
                                    <SelectTrigger className="h-10 rounded-xl">
                                        <SelectValue placeholder="Pilih Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                                        <SelectItem value="FIXED_ADDITION">Nominal Tetap (+Rp)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Nilai Kenaikan</label>
                                <div className="relative">
                                    {markupType === "FIXED_ADDITION" && (
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">Rp</span>
                                    )}
                                    <Input 
                                        type="number"
                                        placeholder={markupType === "PERCENTAGE" ? "Cth: 10" : "Cth: 50000"}
                                        value={markupValue}
                                        onChange={e => setMarkupValue(e.target.value)}
                                        className={`h-10 rounded-xl ${markupType === "FIXED_ADDITION" ? "pl-9" : "pr-8"}`}
                                    />
                                    {markupType === "PERCENTAGE" && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">%</span>
                                    )}
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all mt-2"
                            >
                                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Simpan Aturan"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Tabel Aturan Aktif */}
                <Card className="col-span-1 lg:col-span-2 rounded-2xl border border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 rounded-t-2xl border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-red-600" /> Daftar Aturan Aktif
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center p-12">
                                <RefreshCw className="w-8 h-8 animate-spin text-slate-300" />
                            </div>
                        ) : rules.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 font-medium">
                                Belum ada aturan kenaikan harga yang dibuat.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/30 border-b border-slate-100">
                                            <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipe</th>
                                            <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Target</th>
                                            <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Kenaikan</th>
                                            <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-[80px]">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-medium text-sm text-slate-700">
                                        {rules.map((rule) => (
                                            <tr key={rule.id} className="hover:bg-slate-50/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    {rule.type === "BRAND" ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                                                            <Tag className="w-3.5 h-3.5" /> Brand
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                                                            <FolderTree className="w-3.5 h-3.5" /> Kategori
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-extrabold text-slate-900 uppercase">
                                                    {rule.targetValue}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {rule.markupType === "PERCENTAGE" ? (
                                                        <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">
                                                            +{rule.markupValue}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">
                                                            +Rp {rule.markupValue.toLocaleString("id-ID")}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                        className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
