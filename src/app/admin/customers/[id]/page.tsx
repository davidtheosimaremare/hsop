
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, User, Users, Phone, MapPin, Mail, CreditCard, ShieldCheck, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerDiscountForm } from "@/components/admin/CustomerDiscountForm";
import { CustomerUserList } from "@/components/admin/CustomerUserList";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    const customer = await db.customer.findUnique({
        where: { id },
        include: {
            orders: {
                orderBy: { createdAt: 'desc' },
                include: {
                    items: true,
                }
            },
            users: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!customer) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">No. Pelanggan: {customer.id}</p>
                        <Button variant="outline" size="sm" className="h-6 text-xs" asChild>
                            <Link href={`/admin/customers/${id}/edit`}>
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" /> Informasi Dasar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Mail className="h-4 w-4" /> Email
                                    </div>
                                    <p className="font-medium">{customer.email || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Phone className="h-4 w-4" /> Telepon
                                    </div>
                                    <p className="font-medium">{customer.phone || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin className="h-4 w-4" /> Alamat Penagihan
                                    </div>
                                    <p className="font-medium whitespace-pre-wrap">{customer.address || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Users className="h-4 w-4" /> Kategori Bisnis
                                    </div>
                                    <p className="font-medium">{customer.businessCategory || "-"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" /> Manajemen Akses User
                            </CardTitle>
                            <CardDescription>Kelola user yang bisa login atas nama perusahaan ini.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CustomerUserList
                                customerId={customer.id}
                                users={customer.users}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Settings */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" /> Daftar Pesanan
                            </CardTitle>
                            <CardDescription>
                                Riwayat pesanan dari customer ini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {customer.orders.length > 0 ? (
                                <div className="space-y-4">
                                    {customer.orders.map((order) => (
                                        <div key={order.id} className="border rounded-lg p-4 flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-sm">Order #{order.id.slice(-6)}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                                                            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                                                        })}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                                    order.status === "PROCESSED" ? "bg-blue-100 text-blue-800" :
                                                        order.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                                                            "bg-gray-100 text-gray-800"
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">{order.items.length} Barang</span>
                                                <span className="font-semibold">
                                                    Rp {order.total.toLocaleString("id-ID")}
                                                </span>
                                            </div>
                                            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                                <Link href={`/admin/orders/${order.id}`}>
                                                    Lihat Detail
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Blum ada pesanan.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-blue-100 shadow-sm p-0 gap-0 overflow-hidden">
                        <CardHeader className="bg-blue-50/50 border-b border-blue-100 p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-bold text-gray-900 leading-tight">
                                        Pengaturan Diskon Manual
                                    </CardTitle>
                                    <CardDescription className="text-sm text-gray-500">
                                        Atur diskon bertingkat untuk pelanggan ini.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <CustomerDiscountForm
                                customerId={customer.id}
                                discountLP={customer.discountLP}
                                discountCP={customer.discountCP}
                                discountLighting={customer.discountLighting}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
