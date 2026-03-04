"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2, RefreshCw, Send, ShieldCheck,
    ChevronLeft, ChevronRight, Search, User,
    ArrowRight, TrendingUp, XCircle, Phone, AlertCircle, FileCheck,
} from "lucide-react";
import { getAllQuotations, getQuotationStatusCounts } from "@/app/actions/quotation";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const STATUS_CONFIG: Record<string, {
    label: string; pill: string; dot: string; bar: string; icon: any; urgency?: boolean;
}> = {
    PENDING: {
        label: "Menunggu",
        pill: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 shadow-sm shadow-yellow-100/50",
        dot: "bg-yellow-500",
        bar: "bg-gradient-to-b from-yellow-400 to-yellow-600",
        icon: AlertCircle,
        urgency: true
    },
    PROCESSING: {
        label: "Diproses",
        pill: "bg-purple-50 text-purple-700 ring-1 ring-purple-200 shadow-sm shadow-purple-100/50",
        dot: "bg-purple-500",
        bar: "bg-gradient-to-b from-purple-400 to-purple-600",
        icon: RefreshCw,
        urgency: true
    },
    OFFERED: {
        label: "Ditawarkan",
        pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 shadow-sm shadow-amber-100/50",
        dot: "bg-amber-500",
        bar: "bg-gradient-to-b from-amber-400 to-amber-600",
        icon: Send,
    },
    CONFIRMED: {
        label: "Dikonfirmasi",
        pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-sm shadow-blue-100/50",
        dot: "bg-blue-500",
        bar: "bg-gradient-to-b from-blue-400 to-blue-600",
        icon: ShieldCheck
    },
    CANCELLED: {
        label: "Dibatalkan",
        pill: "bg-slate-50 text-slate-500 ring-1 ring-slate-200",
        dot: "bg-slate-400",
        bar: "bg-slate-400",
        icon: XCircle
    },
};

