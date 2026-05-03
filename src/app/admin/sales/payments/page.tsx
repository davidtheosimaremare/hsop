import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Eye, ExternalLink, FileText, Search, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function SalesPaymentsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const pageSize = 20;
    const query = params?.q?.toString() || "";

    const skip = (page - 1) * pageSize;

    // Filter quotations that have payment proof
    const where: Prisma.SalesQuotationWhereInput = {
        paymentProofPath: { not: null, notIn: ["", "null"] }
    };

    if (query) {
        where.OR = [
            { quotationNo: { contains: query, mode: "insensitive" } },
            { accurateHsoNo: { contains: query, mode: "insensitive" } },
            { accurateHsqNo: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { clientName: { contains: query, mode: "insensitive" } },
            { customer: { name: { contains: query, mode: "insensitive" } } },
        ];
    }

    const [quotations, totalQuotations] = await Promise.all([
        db.salesQuotation.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            skip,
            take: pageSize,
            include: {
                customer: true,
            },
        }),
        db.salesQuotation.count({ where }),
    ]);

    const totalPages = Math.ceil(totalQuotations / pageSize);

    const statusConfig: Record<string, { label: string; color: string }> = {
        PENDING: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
        OFFERED: { label: "Penawaran", color: "bg-blue-100 text-blue-700 border-blue-200" },
        CONFIRMED: { label: "PO Diterima", color: "bg-violet-100 text-violet-700 border-violet-200" },
        PROCESSING: { label: "Pesanan (HSO)", color: "bg-purple-100 text-purple-700 border-purple-200" },
        COMPLETED: { label: "Selesai", color: "bg-green-100 text-green-700 border-green-200" },
        CANCELLED: { label: "Dibatalkan", color: "bg-gray-100 text-gray-500 border-gray-200" },
    };

    const fmtPrice = (p: number) => "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(p));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-red-600" />
                        Konfirmasi Pembayaran
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Daftar bukti pembayaran yang diunggah oleh pelanggan untuk pesanan mereka.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg font-bold">Bukti Pembayaran</CardTitle>
                            <CardDescription>Total {totalQuotations} pembayaran ditemukan</CardDescription>
                        </div>

                        <form className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                name="q"
                                placeholder="Cari No. Pesanan atau Nama..."
                                defaultValue={query}
                                className="pl-10 h-10 border-slate-100 focus-visible:ring-red-500 rounded-xl font-medium bg-slate-50 hover:bg-slate-100/50 transition-all"
                            />
                        </form>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-800 py-4 px-5">No. Pesanan / SQ</TableHead>
                                    <TableHead className="font-bold text-slate-800 py-4 px-5">Customer</TableHead>
                                    <TableHead className="font-bold text-slate-800 py-4 px-5 text-right">Total Tagihan</TableHead>
                                    <TableHead className="font-bold text-slate-800 py-4 px-5">Status Pesanan</TableHead>
                                    <TableHead className="font-bold text-slate-800 py-4 px-5">Tgl Upload</TableHead>
                                    <TableHead className="font-bold text-slate-800 py-4 px-5 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">
                                            Belum ada bukti pembayaran yang diunggah.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    quotations.map((q) => {
                                        const cfg = statusConfig[q.status] || statusConfig.PENDING;
                                        const displayNo = q.accurateHsoNo || q.accurateHsqNo || q.quotationNo;
                                        
                                        return (
                                            <TableRow key={q.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="py-4 px-5">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-black text-slate-900 text-sm">
                                                            {displayNo}
                                                        </span>
                                                        {q.accurateHsqNo && q.accurateHsqNo !== displayNo && (
                                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                                                                SQ: {q.quotationNo}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-800">
                                                            {q.customer?.name ?? q.clientName ?? q.email}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground font-medium">{q.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-5 text-right">
                                                    <span className="font-black text-red-600 font-mono text-sm">
                                                        {fmtPrice(q.totalAmount)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4 px-5">
                                                    <Badge className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border shadow-none ${cfg.color}`}>
                                                        {cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 px-5 text-sm text-slate-500 font-medium">
                                                    {new Date(q.updatedAt).toLocaleDateString("id-ID", {
                                                        day: "2-digit", month: "short", year: "numeric"
                                                    })}
                                                </TableCell>
                                                <TableCell className="py-4 px-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold text-[11px] bg-slate-50 hover:bg-slate-100 border-slate-200" asChild>
                                                            <a href={q.paymentProofPath!} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-3 w-3 mr-1.5" />
                                                                LIHAT BUKTI
                                                            </a>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors" asChild>
                                                            <Link prefetch={false}  href={`/admin/sales/quotations/${q.quotationNo.replace(/\//g, "-")}`} title="Detail Pesanan">
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Halaman {page} dari {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    className="rounded-xl h-9 px-4 font-bold border-slate-200"
                                    asChild
                                >
                                    <Link prefetch={false}  href={`?page=${page - 1}&q=${query}`}>Sebelumnya</Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    className="rounded-xl h-9 px-4 font-bold border-slate-200"
                                    asChild
                                >
                                    <Link prefetch={false}  href={`?page=${page + 1}&q=${query}`}>Berikutnya</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
