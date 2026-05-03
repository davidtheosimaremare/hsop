"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ShoppingCart, Truck, CheckCircle2, ChevronDown, ChevronUp, Clock, Loader2, Download, FileSpreadsheet, Package, XCircle, Send, Tag, Eye, ChevronLeft, ChevronRight, MoreHorizontal, ImageIcon, Trash, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getUserQuotations, sendDraftQuotation, cancelQuotation } from "@/app/actions/quotation";
import { exportQuotationPDF, exportQuotationExcel, type QuotationExportData, type ExportTemplate } from "@/lib/export-quotation";
import { getSiteSetting } from "@/app/actions/settings";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
            <Link prefetch={false}  href="/pencarian">
                <Button className="bg-red-600 hover:bg-red-700 text-white px-6">
                    Mulai Belanja
                </Button>
            </Link>
        </div>
    );
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
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
    DRAFT: "Draf Estimasi",
    PENDING: "Permintaan Penawaran",
    PROCESSING: "Pesanan diproses",
    PROCESSED: "Diproses",
    OFFERED: "Penawaran Tersedia",
    CONFIRMED: "Pesanan diproses",
    SHIPPED: "Dikirim",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
};

const CANCEL_REASONS = [
    "Ingin mengubah rincian pesanan (produk, jumlah, dll)",
    "Menemukan harga yang lebih murah di tempat lain",
    "Berubah pikiran / Tidak jadi beli",
    "Lainnya"
];


