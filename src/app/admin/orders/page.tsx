import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Eye, Package, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
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

    const where: Prisma.SalesQuotationWhereInput = {
        status: { in: ["PROCESSING", "SHIPPED", "COMPLETED"] },
    };

    if (query) {
        where.OR = [
            { quotationNo: { contains: query, mode: "insensitive" } },
            { accurateHsoNo: { contains: query, mode: "insensitive" } },
            { clientName: { contains: query, mode: "insensitive" } },
            { customer: { name: { contains: query, mode: "insensitive" } } },
        ];
    }

    if (statusFilter && statusFilter !== "ALL") {
        where.status = statusFilter;
    }

    const [orders, totalOrders] = await Promise.all([
        db.salesQuotation.findMany({
            where,
            orderBy: { confirmedAt: "desc" },
            skip,
            take: pageSize,
            include: {
                customer: true,
            },
        }),
        db.salesQuotation.count({ where }),
    ]);

    const totalPages = Math.ceil(totalOrders / pageSize);

    const statusConfig: Record<string, { label: string; color: string }> = {
        PROCESSING: { label: "Sales Order", color: "bg-blue-100 text-blue-700 border-blue-200" },
        SHIPPED: { label: "Dikirim", color: "bg-amber-100 text-amber-700 border-amber-200" },
        COMPLETED: { label: "Selesai", color: "bg-green-100 text-green-700 border-green-200" },
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Daftar penawaran yang telah menjadi Sales Order (HSO) di Accurate.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                            <CardTitle>Daftar Pesanan</CardTitle>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                                    <Package className="w-3 h-3" /> Sales Order
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700">
                                    <Truck className="w-3 h-3" /> Dikirim
                                </span>
                            </div>
                        </div>

                        {/* Filter Toolbar */}
                        <form className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Input
                                    name="q"
                                    placeholder="Cari No. HSO, Nama Customer atau No. Penawaran..."
                                    defaultValue={query}
                                    className="pl-4 w-full"
                                />
                            </div>
                            <select
                                name="status"
                                defaultValue={statusFilter}
                                className="h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="ALL">Semua Pesanan</option>
                                <option value="PROCESSING">Sales Order (HSO)</option>
                                <option value="SHIPPED">Dikirim (DO)</option>
                                <option value="COMPLETED">Selesai</option>
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
                                    <TableHead>No. HSO</TableHead>
                                    <TableHead>No. Penawaran</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal Pesanan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                                            <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            Belum ada pesanan. Pesanan akan muncul otomatis saat sudah diproses dengan HSO di Accurate.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order) => {
                                        const cfg = statusConfig[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-700" };
                                        return (
                                            <TableRow key={order.id} className="hover:bg-gray-50">
                                                <TableCell className="font-mono font-semibold text-sm">
                                                    {order.accurateHsoNo?.replace(/\//g, "-") ?? (
                                                        <span className="text-gray-400 text-xs">Menunggu...</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {order.quotationNo.replace(/\//g, "-")}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">
                                                            {order.customer?.name ?? order.clientName ?? "-"}
                                                        </span>
                                                        {order.accurateDoNo && (
                                                            <span className="text-xs text-green-600 font-mono mt-0.5">
                                                                DO: {order.accurateDoNo}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    Rp {order.totalAmount.toLocaleString("id-ID")}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`text-xs border ${cfg.color}`}>
                                                        {cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {order.confirmedAt
                                                        ? new Date(order.confirmedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link prefetch={false}  href={`/admin/sales/quotations/${order.quotationNo.replace(/\//g, "-")}?from=orders`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
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
                            Halaman {page} dari {totalPages || 1} ({totalOrders} Pesanan)
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
