import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Download, Filter, Search } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function SalesOrdersPage() {
    // Get orders from database
    const orders = await db.order.findMany({
        include: {
            customer: true,
            items: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "PENDING").length;
    const processingOrders = orders.filter(o => o.status === "PROCESSING").length;
    const completedOrders = orders.filter(o => o.status === "COMPLETED").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pesanan Penjualan</h1>
                    <p className="text-sm text-gray-500">Kelola pesanan dari customer</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ClipboardList className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalOrders}</p>
                                <p className="text-sm text-gray-500">Total Pesanan</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">{pendingOrders}</p>
                            <p className="text-sm text-gray-500">Menunggu</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">{processingOrders}</p>
                            <p className="text-sm text-gray-500">Diproses</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">{completedOrders}</p>
                            <p className="text-sm text-gray-500">Selesai</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Daftar Pesanan</CardTitle>
                            <CardDescription>
                                Semua pesanan penjualan dari customer
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Cari pesanan..." className="pl-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {orders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">Belum ada pesanan</p>
                            <p className="text-sm">Pesanan dari customer akan muncul di sini</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-gray-500">
                                        <th className="pb-3 font-medium">ID</th>
                                        <th className="pb-3 font-medium">Customer</th>
                                        <th className="pb-3 font-medium">Items</th>
                                        <th className="pb-3 font-medium">Total</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Tanggal</th>
                                        <th className="pb-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 font-medium font-mono text-xs">{order.id.slice(-8)}</td>
                                            <td className="py-3">{order.customer?.name || "-"}</td>
                                            <td className="py-3">{order.items.length} item</td>
                                            <td className="py-3 font-medium">
                                                Rp {order.total.toLocaleString("id-ID")}
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                                        order.status === "PROCESSING" ? "bg-orange-100 text-orange-700" :
                                                            order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                                                "bg-yellow-100 text-yellow-700"
                                                    }`}>
                                                    {order.status === "COMPLETED" ? "Selesai" :
                                                        order.status === "PROCESSING" ? "Diproses" :
                                                            order.status === "CANCELLED" ? "Dibatalkan" :
                                                                "Menunggu"}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-500 text-sm">
                                                {new Date(order.createdAt).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="py-3">
                                                <Link href={`/admin/sales/orders/${order.id}`}>
                                                    <Button variant="ghost" size="sm">Detail</Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