export default function TransaksiPage() {
    const router = useRouter();
    const [quotations, setQuotations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userType, setUserType] = useState<string | null>(null);
    const [template, setTemplate] = useState<ExportTemplate>({});
    const [activeTab, setActiveTab] = useState("penawaran");
    const [currentPage, setCurrentPage] = useState(1);
    const [isSending, setIsSending] = useState<string | null>(null);

    // Cancellation States
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [otherReason, setOtherReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);
    const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);

    const itemsPerPage = 10;

    useEffect(() => {
        loadQuotations();
        loadTemplate();
    }, []);

    const loadQuotations = async () => {
        setIsLoading(true);
        const result = await getUserQuotations();
        console.log("Quotations result:", result); // Debug log
        if (result.success && result.quotations) {
            // Filter out estimations, only show real transactions
            const realTransactions = result.quotations.filter((q: any) => q.isEstimation === false);
            setQuotations(realTransactions);
            if (result.userType) {
                setUserType(result.userType);
                console.log("User type set to:", result.userType);
            }
        } else {
            console.error("Failed to load quotations:", result.error);
            toast.error(result.error || "Gagal memuat transaksi");
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

    const handleSendRFQ = async (id: string) => {
        if (!confirm("Kirim permintaan penawaran ini sekarang?")) return;
        setIsSending(id);
        const result = await sendDraftQuotation(id);
        if (result.success) {
            toast.success("RFQ berhasil dikirim!");
            loadQuotations();
        } else {
            toast.error(result.error || "Gagal mengirim RFQ");
        }
        setIsSending(null);
    };

    const handleCancel = async () => {
        if (!selectedQuotationId) return;

        const finalReason = cancelReason === "Lainnya" ? otherReason : cancelReason;
        if (!finalReason) {
            toast.error("Silakan pilih atau masukkan alasan pembatalan");
            return;
        }

        setIsCancelling(true);
        const result = await cancelQuotation(selectedQuotationId, finalReason);
        if (result.success) {
            toast.success("Anda membatalkan pesanan ini. Proses pembatalan berhasil.");
            setIsCancelOpen(false);
            setCancelReason("");
            setOtherReason("");
            loadQuotations();
        } else {
            toast.error(result.error || "Gagal membatalkan penawaran");
        }
        setIsCancelling(false);
    };

    const formatPrice = (price: number) => new Intl.NumberFormat("id-ID").format(Math.round(price));

    const isRetail = userType
        ? (userType !== 'CORPORATE')
        : (quotations.length > 0
            ? quotations.some(q => q.customerType !== 'CORPORATE')
            : true); // Default to retail for safety/simplicity if no data yet

    console.log("User type:", userType, "Is Retail:", isRetail); // Debug log

    // Show PENDING/DRAFT/OFFERED/CANCELLED for ALL users
    const penawaranQuotations = quotations.filter(q =>
        ["PENDING", "DRAFT", "OFFERED", "CANCELLED"].includes(q.status)
    ).sort((a, b) => {
        if (a.status === 'CANCELLED' && b.status !== 'CANCELLED') return 1;
        if (a.status !== 'CANCELLED' && b.status === 'CANCELLED') return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Show CONFIRMED/PROCESSING/PROCESSED orders for ALL users
    const pesananQuotations = quotations.filter(q =>
        ["CONFIRMED", "PROCESSING", "PROCESSED"].includes(q.status)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const dikirimQuotations = quotations.filter(q => q.status === "SHIPPED");
    const selesaiQuotations = quotations.filter(q => q.status === "COMPLETED");

    const offeredCount = penawaranQuotations.filter(q => q.status !== 'CANCELLED').length;
    const confirmedCount = pesananQuotations.length;
    const shippedCount = dikirimQuotations.length;

    // Map active tab to list
    const getActiveList = () => {
        switch (activeTab) {
            case "penawaran": return penawaranQuotations;
            case "pesanan": return pesananQuotations;
            case "dikirim": return dikirimQuotations;
            case "selesai": return selesaiQuotations;
            default: return [];
        }
    };

    const currentList = getActiveList();
    const totalPages = Math.ceil(currentList.length / itemsPerPage);
    const paginatedList = currentList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getTransactionSlug = (q: any) => {
        const no = q.quotationNo || "";
        const toSlug = (s: string) => s.replace(/\//g, "-");
        const baseNo = no.replace(/^[A-Z]+\//, "");
        const fmt = (p: string) => toSlug(`${p}/${baseNo}`);

        if (["PENDING", "DRAFT"].includes(q.status)) return fmt("SQ");
        if (q.status === "OFFERED") return toSlug(q.accurateHsqNo || fmt("HSQ"));
        if (["CONFIRMED", "PROCESSING", "PROCESSED"].includes(q.status)) return toSlug(q.accurateHsoNo || fmt("HSO"));
        if (q.status === "SHIPPED") return toSlug(q.accurateDoNo || fmt("HDO"));
        if (q.status === "COMPLETED") return fmt("INV");
        return fmt("SQ");
    };

    const renderTable = (list: any[]) => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
                    <p className="text-sm text-gray-400 font-medium">Menyinkronkan transaksi...</p>
                </div>
            );
        }

        if (list.length === 0) {
            return (
                <div className="py-20 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-10 h-10 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm italic">Tidak ada data untuk kategori ini</p>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                <TableHead className="w-[180px] text-[11px] font-black uppercase tracking-wider text-gray-500 py-4">No. Transaksi</TableHead>
                                <TableHead className="text-[11px] font-black uppercase tracking-wider text-gray-500 py-4">Tanggal</TableHead>
                                <TableHead className="text-[11px] font-black uppercase tracking-wider text-gray-500 py-4">Produk</TableHead>
                                <TableHead className="text-[11px] font-black uppercase tracking-wider text-gray-500 py-4 text-right">Total Tagihan</TableHead>
                                <TableHead className="text-[11px] font-black uppercase tracking-wider text-gray-500 py-4 text-center">Status</TableHead>
                                <TableHead className="w-[80px] py-4"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {list.map((q) => {
                                const hasDiscount = q.specialDiscount && q.specialDiscount > 0;
                                const discountAmount = hasDiscount ? q.totalAmount * (q.specialDiscount / 100) : 0;
                                const finalTotal = q.totalAmount - discountAmount + (q.freeShipping ? 0 : (q.shippingCost || 0));

                                const isCancelled = q.status === 'CANCELLED';

                                return (
                                    <TableRow
                                        key={q.id}
                                        className={`group hover:bg-gray-50/80 transition-colors cursor-pointer ${isCancelled ? 'opacity-50 grayscale-[0.8] bg-slate-50/50' : ''}`}
                                        onClick={() => router.push(`/dashboard/transaksi/${getTransactionSlug(q)}`)}
                                    >
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 leading-none mb-1">
                                                    {(() => {
                                                        const no = q.quotationNo || "";
                                                        // Strip existing prefix (SQ/, RFQ/, etc.), rebuild with hyphenated one
                                                        const baseNo = no.replace(/^[A-Z]+\//, "").replace(/\//g, "-");
                                                        const fmt = (p: string) => `${p}-${baseNo}`;

                                                        if (q.status === 'PENDING' || q.status === 'DRAFT') return fmt('SQ');
                                                        if (q.status === 'OFFERED') return q.accurateHsqNo?.replace(/\//g, "-") || fmt('HSQ');
                                                        if (['CONFIRMED', 'PROCESSING', 'PROCESSED'].includes(q.status)) return q.accurateHsoNo?.replace(/\//g, "-") || fmt('HSO');
                                                        if (q.status === 'SHIPPED') return q.accurateDoNo?.replace(/\//g, "-") || fmt('HDO');
                                                        if (q.status === 'COMPLETED') return fmt('INV');
                                                        return fmt('SQ');
                                                    })()}
                                                </span>
                                                <div className="flex flex-col gap-0.5">
                                                    {q.status === 'PENDING' && (
                                                        <span className="text-[9px] text-emerald-600 font-black uppercase tracking-tighter">
                                                            Permintaan Penawaran Dikirim
                                                        </span>
                                                    )}
                                                    {q.status === 'OFFERED' && (
                                                        <span className="text-[9px] text-violet-600 font-black uppercase tracking-tighter">
                                                            Penawaran Tersedia
                                                        </span>
                                                    )}
                                                    {q.clientName && (
                                                        <span className="text-[10px] text-red-500 font-bold uppercase truncate max-w-[150px]">
                                                            {q.clientName}
                                                        </span>
                                                    )}

                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-700 font-medium">{format(new Date(q.createdAt), "dd MMM yyyy")}</span>
                                                <span className="text-[10px] text-gray-400">{format(new Date(q.createdAt), "HH:mm")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-3 overflow-hidden">
                                                    {q.items.slice(0, 3).map((item: any, i: number) => (
                                                        <div key={i} className="inline-block h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden ring-1 ring-gray-100">
                                                            {item.image ? (
                                                                <img src={item.image} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="h-4 w-4 text-gray-300" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-xs font-bold text-gray-500">
                                                    {q.items.length} Item
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black text-red-600">Rp {formatPrice(finalTotal)}</span>
                                                {hasDiscount && (
                                                    <span className="text-[10px] text-gray-400 line-through">Rp {formatPrice(q.totalAmount)}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold border-none ${STATUS_COLORS[q.status] || "bg-gray-100 text-gray-600"}`}
                                            >
                                                {STATUS_LABELS[q.status] || q.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-200/50">
                                                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-gray-100">
                                                    <Link prefetch={false}  href={`/dashboard/transaksi/${getTransactionSlug(q)}`}>
                                                        <DropdownMenuItem className="gap-2 cursor-pointer font-medium py-2">
                                                            <Eye className="w-4 h-4" /> Detail
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    <DropdownMenuItem
                                                        onClick={async () => exportQuotationPDF(q as QuotationExportData, template)}
                                                        className="gap-2 cursor-pointer font-medium py-2"
                                                    >
                                                        <Download className="w-4 h-4" /> PDF
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={async () => exportQuotationExcel(q as QuotationExportData, template)}
                                                        className="gap-2 cursor-pointer font-medium py-2"
                                                    >
                                                        <FileSpreadsheet className="w-4 h-4" /> Excel
                                                    </DropdownMenuItem>
                                                    {['PENDING', 'DRAFT', 'OFFERED'].includes(q.status) && (
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedQuotationId(q.id);
                                                                setIsCancelOpen(true);
                                                            }}
                                                            className="gap-2 cursor-pointer font-bold py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        >
                                                            <Trash className="w-4 h-4" /> Batalkan SQ
                                                        </DropdownMenuItem>
                                                    )}
                                                    {q.status === 'DRAFT' && (
                                                        <DropdownMenuItem
                                                            disabled={!!isSending}
                                                            onClick={() => handleSendRFQ(q.id)}
                                                            className="gap-2 cursor-pointer font-bold py-2 text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                                                        >
                                                            {isSending === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                            Kirim RFQ
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400 font-medium">
                            Menampilkan <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, currentList.length)}</span> dari <span className="text-gray-900">{currentList.length}</span> transaksi
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon-sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="h-8 w-8 rounded-lg border-gray-200"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center px-3">
                                <span className="text-xs font-black text-gray-900">{currentPage}</span>
                                <span className="text-xs font-medium text-gray-400 mx-1.5">/</span>
                                <span className="text-xs font-medium text-gray-400">{totalPages}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="h-8 w-8 rounded-lg border-gray-200"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm overflow-hidden">
            <Tabs
                defaultValue="draft"
                value={activeTab}
                className="w-full"
                onValueChange={(val) => {
                    setActiveTab(val);
                    setCurrentPage(1);
                }}
            >
                <div className="relative mb-8">
                    <TabsList className="bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/50 w-full h-auto flex flex-nowrap overflow-x-auto no-scrollbar gap-2 shadow-inner">
                        <TabsTrigger
                            value="penawaran"
                            className="flex-1 min-w-[120px] sm:min-w-0 flex items-center justify-center gap-2 py-3.5 px-3 text-xs sm:text-[13px] font-bold transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-violet-100 rounded-xl group/tab"
                        >
                            <FileText className="w-4 h-4 text-gray-400 group-data-[state=active]/tab:text-violet-500 transition-colors" />
                            <span>Penawaran</span>
                            {offeredCount > 0 && (
                                <span className="bg-violet-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                                    {offeredCount}
                                </span>
                            )}
                        </TabsTrigger>

                        <TabsTrigger
                            value="pesanan"
                            className="flex-1 min-w-[120px] sm:min-w-0 flex items-center justify-center gap-2 py-3.5 px-3 text-xs sm:text-[13px] font-bold transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-indigo-100 rounded-xl group/tab"
                        >
                            <ShoppingCart className="w-4 h-4 text-gray-400 group-data-[state=active]/tab:text-indigo-500 transition-colors" />
                            <span>Pesanan</span>
                            {confirmedCount > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                                    {confirmedCount}
                                </span>
                            )}
                        </TabsTrigger>

                        <TabsTrigger
                            value="dikirim"
                            className="flex-1 min-w-[120px] sm:min-w-0 flex items-center justify-center gap-2 py-3.5 px-3 text-xs sm:text-[13px] font-bold transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-sky-100 rounded-xl group/tab"
                        >
                            <Truck className="w-4 h-4 text-gray-400 group-data-[state=active]/tab:text-sky-500 transition-colors" />
                            <span>Dikirim</span>
                            {shippedCount > 0 && (
                                <span className="bg-sky-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                                    {shippedCount}
                                </span>
                            )}
                        </TabsTrigger>

                        <TabsTrigger
                            value="selesai"
                            className="flex-1 min-w-[120px] sm:min-w-0 flex items-center justify-center gap-2 py-3.5 px-3 text-xs sm:text-[13px] font-bold transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-emerald-100 rounded-xl group/tab"
                        >
                            <CheckCircle2 className="w-4 h-4 text-gray-400 group-data-[state=active]/tab:text-emerald-500 transition-colors" />
                            <span>Selesai</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <style jsx global>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>



                <TabsContent value="penawaran" className="mt-2 outline-none focus-visible:ring-0">
                    {renderTable(paginatedList)}
                </TabsContent>

                <TabsContent value="pesanan" className="mt-2 outline-none focus-visible:ring-0">
                    {renderTable(paginatedList)}
                </TabsContent>

                <TabsContent value="dikirim" className="mt-2 outline-none focus-visible:ring-0">
                    {renderTable(paginatedList)}
                </TabsContent>

                <TabsContent value="selesai" className="mt-2 outline-none focus-visible:ring-0">
                    {renderTable(paginatedList)}
                </TabsContent>
            </Tabs>

            {/* Cancellation Dialog */}
            <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                            <XCircle className="w-5 h-5 text-red-500" />
                            Batalkan SQ
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 mt-1">
                            Pilih alasan pembatalan untuk memproses pembatalan penawaran ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 pt-2 space-y-6">
                        <RadioGroup value={cancelReason} onValueChange={setCancelReason} className="space-y-4">
                            {CANCEL_REASONS.map((reason) => (
                                <div key={reason} className="flex items-center space-x-3 group">
                                    <RadioGroupItem value={reason} id={reason} className="border-gray-300 text-red-600 focus:ring-red-500" />
                                    <Label
                                        htmlFor={reason}
                                        className="text-sm font-medium text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors"
                                    >
                                        {reason}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>

                        {cancelReason === "Lainnya" && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                    Alasan Detail
                                </Label>
                                <Textarea
                                    placeholder="Tuliskan alasan lainnya..."
                                    value={otherReason}
                                    onChange={(e) => setOtherReason(e.target.value)}
                                    className="min-h-[100px] resize-none border-gray-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsCancelOpen(false);
                                setCancelReason("");
                                setOtherReason("");
                            }}
                            className="flex-1 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                        >
                            Tutup
                        </Button>
                        <Button
                            onClick={handleCancel}
                            disabled={isCancelling || !cancelReason || (cancelReason === "Lainnya" && !otherReason)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Membatalkan...
                                </>
                            ) : (
                                "Batalkan SQ"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