// ─── Row ───────────────────────────────────────────────────────────────────
function QuotationRow({ q, index }: { q: any; index: number }) {
    const router = useRouter();
    const fmtPrice = (p: number) => "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(p));
    const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.OFFERED;
    const StatusIcon = cfg.icon;
    const timeAgo = formatDistanceToNow(new Date(q.createdAt), { addSuffix: true, locale: localeId });

    return (
        <TableRow
            className="cursor-pointer group hover:bg-slate-50/50 border-b border-slate-100/80 transition-all duration-300"
            onClick={() => router.push(`/admin/sales/quotations/${q.quotationNo.replace(/\//g, "-")}`)}
        >
            {/* Status indicator bar */}
            <TableCell className="p-0 w-[4px]">
                <div className={`h-full min-h-[58px] w-1 rounded-r-sm ${cfg.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </TableCell>

            {/* No. HRSQ */}
            <TableCell className="py-5 pl-8 w-[180px]">
                <div className="flex items-center gap-3">
                    {cfg.urgency && (
                        <div className="relative flex h-2 w-2 shrink-0">
                            <div className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${cfg.dot}`} />
                            <div className={`relative rounded-full h-2 w-2 shadow-[0_0_8px_rgba(251,191,36,0.5)] ${cfg.dot}`} />
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="font-mono text-[13px] font-black text-slate-900 group-hover:text-red-600 tracking-tight transition-colors">
                            {q.quotationNo}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none mt-0.5">Reference ID</span>
                    </div>
                </div>
            </TableCell>

            {/* Customer */}
            <TableCell className="py-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:border-red-100 group-hover:text-red-600 transition-all duration-300">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-red-700 transition-colors leading-tight">
                            {q.customerName || "No Name"}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-slate-400 leading-none">{q.email}</span>
                            {q.phone && (
                                <>
                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 leading-none">
                                        {q.phone}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </TableCell>

            {/* Qty */}
            <TableCell className="py-5 text-center w-[80px]">
                <div className="inline-flex flex-col items-center">
                    <span className="text-sm font-black text-slate-700 font-mono">
                        {q.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Items</span>
                </div>
            </TableCell>

            {/* Tanggal */}
            <TableCell className="py-5 w-[140px]">
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-slate-700">{format(new Date(q.createdAt), "dd MMM yyyy")}</span>
                    <span className="text-[11px] font-medium text-slate-400 capitalize">{timeAgo}</span>
                </div>
            </TableCell>

            {/* Total */}
            <TableCell className="py-5 text-right w-[165px]">
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[15px] font-bold text-slate-900 font-mono tracking-tight">{fmtPrice(q.totalAmount)}</span>
                    {q.specialDiscount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shadow-sm">
                            DISC {q.specialDiscount}%
                        </span>
                    )}
                </div>
            </TableCell>

            {/* Status */}
            <TableCell className="py-4 w-[185px]">
                <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap ${cfg.pill}`}>
                        <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                        {cfg.label}
                    </span>
                </div>
            </TableCell>

            {/* CTA */}
            <TableCell className="py-5 pr-6 w-[48px]">
                <div className="flex justify-end">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-red-600 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-200 group-hover:-translate-x-1">
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );
}



// ─── Page ──────────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function SalesQuotationsPage() {
    const router = useRouter();
    const [quotations, setQuotations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [statusCounts, setStatusCounts] = useState<any>({});
    const [pageSize, setPageSize] = useState(20);
    const [sortField, setSortField] = useState<string>("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => { loadData(); }, [currentPage, pageSize]);

    const loadData = async () => {
        setIsLoading(true);
        const [qRes, cRes] = await Promise.all([
            getAllQuotations(currentPage, pageSize, "ALL"),
            getQuotationStatusCounts(),
        ]);
        if (qRes.success) {
            setQuotations(qRes.quotations);
            if (qRes.pagination) {
                setTotalPages(qRes.pagination.pages);
                setTotalItems(qRes.pagination.total);
            }
        }
        if (cRes.success) setStatusCounts(cRes.counts);
        setIsLoading(false);
    };



    const filtered = quotations
        .filter(q =>
            !search.trim() ||
            q.quotationNo?.toLowerCase().replace(/\//g, "-").includes(search.toLowerCase().replace(/\//g, "-")) ||
            q.email?.toLowerCase().includes(search.toLowerCase()) ||
            q.customerName?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];
            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

    const toggleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-700">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-2 h-8 bg-red-600 rounded-full" />
                        Penawaran Masuk
                    </h1>
                    <div className="flex items-center gap-3 pl-5">
                        <span className="text-sm font-medium text-slate-400">Pusat kontrol transaksi HRSQ (Sales Quotation)</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group w-full md:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                        <Input
                            placeholder="Cari No. HRSQ, email, atau nama..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 h-12 w-full text-sm bg-white border-slate-200 rounded-xl focus:ring-0 focus:border-red-300 shadow-sm transition-all"
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={loadData}
                        disabled={isLoading}
                        className="h-12 w-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shadow-sm"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* ── Table Card ── */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-500">

                {/* Toolbar */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/30 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-red-50 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">Tabel Monitoring HRSQ</span>
                            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">{filtered.length} TRANSAKSI DITEMUKAN</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Per Halaman</span>
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                            <SelectTrigger className="h-9 w-[100px] text-xs font-black rounded-xl border-slate-200 bg-white shadow-sm ring-red-500/10 focus:ring-4">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                                {PAGE_SIZE_OPTIONS.map(n => (
                                    <SelectItem key={n} value={String(n)} className="text-xs font-medium">{n} Baris</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-[2px]">
                        <div className="relative">
                            <Loader2 className="w-7 h-7 text-red-600 animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-4 animate-pulse">Memuat data transaksi...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-slate-50/20">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-red-100 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                            <div className="relative w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                <FileCheck className="h-10 w-10 text-slate-200" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Belum ada Penawaran</h3>
                            <p className="text-sm font-medium text-slate-400 max-w-[280px]">
                                {search
                                    ? "Hasil pencarian tidak ditemukan. Coba gunakan kata kunci lain."
                                    : "Semua penawaran masuk dari customer akan muncul secara otomatis di sini."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-100 bg-slate-50/30 hover:bg-slate-50/30">
                                    <TableHead className="p-0 w-[4px]" />
                                    <TableHead
                                        className="pl-8 py-4 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 cursor-pointer hover:text-red-600 transition-colors"
                                        onClick={() => toggleSort("quotationNo")}
                                    >
                                        No. HRSQ {sortField === "quotationNo" && (sortOrder === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="py-4 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Customer</TableHead>
                                    <TableHead className="py-4 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 text-center">Qty</TableHead>
                                    <TableHead
                                        className="py-4 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 cursor-pointer hover:text-red-600 transition-colors"
                                        onClick={() => toggleSort("createdAt")}
                                    >
                                        Tanggal {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead
                                        className="py-4 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 text-right cursor-pointer hover:text-red-600 transition-colors"
                                        onClick={() => toggleSort("totalAmount")}
                                    >
                                        Total Nilai {sortField === "totalAmount" && (sortOrder === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="py-4 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 text-center">Status</TableHead>
                                    <TableHead className="w-[80px]" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((q, i) => (
                                    <QuotationRow key={q.id} q={q} index={i} />
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/20 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Halaman <span className="text-slate-900">{currentPage}</span> / {totalPages}
                                    <span className="mx-3 text-slate-200">|</span>
                                    Total {totalItems} Data
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1 || isLoading}
                                        className="h-10 w-10 p-0 rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                        .reduce<(number | "...")[]>((acc, page, i, arr) => {
                                            if (i > 0 && (arr[i - 1] as number) !== page - 1) acc.push("...");
                                            acc.push(page);
                                            return acc;
                                        }, [])
                                        .map((item, i) =>
                                            item === "..." ? (
                                                <span key={`d${i}`} className="px-2 text-slate-300 font-bold">...</span>
                                            ) : (
                                                <Button key={item} size="sm"
                                                    variant={currentPage === item ? "default" : "outline"}
                                                    onClick={() => setCurrentPage(item as number)}
                                                    disabled={isLoading}
                                                    className={`h-10 w-10 p-0 text-sm font-black rounded-xl border-slate-200 transition-all duration-300 ${currentPage === item
                                                        ? "bg-red-600 hover:bg-red-700 border-red-600 text-white shadow-lg shadow-red-200 scale-110 z-10"
                                                        : "bg-white hover:bg-slate-50"}`}>
                                                    {item}
                                                </Button>
                                            )
                                        )}
                                    <Button variant="outline" size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || isLoading}
                                        className="h-10 w-10 p-0 rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
