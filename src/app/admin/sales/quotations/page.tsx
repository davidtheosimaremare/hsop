import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Eye, FileCheck, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Prisma } from "@prisma/client";
import DeleteQuotationButton from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function SalesQuotationsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const pageSize = 20;
    const query = params?.q?.toString() || "";
    const statusFilter = params?.status?.toString() || "ALL";

    const skip = (page - 1) * pageSize;

    const where: Prisma.SalesQuotationWhereInput = {};

    if (statusFilter && statusFilter !== "ALL") {
        where.status = statusFilter;
    }

    if (query) {
        where.OR = [
            { quotationNo: { contains: query, mode: "insensitive" } },
            { accurateHsqNo: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { clientName: { contains: query, mode: "insensitive" } },
            { customer: { name: { contains: query, mode: "insensitive" } } },
        ];
    }

    const [quotations, totalQuotations] = await Promise.all([
        db.salesQuotation.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
            include: {
                customer: true,
                items: { select: { quantity: true } },
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
        COMPLETED: { label: "Pesanan Dikirim", color: "bg-green-100 text-green-700 border-green-200" },
        CANCELLED: { label: "Dibatalkan", color: "bg-gray-100 text-gray-500 border-gray-200" },
    };

    const fmtPrice = (p: number) => "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(p));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Penawaran Masuk</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Riwayat semua penawaran dari customer, termasuk yang sudah disetujui maupun dibatalkan.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                            <CardTitle>Daftar Penawaran</CardTitle>
                            <span className="text-xs text-muted-foreground">{totalQuotations} penawaran</span>
                        </div>

                        {/* Filter Toolbar */}
                        <form className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Input
                                    name="q"
                                    placeholder="Cari No. SQ, nama, atau email customer..."
                                    defaultValue={query}
                                    className="pl-4 w-full"
                                />
                            </div>
                            <select
                                name="status"
                                defaultValue={statusFilter}
                                className="h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="ALL">Semua Status</option>
                                <option value="PENDING">Menunggu</option>
                                <option value="OFFERED">Penawaran</option>
                                <option value="CONFIRMED">PO Diterima</option>
                                <option value="PROCESSING">Pesanan (HSO)</option>
                                <option value="COMPLETED">Pesanan Dikirim</option>
                                <option value="CANCELLED">Dibatalkan</option>
                            </select>
                            <Button type="submit">Filter</Button>
                        </form>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Penawaran</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                                            <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            {query
                                                ? "Tidak ada hasil pencarian."
                                                : "Belum ada penawaran masuk."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    quotations.map((q) => {
                                        const cfg = statusConfig[q.status] ?? { label: q.status, color: "bg-gray-100 text-gray-700" };
                                        const totalQty = q.items.reduce((sum, item) => sum + item.quantity, 0);
                                        return (
                                            <TableRow key={q.id} className="hover:bg-gray-50">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-mono font-semibold text-sm">{q.quotationNo.replace(/\//g, "-")}</span>
                                                        {q.accurateHsqNo && q.accurateHsqNo !== q.quotationNo && (
                                                            <span className="text-[11px] text-muted-foreground font-mono">
                                                                {q.accurateHsqNo.replace(/\//g, "-")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">
                                                            {q.customer?.name ?? q.clientName ?? q.email}
                                                        </span>
                                                        {q.phone && (
                                                            <span className="text-xs text-muted-foreground">{q.phone}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-medium">
                                                    {totalQty}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {fmtPrice(q.totalAmount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`text-xs border ${cfg.color}`}>
                                                        {cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(q.createdAt).toLocaleDateString("id-ID", {
                                                        day: "2-digit", month: "short", year: "numeric"
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <DeleteQuotationButton id={q.id} quotationNo={q.quotationNo} />
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link prefetch={false}  href={`/admin/sales/quotations/${q.quotationNo.replace(/\//g, "-")}`}>
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
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                            Halaman {page} dari {totalPages || 1} ({totalQuotations} Penawaran)
                        </div>
                        <div className="flex gap-2">
                            {page > 1 && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link prefetch={false}  href={`?page=${page - 1}&q=${query}&status=${statusFilter}`}>Previous</Link>
                                </Button>
                            )}
                            {page < totalPages && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link prefetch={false}  href={`?page=${page + 1}&q=${query}&status=${statusFilter}`}>Next</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
