"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { 
    getMarkupRules, 
    createMarkupRule, 
    deleteMarkupRule, 
    applyAllMarkupRules,
    clearAllMarkupRulesAndResetPrices,
    getMarkupExemptionRules,
    saveMarkupExemptionRule,
    toggleMarkupExemptionRule,
    deleteMarkupExemptionRule,
    previewExemptedProducts,
    RuleType,
    MarkupType
} from "@/app/actions/markup-rules";
import { MarkupExemptionRule, isProductExemptFromMarkup } from "@/lib/pricing";
import { 
    Trash2, 
    Plus, 
    RefreshCw, 
    Calculator,
    Tag,
    FolderTree,
    RotateCcw,
    ShieldCheck,
    ShieldAlert,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Eye,
    Pencil,
    Search,
    AlertCircle,
    SlidersHorizontal,
    Sparkles,
    Boxes
} from "lucide-react";
import Link from "next/link";

interface MarkupRulesClientProps {
    brands: string[];
    categories: string[];
    initialExemptionRules?: MarkupExemptionRule[];
}

export default function MarkupRulesClient({ 
    brands, 
    categories,
    initialExemptionRules = []
}: MarkupRulesClientProps) {
    const { toast } = useToast();
    
    // Tabs state
    const [activeTab, setActiveTab] = useState<string>("exemptions");

    // ── Local Database Rules State ──
    const [rules, setRules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    // Form state for Local DB rules
    const [type, setType] = useState<RuleType>("BRAND");
    const [targetValue, setTargetValue] = useState("");
    const [markupType, setMarkupType] = useState<MarkupType>("PERCENTAGE");
    const [markupValue, setMarkupValue] = useState("");

    // ── Markup Exemptions State ──
    const [exemptionRules, setExemptionRules] = useState<MarkupExemptionRule[]>(initialExemptionRules);
    const [isExemptionDialogOpen, setIsExemptionDialogOpen] = useState(false);
    const [isSavingExemption, setIsSavingExemption] = useState(false);
    const [editingExemption, setEditingExemption] = useState<MarkupExemptionRule | null>(null);

    // Form state for Exemption rule
    const [exemptionName, setExemptionName] = useState("");
    const [exemptionSkuPrefix, setExemptionSkuPrefix] = useState("");
    const [exemptionSkuPattern, setExemptionSkuPattern] = useState("");
    const [exemptionDescPrefix, setExemptionDescPrefix] = useState("");
    const [exemptionCategory, setExemptionCategory] = useState<string>("ALL");
    const [exemptionBrand, setExemptionBrand] = useState<string>("ALL");
    const [exemptionNote, setExemptionNote] = useState("");
    const [exemptionIsActive, setExemptionIsActive] = useState(true);

    // Preview affected products modal state
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewRule, setPreviewRule] = useState<MarkupExemptionRule | null>(null);
    const [previewData, setPreviewData] = useState<{ totalCount: number; products: any[] }>({ totalCount: 0, products: [] });

    // Interactive Simulator / Checker State
    const [simSku, setSimSku] = useState("");
    const [simResult, setSimResult] = useState<any | null>(null);
    const [isSearchingSim, setIsSearchingSim] = useState(false);

    useEffect(() => {
        fetchRules();
        fetchExemptions();
    }, []);

    const fetchRules = async () => {
        setIsLoading(true);
        const res = await getMarkupRules();
        if (res.success) {
            setRules(res.rules);
        } else {
            toast.error("Gagal memuat aturan markup lokal.");
        }
        setIsLoading(false);
    };

    const fetchExemptions = async () => {
        try {
            const data = await getMarkupExemptionRules();
            setExemptionRules(data);
        } catch {
            toast.error("Gagal memuat aturan pengecualian.");
        }
    };

    // ── Exemption Actions ──

    const handleOpenCreateExemption = () => {
        setEditingExemption(null);
        setExemptionName("");
        setExemptionSkuPrefix("");
        setExemptionSkuPattern("");
        setExemptionDescPrefix("");
        setExemptionCategory("ALL");
        setExemptionBrand("ALL");
        setExemptionNote("");
        setExemptionIsActive(true);
        setIsExemptionDialogOpen(true);
    };

    const handleOpenEditExemption = (rule: MarkupExemptionRule) => {
        setEditingExemption(rule);
        setExemptionName(rule.name);
        setExemptionSkuPrefix(rule.skuPrefix || "");
        setExemptionSkuPattern(rule.skuPattern || "");
        setExemptionDescPrefix(rule.descriptionPrefix || "");
        setExemptionCategory(rule.category || "ALL");
        setExemptionBrand(rule.brand || "ALL");
        setExemptionNote(rule.note || "");
        setExemptionIsActive(rule.isActive);
        setIsExemptionDialogOpen(true);
    };

    const handleSaveExemption = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!exemptionName.trim()) {
            toast.error("Nama aturan harus diisi.");
            return;
        }

        if (!exemptionSkuPrefix.trim() && !exemptionDescPrefix.trim()) {
            toast.error("Harap isi minimal Prefix SKU (misal: 3VJ1) atau Awalan/Kata Kunci Nama Produk (misal: Siemens MCCB).");
            return;
        }

        setIsSavingExemption(true);
        const res = await saveMarkupExemptionRule({
            id: editingExemption?.id,
            name: exemptionName.trim(),
            skuPrefix: exemptionSkuPrefix.trim() || undefined,
            skuPattern: exemptionSkuPattern.trim() || undefined,
            descriptionPrefix: exemptionDescPrefix.trim() || undefined,
            category: exemptionCategory !== "ALL" ? exemptionCategory : undefined,
            brand: exemptionBrand !== "ALL" ? exemptionBrand : undefined,
            note: exemptionNote.trim() || undefined,
            isActive: exemptionIsActive,
        });

        if (res.success && res.rules) {
            setExemptionRules(res.rules);
            setIsExemptionDialogOpen(false);
            toast.success(editingExemption ? "Aturan pengecualian berhasil diperbarui!" : "Aturan pengecualian baru berhasil disimpan!");
        } else {
            toast.error(res.error || "Gagal menyimpan aturan pengecualian.");
        }
        setIsSavingExemption(false);
    };

    const handleToggleExemption = async (rule: MarkupExemptionRule) => {
        const newStatus = !rule.isActive;
        const res = await toggleMarkupExemptionRule(rule.id, newStatus);
        if (res.success && res.rules) {
            setExemptionRules(res.rules);
            toast.success(`Aturan "${rule.name}" sekarang ${newStatus ? "AKTIF (Bebas Markup)" : "NON-AKTIF"}.`);
        } else {
            toast.error(res.error || "Gagal mengubah status aturan.");
        }
    };

    const handleDeleteExemption = async (rule: MarkupExemptionRule) => {
        if (!confirm(`Hapus aturan pengecualian "${rule.name}"? Produk yang sebelumnya dikecualikan akan kembali mengikuti kenaikan harga kategori.`)) return;

        const res = await deleteMarkupExemptionRule(rule.id);
        if (res.success && res.rules) {
            setExemptionRules(res.rules);
            toast.success("Aturan pengecualian berhasil dihapus.");
        } else {
            toast.error(res.error || "Gagal menghapus aturan pengecualian.");
        }
    };

    const handlePreviewProducts = async (rule: MarkupExemptionRule) => {
        setPreviewRule(rule);
        setIsPreviewOpen(true);
        setPreviewLoading(true);

        const res = await previewExemptedProducts({
            skuPrefix: rule.skuPrefix,
            skuPattern: rule.skuPattern,
            descriptionPrefix: rule.descriptionPrefix,
            category: rule.category,
            brand: rule.brand,
        });

        if (res.success) {
            setPreviewData({ totalCount: res.totalCount, products: res.products });
        } else {
            toast.error("Gagal mengambil preview produk.");
            setPreviewData({ totalCount: 0, products: [] });
        }
        setPreviewLoading(false);
    };

    const handleSimulateCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!simSku.trim()) return;

        setIsSearchingSim(true);
        const res = await previewExemptedProducts({ skuPrefix: simSku.trim() });
        if (res.success && res.products.length > 0) {
            const product = res.products[0];
            const isExempt = isProductExemptFromMarkup(
                product.sku,
                product.name,
                product.category,
                product.brand,
                exemptionRules
            );
            const matchedRule = exemptionRules.find(r => r.isActive && isProductExemptFromMarkup(product.sku, product.name, product.category, product.brand, [r]));

            setSimResult({
                found: true,
                product,
                isExempt,
                matchedRule,
            });
        } else {
            setSimResult({
                found: false,
                query: simSku.trim(),
            });
        }
        setIsSearchingSim(false);
    };

    // ── Local DB Markup Actions (Legacy) ──

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
        if (!confirm("Hapus aturan ini? Klik tombol 'Reset Semua Harga ke Accurate' untuk mengembalikan harga produk ke asal.")) return;
        
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

    const handleClearAndReset = async () => {
        if (!confirm("Anda yakin ingin MENGHAPUS SEMUA ATURAN LOKAL dan MERESET HARGA seluruh produk agar 100% mengikuti harga Accurate Online?")) return;
        
        setIsApplying(true);
        const res = await clearAllMarkupRulesAndResetPrices();
        if (res.success) {
            toast.success(`Berhasil! Seluruh aturan lokal dihapus dan ${res.updatedCount} produk direset ke harga asli Accurate.`);
            fetchRules();
        } else {
            toast.error(res.error || "Gagal mereset harga ke Accurate.");
        }
        setIsApplying(false);
    };

    return (
        <div className="space-y-6">
            {/* ── Top Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-red-50 text-red-600 rounded-xl">
                            <SlidersHorizontal className="w-5 h-5" />
                        </span>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Aturan Kenaikan Harga &amp; Pengecualian</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Kelola kenaikan harga otomatis kategori (Siemens LP &amp; CP +4.545%) serta aturan pengecualian produk spesifik (seperti Siemens MCCB 3VJ1).
                    </p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                    <Button 
                        asChild 
                        variant="outline" 
                        className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-all text-xs inline-flex items-center gap-1.5"
                    >
                        <Link href="/admin/products/categories">
                            <FolderTree className="w-4 h-4 text-slate-500" />
                            Kelola Pemetaan Kategori
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* ── Informative Pricing Context Banner ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Kategori Siemens LP</span>
                        <span className="text-2xl font-black text-amber-900 mt-0.5 block">+4.545% <span className="text-xs font-semibold text-amber-700">di Shop</span></span>
                        <span className="text-[11px] text-amber-700/90 block mt-0.5">MCB, ACB, MCCB non-3VJ1, dll</span>
                    </div>
                    <Badge className="bg-amber-500 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-xs">
                        Aktif
                    </Badge>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">Kategori Siemens CP</span>
                        <span className="text-2xl font-black text-blue-900 mt-0.5 block">+4.545% <span className="text-xs font-semibold text-blue-700">di Shop</span></span>
                        <span className="text-[11px] text-blue-700/90 block mt-0.5">Contactor, Overload, Simocode, dll</span>
                    </div>
                    <Badge className="bg-blue-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-xs">
                        Aktif
                    </Badge>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Pengecualian Khusus</span>
                        <span className="text-2xl font-black text-emerald-900 mt-0.5 block">{exemptionRules.filter(r => r.isActive).length} <span className="text-xs font-semibold text-emerald-700">Aturan Aktif</span></span>
                        <span className="text-[11px] text-emerald-700/90 block mt-0.5">Tetap 0% markup (Siemens 3VJ1, dll)</span>
                    </div>
                    <Badge className="bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-xs">
                        Terlindungi
                    </Badge>
                </div>
            </div>

            {/* ── Main Tabs ── */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-100/80 p-1 rounded-xl w-fit">
                    <TabsTrigger value="exemptions" className="rounded-lg font-bold text-xs px-4 py-2 gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Pengecualian Kenaikan Harga (Markup Exemptions)
                        <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full">
                            {exemptionRules.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="custom-rules" className="rounded-lg font-bold text-xs px-4 py-2 gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                        <Calculator className="w-4 h-4 text-slate-600" />
                        Aturan Markup Tambahan (Lokal Database)
                        <span className="ml-1 text-[10px] bg-slate-200 text-slate-700 font-extrabold px-1.5 py-0.2 rounded-full">
                            {rules.length}
                        </span>
                    </TabsTrigger>
                </TabsList>

                {/* ══════════════════════════════════════════════════════════════ */}
                {/* TAB 1: MARKUP EXEMPTIONS                                       */}
                {/* ══════════════════════════════════════════════════════════════ */}
                <TabsContent value="exemptions" className="space-y-6">
                    {/* Header Action & Info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                                <ShieldCheck className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-emerald-950">Aturan Bebas Kenaikan Harga (0% Markup)</h3>
                                <p className="text-xs text-emerald-800/80 mt-0.5 leading-relaxed">
                                    Produk yang cocok dengan aturan di bawah ini akan <strong>tetap menggunakan harga dasar asli (0% kenaikan)</strong>, meskipun kategorinya dipetakan ke Siemens LP atau Siemens CP (+4.545%).
                                </p>
                            </div>
                        </div>

                        <Button 
                            onClick={handleOpenCreateExemption}
                            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shrink-0 text-xs shadow-sm inline-flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Aturan Pengecualian
                        </Button>
                    </div>

                    {/* Exemption Cards List */}
                    <div className="space-y-4">
                        {exemptionRules.length === 0 ? (
                            <Card className="rounded-2xl border-dashed border-2 border-slate-200 p-8 text-center bg-slate-50/50">
                                <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                <h3 className="text-sm font-bold text-slate-700">Belum Ada Aturan Pengecualian</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                                    Semua produk akan mengikuti persentase kenaikan harga kategori masing-masing.
                                </p>
                                <Button 
                                    onClick={handleOpenCreateExemption} 
                                    size="sm" 
                                    className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Tambah Aturan Pertama
                                </Button>
                            </Card>
                        ) : (
                            exemptionRules.map((rule) => (
                                <Card 
                                    key={rule.id} 
                                    className={`rounded-2xl border transition-all ${
                                        rule.isActive 
                                            ? "border-emerald-200 bg-white shadow-xs hover:border-emerald-300" 
                                            : "border-slate-200 bg-slate-50/70 opacity-75"
                                    }`}
                                >
                                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                                    {rule.name}
                                                </h3>
                                                {rule.isActive ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-extrabold text-[11px] gap-1 px-2.5 py-0.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        Aktif (Bebas Kenaikan Markup)
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-slate-500 border-slate-300 font-semibold text-[11px] gap-1 px-2.5 py-0.5">
                                                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                                        Non-Aktif
                                                    </Badge>
                                                )}
                                            </div>

                                            {rule.note && (
                                                <p className="text-xs text-slate-500 italic">
                                                    {rule.note}
                                                </p>
                                            )}

                                            {/* Criteria Chips */}
                                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                                {rule.skuPrefix && (
                                                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                                        <Tag className="w-3 h-3" />
                                                        Prefix SKU: <code className="font-mono bg-white px-1 py-0.2 rounded border border-indigo-100">{rule.skuPrefix}*</code>
                                                    </span>
                                                )}

                                                {rule.skuPattern && (
                                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                                        Kode Spesifik: <code className="font-mono bg-white px-1 py-0.2 rounded border border-emerald-100">{rule.skuPattern}</code>
                                                    </span>
                                                )}

                                                {rule.descriptionPrefix && (
                                                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                                        Nama/Deskripsi: &quot;{rule.descriptionPrefix}&quot;
                                                    </span>
                                                )}

                                                {rule.category && (
                                                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                                        <FolderTree className="w-3 h-3" />
                                                        Kategori: {rule.category}
                                                    </span>
                                                )}

                                                {rule.brand && (
                                                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                                        Brand: {rule.brand}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-between md:justify-end">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-slate-600">Status:</span>
                                                <Switch 
                                                    checked={rule.isActive} 
                                                    onCheckedChange={() => handleToggleExemption(rule)}
                                                    className="data-[state=checked]:bg-emerald-600"
                                                />
                                            </div>

                                            <div className="h-4 w-px bg-slate-200 hidden md:block" />

                                            <Button
                                                onClick={() => handlePreviewProducts(rule)}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-xl font-bold text-xs gap-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                Cek Produk
                                            </Button>

                                            <Button
                                                onClick={() => handleOpenEditExemption(rule)}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                                                title="Edit Aturan"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>

                                            <Button
                                                onClick={() => handleDeleteExemption(rule)}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                                                title="Hapus Aturan"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Interactive Price Checker / Simulator Card */}
                    <Card className="rounded-2xl border border-slate-200 shadow-xs bg-gradient-to-br from-slate-50 to-white">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                                <Search className="w-4 h-4 text-red-600" />
                                Simulator &amp; Cek Status Harga Produk
                            </CardTitle>
                            <CardDescription>
                                Ketik SKU produk (contoh: <code className="font-mono font-bold text-slate-700">3VJ1004-3DB32-0AA0</code> [Bebas Markup] atau <code className="font-mono font-bold text-slate-700">3VJ1004-3DA32-0AA0</code> [Naik Sesuai Kategori]) untuk memeriksa status markup harga.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <form onSubmit={handleSimulateCheck} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input 
                                        type="text"
                                        placeholder="Ketik SKU produk (contoh: 3VJ1004-3DB32-0AA0)..."
                                        value={simSku}
                                        onChange={(e) => setSimSku(e.target.value)}
                                        className="h-10 rounded-xl pr-9 font-mono text-sm"
                                    />
                                    {simSku && (
                                        <button 
                                            type="button" 
                                            onClick={() => { setSimSku(""); setSimResult(null); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isSearchingSim || !simSku.trim()}
                                    className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                                >
                                    {isSearchingSim ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Periksa Harga"}
                                </Button>
                            </form>

                            {/* Simulation Result Box */}
                            {simResult && (
                                <div className={`p-4 rounded-xl border transition-all ${
                                    !simResult.found 
                                        ? "bg-slate-50 border-slate-200" 
                                        : simResult.isExempt 
                                            ? "bg-emerald-50/80 border-emerald-300" 
                                            : "bg-amber-50/80 border-amber-300"
                                }`}>
                                    {!simResult.found ? (
                                        <div className="flex items-center gap-2 text-slate-600 text-xs">
                                            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span>Produk dengan SKU &quot;{simResult.query}&quot; tidak ditemukan dalam database.</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <span className="font-mono text-xs font-bold text-slate-500 uppercase">{simResult.product.sku}</span>
                                                    <h4 className="text-sm font-bold text-slate-900 leading-snug mt-0.5">{simResult.product.name}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Kategori: <strong className="text-slate-700">{simResult.product.category || "-"}</strong>
                                                        {simResult.product.categoryGroup && ` (${simResult.product.categoryGroup})`}
                                                        {" · "} Brand: <strong className="text-slate-700">{simResult.product.brand || "-"}</strong>
                                                    </p>
                                                </div>

                                                {simResult.isExempt ? (
                                                    <Badge className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0 inline-flex items-center gap-1.5">
                                                        <ShieldCheck className="w-4 h-4" />
                                                        BEBAS MARKUP (0%)
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0 inline-flex items-center gap-1.5">
                                                        <Calculator className="w-4 h-4" />
                                                        KENAIKAN +{simResult.product.normalMarkupPct}%
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                                <div>
                                                    <span className="text-slate-500">Harga Dasar: </span>
                                                    <strong className="text-slate-800 font-mono">Rp {simResult.product.price.toLocaleString("id-ID")}</strong>
                                                </div>

                                                <div>
                                                    <span className="text-slate-500">Harga di Shop: </span>
                                                    {simResult.isExempt ? (
                                                        <strong className="text-emerald-700 font-mono font-bold text-sm">
                                                            Rp {simResult.product.price.toLocaleString("id-ID")} (Tidak Naik)
                                                        </strong>
                                                    ) : (
                                                        <strong className="text-red-600 font-mono font-bold text-sm">
                                                            Rp {(Math.round((simResult.product.price * (1 + simResult.product.normalMarkupPct / 100)) / 100) * 100).toLocaleString("id-ID")}
                                                        </strong>
                                                    )}
                                                </div>
                                            </div>

                                            {simResult.isExempt && simResult.matchedRule && (
                                                <p className="text-[11px] text-emerald-800 bg-emerald-100/70 p-2 rounded-lg font-medium">
                                                    🛡️ Dikecualikan berdasarkan aturan: <strong>&quot;{simResult.matchedRule.name}&quot;</strong> (Prefix: {simResult.matchedRule.skuPrefix || "-"})
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════════ */}
                {/* TAB 2: CUSTOM LOCAL DB RULES (LEGACY)                         */}
                {/* ══════════════════════════════════════════════════════════════ */}
                <TabsContent value="custom-rules" className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-800">Aturan Markup Kustom Lokal (Database)</h3>
                            <p className="text-xs text-slate-500">
                                Fitur ini mengubah harga dasar di database produk. Standar harga shop saat ini dikelola secara dinamis lewat Pemetaan Kategori &amp; Pengecualian di Tab 1.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button 
                                onClick={handleClearAndReset}
                                disabled={isApplying}
                                variant="outline"
                                className="h-9 px-3 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold transition-all text-xs inline-flex items-center gap-1.5"
                            >
                                <RotateCcw className={`w-3.5 h-3.5 ${isApplying ? "animate-spin" : ""}`} />
                                Reset Semua Harga ke Accurate
                            </Button>
                            <Button 
                                onClick={handleApplyAll} 
                                disabled={isApplying}
                                className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all text-xs shadow-xs inline-flex items-center gap-1.5"
                            >
                                <Calculator className={`w-3.5 h-3.5 ${isApplying ? "animate-pulse" : ""}`} />
                                {isApplying ? "Menerapkan..." : "Terapkan ke Database"}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Form Tambah Aturan */}
                        <Card className="col-span-1 rounded-2xl border border-slate-200 shadow-sm h-fit">
                            <CardHeader className="bg-slate-50/50 rounded-t-2xl border-b border-slate-100 pb-4">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-red-600" /> Tambah Aturan Lokal
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Aturan kategori akan menang (menimpa) jika ada produk dengan kategori dan brand yang sama-sama memiliki aturan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={handleCreateRule} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Tipe Aturan</label>
                                        <Select value={type} onValueChange={(val: RuleType) => {
                                            setType(val);
                                            setTargetValue("");
                                        }}>
                                            <SelectTrigger className="h-9 rounded-xl text-xs">
                                                <SelectValue placeholder="Pilih Tipe" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BRAND">Berdasarkan Brand</SelectItem>
                                                <SelectItem value="CATEGORY">Berdasarkan Kategori</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">
                                            Nama {type === "BRAND" ? "Brand" : "Kategori"}
                                        </label>
                                        <Select 
                                            value={targetValue} 
                                            onValueChange={setTargetValue}
                                        >
                                            <SelectTrigger className="h-9 rounded-xl text-xs">
                                                <SelectValue placeholder={type === "BRAND" ? "Pilih Brand" : "Pilih Kategori"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(type === "BRAND" ? brands : categories).map(name => (
                                                    <SelectItem key={name} value={name}>
                                                        {name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Jenis Kenaikan</label>
                                        <Select value={markupType} onValueChange={(val: MarkupType) => setMarkupType(val)}>
                                            <SelectTrigger className="h-9 rounded-xl text-xs">
                                                <SelectValue placeholder="Pilih Jenis" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                                                <SelectItem value="FIXED_ADDITION">Nominal Tetap (+Rp)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Nilai Kenaikan</label>
                                        <div className="relative">
                                            {markupType === "FIXED_ADDITION" && (
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">Rp</span>
                                            )}
                                            <Input 
                                                type="number"
                                                placeholder={markupType === "PERCENTAGE" ? "Cth: 10" : "Cth: 50000"}
                                                value={markupValue}
                                                onChange={e => setMarkupValue(e.target.value)}
                                                className={`h-9 rounded-xl text-xs ${markupType === "FIXED_ADDITION" ? "pl-9" : "pr-8"}`}
                                            />
                                            {markupType === "PERCENTAGE" && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">%</span>
                                            )}
                                        </div>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all text-xs"
                                    >
                                        {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Simpan Aturan"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* List Aturan */}
                        <Card className="col-span-1 lg:col-span-2 rounded-2xl border border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-50/50 rounded-t-2xl border-b border-slate-100 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-bold">Daftar Aturan Lokal</CardTitle>
                                        <CardDescription className="text-xs">Aturan yang saat ini tersimpan dalam database</CardDescription>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={fetchRules}
                                        className="h-8 rounded-xl font-bold border-slate-200 text-xs gap-1"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Muat Ulang
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="py-12 flex justify-center items-center">
                                        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                                    </div>
                                ) : rules.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 text-xs">
                                        Belum ada aturan kenaikan harga lokal yang dibuat.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 uppercase font-extrabold text-[10px]">
                                                    <th className="py-2.5 px-4">Tipe</th>
                                                    <th className="py-2.5 px-4">Target</th>
                                                    <th className="py-2.5 px-4">Jenis &amp; Nilai</th>
                                                    <th className="py-2.5 px-4 text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {rules.map((rule) => (
                                                    <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-3 px-4 font-bold text-slate-700">
                                                            {rule.type === "BRAND" ? "Brand" : "Kategori"}
                                                        </td>
                                                        <td className="py-3 px-4 font-semibold text-slate-900">
                                                            {rule.targetValue}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="font-extrabold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                                                                {rule.markupType === "PERCENTAGE" ? `+${rule.markupValue}%` : `+Rp ${rule.markupValue.toLocaleString("id-ID")}`}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                onClick={() => handleDeleteRule(rule.id)}
                                                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
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
                </TabsContent>
            </Tabs>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MODAL / DIALOG: TAMBAH / EDIT ATURAN PENGECUALIAN              */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <Dialog open={isExemptionDialogOpen} onOpenChange={setIsExemptionDialogOpen}>
                <DialogContent className="max-w-lg rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            {editingExemption ? "Edit Aturan Pengecualian" : "Tambah Aturan Pengecualian Baru"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Produk yang cocok dengan kriteria aturan ini tidak akan dikenakan markup kategori (LP &amp; CP +4.545%).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveExemption} className="space-y-4 pt-2">
                        {/* Nama Aturan */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">
                                Nama Aturan <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                placeholder="Contoh: Siemens MCCB 3VJ1"
                                value={exemptionName}
                                onChange={(e) => setExemptionName(e.target.value)}
                                className="h-9 rounded-xl text-xs"
                                required
                            />
                        </div>

                        {/* Prefix SKU */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span>Prefix SKU (Awalan Kode Produk)</span>
                                <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                            </label>
                            <Input 
                                placeholder="Contoh: 3VJ1 (semua SKU yang dimulai dengan 3VJ1...)"
                                value={exemptionSkuPrefix}
                                onChange={(e) => setExemptionSkuPrefix(e.target.value)}
                                className="h-9 rounded-xl font-mono text-xs uppercase"
                            />
                            <p className="text-[10px] text-slate-400">
                                Contoh: <code className="font-mono font-bold text-slate-600">3VJ1</code> akan mencocokkan semua produk yang diawali <code className="font-mono text-slate-600">3VJ1...</code>
                            </p>
                        </div>

                        {/* Pola / Kode SKU Tertentu */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span>Pola / Kode SKU Tertentu</span>
                                <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                            </label>
                            <Input 
                                placeholder="Contoh: 3DB, 5DB, 7DB"
                                value={exemptionSkuPattern}
                                onChange={(e) => setExemptionSkuPattern(e.target.value)}
                                className="h-9 rounded-xl font-mono text-xs uppercase"
                            />
                            <p className="text-[10px] text-slate-400">
                                Pisahkan dengan koma jika lebih dari satu. Contoh: <code className="font-mono font-bold text-slate-600">3DB, 5DB, 7DB</code> (hanya SKU yang mengandung kode ini setelah tanda strip yang bebas markup).
                            </p>
                        </div>

                        {/* Deskripsi / Nama Prefix */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span>Awalan / Kata Kunci Nama Produk</span>
                                <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                            </label>
                            <Input 
                                placeholder="Contoh: Siemens MCCB"
                                value={exemptionDescPrefix}
                                onChange={(e) => setExemptionDescPrefix(e.target.value)}
                                className="h-9 rounded-xl text-xs"
                            />
                            <p className="text-[10px] text-slate-400">
                                Mencocokkan produk yang nama/deskripsinya dimulai atau mengandung kata kunci ini.
                            </p>
                        </div>

                        {/* Kategori & Brand Constraints */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Kategori Khusus</label>
                                <Select value={exemptionCategory} onValueChange={setExemptionCategory}>
                                    <SelectTrigger className="h-9 rounded-xl text-xs">
                                        <SelectValue placeholder="Semua Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Kategori</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Brand Khusus</label>
                                <Select value={exemptionBrand} onValueChange={setExemptionBrand}>
                                    <SelectTrigger className="h-9 rounded-xl text-xs">
                                        <SelectValue placeholder="Semua Brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Brand</SelectItem>
                                        {brands.map((b) => (
                                            <SelectItem key={b} value={b}>{b}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Catatan */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span>Catatan / Keterangan</span>
                                <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                            </label>
                            <Input 
                                placeholder="Contoh: Kebijakan prinsipal Siemens, seri 3VJ1 tidak naik harga 4.545%"
                                value={exemptionNote}
                                onChange={(e) => setExemptionNote(e.target.value)}
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>

                        {/* Status Aktif */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <span className="text-xs font-bold text-slate-800 block">Status Aturan</span>
                                <span className="text-[11px] text-slate-500 block">Aktifkan untuk langsung menerapkan pengecualian ini di shop</span>
                            </div>
                            <Switch 
                                checked={exemptionIsActive} 
                                onCheckedChange={setExemptionIsActive}
                                className="data-[state=checked]:bg-emerald-600"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsExemptionDialogOpen(false)}
                                className="rounded-xl text-xs"
                            >
                                Batal
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSavingExemption}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                                {isSavingExemption ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                                {editingExemption ? "Simpan Perubahan" : "Simpan Aturan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MODAL: PREVIEW PRODUK TERDAMPAK ATURAN                         */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-3xl rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Boxes className="w-5 h-5 text-indigo-600" />
                            Produk Terdampak: &quot;{previewRule?.name}&quot;
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Ditemukan <strong className="text-slate-900 font-bold">{previewData.totalCount.toLocaleString("id-ID")} produk</strong> dalam database yang cocok dengan aturan pengecualian ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        {/* Summary Chips */}
                        <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-500">Kriteria:</span>
                            {previewRule?.skuPrefix && (
                                <Badge variant="outline" className="font-mono bg-white text-indigo-700 border-indigo-200">
                                    SKU Prefix: {previewRule.skuPrefix}*
                                </Badge>
                            )}
                            {previewRule?.descriptionPrefix && (
                                <Badge variant="outline" className="bg-white text-purple-700 border-purple-200">
                                    Deskripsi: &quot;{previewRule.descriptionPrefix}&quot;
                                </Badge>
                            )}
                            {previewRule?.category && (
                                <Badge variant="outline" className="bg-white text-amber-700 border-amber-200">
                                    Kategori: {previewRule.category}
                                </Badge>
                            )}
                            {previewRule?.brand && (
                                <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                                    Brand: {previewRule.brand}
                                </Badge>
                            )}
                        </div>

                        {previewLoading ? (
                            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                                <span className="text-xs font-medium">Memuat data produk...</span>
                            </div>
                        ) : previewData.products.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs">
                                Tidak ada produk aktif yang cocok dengan kriteria aturan ini.
                            </div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="sticky top-0 bg-slate-100 z-10 text-[10px] text-slate-500 uppercase font-extrabold border-b border-slate-200">
                                        <tr>
                                            <th className="py-2.5 px-3">SKU</th>
                                            <th className="py-2.5 px-3">Nama Produk</th>
                                            <th className="py-2.5 px-3">Kategori</th>
                                            <th className="py-2.5 px-3 text-right">Harga Dasar</th>
                                            <th className="py-2.5 px-3 text-center">Status Markup</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {previewData.products.map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                                                    {p.sku}
                                                </td>
                                                <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate" title={p.name}>
                                                    {p.name}
                                                </td>
                                                <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                                                    {p.category || "-"}
                                                    {p.categoryGroup && (
                                                        <span className="ml-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">
                                                            {p.categoryGroup}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                                                    Rp {p.price.toLocaleString("id-ID")}
                                                </td>
                                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                                        Bebas Markup (0%)
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {previewData.totalCount > 20 && (
                            <p className="text-right text-[11px] text-slate-400">
                                Menampilkan 20 sampel dari total {previewData.totalCount.toLocaleString("id-ID")} produk.
                            </p>
                        )}

                        <DialogFooter className="pt-2">
                            <Button 
                                type="button" 
                                onClick={() => setIsPreviewOpen(false)}
                                className="rounded-xl text-xs bg-slate-900 text-white font-bold"
                            >
                                Tutup Preview
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
