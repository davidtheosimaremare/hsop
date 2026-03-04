"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Loader2,
    Mail,
    Phone,
    User,
    Package,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Send,
    BadgePercent,
    MessageSquare,
    Info,
    Plus,
    Trash2,
    Save,
    Clock,
    History,
    Search,
    ChevronDown,
    ChevronUp,
    FileText,
} from "lucide-react";
import { getQuotationDetail, processQuotation, submitQuotationOffer, saveQuotationDraft } from "@/app/actions/quotation";
import { getProductsForAlternative } from "@/app/actions/product";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Menunggu", color: "text-yellow-700", bg: "bg-yellow-100 border-yellow-200" },
    PROCESSING: { label: "Diproses", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
    OFFERED: { label: "Ditawarkan", color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
    COMPLETED: { label: "Selesai", color: "text-green-700", bg: "bg-green-100 border-green-200" },
    CANCELLED: { label: "Dibatalkan", color: "text-red-700", bg: "bg-red-100 border-red-200" },
};

interface Alternative {
    id?: string;
    productSku: string;
    productName: string;
    brand?: string;
    price: number;
    image?: string;
    availableToSell?: number;
    quantity: number;
    note?: string;
}

interface ItemState {
    id: string;
    productSku: string;
    productName: string;
    brand: string;
    quantity: number;
    price: number;
    basePrice?: number | null;
    discountPercent?: number | null;
    discountStr?: string | null;
    isAvailable: boolean | null;
    availableQty: number | null;
    adminNote: string;
    currentStock: number;
    currentPrice: number;
    image?: string;
    category?: string;
    alternatives: Alternative[];
}

export default function QuotationDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [quotation, setQuotation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Editable state
    const [items, setItems] = useState<ItemState[]>([]);
    const [adminNotes, setAdminNotes] = useState("");
    const [specialDiscount, setSpecialDiscount] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    // Search for alternatives
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeItemForAlt, setActiveItemForAlt] = useState<string | null>(null);

    const fmtPrice = (p: number) => new Intl.NumberFormat("id-ID").format(Math.round(p));

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const result = await getQuotationDetail(id);
        if (result.success && result.quotation) {
            const q = result.quotation;
            setQuotation(q);
            setItems(
                q.items.map((item: any) => ({
                    id: item.id,
                    productSku: item.productSku,
                    productName: item.productName,
                    brand: item.brand,
                    quantity: item.quantity,
                    price: item.price,
                    basePrice: item.basePrice,
                    discountPercent: item.discountPercent,
                    discountStr: item.discountStr,
                    isAvailable: item.isAvailable,
                    availableQty: item.availableQty ?? item.currentStock,
                    adminNote: item.adminNote || "",
                    currentStock: item.currentStock,
                    currentPrice: item.currentPrice,
                    image: item.image,
                    category: item.category,
                    alternatives: item.alternatives || [],
                }))
            );
            setAdminNotes(q.adminNotes || "");
            setSpecialDiscount(q.specialDiscountNote || (q.specialDiscount != null ? String(q.specialDiscount) : ""));
        }
        setIsLoading(false);
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleProcess = async () => {
        setIsProcessing(true);
        const result = await processQuotation(id);
        if (result.success) {
            toast.success("Quotation mulai diproses");
            await loadData();
        } else {
            toast.error(result.error || "Gagal memproses quotation");
        }
        setIsProcessing(false);
    };

    const updateItem = (itemId: string, updates: Partial<ItemState>) => {
        setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        const result = await saveQuotationDraft(id, {
            adminNotes: adminNotes || null,
            specialDiscount: effectiveTotalPercent,
            specialDiscountNote: specialDiscount,
            items: items.map(item => ({
                id: item.id,
                isAvailable: item.isAvailable,
                availableQty: item.availableQty,
                adminNote: item.adminNote || null,
                alternatives: item.alternatives.map(alt => ({
                    productSku: alt.productSku,
                    productName: alt.productName,
                    brand: alt.brand,
                    quantity: alt.quantity,
                    price: alt.price,
                    note: alt.note
                }))
            })),
        });
        if (result.success) {
            toast.success("Draft berhasil disimpan");
            await loadData();
        } else {
            toast.error(result.error || "Gagal menyimpan draft");
        }
        setIsSaving(false);
    };

    const handleSubmitOffer = async () => {
        const confirm = window.confirm("Kirim penawaran ini ke customer?");
        if (!confirm) return;

        setIsSubmitting(true);
        const result = await submitQuotationOffer(id, {
            adminNotes: adminNotes || null,
            specialDiscount: effectiveTotalPercent,
            specialDiscountNote: specialDiscount,
            items: items.map(item => ({
                id: item.id,
                isAvailable: item.isAvailable,
                availableQty: item.availableQty,
                adminNote: item.adminNote || null,
                alternatives: item.alternatives.map(alt => ({
                    productSku: alt.productSku,
                    productName: alt.productName,
                    brand: alt.brand,
                    quantity: alt.quantity,
                    price: alt.price,
                    note: alt.note
                }))
            })),
        });
        if (result.success) {
            toast.success("Penawaran berhasil dikirim");
            router.push("/admin/sales/quotations");
        } else {
            toast.error(result.error || "Gagal mengirim penawaran");
        }
        setIsSubmitting(false);
    };

    const searchAltProducts = async (query: string, category?: string) => {
        setIsSearching(true);
        const result = await getProductsForAlternative(category || "All", query, "all", 1, 60);
        if (result.success) {
            let prods = result.products || [];

            // Client-side relevance sort: exact match > starts-with > contains
            if (query.trim()) {
                const q = query.trim().toLowerCase();
                prods = [...prods].sort((a: any, b: any) => {
                    const scoreOf = (p: any) => {
                        const name = p.name.toLowerCase();
                        const sku = p.sku.toLowerCase();
                        if (name === q || sku === q) return 0;
                        if (name.startsWith(q) || sku.startsWith(q)) return 1;
                        return 2;
                    };
                    return scoreOf(a) - scoreOf(b);
                });
            }

            setSearchResults(prods);
        }
        setIsSearching(false);
    };

    const addAlternative = (itemId: string, product: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                // Check if already added
                if (item.alternatives.some(a => a.productSku === product.sku)) {
                    toast.error("Produk ini sudah ditambahkan sebagai alternatif");
                    return item;
                }
                return {
                    ...item,
                    alternatives: [
                        ...item.alternatives,
                        {
                            productSku: product.sku,
                            productName: product.name,
                            brand: product.brand,
                            price: product.price,
                            image: product.image,
                            availableToSell: product.availableToSell,
                            quantity: item.quantity,
                        }
                    ]
                };
            }
            return item;
        }));
        toast.success("Alternatif ditambahkan");
    };

    const removeAlternative = (itemId: string, sku: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    alternatives: item.alternatives.filter(a => a.productSku !== sku)
                };
            }
            return item;
        }));
    };

    const updateAlternative = (itemId: string, sku: string, updates: Partial<Alternative>) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    alternatives: item.alternatives.map(a => a.productSku === sku ? { ...a, ...updates } : a)
                };
            }
            return item;
        }));
    };

    // Calculate totals
    const originalTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Handle tiered discounts
    const calcEffectivePercent = (str: string) => {
        if (!str) return 0;
        if (str.includes('+')) {
            const parts = str.split('+').map(p => parseFloat(p) || 0);
            let multiplier = 1;
            parts.forEach(p => { multiplier *= (1 - (p / 100)); });
            return (1 - multiplier) * 100;
        }
        return parseFloat(str) || 0;
    };

    const effectiveTotalPercent = calcEffectivePercent(specialDiscount);
    const discountAmount = originalTotal * (effectiveTotalPercent / 100);
    const finalTotal = originalTotal - discountAmount;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
                <p className="text-sm text-gray-500">Memuat detail quotation...</p>
            </div>
        );
    }

    if (!quotation) {
        return (
            <div className="text-center py-20">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700">Quotation tidak ditemukan</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/sales/quotations")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                </Button>
            </div>
        );
    }

    const status = STATUS_CONFIG[quotation.status] || STATUS_CONFIG.PENDING;
    const isOffered = quotation.status === "OFFERED";
    const isInProcess = quotation.status === "PROCESSING";
    const isEditable = isInProcess || isOffered;
    const isPending = quotation.status === "PENDING";
    const isAdminEditable = isEditable || isPending; // admins can edit discount in any non-final state

    return (
        <div className="space-y-6 max-w-7xl pb-20">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    <span className="cursor-pointer hover:text-red-600 transition-colors" onClick={() => router.push("/admin/sales/quotations")}>Sales Quotations</span>
                    <span>/</span>
                    <span className="text-slate-600">Detail Penawaran</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push("/admin/sales/quotations")}
                            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{quotation.quotationNo}</h1>
                                <Badge className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border-2 shadow-sm ${status.bg} ${status.color}`}>
                                    {status.label}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Dibuat {format(new Date(quotation.createdAt), "dd MMM yyyy, HH:mm")}
                                    {quotation.processedAt && (
                                        <> • Diproses {format(new Date(quotation.processedAt), "dd MMM yyyy, HH:mm")}</>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAdminEditable && (
                            <Button
                                onClick={handleSaveDraft}
                                disabled={isSaving || isSubmitting}
                                variant="outline"
                                className="border-2 border-slate-200 font-bold px-6 rounded-xl hover:bg-slate-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Simpan Draft
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (Main Info) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Customer & Product List */}
                    <div className="flex flex-col gap-6">
                        {/* Customer Info Section - Compact & Streamlined */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-x-10 overflow-x-auto no-scrollbar">
                            {/* Identity */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 flex items-center justify-center text-red-600 shadow-inner">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                                            {quotation.customerCompany || quotation.customerName || "No Name"}
                                        </span>
                                        {quotation.customerCompany && (
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 opacity-80 whitespace-nowrap">
                                                PIC: {quotation.customerName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-10 w-px bg-slate-100 flex-shrink-0" />

                            {/* Email */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-slate-700 block leading-none mb-1 whitespace-nowrap">{quotation.email}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Email Address</span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-10 w-px bg-slate-100 flex-shrink-0" />

                            {/* Phone / WA */}
                            <div className="flex items-center gap-3 group/phone flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/phone:bg-green-50 group-hover/phone:text-green-600 transition-colors">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-700 block leading-none whitespace-nowrap">{quotation.phone || "-"}</span>
                                        {quotation.phone && (
                                            <a
                                                href={`https://wa.me/${quotation.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-200 whitespace-nowrap"
                                            >
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.886.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.89 4.44-9.892 9.886-.001 2.125.593 3.456 1.574 5.111l-.973 3.558 3.65-0.959h.001zm11.366-7.312c-.315-.158-1.86-.918-2.149-1.023-.289-.105-.499-.158-.708.158-.21.316-.81.1023-1.021 1.264-.21.21-.42.263-.735.105-.315-.158-1.33-.49-2.53-1.562-.934-.833-1.566-1.861-1.749-2.177-.184-.316-.02-.486.138-.644.142-.143.315-.368.472-.553.157-.184.21-.316.315-.526.105-.21.053-.395-.026-.553-.079-.158-.708-1.711-.973-2.343-.258-.614-.52-.53-.708-.539-.184-.009-.394-.011-.604-.011s-.552.079-.841.395c-.289.316-1.104 1.079-1.104 2.632 0 1.553 1.13 3.053 1.288 3.264.158.21 2.221 3.391 5.387 4.755.75.324 1.337.518 1.792.661.76.242 1.45.208 1.996.127.608-.091 1.86-.763 2.122-1.474.263-.711.263-1.316.184-1.448-.079-.131-.289-.21-.604-.368z" /></svg>
                                                Whatsapp
                                            </a>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Contact Number</span>
                                </div>
                            </div>
                        </div>

                        {quotation.notes && (
                            <>
                                {/* Divider */}
                                <div className="h-10 w-px bg-slate-100 hidden 2xl:block" />

                                {/* Quick Note */}
                                <div className="flex-1 min-w-[300px] bg-red-50/30 border border-red-100/50 p-3 rounded-2xl flex items-start gap-3 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-5">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-red-100/50 flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="w-4 h-4 text-red-500" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest block mb-0.5">Catatan Customer</span>
                                        <p className="text-[11px] font-bold text-red-900 leading-tight line-clamp-2">"{quotation.notes}"</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Product Items + Pricing Summary */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
                        <CardHeader className="bg-white border-b border-slate-100/80 py-3 px-6 flex flex-row items-center justify-between rounded-t-[2rem]">
                            <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-slate-700">
                                <Package className="w-4 h-4 text-red-600" /> Daftar Produk Penawaran
                            </CardTitle>
                            <span className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-slate-400 border border-slate-100 shadow-sm uppercase tracking-[0.2em]">
                                {items.length} Item
                            </span>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {items.map((item, idx) => {
                                    const stockSufficient = item.currentStock >= item.quantity;
                                    const discountDisplay = item.discountStr ?
                                        (item.discountStr.includes('%') ? item.discountStr : `${item.discountStr}%`) :
                                        (item.discountPercent && item.discountPercent > 0 ? `${Math.round(item.discountPercent)}%` : null);

                                    return (
                                        <div key={item.id} className="group transition-all">
                                            {/* Main Item Section */}
                                            <div className="p-5 px-6 hover:bg-slate-50/40 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    {/* Product Image */}
                                                    <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden hover:shadow-md transition-all flex-shrink-0">
                                                        {item.image ? (
                                                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-8 h-8 text-slate-300" />
                                                        )}
                                                    </div>

                                                    {/* Product Details */}
                                                    <div className="flex-1 min-w-0">
                                                        {/* Row 1: Product Info - compact */}
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                                                            <div className="space-y-1.5">
                                                                <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                                                                    {item.productName}
                                                                </h3>
                                                                <div className="flex items-center gap-3 flex-wrap">
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                                        {item.productSku}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 text-[10px] font-bold">
                                                                        <span className={stockSufficient ? "text-green-600" : "text-red-500 uppercase"}>
                                                                            {stockSufficient ? "Ready Stock" : "Indent"}
                                                                        </span>
                                                                        <span className="text-slate-300">•</span>
                                                                        <span className="text-slate-600 font-black">{item.quantity} Unit</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Pricing & Subtotal - inline */}
                                                            <div className="flex items-center gap-4 md:gap-6 flex-wrap md:flex-nowrap">
                                                                <div className="flex flex-col items-start md:items-end gap-0.5">
                                                                    {discountDisplay && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-[9px] font-bold text-slate-400 line-through opacity-70">Rp {fmtPrice(item.basePrice || item.price)}</span>
                                                                            <Badge className="bg-red-500 hover:bg-red-500 text-[9px] h-4 px-1.5 font-black rounded-md border-none shadow-sm">
                                                                                {discountDisplay}
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-baseline gap-0.5">
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">@</span>
                                                                        <span className="text-base font-black text-slate-900 tracking-tight">Rp {fmtPrice(item.price)}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right md:block">
                                                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-70">Subtotal</div>
                                                                    <div className="text-base font-black text-red-600 tracking-tight">Rp {fmtPrice(item.price * item.quantity)}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Status & Options row */}
                                                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100/50">
                                                            {/* Availability Toggle */}
                                                            {isEditable ? (
                                                                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                                                                    <button
                                                                        onClick={() => updateItem(item.id, { isAvailable: true })}
                                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${item.isAvailable === true ? "bg-white text-green-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                                                                    >
                                                                        Tersedia
                                                                    </button>
                                                                    <button
                                                                        onClick={() => updateItem(item.id, { isAvailable: false })}
                                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${item.isAvailable === false ? "bg-white text-red-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                                                                    >
                                                                        Kosong
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center">
                                                                    {item.isAvailable === true && <span className="text-[9px] font-black uppercase text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100 shadow-sm">Tersedia</span>}
                                                                    {item.isAvailable === false && <span className="text-[9px] font-black uppercase text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-100 shadow-sm">Kosong</span>}

                                                                </div>
                                                            )}

                                                            {/* Admin Note Input */}
                                                            {isEditable && (
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="relative group/input">
                                                                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within/input:text-red-500 transition-colors pointer-events-none" />
                                                                        <Input
                                                                            value={item.adminNote}
                                                                            onChange={(e) => updateItem(item.id, { adminNote: e.target.value })}
                                                                            placeholder="Catatan..."
                                                                            className="pl-9 h-9 text-xs font-bold border-slate-200 focus-visible:ring-red-500 bg-slate-50/30 rounded-lg shadow-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Alternative Products Trigger - shown for all items when admin can edit */}
                                                            {isAdminEditable && (
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="rounded-lg border-dashed border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-red-300 hover:text-red-600 font-black text-[9px] uppercase h-9 px-3 transition-all whitespace-nowrap"
                                                                            onClick={() => {
                                                                                setActiveItemForAlt(item.id);
                                                                                setSearchQuery("");
                                                                                setSearchResults([]);
                                                                                searchAltProducts("", item.category); // Auto-load on open
                                                                            }}
                                                                        >
                                                                            <Plus className="w-3 h-3 mr-1" /> Alternatif
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="max-w-5xl w-[95vw] h-[92vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
                                                                        {/* Header */}
                                                                        <div className="bg-slate-900 px-8 py-6 text-white overflow-hidden relative flex-shrink-0">
                                                                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                                                                <Package className="w-64 h-64" />
                                                                            </div>
                                                                            <DialogHeader>
                                                                                <DialogTitle className="text-xl font-black uppercase tracking-tight">Produk Alternatif</DialogTitle>
                                                                                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-2 bg-slate-800 px-4 py-1.5 rounded-full inline-block border border-slate-700">
                                                                                    Untuk: {item.productName}
                                                                                </p>
                                                                            </DialogHeader>
                                                                        </div>
                                                                        {/* Body */}
                                                                        <div className="flex flex-col flex-1 overflow-hidden bg-white">
                                                                            {/* Search bar */}
                                                                            <div className="px-8 pt-6 pb-4 border-b border-slate-100">
                                                                                <div className="relative group/search">
                                                                                    {isSearching
                                                                                        ? <Loader2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500 animate-spin" />
                                                                                        : <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/search:text-red-500 transition-colors" />
                                                                                    }
                                                                                    <Input
                                                                                        placeholder="Cari SKU atau nama produk..."
                                                                                        className="pl-14 h-14 text-sm font-bold border-slate-200 focus-visible:ring-red-500 rounded-2xl shadow-sm bg-slate-50/50"
                                                                                        value={searchQuery}
                                                                                        onChange={(e) => {
                                                                                            const val = e.target.value;
                                                                                            setSearchQuery(val);
                                                                                            // Debounced auto-search
                                                                                            clearTimeout((window as any).__altSearchTimer);
                                                                                            (window as any).__altSearchTimer = setTimeout(() => {
                                                                                                searchAltProducts(val, item.category);
                                                                                            }, 300);
                                                                                        }}
                                                                                        onKeyDown={(e) => e.key === "Enter" && searchAltProducts(searchQuery, item.category)}
                                                                                        autoFocus
                                                                                    />
                                                                                </div>
                                                                                <div className="flex items-center justify-between mt-2 px-1">
                                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                                        Kategori: {item.category || "Semua"}
                                                                                    </span>
                                                                                    <span className="text-[10px] font-bold text-slate-400">
                                                                                        {searchResults.length} produk ditemukan
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            {/* Results grid */}
                                                                            <div className="flex-1 overflow-y-auto p-8">
                                                                                {isSearching && searchResults.length === 0 ? (
                                                                                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                                                                        <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                                                                        <p className="text-sm font-black uppercase tracking-widest">Memuat produk...</p>
                                                                                    </div>
                                                                                ) : searchResults.length === 0 ? (
                                                                                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                                                                        <Search className="w-12 h-12 mb-4" />
                                                                                        <p className="text-sm font-black uppercase tracking-widest">Produk tidak ditemukan</p>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                        {searchResults.map((res: any) => {
                                                                                            const alreadyAdded = item.alternatives.some(a => a.productSku === res.sku);
                                                                                            return (
                                                                                                <div key={res.sku} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group/res ${alreadyAdded
                                                                                                    ? "bg-green-50 border-green-200"
                                                                                                    : "bg-slate-50 border-slate-100 hover:border-red-200 hover:bg-red-50/20 cursor-pointer"
                                                                                                    }`}>
                                                                                                    {/* Image */}
                                                                                                    <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0 group-hover/res:scale-105 transition-all">
                                                                                                        {res.image ? <img src={res.image} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-slate-200" />}
                                                                                                    </div>
                                                                                                    {/* Info */}
                                                                                                    <div className="flex-1 min-w-0">
                                                                                                        <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug group-hover/res:text-red-700 transition-colors">{res.name}</h4>
                                                                                                        <div className="flex items-center gap-2 mt-1">
                                                                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{res.sku}</span>
                                                                                                            {res.availableToSell > 0
                                                                                                                ? <span className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">Ready</span>
                                                                                                                : <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">Indent</span>
                                                                                                            }
                                                                                                        </div>
                                                                                                        <div className="text-sm font-black text-red-600 mt-1">Rp {fmtPrice(res.price)}</div>
                                                                                                    </div>
                                                                                                    {/* Action */}
                                                                                                    {alreadyAdded ? (
                                                                                                        <span className="text-[9px] font-black text-green-600 uppercase tracking-widest flex-shrink-0">✓ Dipilih</span>
                                                                                                    ) : (
                                                                                                        <Button
                                                                                                            size="sm"
                                                                                                            className="rounded-xl font-black text-[10px] uppercase bg-white border-2 border-slate-200 text-slate-900 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all px-4 h-9 flex-shrink-0"
                                                                                                            onClick={() => addAlternative(item.id, res)}
                                                                                                        >
                                                                                                            Pilih
                                                                                                        </Button>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Selected Alternatives List */}
                                            {item.alternatives.length > 0 && (
                                                <div className="mt-0 space-y-1.5 px-6 pb-4 border-t border-slate-100">
                                                    <div className="flex items-center gap-2 py-2">
                                                        <Badge className="bg-slate-700 text-[8px] font-black tracking-[0.15em] px-2 py-0.5 rounded-md uppercase">
                                                            {item.alternatives.length} Alternatif Ditawarkan
                                                        </Badge>
                                                    </div>
                                                    {item.alternatives.map((alt) => (
                                                        <div key={alt.productSku} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl hover:border-slate-300 transition-all group/alt shadow-sm">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                                    {alt.image ? <img src={alt.image} className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-300" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="text-[11px] font-black text-slate-900 tracking-tight line-clamp-1">{alt.productName}</div>
                                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{alt.productSku}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <div className="text-[11px] font-black text-slate-700">Rp {fmtPrice(alt.price)}</div>
                                                                {isAdminEditable && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 px-2 rounded-lg text-[9px] font-black uppercase text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0"
                                                                        onClick={() => removeAlternative(item.id, alt.productSku)}
                                                                    >
                                                                        <Trash2 className="w-3 h-3 mr-1" /> Batal
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>



                            {/* Pricing Summary */}
                            <div className="border-t border-slate-100 bg-white rounded-b-[2rem]">
                                <div className="px-6 py-6 space-y-6">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">SUBTOTAL</span>
                                        <span className="text-sm font-black text-slate-900">Rp {fmtPrice(originalTotal)}</span>
                                    </div>

                                    {isAdminEditable && (
                                        <div className="space-y-3 pt-4 border-t border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Diskon Spesial SQ</Label>
                                                <span className="text-[9px] font-bold text-slate-400">Gunakan &quot;+&quot; untuk diskon bertahap (Mis: 10+5)</span>
                                            </div>
                                            <div className="relative group/disc">
                                                <BadgePercent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/disc:text-red-600 transition-colors pointer-events-none" />
                                                <Input
                                                    type="text"
                                                    value={specialDiscount}
                                                    onChange={(e) => setSpecialDiscount(e.target.value)}
                                                    placeholder="0 (Contoh: 10 atau 10+5)"
                                                    className="pl-10 bg-slate-50 border-slate-200 text-slate-900 font-black rounded-xl focus:ring-red-500 h-10 text-sm transition-all w-full shadow-inner"
                                                />
                                            </div>
                                            {effectiveTotalPercent > 0 && (
                                                <div className="flex justify-between items-center p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Potongan Terhitung</span>
                                                        <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter">
                                                            {specialDiscount.includes('+')
                                                                ? `${specialDiscount} → Eff: ${effectiveTotalPercent.toFixed(2)}%`
                                                                : `${effectiveTotalPercent}%`
                                                            }
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-black text-red-600">- Rp {fmtPrice(discountAmount)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col items-end justify-end pt-4 border-t-2 border-slate-900/5">
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Net Penawaran (Inc. PPN)</div>
                                        <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1.5 animate-in fade-in slide-in-from-right-1">
                                            <span className="text-sm text-red-600">Rp</span>
                                            <span>{fmtPrice(finalTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>


                {/* Right Column (Sidebar) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Quotation Global Notes (Internal) */}
                    {isEditable && (
                        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 py-4">
                                <CardTitle className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2 text-slate-700">
                                    <MessageSquare className="w-3.5 h-3.5 text-red-600" /> Catatan Admin (Internal)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Tambahkan catatan khusus untuk tim..."
                                    className="min-h-[100px] text-xs font-bold border-slate-200 focus-visible:ring-red-500 rounded-2xl bg-slate-50/20"
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Activity Log Card */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem] sticky top-6">
                        <CardHeader className="bg-white border-b border-slate-100/80 py-4">
                            <CardTitle className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2 text-slate-700">
                                <History className="w-3.5 h-3.5 text-red-600" /> Log Aktivitas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ScrollArea className="h-[calc(100vh-500px)] min-h-[300px]">
                                <div className="space-y-6 pl-2">
                                    {(quotation.activities || []).map((activity: any, idx: number) => (
                                        <div key={activity.id || idx} className="relative pl-6 pb-2">
                                            {idx !== (quotation.activities?.length || 0) - 1 && (
                                                <div className="absolute left-[7px] top-6 bottom-[-24px] w-[2px] bg-slate-100" />
                                            )}
                                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-2 ring-slate-100 bg-slate-300 z-10" />
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">{activity.title}</span>
                                                    <span className="text-[9px] font-bold text-slate-400">{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: localeId })}</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-700 leading-relaxed">{activity.description}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User className="w-2.5 h-2.5 text-slate-400" />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Oleh: {activity.performedBy || "System"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(quotation.activities || []).length === 0 && (
                                        <div className="text-center py-10">
                                            <Clock className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada aktivitas tercatat</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Final Action */}
                    {isEditable && (
                        <Card className="border-none shadow-xl bg-slate-900 overflow-hidden rounded-[2rem] ring-1 ring-slate-800">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/20">
                                            <Send className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Tahap Akhir</span>
                                            <h3 className="text-sm font-black text-white uppercase tracking-tight">
                                                {isOffered ? "Kirim Update Penawaran" : "Kirim Penawaran Resmi"}
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed">Setelah dikirim, status akan berubah menjadi <span className="text-red-400 uppercase">OFFERED</span>. Customer akan menerima email &amp; notifikasi WhatsApp.</p>
                                    <Button
                                        onClick={handleSubmitOffer}
                                        disabled={isSubmitting || isSaving}
                                        className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-red-900/40 transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-3" />}
                                        {isOffered ? "Update & Kirim" : "Kirim Sekarang"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
