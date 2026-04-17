"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Package, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    TrendingUp, 
    Plus, 
    ArrowRight,
    Search,
    Filter,
    MoreHorizontal,
    ShoppingBag,
    FileText
} from "lucide-react";
import { useAuth } from "@/components/auth/CanAccess";
import { useEffect, useState } from "react";
import { getVendorProductsAction } from "@/app/actions/vendor-product";
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const result = await getVendorProductsAction();
            if (result.success && result.products) {
                const products = result.products;
                setStats({
                    total: products.length,
                    approved: products.filter((p: any) => p.status === "APPROVED").length,
                    pending: products.filter((p: any) => p.status === "PENDING").length,
                    rejected: products.filter((p: any) => p.status === "REJECTED").length,
                });
                // Sort by createdAt or updatedAt if available, or just take first 5
                setRecentProducts(products.slice(0, 5));
            }
            setLoading(false);
        };
        fetchStats();
    }, []);

    const statCards = [
        {
            title: "Total Produk",
            value: stats.total,
            icon: Package,
            color: "teal",
            description: "Semua produk terdaftar"
        },
        {
            title: "Disetujui",
            value: stats.approved,
            icon: CheckCircle,
            color: "green",
            description: "Aktif di katalog"
        },
        {
            title: "Menunggu",
            value: stats.pending,
            icon: Clock,
            color: "amber",
            description: "Proses verifikasi admin"
        },
        {
            title: "Ditolak",
            value: stats.rejected,
            icon: AlertCircle,
            color: "red",
            description: "Perlu perbaikan data"
        }
    ];

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="border-teal-200 text-teal-700 bg-teal-50/50 px-2 py-0 text-[10px] font-black uppercase tracking-widest">
                            Vendor Portal
                        </Badge>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Terakhir: Hari ini</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Halo, <span className="text-teal-600">{user?.name?.split(' ')[0] || 'Vendor'}</span>!
                    </h1>
                    <p className="text-slate-500 font-medium">Pantau performa produk dan kelola inventaris Anda di sini.</p>
                </div>
                
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="rounded-xl border-slate-200 font-bold text-xs h-10 px-4 shadow-sm hover:bg-slate-50" asChild>
                        <Link href="/vendor/products">
                           <Search className="h-3.5 w-3.5 mr-2" />
                           Cari Produk
                        </Link>
                    </Button>
                    <Button size="sm" className="rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-xs h-10 px-5 shadow-lg shadow-teal-600/20" asChild>
                        <Link href="/vendor/products/new">
                           <Plus className="h-4 w-4 mr-2" />
                           Tambah Produk
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <CardContent className="p-6 relative">
                            <div className={cn(
                                "absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-500",
                                stat.color === "teal" ? "bg-teal-600" :
                                stat.color === "green" ? "bg-green-600" :
                                stat.color === "amber" ? "bg-amber-600" : "bg-red-600"
                            )} />
                            
                            <div className="flex flex-col gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300",
                                    stat.color === "teal" ? "bg-teal-50 border-teal-100 group-hover:bg-teal-600 group-hover:border-teal-600" :
                                    stat.color === "green" ? "bg-green-50 border-green-100 group-hover:bg-green-600 group-hover:border-green-600" :
                                    stat.color === "amber" ? "bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:border-amber-600" :
                                    "bg-red-50 border-red-100 group-hover:bg-red-600 group-hover:border-red-600"
                                )}>
                                    <stat.icon className={cn(
                                        "h-6 w-6 transition-colors duration-300",
                                        stat.color === "teal" ? "text-teal-600 group-hover:text-white" :
                                        stat.color === "green" ? "text-green-600 group-hover:text-white" :
                                        stat.color === "amber" ? "text-amber-600 group-hover:text-white" :
                                        "text-red-600 group-hover:text-white"
                                    )} />
                                </div>
                                
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-black text-slate-900 leading-none">
                                            {loading ? (
                                                <div className="h-8 w-12 bg-slate-100 animate-pulse rounded-lg" />
                                            ) : stat.value}
                                        </h3>
                                        <div className="flex items-center text-[10px] font-black text-green-600">
                                            <TrendingUp className="h-3 w-3 mr-0.5" />
                                            <span>+0%</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">{stat.title}</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">{stat.description}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Products Card */}
                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                        <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-teal-600" />
                                    Produk Terakhir
                                </CardTitle>
                                <p className="text-xs text-slate-400 font-medium mt-1">Daftar produk yang baru saja Anda tambahkan.</p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-teal-600 font-bold hover:bg-teal-50" asChild>
                                <Link href="/vendor/products">
                                    Lihat Semua <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-6 space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-4 animate-pulse">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-1/3 bg-slate-100 rounded" />
                                                <div className="h-3 w-1/4 bg-slate-100 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : recentProducts.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {recentProducts.map((product) => (
                                        <div key={product.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 group-hover:scale-105 transition-transform">
                                                    {product.images && product.images[0] ? (
                                                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-teal-50">
                                                            <Package className="h-5 w-5 text-teal-200" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-800 text-sm truncate max-w-[200px] md:max-w-md">{product.name}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.sku || 'TANPA-SKU'}</span>
                                                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                        <span className="text-[10px] font-bold text-teal-600">Rp {product.price?.toLocaleString('id-ID')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none",
                                                    product.status === "APPROVED" ? "bg-green-100 text-green-700" :
                                                    product.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                                                    "bg-red-100 text-red-700"
                                                )}>
                                                    {product.status === "APPROVED" ? "Disetujui" : 
                                                     product.status === "PENDING" ? "Menunggu" : "Ditolak"}
                                                </Badge>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Package className="h-8 w-8 text-slate-200" />
                                    </div>
                                    <h3 className="font-bold text-slate-800">Belum Ada Produk</h3>
                                    <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Mulai tambahkan produk pertama Anda untuk mulai berjualan.</p>
                                    <Button size="sm" className="mt-4 bg-teal-600 rounded-xl font-bold" asChild>
                                        <Link href="/vendor/products/new">Tambah Produk</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info Area */}
                <div className="space-y-6">
                    {/* Activity Feed / Tips Card */}
                    <Card className="border-none shadow-sm bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-8 -mt-8 rounded-full blur-2xl" />
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-teal-50">
                                <FileText className="h-4 w-4" />
                                Petunjuk Cepat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 space-y-4">
                            <div className="space-y-3">
                                {[
                                    { title: "Verifikasi Admin", desc: "Produk akan direview dalam 1x24 jam." },
                                    { title: "Kualitas Gambar", desc: "Gunakan foto produk yang jernih agar cepat disetujui." },
                                    { title: "Kelengkapan SKU", desc: "Pastikan SKU unik untuk mempermudah pelacakan." }
                                ].map((tip, i) => (
                                    <div key={i} className="flex gap-3 group">
                                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
                                            <span className="text-[10px] font-black">{i+1}</span>
                                        </div>
                                        <div>
                                            <h5 className="text-[11px] font-black uppercase tracking-wider">{tip.title}</h5>
                                            <p className="text-[11px] text-teal-100/80 leading-snug">{tip.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <Button className="w-full bg-white text-teal-700 hover:bg-teal-50 font-black text-[10px] uppercase tracking-widest rounded-xl h-10 mt-2 shadow-xl shadow-black/10">
                                Baca Panduan Lengkap
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Support Card */}
                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-2 border-slate-50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">Butuh Bantuan?</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hubungi Support Admin</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-50">
                                <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                                    Jika Anda mengalami kendala saat upload produk atau verifikasi akun, silakan hubungi tim support kami.
                                </p>
                                <Button variant="outline" className="w-full rounded-xl border-slate-200 font-bold text-xs h-10 shadow-sm hover:bg-slate-50">
                                    Kirim Pesan (WhatsApp)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
