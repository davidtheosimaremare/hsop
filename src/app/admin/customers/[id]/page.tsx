
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, History, Package, ShoppingCart, ChevronRight, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerDiscountForm } from "@/components/admin/CustomerDiscountForm";
import { CustomerUserList } from "@/components/admin/CustomerUserList";
import { CustomerBasicInfo } from "@/components/admin/CustomerBasicInfo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { getCategoryMappings } from "@/app/actions/product-public";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;

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
                        isPrimary: "desc",
                    }
                }
            }
        }),
        getCategoryMappings()
    ]);

    if (!customer) {
        notFound();
    }

    const customerDisplayName = customer.type === "BISNIS" && customer.company ? customer.company : customer.name;

    return (
        <div className="space-y-4 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Breadcrumbs & Header */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Link href="/admin" className="hover:text-red-600 transition-colors">Admin</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/admin/customers" className="hover:text-red-600 transition-colors">Pelanggan</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-gray-600">Detail</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-xl border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 shrink-0">
                            <Link href="/admin/customers">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">
                                    {customerDisplayName}
                                </h1>
                                <Badge className={cn(
                                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-none shadow-none",
                                    customer.type === "BISNIS" ? "bg-blue-100 text-blue-700" :
                                        customer.type === "RESELLER" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                                )}>
                                    {customer.type === "BISNIS" ? "PERUSAHAAN" : customer.type}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] font-bold text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">
                                    {customer.id}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 text-gray-600 h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest" asChild>
                            <Link href={`/admin/customers/${id}/edit`}>
                                <Settings className="w-3.5 h-3.5 mr-1.5" /> Edit Profil
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                {/* Main Content Area */}
                <div className="xl:col-span-8 space-y-5">

                    {/* Access Management */}
                    <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white pt-0">
                        <CardHeader className="bg-gray-100 px-5 py-4 border-b border-gray-200 h-14 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-[0.15em] flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-red-600" /> Manajemen Akses User
                            </CardTitle>
                            <Badge className="bg-gray-900 text-[9px] font-black uppercase px-2.5 py-1 border-none shadow-none">
                                {customer.users.length} Akun
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-5">
                            <CustomerUserList
                                customerId={customer.id}
                                users={customer.users.map(u => ({
                                    id: u.id,
                                    username: u.username,
                                    name: u.name,
                                    email: u.email,
                                    phone: u.phone,
                                    isActive: u.isActive,
                                    role: u.role,
                                    position: (u as any).position,
                                    isPrimaryContact: (u as any).isPrimaryContact
                                }))}
                                customerType={customer.type}
                            />
                        </CardContent>
                    </Card>

                    {/* Order History */}
                    <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white pt-0">
                        <CardHeader className="px-5 py-4 bg-gray-100 border-b border-gray-200 h-14 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-[0.15em] flex items-center gap-2">
                                <History className="h-4 w-4 text-red-600" /> Riwayat Pesanan
                            </CardTitle>
                            <span className="text-[10px] font-bold text-gray-400">{customer.orders.length} transaksi</span>
                        </CardHeader>
                        <CardContent className="p-5">
                            {customer.orders.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {customer.orders.map((order) => (
                                        <div key={order.id} className="group p-4 bg-gray-50/50 border border-gray-100/50 rounded-xl transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-gray-200/40 hover:border-red-100/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{order.id}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border-none shadow-none",
                                                    order.status === "DONE" ? "bg-emerald-500 text-white" :
                                                        order.status === "CANCELLED" ? "bg-red-500 text-white" : "bg-blue-600 text-white"
                                                )}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                    <Package className="h-3 w-3 text-gray-400" />
                                                    {order.items.length} item &bull; <span className="text-red-600 font-black">Rp {order.total.toLocaleString("id-ID")}</span>
                                                </div>
                                                <Button variant="ghost" size="sm" asChild className="h-7 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest text-gray-400 hover:text-red-600">
                                                    <Link href={`/admin/orders/${order.id}`}>
                                                        Detail <ChevronRight className="h-3 w-3 ml-0.5" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <ShoppingCart className="h-6 w-6 text-gray-200" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Belum ada pesanan</p>
                                        <p className="text-[9px] text-gray-300 font-bold mt-0.5 uppercase">Customer ini belum melakukan pembelian</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar area */}
                <div className="xl:col-span-4 space-y-5">
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
                            company: customer.company,
                            // @ts-ignore
                            companyEmail: customer.companyEmail,
                            // @ts-ignore
                            companyPhone: customer.companyPhone,
                            addresses: customer.addresses.map(a => ({
                                id: a.id,
                                label: a.label,
                                recipient: a.recipient,
                                phone: a.phone,
                                address: a.address,
                                province: a.province,
                                city: a.city,
                                district: a.district,
                                postalCode: a.postalCode,
                                isPrimary: a.isPrimary,
                                isBilling: a.isBilling
                            })),
                            users: customer.users.map(u => ({
                                id: u.id,
                                username: u.username,
                                name: u.name,
                                email: u.email,
                                phone: u.phone,
                                isActive: u.isActive,
                                role: u.role,
                                position: (u as any).position,
                                isPrimaryContact: (u as any).isPrimaryContact
                            }))
                        }}
                    />

                    {/* Discount Pricing Card */}
                    <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white pt-0">
                        <CardHeader className="bg-blue-100 px-5 py-4 border-b border-blue-200 h-14 flex flex-row items-center space-y-0">
                            <CardTitle className="text-xs font-black text-blue-800 uppercase tracking-[0.15em] flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-blue-700" /> Diskon Spesial
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
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
                </div>
            </div>
        </div >
    );
}
