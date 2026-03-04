"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Users,
    Package,
    ShoppingCart,
    TrendingUp,
    FileText,
    ArrowUpRight,
    Filter,
    UserPlus,
    Clock,
    CheckCircle2,
    AlertCircle,
    Activity,
    Calendar,
    ChevronRight,
    ArrowRight,
    Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { motion } from "framer-motion";

interface DashboardClientProps {
    stats: {
        totalCustomers: number;
        totalProducts: number;
        totalQuotations: number;
        totalRevenue: number;
        recentQuotations: any[];
        recentCustomers: any[];
    };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    'DRAFT': { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Clock },
    'PENDING': { label: 'Menunggu', color: 'bg-amber-100 text-amber-700', icon: Clock },
    'OFFERED': { label: 'Penawaran', color: 'bg-blue-100 text-blue-700', icon: FileText },
    'CONFIRMED': { label: 'Pesanan', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    'COMPLETED': { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    'CANCELLED': { label: 'Batal', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

function formatCompactNumber(number: number) {
    if (number < 1000) return number.toString();
    if (number < 1000000) return (number / 1000).toFixed(1) + 'K';
    if (number < 1000000000) return (number / 1000000).toFixed(1) + ' jt';
    if (number < 1000000000000) return (number / 1000000000).toFixed(1) + ' M';
    return (number / 1000000000000).toFixed(1) + ' T';
}

export default function DashboardClient({ stats }: DashboardClientProps) {
    const weeklyData = [
        { day: 'Sen', views: 450 },
        { day: 'Sel', views: 520 },
        { day: 'Rab', views: 480 },
        { day: 'Kam', views: 610 },
        { day: 'Jum', views: 550 },
        { day: 'Sab', views: 320 },
        { day: 'Min', views: 280 },
    ];

    const maxViews = Math.max(...weeklyData.map(d => d.views));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Activity className="w-6 h-6 text-red-600" />
                        Dashboard Admin
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Monitoring performa bisnis Hokiindo.</p>
                </div>

            </div>

            {/* Metric Cards - With Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Customer"
                    value={stats.totalCustomers.toString()}
                    subValue="Pelanggan terdaftar"
                    icon={Users}
                    color="red"
                    href="/admin/customers"
                />
                <MetricCard
                    title="Total Produk"
                    value={stats.totalProducts.toLocaleString()}
                    subValue="SKU Aktif di sistem"
                    icon={Package}
                    color="blue"
                    href="/admin/products"
                />
                <MetricCard
                    title="Total Pesanan"
                    value={stats.totalQuotations.toString()}
                    subValue="Semua status transaksi"
                    icon={ShoppingCart}
                    color="amber"
                    href="/admin/sales/orders"
                />
                <MetricCard
                    title="Omzet Terkonfirmasi"
                    value={formatCompactNumber(stats.totalRevenue)}
                    subValue="Pesanan valid & tuntas"
                    icon={TrendingUp}
                    color="emerald"
                    isCurrency={true}
                    href="/admin/sales/orders"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic - Placeholder GA4 */}
                <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold text-gray-900">Statistik Kunjungan</CardTitle>
                                <CardDescription className="text-xs">Statistik traffic (Simulasi GA4)</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold border-gray-200">GA4 Integration</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[180px] w-full flex items-end justify-between gap-3 px-2">
                            {weeklyData.map((data, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full relative flex items-end justify-center h-full">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(data.views / maxViews) * 100}%` }}
                                            transition={{ duration: 1, delay: idx * 0.05, ease: "circOut" }}
                                            className="w-full max-w-[32px] bg-red-500/10 group-hover:bg-red-500/20 rounded-t-md transition-all relative overflow-hidden"
                                        >
                                            <div className="absolute inset-x-0 bottom-0 bg-red-600 h-1 rounded-t-full" />
                                        </motion.div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">{data.day}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Baru Baru - Side list */}
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold text-gray-900">Customer Baru</CardTitle>
                            <UserPlus className="w-4 h-4 text-gray-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {stats.recentCustomers.map((customer) => (
                            <Link
                                key={customer.id}
                                href={`/admin/customers/${customer.id}`}
                                className="flex items-center gap-3 group hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-bold text-gray-500 text-xs shrink-0 border border-gray-100 overflow-hidden">
                                    {customer.image ? (
                                        <img src={customer.image} alt={customer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        customer.name?.charAt(0).toUpperCase() || 'C'
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-900 truncate tracking-tight">{customer.name || 'No Company Name'}</p>
                                    <p className="text-[10px] font-medium text-gray-400">{format(new Date(customer.createdAt), 'dd MMM yyyy')}</p>
                                </div>
                                <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-red-600 transition-colors" />
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Compact Orders Table */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="pb-4 px-6 border-b border-gray-50 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-gray-900">Update Transaksi</CardTitle>
                        <CardDescription className="text-xs">Data pesanan terbaru dalam sistem</CardDescription>
                    </div>
                    <Button variant="ghost" asChild className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 h-8">
                        <Link href="/admin/sales/orders" className="flex items-center gap-1">
                            Semua Pesanan <ArrowRight className="w-3 h-3" />
                        </Link>
                    </Button>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID Pesanan</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Waktu</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats.recentQuotations.map((order) => {
                                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG['PENDING'];
                                // Linked to either quotation or order detail based on status
                                const detailHref = `/admin/sales/orders/${order.id}`;
                                return (
                                    <tr key={order.id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-6 py-3">
                                            <span className="text-xs font-black text-gray-900 font-mono">{order.quotationNo}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-900 truncate max-w-[140px]">{order.user?.name || order.clientName || 'General Customer'}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">{order.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                                {format(new Date(order.createdAt), 'dd/MM HH:mm')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-xs font-black text-gray-900">
                                                Rp {order.totalAmount?.toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <Badge className={`rounded-lg px-2 py-0.5 text-[9px] font-black border-none shadow-none whitespace-nowrap ${status.color}`}>
                                                {status.label.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <Button variant="ghost" size="icon" asChild className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-600">
                                                <Link href={detailHref}>
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function MetricCard({ title, value, subValue, icon: Icon, color, isCurrency, href }: any) {
    const colors: Record<string, string> = {
        red: "bg-red-50 text-red-600 border-red-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100"
    };

    const content = (
        <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    {isCurrency && <span className="text-xs font-bold text-gray-500 italic">Rp</span>}
                    <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">{value}</h3>
                </div>
                <p className="text-[10px] font-medium text-gray-400 mt-1 truncate">{subValue}</p>
            </div>
            {href && (
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-red-600 transition-colors" />
            )}
        </CardContent>
    );

    return (
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white hover:border-gray-200 transition-all group overflow-hidden">
            {href ? (
                <Link href={href}>
                    {content}
                </Link>
            ) : content}
        </Card>
    );
}
