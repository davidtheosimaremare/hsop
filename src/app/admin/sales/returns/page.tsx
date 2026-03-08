import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Eye, ExternalLink, Package, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function SalesReturnsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const pageSize = 20;
    const query = params?.q?.toString() || "";

    const skip = (page - 1) * pageSize;

    // Filter quotations that have return request
    const where: Prisma.SalesQuotationWhereInput = {
        returnRequest: true
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

    const fmtPrice = (p: number) => "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(p));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-red-600" />
                        Pengembalian Barang (Retur)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Daftar permintaan pengembalian barang atau klaim garansi dari pelanggan.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg font-bold">Daftar Retur</CardTitle>
                            <CardDescription>Total {totalQuotations} permintaan retur ditemukan</CardDescription>
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
                                    <TableHead className="font-bold text-slate-800 py-4 px-5">Alasan Retur</TableHead>
                                    <TableHead className="font-bold text-slate-800 py-4 px-5">Tgl Pengajuan</TableHead>
                                    <TableHead className="font-bold text-slate-800 py-4 px-5 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-medium">
                                            Belum ada permintaan retur yang diajukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    quotations.map((q) => {
                                        const displayNo = q.accurateHsoNo || q.accurateHsqNo || q.quotationNo;

                                        return (
                                            <TableRow key={q.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="py-4 px-5">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-black text-slate-900 text-sm">
                                                            {displayNo}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                                                            SQ: {q.quotationNo}
                                                        </span>
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
                                                <TableCell className="py-4 px-5">
                                                    <div className="flex items-start gap-2 max-w-xs">
                                                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                        <p className="text-sm font-medium text-slate-600 line-clamp-2">
                                                            {q.returnReason || "Tidak ada alasan yang diberikan."}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-5 text-sm text-slate-500 font-medium">
                                                    {new Date(q.updatedAt).toLocaleDateString("id-ID", {
                                                        day: "2-digit", month: "short", year: "numeric"
                                                    })}
                                                </TableCell>
                                                <TableCell className="py-4 px-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {q.returnEvidencePath && (() => {
                                                            let firstUrl = q.returnEvidencePath;
                                                            try {
                                                                const parsed = JSON.parse(q.returnEvidencePath);
                                                                if (Array.isArray(parsed) && parsed.length > 0) {
                                                                    firstUrl = parsed[0];
                                                                }
                                                            } catch (e) { }

                                                            return (
                                                                <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold text-[11px] bg-slate-50 hover:bg-slate-100 border-slate-200" asChild>
                                                                    <a href={firstUrl} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink className="h-3 w-3 mr-1.5" />
                                                                        LIHAT BUKTI
                                                                    </a>
                                                                </Button>
                                                            );
                                                        })()}
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors" asChild>
                                                            <Link href={`/admin/sales/returns/${q.quotationNo.replace(/\//g, "-")}`} title="Detail Retur">
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
                                    <Link href={`?page=${page - 1}&q=${query}`}>Sebelumnya</Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    className="rounded-xl h-9 px-4 font-bold border-slate-200"
                                    asChild
                                >
                                    <Link href={`?page=${page + 1}&q=${query}`}>Berikutnya</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
