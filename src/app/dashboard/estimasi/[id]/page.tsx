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
    Send,
    ImageIcon,
} from "lucide-react";
import { getQuotationDetail, sendDraftQuotation } from "@/app/actions/quotation";
import { exportQuotationPDF, type QuotationExportData, type ExportTemplate } from "@/lib/export-quotation";
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

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const result = await getQuotationDetail(id);
        if (result.success && result.quotation) {
            setQuotation(result.quotation);
        } else {
            toast.error("Data estimasi tidak ditemukan");
            router.push("/dashboard/estimasi");
        }
        setIsLoading(false);
    }, [id, router]);

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

    const handleSendDraft = async () => {
        setShowSendDialog(false);
        setIsSending(true);
        const result = await sendDraftQuotation(id);
        if (result.success) {
            toast.success(`Permintaan penawaran telah terkirim! Nomor: ${result.newQuotationNo}`);
            router.push("/dashboard/transaksi"); // Redirect to transactions with new RFQ number
        } else {
            toast.error(result.error || "Gagal mengirim penawaran");
        }
        setIsSending(false);
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
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(quotation.createdAt), "dd MMMM yyyy HH:mm")}
                            </span>
                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 py-0 h-5">
                                DRAFT
                            </Badge>
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
                        className="border-red-100 text-red-600 hover:bg-red-50 h-9"
                        onClick={() => exportQuotationPDF(quotation as QuotationExportData, template)}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                    </Button>
                    <Button
                        variant="red"
                        size="sm"
                        className="h-9 shadow-lg shadow-red-100 px-6 font-bold"
                        disabled={isSending}
                        onClick={() => setShowSendDialog(true)}
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        Lanjutkan ke Penawaran
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

                <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-red-900">Informasi RFQ</p>
                        <p className="text-xs text-red-700 leading-relaxed">
                            Klik tombol <strong>"Lanjutkan ke Penawaran"</strong> untuk mengirim data estimasi ini ke tim kami.
                            Admin akan meninjau ketersediaan stok dan memberikan konfirmasi harga penawaran resmi kepada Anda.
                        </p>
                    </div>
                </div>
            </div>

            {/* AlertDialog for Send Confirmation */}
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
                            onClick={handleSendDraft}
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
        </div>
    );
}
