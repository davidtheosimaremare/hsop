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
} from "lucide-react";
import { getQuotationDetail, processQuotation, submitQuotationOffer } from "@/app/actions/quotation";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Menunggu", color: "text-yellow-700", bg: "bg-yellow-100 border-yellow-200" },
    PROCESSING: { label: "Diproses", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
    OFFERED: { label: "Ditawarkan", color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
    COMPLETED: { label: "Selesai", color: "text-green-700", bg: "bg-green-100 border-green-200" },
    CANCELLED: { label: "Dibatalkan", color: "text-red-700", bg: "bg-red-100 border-red-200" },
};

interface ItemState {
    id: string;
    productSku: string;
    productName: string;
    brand: string;
    quantity: number;
    price: number;
    isAvailable: boolean | null;
    availableQty: number | null;
    adminNote: string;
    currentStock: number;
    currentPrice: number;
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
                    isAvailable: item.isAvailable,
                    availableQty: item.availableQty ?? item.currentStock,
                    adminNote: item.adminNote || "",
                    currentStock: item.currentStock,
                    currentPrice: item.currentPrice,
                }))
            );
            setAdminNotes(q.adminNotes || "");
            setSpecialDiscount(q.specialDiscount != null ? String(q.specialDiscount) : "");
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
            await loadData();
        }
        setIsProcessing(false);
    };

    const updateItem = (itemId: string, updates: Partial<ItemState>) => {
        setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    };

    const handleSubmitOffer = async () => {
        setIsSubmitting(true);
        const result = await submitQuotationOffer(id, {
            adminNotes: adminNotes || null,
            specialDiscount: specialDiscount ? parseFloat(specialDiscount) : null,
            items: items.map(item => ({
                id: item.id,
                isAvailable: item.isAvailable,
                availableQty: item.availableQty,
                adminNote: item.adminNote || null,
            })),
        });
        if (result.success) {
            router.push("/admin/sales/quotations");
        }
        setIsSubmitting(false);
    };

    // Calculate totals
    const originalTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountPercent = specialDiscount ? parseFloat(specialDiscount) : 0;
    const discountAmount = originalTotal * (discountPercent / 100);
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
    const isEditable = quotation.status === "PROCESSING";
    const isPending = quotation.status === "PENDING";

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/admin/sales/quotations")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">{quotation.quotationNo}</h1>
                            <Badge variant="outline" className={`text-xs px-2.5 py-1 ${status.bg} ${status.color}`}>
                                {status.label}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Dibuat: {format(new Date(quotation.createdAt), "dd MMM yyyy, HH:mm")}
                            {quotation.processedAt && (
                                <> · Diproses: {format(new Date(quotation.processedAt), "dd MMM yyyy, HH:mm")}</>
                            )}
                        </p>
                    </div>
                </div>

                {isPending && (
                    <Button
                        onClick={handleProcess}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                        Mulai Proses
                    </Button>
                )}
            </div>

            {/* Customer Info */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4" /> Informasi Customer
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{quotation.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{quotation.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{quotation.userId ? "Customer Terdaftar" : "Guest"}</span>
                        </div>
                    </div>
                    {quotation.notes && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800">
                            <strong>Catatan Customer:</strong> {quotation.notes}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Product Items */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Package className="w-4 h-4" /> Daftar Produk ({items.length} item)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-y border-gray-200">
                                <tr className="text-gray-500 text-xs uppercase">
                                    <th className="py-3 px-4 text-left w-10">#</th>
                                    <th className="py-3 px-4 text-left">Produk</th>
                                    <th className="py-3 px-4 text-center w-20">Qty</th>
                                    <th className="py-3 px-4 text-right w-28">Harga</th>
                                    <th className="py-3 px-4 text-center w-24">Stok</th>
                                    <th className="py-3 px-4 text-center w-32">Ketersediaan</th>
                                    <th className="py-3 px-4 text-left min-w-[200px]">Catatan Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => {
                                    const stockSufficient = item.currentStock >= item.quantity;
                                    return (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                            <td className="py-4 px-4 text-gray-400">{idx + 1}</td>
                                            <td className="py-4 px-4">
                                                <p className="font-medium text-gray-900">{item.productName}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    SKU: {item.productSku} · {item.brand}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4 text-center font-medium">{item.quantity}</td>
                                            <td className="py-4 px-4 text-right">
                                                <p className="font-medium">Rp {fmtPrice(item.price)}</p>
                                                <p className="text-xs text-gray-400">
                                                    Sub: Rp {fmtPrice(item.price * item.quantity)}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockSufficient ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                                    {stockSufficient ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                    {item.currentStock}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                {isEditable ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => updateItem(item.id, { isAvailable: true })}
                                                            className={`p-1.5 rounded-lg transition-colors ${item.isAvailable === true ? "bg-green-100 text-green-700 ring-2 ring-green-300" : "bg-gray-100 text-gray-400 hover:bg-green-50"}`}
                                                            title="Tersedia"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateItem(item.id, { isAvailable: false })}
                                                            className={`p-1.5 rounded-lg transition-colors ${item.isAvailable === false ? "bg-red-100 text-red-700 ring-2 ring-red-300" : "bg-gray-100 text-gray-400 hover:bg-red-50"}`}
                                                            title="Tidak Tersedia"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {item.isAvailable === true && (
                                                            <span className="inline-flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="w-3 h-3" /> Tersedia</span>
                                                        )}
                                                        {item.isAvailable === false && (
                                                            <span className="inline-flex items-center gap-1 text-red-600 text-xs"><XCircle className="w-3 h-3" /> Tidak Tersedia</span>
                                                        )}
                                                        {item.isAvailable == null && (
                                                            <span className="text-gray-400 text-xs">Belum dicek</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {isEditable ? (
                                                    <Textarea
                                                        value={item.adminNote}
                                                        onChange={(e) => updateItem(item.id, { adminNote: e.target.value })}
                                                        placeholder="Catatan untuk produk ini..."
                                                        className="min-h-[60px] text-xs resize-none"
                                                        rows={2}
                                                    />
                                                ) : (
                                                    <p className="text-xs text-gray-600">{item.adminNote || "-"}</p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Special Price & Admin Notes - only show when editable or when already set */}
            {(isEditable || quotation.specialDiscount || quotation.adminNotes) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Special Discount */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <BadgePercent className="w-4 h-4" /> Diskon Spesial
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isEditable ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                                        <Info className="w-4 h-4 flex-shrink-0" />
                                        <span>Diskon berlaku untuk total keseluruhan. Harga sudah termasuk PPN.</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Label className="text-sm text-gray-600 whitespace-nowrap">Diskon (%)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.5"
                                            value={specialDiscount}
                                            onChange={(e) => setSpecialDiscount(e.target.value)}
                                            placeholder="0"
                                            className="w-28"
                                        />
                                    </div>
                                    {discountPercent > 0 && (
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Total Awal</span>
                                                <span>Rp {fmtPrice(originalTotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-red-600">
                                                <span>Diskon ({discountPercent}%)</span>
                                                <span>- Rp {fmtPrice(discountAmount)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t">
                                                <span>Total Akhir</span>
                                                <span>Rp {fmtPrice(finalTotal)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm">
                                    {quotation.specialDiscount ? (
                                        <div className="space-y-1">
                                            <p>Diskon: <strong>{quotation.specialDiscount}%</strong></p>
                                            <p className="text-gray-500">
                                                Potongan: Rp {fmtPrice(originalTotal * (quotation.specialDiscount / 100))}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400">Tidak ada diskon spesial</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Admin Notes */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Catatan untuk Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isEditable ? (
                                <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Pesan untuk customer mengenai penawaran ini..."
                                    className="min-h-[120px] resize-none"
                                    rows={4}
                                />
                            ) : (
                                <p className="text-sm text-gray-600">{quotation.adminNotes || "Tidak ada catatan"}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Summary & Actions */}
            <Card className="border-t-4 border-t-red-500">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-6 text-sm">
                                <div>
                                    <span className="text-gray-500">Total Item:</span>{" "}
                                    <span className="font-semibold">{items.length} produk</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Total Qty:</span>{" "}
                                    <span className="font-semibold">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Tersedia:</span>{" "}
                                    <span className="font-semibold text-green-600">
                                        {items.filter(i => i.isAvailable === true).length}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Tidak Tersedia:</span>{" "}
                                    <span className="font-semibold text-red-600">
                                        {items.filter(i => i.isAvailable === false).length}
                                    </span>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                Total: Rp {fmtPrice(discountPercent > 0 ? finalTotal : originalTotal)}
                                {discountPercent > 0 && (
                                    <span className="text-sm font-normal text-red-600 ml-2">
                                        (diskon {discountPercent}%)
                                    </span>
                                )}
                            </div>
                        </div>

                        {isEditable && (
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/admin/sales/quotations")}
                                    className="border-gray-300"
                                >
                                    Kembali
                                </Button>
                                <Button
                                    onClick={handleSubmitOffer}
                                    disabled={isSubmitting}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Send className="w-4 h-4 mr-2" />
                                    )}
                                    Kirim Penawaran
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
