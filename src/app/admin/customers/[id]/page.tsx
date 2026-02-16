
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, User, CreditCard, ShieldCheck, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerDiscountForm } from "@/components/admin/CustomerDiscountForm";
import { CustomerUserList } from "@/components/admin/CustomerUserList";
import { CustomerBasicInfo } from "@/components/admin/CustomerBasicInfo";

import { getCategoryMappings } from "@/app/actions/product-public";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    // Parallel fetching
    const [customer, categoryMappings] = await Promise.all([
        db.customer.findUnique({
            where: { id },
            include: {
                users: true,
                orders: {
                    include: {
                        items: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                addresses: {
                    orderBy: {
                        isPrimary: "desc", // Primary first
                    }
                }
            }
        }),
        getCategoryMappings()
    ]);

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

            <div className="space-y-8">
                {/* Row 1: Informasi Dasar & Manajemen User */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CustomerBasicInfo
                        customer={{
                            id: customer.id,
                            name: customer.name ?? "",
                            email: customer.email,
                            phone: customer.phone,
                            address: customer.address,
                            businessCategory: customer.businessCategory,
                            type: customer.type,
                            image: customer.image,
                            addresses: customer.addresses,
                            company: customer.company
                        }}
                    />

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
                                customerType={customer.type}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Row 2: Pengaturan Diskon */}
                <Card className="border-blue-100 shadow-sm overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-base font-semibold text-gray-900">
                                Pengaturan Diskon Manual
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Atur diskon bertingkat untuk pelanggan ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <CustomerDiscountForm
                            customerId={customer.id}
                            discountLP={customer.discountLP}
                            discountLPIndent={customer.discountLPIndent || "0"}
                            discountCP={customer.discountCP}
                            discountCPIndent={customer.discountCPIndent || "0"}
                            discountLighting={customer.discountLighting}
                            discountLightingIndent={customer.discountLightingIndent || "0"}
                            mappings={categoryMappings}
                        />
                    </CardContent>
                </Card>

                {/* Row 3: Daftar Pesanan */}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {customer.orders.map((order) => (
                                    <div key={order.id} className="border rounded-lg p-4 flex flex-col gap-2 hover:bg-gray-50 transition-colors bg-white shadow-sm">
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
                                        <div className="flex justify-between items-center text-sm pt-2 border-t mt-2">
                                            <span className="text-gray-600">{order.items.length} Barang</span>
                                            <span className="font-bold text-gray-900">
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
                            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                Belum ada pesanan.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
