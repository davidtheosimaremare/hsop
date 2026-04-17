"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Search, 
    Package, 
    CheckCircle, 
    XCircle,
    Loader2,
    Eye,
    Check,
    X
} from "lucide-react";
import { 
    adminApproveProductAction, 
    adminRejectProductAction 
} from "@/app/actions/vendor-product";
import { db } from "@/lib/db"; // Wait, can't use db in client component directly
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// I need an action to fetch all vendor products for admin
// I'll add it to vendor-product.ts

export default function AdminVendorProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, startTransition] = useTransition();

    const fetchProducts = async () => {
        setLoading(true);
        // We'll use a new action here
        const res = await fetch("/api/admin/vendor-products");
        if (res.ok) {
            const data = await res.json();
            setProducts(data.products || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleApprove = async (id: string) => {
        if (!confirm("Setujui produk ini untuk ditampilkan di toko?")) return;
        
        const result = await adminApproveProductAction(id);
        if (result.success) {
            toast.success("Produk disetujui");
            fetchProducts();
        } else {
            toast.error(result.error || "Gagal menyetujui produk");
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Alasan penolakan:");
        if (reason === null) return;
        
        const result = await adminRejectProductAction(id, reason);
        if (result.success) {
            toast.success("Produk ditolak");
            fetchProducts();
        } else {
            toast.error(result.error || "Gagal menolak produk");
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Persetujuan Produk Vendor</h1>
                <p className="text-slate-500 font-medium">Verifikasi dan setujui produk yang diajukan oleh vendor.</p>
            </div>

            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-50 py-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari produk atau nama vendor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-50 border-transparent focus:bg-white focus:ring-red-500 rounded-xl"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                                <tr>
                                    <th className="px-6 py-4">Produk</th>
                                    <th className="px-6 py-4">Vendor</th>
                                    <th className="px-6 py-4">Harga</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            Tidak ada antrian produk vendor.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0">
                                                        <Package className="w-5 h-5 text-slate-300" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-700">{product.vendor?.name || "Unknown"}</p>
                                                <p className="text-[10px] text-slate-400">{product.vendor?.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-900">Rp {product.price.toLocaleString("id-ID")}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {product.status === "APPROVED" ? (
                                                    <Badge className="bg-green-100 text-green-700 border-green-200">Disetujui</Badge>
                                                ) : product.status === "PENDING" ? (
                                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">Menunggu</Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700 border-red-200">Ditolak</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {product.status === "PENDING" && (
                                                        <>
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => handleApprove(product.id)}
                                                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 px-3 text-xs font-bold"
                                                            >
                                                                <Check className="w-3.5 h-3.5 mr-1" /> Setujui
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => handleReject(product.id)}
                                                                className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg h-8 px-3 text-xs font-bold"
                                                            >
                                                                <X className="w-3.5 h-3.5 mr-1" /> Tolak
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                                                        <Link href={`/admin/products/${product.id}/edit`}>
                                                            <Eye className="w-4 h-4 text-slate-400" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
