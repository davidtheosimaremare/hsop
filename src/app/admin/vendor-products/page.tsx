"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Search, 
    Package, 
    CheckCircle, 
    Loader2,
    Eye,
    Check,
    X
} from "lucide-react";
import { 
    adminApproveProductAction, 
    adminBulkApproveProductsAction,
    adminRejectProductAction 
} from "@/app/actions/vendor-product";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";

export const dynamic = "force-dynamic";

export default function AdminVendorProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    // Dialog States
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [marginType, setMarginType] = useState<"PERCENTAGE" | "FIXED" | "MANUAL">("PERCENTAGE");
    const [marginValue, setMarginValue] = useState<number>(10);
    const [dialogLoading, setDialogLoading] = useState(false);

    const calculateFinalPrice = (basePrice: number) => {
        if (marginType === "PERCENTAGE") {
            return basePrice + (basePrice * (marginValue / 100));
        } else if (marginType === "FIXED") {
            return basePrice + marginValue;
        } else {
            return marginValue;
        }
    };

    const openApprovalDialog = (product: any) => {
        setSelectedProduct(product);
        setMarginType("PERCENTAGE");
        setMarginValue(10);
        setDialogOpen(true);
    };

    const submitApproval = async () => {
        if (!selectedProduct) return;
        setDialogLoading(true);

        const finalPrice = calculateFinalPrice(selectedProduct.price);
        
        try {
            const result = await adminApproveProductAction(selectedProduct.id, {
                type: marginType,
                value: marginValue,
                finalPrice: finalPrice,
                vendorPrice: selectedProduct.price,
            });

            if (result.success) {
                toast.success("Produk disetujui & dipublikasikan!");
                setDialogOpen(false);
                fetchProducts();
            } else {
                toast.error(result.error || "Gagal menyetujui produk");
            }
        } catch (err: any) {
            toast.error(err.message || "Terjadi kesalahan server");
        } finally {
            setDialogLoading(false);
        }
    };

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/vendor-products");
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error("Fetch products failed:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        const pendingProducts = filteredProducts.filter(p => p.status === "PENDING");
        if (selectedIds.length === pendingProducts.length && pendingProducts.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingProducts.map(p => p.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Setujui ${selectedIds.length} produk terpilih?`)) return;

        const result = await adminBulkApproveProductsAction(selectedIds);
        if (result.success) {
            toast.success(`${result.count} produk berhasil disetujui`);
            setSelectedIds([]);
            fetchProducts();
        } else {
            toast.error(result.error || "Gagal menyetujui produk");
        }
    };

    const handleApprove = async (id: string) => {
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

    return (
        <div className="space-y-4 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Antrean Produk Vendor</h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Total: {products.length} Items</p>
                </div>
                {/* Bulk Approve button removed temporarily to enforce individual margins */}
            </div>

            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-100">
                <CardHeader className="border-b border-slate-50 p-4">
                    <div className="relative max-w-sm group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                        <Input
                            placeholder="Cari produk atau vendor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 bg-slate-50 border-transparent focus:bg-white focus:ring-teal-500 rounded-xl text-xs font-medium"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-50">
                                <tr>
                                    <th className="px-4 py-3 w-1/3">Produk</th>
                                    <th className="px-4 py-3">Vendor</th>
                                    <th className="px-4 py-3 w-32">Harga Dasar</th>
                                    <th className="px-4 py-3 w-28">Status</th>
                                    <th className="px-4 py-3 text-right w-40">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-16 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600" />
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-16 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                            Tidak ada antrean.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr key={product.id} className={cn(
                                            "hover:bg-slate-50/50 transition-colors group",
                                            selectedIds.includes(product.id) && "bg-teal-50/50"
                                        )}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                                        <Package className="w-3.5 h-3.5 text-slate-300" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 truncate leading-tight" title={product.name}>{product.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{product.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 min-w-0">
                                                <p className="text-[11px] font-bold text-slate-700 truncate">{product.vendor?.name || "Unknown"}</p>
                                                <p className="text-[9px] text-slate-400 truncate">{product.vendor?.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-black text-slate-500">Rp {product.price.toLocaleString("id-ID")}</p>
                                                {product.marginType && (
                                                    <p className="text-[9px] font-bold text-teal-600 mt-0.5" title="Harga Jual Hokiindo">
                                                        Jual: Rp {(product.price || 0).toLocaleString("id-ID")}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge className={cn(
                                                    "text-[8px] font-black uppercase px-1.5 py-0 rounded-md border-none",
                                                    product.status === "APPROVED" ? "bg-green-50 text-green-700" :
                                                    product.status === "PENDING" ? "bg-amber-50 text-amber-700" :
                                                    "bg-red-50 text-red-700"
                                                )}>
                                                    {product.status === "APPROVED" ? "Approved" : product.status === "PENDING" ? "Pending" : "Rejected"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {product.status === "PENDING" && (
                                                        <>
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => openApprovalDialog(product)}
                                                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-7 px-2.5 text-[9px] font-black uppercase tracking-wider"
                                                            >
                                                                <Check className="w-3 h-3 mr-1" /> OK
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => handleReject(product.id)}
                                                                className="border-red-100 text-red-600 hover:bg-red-50 rounded-lg h-7 px-2.5 text-[9px] font-black uppercase tracking-wider"
                                                            >
                                                                <X className="w-3 h-3 mr-1" /> No
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-white" asChild>
                                                        <Link href={`/admin/products/${product.id}/edit`}>
                                                            <Eye className="w-3.5 h-3.5 text-slate-400" />
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Set Margin Harga Produk</DialogTitle>
                        <DialogDescription>
                            Tentukan harga jual <span className="font-bold text-slate-900">{selectedProduct?.name}</span> agar muncul di Hokiindo.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedProduct && (
                        <div className="space-y-4 py-4">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Harga Dasar Vendor</span>
                                <span className="text-sm font-black text-slate-900">Rp {selectedProduct.price.toLocaleString("id-ID")}</span>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-700">Tipe Margin Setup</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button 
                                        type="button"
                                        variant={marginType === "PERCENTAGE" ? "default" : "outline"}
                                        className={cn("h-8 text-[11px] font-bold rounded-lg", marginType === "PERCENTAGE" && "bg-teal-600")}
                                        onClick={() => { setMarginType("PERCENTAGE"); setMarginValue(10); }}
                                    >
                                        Persentase (%)
                                    </Button>
                                    <Button 
                                        type="button"
                                        variant={marginType === "FIXED" ? "default" : "outline"}
                                        className={cn("h-8 text-[11px] font-bold rounded-lg", marginType === "FIXED" && "bg-teal-600")}
                                        onClick={() => { setMarginType("FIXED"); setMarginValue(50000); }}
                                    >
                                        Angka Tetap
                                    </Button>
                                    <Button 
                                        type="button"
                                        variant={marginType === "MANUAL" ? "default" : "outline"}
                                        className={cn("h-8 text-[11px] font-bold rounded-lg", marginType === "MANUAL" && "bg-teal-600")}
                                        onClick={() => { setMarginType("MANUAL"); setMarginValue(selectedProduct.price); }}
                                    >
                                        Harga Manual
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">
                                    {marginType === "PERCENTAGE" ? "Besaran Persen (%)" : marginType === "FIXED" ? "Besaran Angka (Rp)" : "Harga Jual Akhir (Rp)"}
                                </label>
                                <Input 
                                    type="number" 
                                    value={marginValue} 
                                    onChange={(e) => setMarginValue(Number(e.target.value))} 
                                    className="h-10 text-sm font-bold bg-slate-50"
                                />
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Harga Tayang Hokiindo</span>
                                <span className="text-xl font-black text-teal-600">Rp {calculateFinalPrice(selectedProduct.price).toLocaleString("id-ID")}</span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={dialogLoading}>Batal</Button>
                        <Button 
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold" 
                            onClick={submitApproval}
                            disabled={dialogLoading}
                        >
                            {dialogLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Setujui & Publikasikan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
