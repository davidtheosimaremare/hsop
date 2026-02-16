import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, User, MapPin, CreditCard, Truck } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function SalesOrderDetailPage({ params }: PageProps) {
    const { id } = await params;

    const order = await db.order.findUnique({
        where: { id },
        include: {
            customer: true,
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    if (!order) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/sales/orders">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pesanan #{order.id.slice(-8)}</h1>
                        <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString("id-ID", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                        order.status === "PROCESSING" ? "bg-orange-100 text-orange-700" :
                            order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700"
                        }`}>
                        {order.status === "COMPLETED" ? "Selesai" :
                            order.status === "PROCESSING" ? "Diproses" :
                                order.status === "CANCELLED" ? "Dibatalkan" :
                                    "Menunggu"}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Items Pesanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                            <Package className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium">{item.product?.name || item.productId}</h4>
                                            <p className="text-sm text-gray-500">{item.product?.sku}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                <span>Qty: {item.quantity}</span>
                                                <span>@ Rp {item.price.toLocaleString("id-ID")}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">Rp {(item.quantity * item.price).toLocaleString("id-ID")}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Order Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Informasi Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Nama</p>
                                <p className="font-medium">{order.customer?.name || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{order.customer?.email || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Telepon</p>
                                <p className="font-medium">{order.customer?.phone || "-"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Alamat Pengiriman
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{order.customer?.address || "-"}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Ringkasan Pembayaran
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span>Rp {order.total.toLocaleString("id-ID")}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Diskon</span>
                                    <span>- Rp {order.discount.toLocaleString("id-ID")}</span>
                                </div>
                            )}
                            <hr />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>Rp {(order.total - order.discount).toLocaleString("id-ID")}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {order.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Catatan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{order.notes}</p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex flex-col gap-2">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                            <Truck className="h-4 w-4 mr-2" />
                            Buat Pengiriman
                        </Button>
                        <Button variant="outline" className="w-full">
                            Cetak Invoice
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
