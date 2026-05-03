"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
    Package, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    Plus, 
    ArrowRight,
    Search,
    ShoppingBag,
    History
} from "lucide-react";
import { useAuth } from "@/components/auth/CanAccess";
import { useEffect, useState } from "react";
import { getVendorProductsAction } from "@/app/actions/vendor-product";
import { getVendorStockLogsAction } from "@/app/actions/vendor-stock";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function VendorDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
    });
    const [recentProducts, setRecentProducts] = useState<any[]>([]);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [productsRes, logsRes] = await Promise.all([
                getVendorProductsAction(),
                getVendorStockLogsAction()
            ]);

            if (productsRes.success && productsRes.products) {
                const products = productsRes.products;
                setStats({
                    total: products.length,
                    approved: products.filter((p: any) => p.status === "APPROVED").length,
                    pending: products.filter((p: any) => p.status === "PENDING").length,
                    rejected: products.filter((p: any) => p.status === "REJECTED").length,
                });
                setRecentProducts(products.slice(0, 4));
            }

            if (logsRes.success && logsRes.logs) {
                setRecentLogs(logsRes.logs.slice(0, 3));
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    const statCards = [
        { label: "Total", value: stats.total, color: "bg-slate-50 text-slate-600", icon: Package },
        { label: "Disetujui", value: stats.approved, color: "bg-green-50 text-green-600", icon: CheckCircle },
        { label: "Menunggu", value: stats.pending, color: "bg-amber-50 text-amber-600", icon: Clock },
        { label: "Ditolak", value: stats.rejected, color: "bg-red-50 text-red-600", icon: AlertCircle },
    ];

    return (
        <div className="space-y-6 pb-8 animate-in fade-in duration-500">
            {/* Minimal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Dashboard <span className="text-teal-600">Vendor</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Selamat Datang, {user?.name?.split(' ')[0] || 'Vendor'}
                    </p>
                </div>
                
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 font-bold text-[11px] uppercase tracking-wider" asChild>
                        <Link prefetch={false}  href="/vendor/products">
                           <Search className="h-3.5 w-3.5 mr-2" /> Cari
                        </Link>
                    </Button>
                    <Button size="sm" className="h-9 rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-teal-600/10" asChild>
                        <Link prefetch={false}  href="/vendor/products/new">
                           <Plus className="h-3.5 w-3.5 mr-2" /> Tambah Produk
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Compact Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {statCards.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", stat.color)}>
                                    <stat.icon className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-slate-900 leading-none">
                                        {loading ? "..." : stat.value}
                                    </p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-1">{stat.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                {/* Left: Recent Activity */}
                <div className="lg:col-span-2 space-y-5">
                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                        <div className="p-5 pb-3 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-teal-600" />
                                Update Produk Terakhir
                            </h2>
                            <Link prefetch={false}  href="/vendor/products" className="text-[10px] font-black text-teal-600 uppercase hover:underline flex items-center">
                                Semua <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                        </div>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-8 text-center text-slate-300 animate-pulse font-bold text-xs uppercase tracking-widest">Memuat...</div>
                            ) : recentProducts.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {recentProducts.map((p) => (
                                        <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden">
                                                    {p.image ? (
                                                        <img src={p.image} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                            <Package className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-800 text-sm truncate">{p.name}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{p.sku}</p>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border-none",
                                                p.status === "APPROVED" ? "bg-green-100 text-green-700" :
                                                p.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                                                "bg-red-100 text-red-700"
                                            )}>
                                                {p.status === "APPROVED" ? "OK" : p.status === "PENDING" ? "Wait" : "Fail"}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center text-slate-400 text-xs font-medium">Belum ada produk.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Quick Logs & Info */}
                <div className="space-y-5">
                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                        <div className="p-5 pb-3 border-b border-slate-50">
                            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-teal-600" />
                                Log Stok
                            </h2>
                        </div>
                        <CardContent className="p-0">
                            {recentLogs.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {recentLogs.map((log) => (
                                        <div key={log.id} className="p-4">
                                            <p className="text-[11px] font-bold text-slate-800 truncate">{log.product?.name}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-slate-400">{log.oldStock}</span>
                                                    <ArrowRight className="h-2 w-2 text-slate-300" />
                                                    <span className="text-[10px] font-black text-teal-600">{log.newStock}</span>
                                                </div>
                                                <span className="text-[9px] font-medium text-slate-300">
                                                    {new Date(log.createdAt).toLocaleDateString("id-ID")}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">Tidak ada log</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-teal-600 rounded-3xl p-5 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 -mr-6 -mt-6 rounded-full blur-xl" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest mb-2 text-teal-100">Tips Cepat</h3>
                        <ul className="space-y-2">
                            <li className="text-[11px] font-medium text-teal-50 flex gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-teal-300 mt-1 flex-shrink-0" />
                                Update stok berkala agar pesanan selalu akurat.
                            </li>
                            <li className="text-[11px] font-medium text-teal-50 flex gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-teal-300 mt-1 flex-shrink-0" />
                                Gunakan SKU yang unik untuk tiap produk baru.
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}
