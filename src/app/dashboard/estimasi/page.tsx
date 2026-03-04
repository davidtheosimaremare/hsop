"use client";

import { useEffect, useState } from "react";
import {
    FileText,
    Loader2,
    Clock,
    Send,
    Download,
    Search,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Eye,
    ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserQuotations, sendDraftQuotation } from "@/app/actions/quotation";
import { exportQuotationPDF, type QuotationExportData, type ExportTemplate } from "@/lib/export-quotation";
import { getSiteSetting } from "@/app/actions/settings";
import { format } from "date-fns";
import { toast } from "sonner";

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="w-16 h-16 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Belum Ada Estimasi</h3>
            <p className="text-xs text-gray-500 text-center max-w-xs mb-4">
                Simpan produk di keranjang sebagai estimasi untuk memudahkan penawaran di kemudian hari.
            </p>
            <Link href="/pencarian">
                <Button variant="red" size="sm">
                    Cari Produk
                </Button>
            </Link>
        </div>
    );
}

export default function EstimasiPage() {
    const router = useRouter();
    const [quotations, setQuotations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [template, setTemplate] = useState<ExportTemplate>({});
    const [isSending, setIsSending] = useState<string | null>(null);

    const itemsPerPage = 10;

    useEffect(() => {
        loadQuotations();
        loadTemplate();
    }, []);

    const loadQuotations = async () => {
        setIsLoading(true);
        const result = await getUserQuotations();
        if (result.success) {
            setQuotations(result.quotations.filter((q: any) => q.status === "DRAFT"));
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
        } catch (e) { }
    };

    const handleSendDraft = async (id: string) => {
        if (!confirm("Lanjutkan estimasi ini ke permintaan penawaran harga?")) return;

        setIsSending(id);
        const result = await sendDraftQuotation(id);
        if (result.success) {
            toast.success("Permintaan penawaran telah terkirim!");
            loadQuotations();
        } else {
            toast.error(result.error || "Gagal mengirim penawaran");
        }
        setIsSending(null);
    };

    const filteredQuotations = quotations.filter(q =>
        q.quotationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.clientName && q.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        q.items.some((item: any) => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedQuotations = filteredQuotations.slice(startIndex, startIndex + itemsPerPage);

    const formatPrice = (price: number) => new Intl.NumberFormat("id-ID").format(Math.round(price));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Estimasi Saya</h2>
                    <p className="text-xs text-gray-500 mt-1">Kelola daftar estimasi dan lanjutkan ke permintaan penawaran harga.</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Cari No. Estimasi, Proyek, atau Produk..."
                        className="pl-9 h-9 text-sm focus-visible:ring-red-500"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="w-[180px] text-xs font-bold uppercase tracking-wider text-gray-500">No. Estimasi</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-500">Tanggal</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-500">Produk</TableHead>
                                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-gray-500">Total Estimasi</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5} className="py-8">
                                            <div className="flex justify-center">
                                                <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : paginatedQuotations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="p-0">
                                        <div className="py-12 px-6">
                                            <EmptyState />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedQuotations.map((q) => (
                                    <TableRow key={q.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm font-bold text-gray-900 leading-none">
                                                    {q.quotationNo.replace('SQ-', 'EST-')}
                                                </span>
                                                {q.clientName && (
                                                    <span className="text-[10px] font-medium text-red-600 mt-1 uppercase tracking-wider">
                                                        {q.clientName}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(q.createdAt), "dd MMM yyyy")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                {/* Stacked Images */}
                                                <div className="relative w-14 h-10 shrink-0 flex items-center group/stack">
                                                    {(() => {
                                                        const uniqueImages = Array.from(new Set(q.items.map((i: any) => i.image))).filter(Boolean).slice(0, 3);
                                                        if (uniqueImages.length === 0) {
                                                            return (
                                                                <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                                                    <ImageIcon className="w-5 h-5 text-gray-200" />
                                                                </div>
                                                            );
                                                        }
                                                        if (uniqueImages.length === 1) {
                                                            return (
                                                                <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 z-10 relative">
                                                                    <img src={uniqueImages[0] as string} alt="Product" className="w-full h-full object-contain p-0.5" />
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <>
                                                                {uniqueImages.map((img, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="absolute top-0 w-9 h-9 bg-white rounded-lg border border-gray-100 overflow-hidden flex items-center justify-center shadow-md transition-all duration-300"
                                                                        style={{
                                                                            left: `${idx * 12}px`,
                                                                            zIndex: 10 - idx,
                                                                            transform: `scale(${1 - idx * 0.1})`,
                                                                            opacity: 1 - idx * 0.15
                                                                        }}
                                                                    >
                                                                        <img src={img as string} alt={`Product ${idx}`} className="w-full h-full object-contain p-0.5" />
                                                                    </div>
                                                                ))}
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                                                        {q.items[0]?.productName}
                                                    </span>
                                                    {q.items.length > 1 && (
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            +{q.items.length - 1} produk lainnya
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-sm font-bold text-red-600">
                                                Rp {formatPrice(q.totalAmount)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end pr-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/estimasi/${q.id}`)} className="gap-2 cursor-pointer">
                                                            <Eye className="w-4 h-4 text-gray-500" /> Lihat Produk
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => exportQuotationPDF(q as QuotationExportData, template)} className="gap-2 cursor-pointer">
                                                            <Download className="w-4 h-4 text-gray-500" /> Unduh PDF
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleSendDraft(q.id)}
                                                            className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                                                        >
                                                            {isSending === q.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Send className="w-4 h-4" />
                                                            )}
                                                            Kirim Penawaran
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            Menampilkan <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredQuotations.length)}</span> dari <span className="font-medium text-gray-900">{filteredQuotations.length}</span> estimasi
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon-xs"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="w-3 h-3" />
                            </Button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant={currentPage === i + 1 ? "red" : "outline"}
                                    size="icon-xs"
                                    className="text-[10px] w-6 h-6"
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                size="icon-xs"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
