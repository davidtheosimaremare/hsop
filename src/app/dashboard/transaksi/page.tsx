"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ShoppingCart, Truck, CheckCircle2, ChevronDown, ChevronUp, Clock, Loader2, Download, FileSpreadsheet, Package, XCircle, Send, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getUserQuotations } from "@/app/actions/quotation";
import { exportQuotationPDF, exportQuotationExcel, type QuotationExportData, type ExportTemplate } from "@/lib/export-quotation";
import { getSiteSetting } from "@/app/actions/settings";
import { format } from "date-fns";

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 mb-6 bg-red-50 rounded-full flex items-center justify-center">
                <Icon className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                {description}
            </p>
            <Link href="/pencarian">
                <Button className="bg-red-600 hover:bg-red-700 text-white px-6">
                    Mulai Belanja
                </Button>
            </Link>
        </div>
    );
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
    PROCESSED: "bg-blue-100 text-blue-800 border-blue-200",
    OFFERED: "bg-purple-100 text-purple-800 border-purple-200",
    CONFIRMED: "bg-indigo-100 text-indigo-800 border-indigo-200",
    SHIPPED: "bg-sky-100 text-sky-800 border-sky-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Menunggu",
    PROCESSING: "Diproses",
    PROCESSED: "Diproses",
    OFFERED: "Penawaran Masuk",
    CONFIRMED: "Pesanan Dikonfirmasi",
    SHIPPED: "Dikirim",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
};

