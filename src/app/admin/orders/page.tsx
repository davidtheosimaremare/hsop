import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Eye, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
    const orders = await db.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            customer: true,
            _count: {
                select: { items: true },
            },
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Pesanan Masuk</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
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
                                        Belum ada pesanan masuk.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.id}</TableCell>
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
                </CardContent>
            </Card>
        </div>
    );
}
