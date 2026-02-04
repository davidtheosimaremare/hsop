import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
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

    const where: Prisma.OrderWhereInput = {};

    if (query) {
        where.OR = [
            { id: { contains: query, mode: "insensitive" } },
            { customer: { name: { contains: query, mode: "insensitive" } } },
            { customer: { email: { contains: query, mode: "insensitive" } } },
        ];
    }

    if (statusFilter && statusFilter !== "ALL") {
        where.status = statusFilter;
    }

    const [orders, totalOrders] = await Promise.all([
        db.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
            include: {
                customer: true,
                _count: {
                    select: { items: true },
                },
            },
        }),
        db.order.count({ where }),
    ]);

    const totalPages = Math.ceil(totalOrders / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Pesanan Masuk</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                            <CardTitle>Daftar Pesanan</CardTitle>
                        </div>

                        {/* Filter Toolbar */}
                        <form className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    name="q"
                                    placeholder="Cari No. Pesanan, Nama atau Email Customer..."
                                    defaultValue={query}
                                    className="pl-9 w-full"
                                />
                            </div>
                            <div className="w-[200px]">
                                <select
                                    name="status"
                                    defaultValue={statusFilter}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="ALL">Semua Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="PROCESSED">Diproses</option>
                                    <option value="COMPLETED">Selesai</option>
                                    <option value="CANCELLED">Dibatalkan</option>
                                </select>
                            </div>
                            <Button type="submit">Filter</Button>
                        </form>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Pesanan</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            Tidak ada pesanan ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium text-xs font-mono">{order.id}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{order.customer.name}</span>
                                                    <span className="text-xs text-gray-500">{order.customer.email || "-"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                Rp {order.total.toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    order.status === "PENDING" ? "secondary" :
                                                        order.status === "PROCESSED" ? "default" :
                                                            order.status === "COMPLETED" ? "outline" : "destructive" // Cancelled
                                                }>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(order.createdAt).toLocaleDateString("id-ID")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/admin/orders/${order.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
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
                                    <Link href={`?page=${page - 1}&q=${query}&status=${statusFilter}`}>Previous</Link>
                                </Button>
                            )}
                            {page < totalPages && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`?page=${page + 1}&q=${query}&status=${statusFilter}`}>Next</Link>
                                </Button>
                            )}
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
