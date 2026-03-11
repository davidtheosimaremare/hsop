"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Package,
    FileText,
    ArrowLeft,
    Clock,
    Download,
    FileDown,
    FileSpreadsheet,
    Send,
    ImageIcon,
    Trash2,
} from "lucide-react";
import { getQuotationDetail, sendDraftQuotation, deleteQuotationUser } from "@/app/actions/quotation";
import { exportQuotationPDF, exportQuotationExcel, type QuotationExportData, type ExportTemplate } from "@/lib/export-quotation";
import { getSiteSetting } from "@/app/actions/settings";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EstimasiDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [quotation, setQuotation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [template, setTemplate] = useState<ExportTemplate>({});
    const [showSendDialog, setShowSendDialog] = useState(false);
    const [showSendConfirmDialog, setShowSendConfirmDialog] = useState(false);
    const [quoteToSend, setQuoteToSend] = useState<any>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const result = await getQuotationDetail(id);
        if (result.success && result.quotation) {
            const quote = result.quotation;
            const targetSlug = quote.quotationNo.replace(/\//g, "-").toLowerCase();

            // If accessed via ID or different case/format, redirect to pretty URL
            if (id === quote.id || (id !== targetSlug && id.toLowerCase() !== targetSlug)) {
                router.replace(`/dashboard/estimasi/${targetSlug}`);
                return;
            }

            setQuotation(quote);
        } else {
            toast.error("Data estimasi tidak ditemukan");
            router.push("/dashboard/estimasi");
        }
        setIsLoading(false);
    }, [id, router]);

    const handleExportPDF = () => {
        if (!quotation) return;
        const exportData = {
            ...quotation,
            quotationNo: quotation.quotationNo.replace('SQ-', 'EST-'),
            title: "ESTIMASI HARGA",
            typeLabel: "Nomor Estimasi",
            items: quotation.items.map((item: any) => {
                const status = item.stockStatus || (item.currentStock > 0 ? 'READY' : 'INDENT');
                return {
                    ...item,
                    stockStatus: status === 'READY' ? 'READY' : 'INDENT'
                };
            })
        };
        exportQuotationPDF(exportData as QuotationExportData, template);
    };

    const handleExportExcel = () => {
        if (!quotation) return;
        const exportData = {
            ...quotation,
            quotationNo: quotation.quotationNo.replace('SQ-', 'EST-'),
            title: "ESTIMASI HARGA",
            typeLabel: "Nomor Estimasi",
            items: quotation.items.map((item: any) => {
                const status = item.stockStatus || (item.currentStock > 0 ? 'READY' : 'INDENT');
                return {
                    ...item,
                    stockStatus: status === 'READY' ? 'READY' : 'INDENT'
                };
            })
        };
        exportQuotationExcel(exportData as QuotationExportData, template);
    };

    const loadTemplate = useCallback(async () => {
        try {
            const result = await getSiteSetting("export_template") as Record<string, string> | null;
            if (result) {
                setTemplate({
                    headerImage: result.headerImage || undefined,
                    footerImage: result.footerImage || undefined,
                });
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        loadData();
        loadTemplate();
    }, [loadData, loadTemplate]);

    const handleSendDraft = async (quote: any) => {
        if (!quote) return;
        if (quote.lastSentAt) {
            setQuoteToSend(quote);
            setShowSendConfirmDialog(true);
        } else {
            setShowSendDialog(true);
        }
    };

    const confirmSendDraft = async (id: string) => {
        setShowSendDialog(false);
        setShowSendConfirmDialog(false);
        setIsSending(true);
        const result = await sendDraftQuotation(id);
        if (result.success) {
            toast.success(`Permintaan penawaran telah terkirim! Nomor: ${result.newQuotationNo}`);
            router.push("/dashboard/transaksi"); // Redirect to transactions
        } else {
            toast.error(result.error || "Gagal mengirim penawaran");
        }
        setIsSending(false);
        setQuoteToSend(null);
    };

    const handleDelete = async () => {
        if (!quotation) return;
        setIsLoading(true);
        const result = await deleteQuotationUser(quotation.id);
        if (result.success) {
            toast.success("Estimasi berhasil dihapus");
            router.push("/dashboard/estimasi");
        } else {
            toast.error(result.error || "Gagal menghapus estimasi");
            setIsLoading(false);
        }
    };

    const formatPrice = (price: number) => new Intl.NumberFormat("id-ID").format(Math.round(price));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-sm text-gray-400">Memuat detail estimasi...</p>
            </div>
        );
    }

    if (!quotation) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => router.push("/dashboard/estimasi")}
                        className="rounded-full"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            Estimasi #{quotation.quotationNo.replace('SQ-', 'EST-')}
                            {quotation.lastSentAt && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold px-2 py-0">
                                    SUDAH DIKIRIM {quotation.sentQuotationNo || ""}
                                </Badge>
                            )}
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(quotation.createdAt), "dd MMMM yyyy HH:mm")}
                            </span>
                            {quotation.clientName && (
                                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    Proyek: {quotation.clientName}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-gray-600 hover:bg-gray-50 h-9 font-bold"
                        onClick={handleExportPDF}
                    >
                        <FileDown className="w-4 h-4 mr-2 text-red-500" />
                        Estimasi PDF
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-gray-600 hover:bg-gray-50 h-9 font-bold"
                        onClick={handleExportExcel}
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" />
                        Excel
                    </Button>
                    <Button
                        variant={quotation.lastSentAt ? "outline" : "red"}
                        size="sm"
                        className={`h-9 px-6 font-bold ${!quotation.lastSentAt && "shadow-lg shadow-red-100"}`}
                        disabled={isSending || quotation.lastSentAt}
                        onClick={() => handleSendDraft(quotation)}
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : quotation.lastSentAt ? (
                            <Package className="w-4 h-4 mr-2" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        {quotation.lastSentAt ? `Penawaran Sudah Dikirim ${quotation.sentQuotationNo || ""}` : "Lanjutkan ke Penawaran"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                        <Package className="w-4 h-4 text-gray-400" />
                        <h3 className="font-bold text-sm text-gray-900">Daftar Produk Estimasi</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/30">
                                <TableRow>
                                    <TableHead className="w-[80px] text-[10px] font-bold uppercase text-gray-500">Foto</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Produk</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 text-center">Status</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 text-center">Qty</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 text-right">Harga Satuan</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotation.items.map((item: any) => (
                                    <TableRow key={item.id} className="hover:bg-transparent">
                                        <TableCell>
                                            <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden flex items-center justify-center">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.productName} className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-gray-200" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{item.productName}</p>
                                                <p className="text-[10px] text-gray-400 font-mono italic">{item.brand} • {item.productSku}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {(() => {
                                                // Priority 1: Use saved status from DB
                                                // Priority 2: Fallback to current real-time stock
                                                const status = item.stockStatus || (item.currentStock > 0 ? 'READY' : 'INDENT');

                                                if (status === 'READY') {
                                                    return (
                                                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100 whitespace-nowrap">
                                                            READY STOCK
                                                        </span>
                                                    );
                                                }
                                                if (status === 'INDENT') {
                                                    return (
                                                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap">
                                                            INDENT
                                                        </span>
                                                    );
                                                }
                                                return <span className="text-[10px] text-gray-400">-</span>;
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-sm font-bold text-gray-700">
                                                {item.quantity}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className="text-sm text-gray-600">Rp {formatPrice(item.price)}</p>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className="text-sm font-black text-gray-900">
                                                Rp {formatPrice(item.price * item.quantity)}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="bg-gray-50/50 px-6 py-6 border-t border-gray-100 flex justify-end">
                        <div className="w-full sm:w-64 space-y-2">
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Subtotal Produk</span>
                                <span className="font-medium">Rp {formatPrice(quotation.totalAmount || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>PPN (11% Incl.)</span>
                                <span className="font-medium">Termasuk</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900">Total Estimasi</span>
                                <span className="text-xl font-black text-red-600">
                                    Rp {formatPrice(quotation.totalAmount || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`border rounded-xl p-4 flex items-start gap-3 ${quotation.lastSentAt ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${quotation.lastSentAt ? "bg-green-100" : "bg-red-100"}`}>
                        {quotation.lastSentAt ? <Package className="w-4 h-4 text-green-600" /> : <FileText className="w-4 h-4 text-red-600" />}
                    </div>
                    <div className="space-y-1">
                        <p className={`text-sm font-bold ${quotation.lastSentAt ? "text-green-900" : "text-red-900"}`}>
                            {quotation.lastSentAt ? "Estimasi Telah Dikirim" : "Informasi RFQ"}
                        </p>
                        <p className={`text-xs leading-relaxed ${quotation.lastSentAt ? "text-green-700" : "text-red-700"}`}>
                            {quotation.lastSentAt ? (
                                <>
                                    Estimasi ini telah dikirim ke tim kami untuk diproses menjadi penawaran resmi dengan nomor <strong>{quotation.sentQuotationNo || ""}</strong>.
                                    Anda dapat melihat status permintaan penawaran ini di menu <strong>"Transaksi"</strong>.
                                </>
                            ) : (
                                <>
                                    Klik tombol <strong>"Lanjutkan ke Penawaran"</strong> untuk mengirim data estimasi ini ke tim kami.
                                    Admin akan meninjau ketersediaan stok dan memberikan konfirmasi harga penawaran resmi kepada Anda.
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* First-time Send Dialog */}
            <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Send className="w-6 h-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-center text-lg font-bold text-gray-900">
                            Lanjutkan ke Penawaran?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-sm text-gray-500">
                            Estimasi ini akan dikirim ke tim sales untuk diproses menjadi penawaran harga resmi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel
                            onClick={() => setShowSendDialog(false)}
                            className="h-10 px-4 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmSendDraft(quotation.id)}
                            className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white font-medium"
                            disabled={isSending}
                        >
                            {isSending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Ya, Lanjutkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Re-send Confirmation Dialog */}
            <AlertDialog open={showSendConfirmDialog} onOpenChange={setShowSendConfirmDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Send className="w-6 h-6 text-blue-600" />
                        </div>
                        <AlertDialogTitle className="text-center text-lg font-bold text-gray-900">
                            Kirim Penawaran Lagi?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-sm text-gray-500">
                            Estimasi ini sudah pernah dikirimkan sebelumnya. Ingin membuat permintaan penawaran baru dengan daftar produk yang sama?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel
                            onClick={() => {
                                setShowSendConfirmDialog(false);
                                setQuoteToSend(null);
                            }}
                            className="h-10 px-4 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmSendDraft(quotation.id)}
                            className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white font-medium"
                            disabled={isSending}
                        >
                            {isSending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Ya, Kirim Baru
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog for Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-center text-lg font-bold text-gray-900">
                            Hapus Estimasi ini?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-sm text-gray-500">
                            Tindakan ini tidak dapat dibatalkan. Estimasi ini akan dihapus secara permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel
                            onClick={() => setShowDeleteDialog(false)}
                            className="h-10 px-4 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white font-medium"
                        >
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
