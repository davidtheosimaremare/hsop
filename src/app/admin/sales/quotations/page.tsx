"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileCheck, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Mail, Phone, Download, FileSpreadsheet, Loader2, RefreshCw, Package, Send, Truck, ShieldCheck } from "lucide-react";
import { getAllQuotations, updateQuotationStatus, processQuotation, confirmQuotationOrder, shipQuotationOrder, completeQuotationOrder } from "@/app/actions/quotation";
import { getSiteSetting } from "@/app/actions/settings";
import { exportQuotationPDF, exportQuotationExcel, type QuotationExportData, type ExportTemplate } from "@/lib/export-quotation";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Menunggu", color: "text-yellow-700", bg: "bg-yellow-100 border-yellow-200" },
    PROCESSING: { label: "Diproses", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
    PROCESSED: { label: "Diproses", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
    OFFERED: { label: "Ditawarkan", color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
    CONFIRMED: { label: "Pesanan Dikonfirmasi", color: "text-indigo-700", bg: "bg-indigo-100 border-indigo-200" },
    SHIPPED: { label: "Dikirim", color: "text-sky-700", bg: "bg-sky-100 border-sky-200" },
    COMPLETED: { label: "Selesai", color: "text-green-700", bg: "bg-green-100 border-green-200" },
    CANCELLED: { label: "Dibatalkan", color: "text-red-700", bg: "bg-red-100 border-red-200" },
};

function QuotationRow({ q, template, onStatusChange }: { q: any; template?: ExportTemplate; onStatusChange: () => void }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showShipDialog, setShowShipDialog] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [shippingNotes, setShippingNotes] = useState("");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [shippingCost, setShippingCost] = useState("");
    const [freeShipping, setFreeShipping] = useState(false);
    const fmtPrice = (p: number) => new Intl.NumberFormat("id-ID").format(Math.round(p));
    const status = STATUS_CONFIG[q.status] || STATUS_CONFIG.PENDING;

    const handleStatus = async (newStatus: string) => {
        setIsUpdating(true);
        await updateQuotationStatus(q.id, newStatus);
        setIsUpdating(false);
        onStatusChange();
    };

    const handleProcess = async () => {
        setIsUpdating(true);
        const result = await processQuotation(q.id);
        setIsUpdating(false);
        if (result.success) {
            router.push(`/admin/sales/quotations/${q.id}`);
        }
    };

    const handleConfirm = async () => {
        setIsUpdating(true);
        const cost = freeShipping ? 0 : parseInt(shippingCost.replace(/\D/g, "") || "0");
        await confirmQuotationOrder(q.id, cost, freeShipping);
        setIsUpdating(false);
        setShowConfirmDialog(false);
        onStatusChange();
    };

    const handleShip = async () => {
        setIsUpdating(true);
        await shipQuotationOrder(q.id, trackingNumber, shippingNotes);
        setIsUpdating(false);
        setShowShipDialog(false);
        setTrackingNumber("");
        setShippingNotes("");
        onStatusChange();
    };

    const handleComplete = async () => {
        setIsUpdating(true);
        await completeQuotationOrder(q.id);
        setIsUpdating(false);
        onStatusChange();
    };

    return (
        <>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {/* Row Header */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full grid grid-cols-12 items-center gap-3 p-5 hover:bg-gray-50 transition-colors text-left"
                >
                    <div className="col-span-2 font-mono font-semibold text-gray-800 text-sm">
                        {q.quotationNo}
                    </div>
                    <div className="col-span-3 min-w-0">
                        <p className="text-gray-900 truncate font-medium text-sm">{q.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{q.phone}</p>
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">
                        {format(new Date(q.createdAt), "dd/MM/yyyy HH:mm")}
                    </div>
                    <div className="col-span-1 text-center">
                        <span className="text-sm text-gray-600">{q.items.length}</span>
                    </div>
                    <div className="col-span-2 text-right font-semibold text-gray-900 text-base">
                        Rp {fmtPrice(q.totalAmount)}
                    </div>
                    <div className="col-span-1 text-center">
                        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${status.bg} ${status.color}`}>
                            {status.label}
                        </Badge>
                    </div>
                    <div className="col-span-1 text-right">
                        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 inline" /> : <ChevronDown className="w-5 h-5 text-gray-400 inline" />}
                    </div>
                </button>

                {/* Expanded Detail */}
                {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                        {/* Customer Info */}
                        <div className="flex gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{q.email}</span>
                            <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{q.phone}</span>
                            <span>{q.userId ? "Customer Terdaftar" : "Guest"}</span>
                        </div>

                        {/* Items Table */}
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr className="text-gray-500 uppercase text-xs">
                                        <th className="py-3 px-4 text-left w-10">#</th>
                                        <th className="py-3 px-4 text-left">SKU</th>
                                        <th className="py-3 px-4 text-left">Produk</th>
                                        <th className="py-3 px-4 text-left">Brand</th>
                                        <th className="py-3 px-4 text-center">Qty</th>
                                        <th className="py-3 px-4 text-right">Harga</th>
                                        <th className="py-3 px-4 text-right">Subtotal</th>
                                        {["OFFERED", "CONFIRMED", "SHIPPED", "COMPLETED"].includes(q.status) && (
                                            <>
                                                <th className="py-3 px-4 text-center">Status</th>
                                                <th className="py-3 px-4 text-left">Catatan</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {q.items.map((item: any, idx: number) => (
                                        <tr key={item.id} className="border-t border-gray-100">
                                            <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                                            <td className="py-3 px-4 font-mono text-gray-600">{item.productSku}</td>
                                            <td className="py-3 px-4 text-gray-900">{item.productName}</td>
                                            <td className="py-3 px-4 text-gray-500">{item.brand}</td>
                                            <td className="py-3 px-4 text-center font-medium">{item.quantity}</td>
                                            <td className="py-3 px-4 text-right">Rp {fmtPrice(item.price)}</td>
                                            <td className="py-3 px-4 text-right font-semibold">Rp {fmtPrice(item.price * item.quantity)}</td>
                                            {["OFFERED", "CONFIRMED", "SHIPPED", "COMPLETED"].includes(q.status) && (
                                                <>
                                                    <td className="py-3 px-4 text-center">
                                                        {item.isAvailable === true && <span className="inline-flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="w-3 h-3" /> Tersedia</span>}
                                                        {item.isAvailable === false && <span className="inline-flex items-center gap-1 text-red-600 text-xs"><XCircle className="w-3 h-3" /> Tidak</span>}
                                                        {item.isAvailable == null && <span className="text-gray-400 text-xs">-</span>}
                                                    </td>
                                                    <td className="py-3 px-4 text-xs text-gray-600 max-w-[200px] truncate">{item.adminNote || "-"}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Special Discount */}
                        {q.specialDiscount && q.specialDiscount > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-700">
                                <Package className="w-4 h-4" />
                                <span>Diskon Spesial: <strong>{q.specialDiscount}%</strong></span>
                            </div>
                        )}

                        {/* Shipping Cost Info (if confirmed/shipped/completed) */}
                        {(q.shippingCost !== null || q.freeShipping) && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
                                <Truck className="w-4 h-4" />
                                <span>Ongkos Kirim: <strong>{q.freeShipping ? "GRATIS (Ditanggung Toko)" : `Rp ${fmtPrice(q.shippingCost)}`}</strong></span>
                            </div>
                        )}

                        {/* Admin Notes */}
                        {q.adminNotes && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                                <Send className="w-4 h-4" />
                                <span>Catatan Admin: {q.adminNotes}</span>
                            </div>
                        )}

                        {/* Tracking Info */}
                        {q.trackingNumber && (
                            <div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-100 rounded-lg text-sm text-sky-700">
                                <Truck className="w-4 h-4" />
                                <span>No. Resi: <strong>{q.trackingNumber}</strong></span>
                                {q.shippingNotes && <span className="text-sky-500 ml-2">({q.shippingNotes})</span>}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => exportQuotationPDF(q as QuotationExportData, template)} className="text-sm h-10 px-4 border-red-200 text-red-600 hover:bg-red-50">
                                    <Download className="w-4 h-4 mr-2" /> PDF
                                </Button>
                                <Button variant="outline" onClick={() => exportQuotationExcel(q as QuotationExportData, template)} className="text-sm h-10 px-4 border-green-200 text-green-600 hover:bg-green-50">
                                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                {q.status === "PENDING" && (
                                    <>
                                        <Button variant="outline" onClick={handleProcess} disabled={isUpdating} className="text-sm h-10 px-4 border-blue-200 text-blue-600 hover:bg-blue-50">
                                            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                                            Proses
                                        </Button>
                                        <Button variant="outline" onClick={() => handleStatus("CANCELLED")} disabled={isUpdating} className="text-sm h-10 px-4 border-red-200 text-red-600 hover:bg-red-50">
                                            Tolak
                                        </Button>
                                    </>
                                )}
                                {q.status === "PROCESSING" && (
                                    <Button variant="outline" onClick={() => router.push(`/admin/sales/quotations/${q.id}`)} className="text-sm h-10 px-4 border-blue-200 text-blue-600 hover:bg-blue-50">
                                        <Package className="w-4 h-4 mr-2" /> Lanjutkan Proses
                                    </Button>
                                )}
                                {q.status === "OFFERED" && (
                                    <Button variant="outline" onClick={() => setShowConfirmDialog(true)} disabled={isUpdating} className="text-sm h-10 px-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                        Konfirmasi Pesanan
                                    </Button>
                                )}
                                {q.status === "CONFIRMED" && (
                                    <Button variant="outline" onClick={() => setShowShipDialog(true)} disabled={isUpdating} className="text-sm h-10 px-4 border-sky-200 text-sky-600 hover:bg-sky-50">
                                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                                        Kirim Barang
                                    </Button>
                                )}
                                {q.status === "SHIPPED" && (
                                    <Button variant="outline" onClick={handleComplete} disabled={isUpdating} className="text-sm h-10 px-4 border-green-200 text-green-600 hover:bg-green-50">
                                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                        Selesai
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Dialog (Shipping Cost) */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Pesanan — {q.quotationNo}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-500">
                            Masukkan biaya ongkos kirim untuk pesanan ini. Kosongkan atau centang "Gratis Ongkir" jika tidak ada biaya.
                        </p>

                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="freeShipping"
                                checked={freeShipping}
                                onChange={(e) => {
                                    setFreeShipping(e.target.checked);
                                    if (e.target.checked) setShippingCost("");
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="freeShipping" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Gratis Ongkos Kirim (Ditanggung Toko)
                            </label>
                        </div>

                        {!freeShipping && (
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Biaya Ongkir (Rp)</label>
                                <Input
                                    type="number"
                                    placeholder="Contoh: 50000"
                                    value={shippingCost}
                                    onChange={(e) => setShippingCost(e.target.value)}
                                    min="0"
                                />
                            </div>
                        )}

                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Total Produk:</span>
                                <span className="font-medium">Rp {fmtPrice(q.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Ongkir:</span>
                                <span className="font-medium text-green-600">
                                    {freeShipping ? "GRATIS" : `+ Rp ${fmtPrice(parseInt(shippingCost || "0"))}`}
                                </span>
                            </div>
                            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
                                <span>Total Tagihan:</span>
                                <span>Rp {fmtPrice(q.totalAmount + (freeShipping ? 0 : parseInt(shippingCost || "0")))}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Batal</Button>
                        <Button onClick={handleConfirm} disabled={isUpdating} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                            Konfirmasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Ship Dialog */}
            <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Kirim Barang — {q.quotationNo}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nomor Resi (opsional)</label>
                            <Input
                                placeholder="Masukkan nomor resi pengiriman"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Catatan Pengiriman (opsional)</label>
                            <Textarea
                                placeholder="Nama ekspedisi, estimasi tiba, dll."
                                value={shippingNotes}
                                onChange={(e) => setShippingNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowShipDialog(false)}>Batal</Button>
                        <Button onClick={handleShip} disabled={isUpdating} className="bg-sky-600 hover:bg-sky-700 text-white">
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                            Konfirmasi Kirim
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function SalesQuotationsPage() {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [template, setTemplate] = useState<ExportTemplate>({});
    const [filter, setFilter] = useState<string>("ALL");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [qResult, tResult] = await Promise.all([
            getAllQuotations(),
            getSiteSetting("export_template") as Promise<Record<string, string> | null>,
        ]);
        if (qResult.success) setQuotations(qResult.quotations);
        if (tResult) setTemplate({ headerImage: tResult.headerImage || undefined, footerImage: tResult.footerImage || undefined });
        setIsLoading(false);
    };

    const filtered = filter === "ALL" ? quotations : quotations.filter(q => q.status === filter);
    const counts = {
        total: quotations.length,
        pending: quotations.filter(q => q.status === "PENDING").length,
        processing: quotations.filter(q => q.status === "PROCESSING").length,
        offered: quotations.filter(q => q.status === "OFFERED").length,
        confirmed: quotations.filter(q => q.status === "CONFIRMED").length,
        shipped: quotations.filter(q => q.status === "SHIPPED").length,
        completed: quotations.filter(q => q.status === "COMPLETED").length,
    };

    const statCards = [
        { key: "ALL", label: "Total", count: counts.total, icon: FileCheck, borderColor: "border-l-gray-400", iconBg: "bg-gray-100", iconColor: "text-gray-600", ringColor: "" },
        { key: "PENDING", label: "Menunggu", count: counts.pending, icon: Clock, borderColor: "border-l-yellow-500", iconBg: "bg-yellow-100", iconColor: "text-yellow-600", ringColor: "ring-yellow-300" },
        { key: "PROCESSING", label: "Diproses", count: counts.processing, icon: Package, borderColor: "border-l-blue-400", iconBg: "bg-blue-100", iconColor: "text-blue-500", ringColor: "ring-blue-300" },
        { key: "OFFERED", label: "Ditawarkan", count: counts.offered, icon: Send, borderColor: "border-l-purple-500", iconBg: "bg-purple-100", iconColor: "text-purple-600", ringColor: "ring-purple-300" },
        { key: "CONFIRMED", label: "Dikonfirmasi", count: counts.confirmed, icon: ShieldCheck, borderColor: "border-l-indigo-500", iconBg: "bg-indigo-100", iconColor: "text-indigo-600", ringColor: "ring-indigo-300" },
        { key: "SHIPPED", label: "Dikirim", count: counts.shipped, icon: Truck, borderColor: "border-l-sky-500", iconBg: "bg-sky-100", iconColor: "text-sky-600", ringColor: "ring-sky-300" },
        { key: "COMPLETED", label: "Selesai", count: counts.completed, icon: CheckCircle2, borderColor: "border-l-green-500", iconBg: "bg-green-100", iconColor: "text-green-600", ringColor: "ring-green-300" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Penawaran Penjualan</h1>
                    <p className="text-sm text-gray-500">Kelola permintaan penawaran harga dari customer</p>
                </div>
                <Button variant="outline" onClick={loadData} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {statCards.map(card => (
                    <Card
                        key={card.key}
                        className={`border-l-4 ${card.borderColor} cursor-pointer hover:shadow-md transition-shadow ${filter === card.key && card.key !== "ALL" ? `ring-2 ${card.ringColor}` : ""}`}
                        onClick={() => setFilter(f => f === card.key ? "ALL" : card.key)}
                    >
                        <CardContent className="pt-3 pb-3 px-3">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 ${card.iconBg} rounded-lg`}>
                                    <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold leading-none">{card.count}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{card.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 items-center gap-3 px-5 text-xs font-semibold text-gray-400 uppercase">
                <div className="col-span-2">No. SQ</div>
                <div className="col-span-3">Customer</div>
                <div className="col-span-2">Tanggal</div>
                <div className="col-span-1 text-center">Item</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1"></div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center py-16">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Memuat data...</p>
                </div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12 text-gray-500">
                        <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Belum ada penawaran</p>
                        <p className="text-sm">Penawaran dari customer akan muncul di sini</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filtered.map(q => (
                        <QuotationRow key={q.id} q={q} template={template} onStatusChange={loadData} />
                    ))}
                </div>
            )}
        </div>
    );
}