function QuotationCard({ quotation, template }: { quotation: any; template?: ExportTemplate }) {
    const [isOpen, setIsOpen] = useState(false);
    const formatPrice = (price: number) => new Intl.NumberFormat("id-ID").format(Math.round(price));

    const isOffered = ["OFFERED", "CONFIRMED", "SHIPPED", "COMPLETED"].includes(quotation.status);
    const hasDiscount = quotation.specialDiscount && quotation.specialDiscount > 0;
    const discountAmount = hasDiscount ? quotation.totalAmount * (quotation.specialDiscount / 100) : 0;
    const finalTotal = quotation.totalAmount - discountAmount;

    const handleDownloadPDF = (e: React.MouseEvent) => {
        e.stopPropagation();
        exportQuotationPDF(quotation as QuotationExportData, template);
    };

    const handleDownloadExcel = (e: React.MouseEvent) => {
        e.stopPropagation();
        exportQuotationExcel(quotation as QuotationExportData, template);
    };

    return (
        <div className={`border rounded-xl overflow-hidden bg-white ${quotation.status === "OFFERED" ? 'border-purple-200 ring-1 ring-purple-100' :
            quotation.status === "CONFIRMED" ? 'border-indigo-200 ring-1 ring-indigo-100' :
                quotation.status === "SHIPPED" ? 'border-sky-200 ring-1 ring-sky-100' :
                    'border-gray-200'
            }`}>
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-sm font-mono font-bold text-gray-800">
                            {quotation.quotationNo}
                        </span>
                        <Badge
                            variant="outline"
                            className={`text-xs px-2.5 py-0.5 ${STATUS_COLORS[quotation.status] || "bg-gray-100 text-gray-800"}`}
                        >
                            {STATUS_LABELS[quotation.status] || quotation.status}
                        </Badge>
                        {quotation.status === "OFFERED" && (
                            <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                <Send className="w-3 h-3" /> Baru
                            </span>
                        )}
                        {quotation.status === "SHIPPED" && quotation.trackingNumber && (
                            <span className="flex items-center gap-1 text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                                <Truck className="w-3 h-3" /> {quotation.trackingNumber}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {format(new Date(quotation.createdAt), "dd/MM/yyyy HH:mm")}
                        </span>
                        <span>{quotation.items.length} produk</span>
                        {quotation.offeredAt && (
                            <span className="text-purple-600 text-xs">
                                Ditawarkan: {format(new Date(quotation.offeredAt), "dd/MM/yyyy")}
                            </span>
                        )}
                        {quotation.shippedAt && (
                            <span className="text-sky-600 text-xs">
                                Dikirim: {format(new Date(quotation.shippedAt), "dd/MM/yyyy")}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        {hasDiscount ? (
                            <>
                                <p className="text-xs text-gray-400 line-through">
                                    Rp {formatPrice(quotation.totalAmount)}
                                </p>
                                <p className="text-base font-bold text-red-600">
                                    Rp {formatPrice(finalTotal)}
                                </p>
                            </>
                        ) : (
                            <p className="text-base font-bold text-gray-900">
                                Rp {formatPrice(quotation.totalAmount)}
                            </p>
                        )}
                    </div>
                    {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </button>

            {/* Expandable Items */}
            {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-5 space-y-3">
                        {/* Items */}
                        {quotation.items.map((item: any, idx: number) => (
                            <div
                                key={item.id}
                                className={`flex items-center gap-4 text-sm bg-white rounded-lg px-4 py-3 border ${isOffered
                                    ? item.isAvailable === true
                                        ? 'border-green-100'
                                        : item.isAvailable === false
                                            ? 'border-red-100 bg-red-50/30'
                                            : 'border-gray-100'
                                    : 'border-gray-100'
                                    }`}
                            >
                                <div className="w-6 text-gray-400">{idx + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 line-clamp-1">{item.productName}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.brand} • {item.productSku}</p>
                                    {item.adminNote && (
                                        <p className="text-xs text-blue-600 mt-1 italic">📝 {item.adminNote}</p>
                                    )}
                                </div>
                                <div className="text-right text-gray-600 w-28">
                                    Rp {formatPrice(item.price)}
                                </div>
                                <div className="text-center text-gray-900 font-semibold w-12">
                                    {item.quantity}
                                </div>
                                <div className="text-right font-bold text-gray-900 w-32">
                                    Rp {formatPrice(item.price * item.quantity)}
                                </div>
                                {isOffered && (
                                    <div className="w-28 text-center">
                                        {item.isAvailable === true && (
                                            <span className="inline-flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> Tersedia
                                            </span>
                                        )}
                                        {item.isAvailable === false && (
                                            <span className="inline-flex items-center gap-1 text-red-600 text-xs bg-red-50 px-2 py-1 rounded-full">
                                                <XCircle className="w-3 h-3" /> Tidak
                                            </span>
                                        )}
                                        {item.isAvailable == null && (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Discount Info */}
                        {hasDiscount && (
                            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-700">
                                <Tag className="w-4 h-4" />
                                <span>Diskon Spesial: <strong>{quotation.specialDiscount}%</strong> (-Rp {formatPrice(discountAmount)})</span>
                            </div>
                        )}

                        {/* Shipping Cost Info */}
                        {(quotation.shippingCost > 0 || quotation.freeShipping) && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
                                <Truck className="w-4 h-4" />
                                <span>Ongkos Kirim: <strong>{quotation.freeShipping ? "GRATIS (Ditanggung Toko)" : `Rp ${formatPrice(quotation.shippingCost)}`}</strong></span>
                            </div>
                        )}

                        {/* Admin Notes */}
                        {quotation.adminNotes && (
                            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                                <Send className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-blue-800">Catatan dari Tim Sales:</p>
                                    <p className="mt-1">{quotation.adminNotes}</p>
                                </div>
                            </div>
                        )}

                        {/* Tracking Info */}
                        {quotation.trackingNumber && (
                            <div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-100 rounded-lg text-sm text-sky-700">
                                <Truck className="w-4 h-4" />
                                <div>
                                    <span>No. Resi: <strong>{quotation.trackingNumber}</strong></span>
                                    {quotation.shippingNotes && (
                                        <p className="text-xs text-sky-500 mt-1">{quotation.shippingNotes}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Total */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                            {/* Download Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadPDF}
                                    className="text-sm h-10 px-4 border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadExcel}
                                    className="text-sm h-10 px-4 border-green-200 text-green-600 hover:bg-green-50"
                                >
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Excel
                                </Button>
                            </div>

                            {/* Total Amount */}
                            <div className="text-right">
                                {hasDiscount && (
                                    <p className="text-xs text-gray-400 line-through">Rp {formatPrice(quotation.totalAmount)}</p>
                                )}
                                <p className="text-sm text-gray-500">Total Tagihan</p>
                                <p className="text-lg font-bold text-red-600">
                                    Rp {formatPrice(finalTotal + (quotation.freeShipping ? 0 : (quotation.shippingCost || 0)))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TransaksiPage() {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [template, setTemplate] = useState<ExportTemplate>({});

    useEffect(() => {
        loadQuotations();
        loadTemplate();
    }, []);

    const loadQuotations = async () => {
        setIsLoading(true);
        const result = await getUserQuotations();
        if (result.success) {
            setQuotations(result.quotations);
        }
        setIsLoading(false);
    };

    const loadTemplate = async () => {
        try {
            const result = await getSiteSetting("export_template") as Record<string, string> | null;
            if (result) {
                setTemplate({
                    headerImage: result.headerImage || undefined,
                    footerImage: result.footerImage || undefined,
                });
            }
        } catch (e) { /* use defaults */ }
    };

    // Group quotations by tabs
    const penawaranQuotations = quotations.filter(q =>
        ["PENDING", "PROCESSING", "OFFERED"].includes(q.status)
    );
    const pesananQuotations = quotations.filter(q => q.status === "CONFIRMED");
    const dikirimQuotations = quotations.filter(q => q.status === "SHIPPED");
    const selesaiQuotations = quotations.filter(q => q.status === "COMPLETED");

    const offeredCount = quotations.filter(q => q.status === "OFFERED").length;
    const confirmedCount = pesananQuotations.length;
    const shippedCount = dikirimQuotations.length;

    // Sort: OFFERED first within penawaran tab
    const sortedPenawaran = [...penawaranQuotations].sort((a, b) => {
        if (a.status === "OFFERED" && b.status !== "OFFERED") return -1;
        if (a.status !== "OFFERED" && b.status === "OFFERED") return 1;
        return 0;
    });

    const renderList = (list: any[], emptyIcon: React.ElementType, emptyTitle: string, emptyDesc: string) => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Memuat data...</p>
                </div>
            );
        }
        if (list.length === 0) {
            return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDesc} />;
        }
        return (
            <div className="space-y-3">
                {list.map((q) => (
                    <QuotationCard key={q.id} quotation={q} template={template} />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Transaksi</h2>

            <Tabs defaultValue="penawaran" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg h-auto">
                    <TabsTrigger
                        value="penawaran"
                        className="flex items-center gap-1.5 text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-md relative"
                    >
                        <FileText className="w-4 h-4 hidden sm:block" />
                        <span>Penawaran</span>
                        {offeredCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                {offeredCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="pesanan"
                        className="flex items-center gap-1.5 text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-md relative"
                    >
                        <ShoppingCart className="w-4 h-4 hidden sm:block" />
                        <span>Pesanan</span>
                        {confirmedCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                {confirmedCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="dikirim"
                        className="flex items-center gap-1.5 text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-md relative"
                    >
                        <Truck className="w-4 h-4 hidden sm:block" />
                        <span>Dikirim</span>
                        {shippedCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-sky-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                {shippedCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="selesai"
                        className="flex items-center gap-1.5 text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-md"
                    >
                        <CheckCircle2 className="w-4 h-4 hidden sm:block" />
                        <span>Selesai</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="penawaran" className="mt-6">
                    {renderList(
                        sortedPenawaran,
                        FileText,
                        "Belum Ada Permintaan Penawaran",
                        "Cari produk yang Anda butuhkan, lalu ajukan permintaan penawaran harga."
                    )}
                </TabsContent>

                <TabsContent value="pesanan" className="mt-6">
                    {renderList(
                        pesananQuotations,
                        ShoppingCart,
                        "Belum Ada Pesanan",
                        "Pesanan yang telah dikonfirmasi akan muncul di sini."
                    )}
                </TabsContent>

                <TabsContent value="dikirim" className="mt-6">
                    {renderList(
                        dikirimQuotations,
                        Truck,
                        "Belum Ada Pengiriman",
                        "Pesanan yang sedang dikirim akan muncul di sini beserta nomor resi."
                    )}
                </TabsContent>

                <TabsContent value="selesai" className="mt-6">
                    {renderList(
                        selesaiQuotations,
                        CheckCircle2,
                        "Belum Ada Pesanan Selesai",
                        "Pesanan yang sudah diterima akan muncul di sini."
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
