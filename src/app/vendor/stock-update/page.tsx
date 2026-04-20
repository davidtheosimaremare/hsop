"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    FileUp, 
    FileDown, 
    Loader2, 
    CheckCircle, 
    History,
    RefreshCw,
    Search,
    Package
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { 
    confirmStockUpdateAction, 
    getVendorStockLogsAction 
} from "@/app/actions/vendor-stock";
import { getVendorProductsAction } from "@/app/actions/vendor-product";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function VendorStockUpdatePage() {
    const [isImporting, setIsImporting] = useState(false);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [stockLogs, setStockLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    
    // Product States
    const [vendorProducts, setVendorProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [newStocks, setNewStocks] = useState<Record<string, string>>({});

    const fetchLogs = async () => {
        setLoadingLogs(true);
        const result = await getVendorStockLogsAction();
        if (result.success) {
            setStockLogs(result.logs || []);
        }
        setLoadingLogs(false);
    };

    const fetchVendorProducts = async () => {
        setLoadingProducts(true);
        const result = await getVendorProductsAction();
        if (result.success) {
            setVendorProducts(result.products || []);
        }
        setLoadingProducts(false);
    };

    useEffect(() => {
        fetchLogs();
        fetchVendorProducts();
    }, []);

    const handleExportTemplate = () => {
        if (vendorProducts.length === 0) {
            toast.error("Tidak ada produk untuk diekspor");
            return;
        }

        const dataForTemplate = vendorProducts.map(p => ({
            "Kategori Barang": p.category || "—",
            "Kode Barang (MLFB/ SKU)": p.sku,
            "Nama Barang": p.name,
            "Quantity/Stock (SAAT INI)": p.availableToSell,
            "Quantity/Stock": p.availableToSell, 
        }));

        const ws = XLSX.utils.json_to_sheet(dataForTemplate);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Update_Stok");
        XLSX.writeFile(wb, `Template_Update_Stok_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Template berhasil diunduh");
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws) as any[];

                if (rawData.length === 0) {
                    toast.error("File Excel kosong");
                    setIsImporting(false);
                    return;
                }

                const updates = rawData.map(row => {
                    const sku = (row["Kode Barang (MLFB/ SKU)"] || "").toString().trim();
                    const newStock = parseInt(row["Quantity/Stock"] || 0);
                    const product = vendorProducts.find(p => p.sku === sku);
                    
                    if (product) {
                        return {
                            productId: product.id,
                            oldStock: product.availableToSell,
                            newStock: newStock,
                            source: "EXCEL_BULK"
                        };
                    }
                    return null;
                }).filter(Boolean) as any[];

                if (updates.length === 0) {
                    toast.error("Tidak ada SKU produk Anda yang cocok dalam file ini");
                    return;
                }

                if (confirm(`Perbarui stok untuk ${updates.length} produk dari file Excel?`)) {
                    const result = await confirmStockUpdateAction(updates);
                    if (result.success) {
                        toast.success(`${result.count} stok berhasil diperbarui`);
                        fetchVendorProducts();
                        fetchLogs();
                    } else {
                        toast.error(result.error || "Gagal memperbarui stok");
                    }
                }
            } catch (err) {
                toast.error("Terjadi kesalahan saat membaca file Excel");
            } finally {
                setIsImporting(false);
                e.target.value = ""; 
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleUpdateSingle = async (product: any) => {
        const newStockStr = newStocks[product.id];
        if (newStockStr === undefined || newStockStr === "") {
            toast.error("Masukkan stok baru");
            return;
        }

        const newStock = parseInt(newStockStr);
        if (isNaN(newStock)) {
            toast.error("Stok harus angka");
            return;
        }

        setIsUpdating(product.id);
        const result = await confirmStockUpdateAction([{
            productId: product.id,
            oldStock: product.availableToSell,
            newStock: newStock,
            source: "MANUAL_INLINE"
        }]);

        if (result.success) {
            toast.success(`Stok ${product.sku} diperbarui`);
            setNewStocks(prev => ({ ...prev, [product.id]: "" }));
            fetchVendorProducts();
            fetchLogs();
        } else {
            toast.error(result.error || "Gagal update stok");
        }
        setIsUpdating(null);
    };

    const filteredProducts = vendorProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="border-teal-200 text-teal-700 bg-teal-50/50 px-2 py-0 text-[10px] font-black uppercase tracking-widest">
                            Management
                        </Badge>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Stok Cepat</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Update Stok</h1>
                    <p className="text-slate-500 font-medium mt-2">Kelola ketersediaan produk Anda secara langsung di sini.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" onClick={handleExportTemplate} className="rounded-2xl border-slate-200 font-bold text-xs h-11 px-5 shadow-sm hover:bg-slate-50 transition-all">
                        <FileDown className="w-4 h-4 mr-2 text-teal-600" />
                        Template & Data Excel
                    </Button>
                    <div className="relative">
                        <Input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="stock-import"
                            onChange={handleImportExcel}
                            disabled={isImporting}
                        />
                        <Button variant="outline" asChild className="rounded-2xl border-slate-200 font-bold text-xs h-11 px-5 shadow-sm hover:bg-slate-50 transition-all cursor-pointer">
                            <label htmlFor="stock-import">
                                {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-teal-600" /> : <FileUp className="w-4 h-4 mr-2 text-teal-600" />}
                                Upload Excel
                            </label>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Section: Product List Update */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border border-slate-100">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative w-full md:max-w-md group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <Input
                                        placeholder="Cari produk Anda..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-12 pl-12 bg-slate-50/50 border-transparent focus:bg-white focus:ring-teal-500 focus:border-teal-500 rounded-2xl font-medium transition-all"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto px-4 pb-8">
                                <table className="w-full text-left border-separate border-spacing-y-2">
                                    <thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4 font-black">Produk</th>
                                            <th className="px-6 py-4 font-black text-center">Stok Saat Ini</th>
                                            <th className="px-6 py-4 font-black">Input Stok Baru</th>
                                            <th className="px-6 py-4 text-right font-black">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingProducts ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
                                                </td>
                                            </tr>
                                        ) : filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest">Tidak ada produk.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map((p) => (
                                                <tr key={p.id} className="group">
                                                    <td className="px-6 py-4 bg-white border-y border-l border-slate-50 first:rounded-l-3xl">
                                                        <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">{p.name}</p>
                                                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{p.sku}</p>
                                                    </td>
                                                    <td className="px-6 py-4 bg-white border-y border-slate-50 text-center">
                                                        <Badge variant="outline" className="h-8 px-4 rounded-xl border-slate-200 font-black text-sm text-slate-900 bg-slate-50/50">
                                                            {p.availableToSell}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 bg-white border-y border-slate-50">
                                                        <Input 
                                                            type="number"
                                                            placeholder="Stok..."
                                                            value={newStocks[p.id] || ""}
                                                            onChange={(e) => setNewStocks(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                            className="h-10 w-28 bg-slate-50 border-slate-200 rounded-xl font-black text-center focus:bg-white"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 bg-white border-y border-r border-slate-50 last:rounded-r-3xl text-right">
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => handleUpdateSingle(p)}
                                                            disabled={isUpdating === p.id}
                                                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95"
                                                        >
                                                            {isUpdating === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update"}
                                                        </Button>
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

                {/* Activity Log Section */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-slate-100">
                        <CardHeader className="p-6 border-b border-slate-50">
                            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-teal-600" />
                                Riwayat Perubahan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingLogs ? (
                                <div className="p-12 flex justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                                </div>
                            ) : stockLogs.length > 0 ? (
                                <div className="max-h-[600px] overflow-y-auto">
                                    <div className="divide-y divide-slate-50">
                                        {stockLogs.map((log) => (
                                            <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h4 className="text-[11px] font-black text-slate-900 truncate leading-tight">{log.product?.name}</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.product?.sku}</p>
                                                    </div>
                                                    <Badge className={cn(
                                                        "text-[9px] font-black px-1.5 py-0 rounded-md border-none flex-shrink-0",
                                                        log.changeValue > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                    )}>
                                                        {log.changeValue > 0 ? `+${log.changeValue}` : log.changeValue}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.oldStock}</span>
                                                        <RefreshCw className="w-2.5 h-2.5 text-slate-300" />
                                                        <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{log.newStock}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.source.split('_')[0]}</span>
                                                        <span className="text-[8px] font-medium text-slate-300">
                                                            {new Date(log.createdAt).toLocaleDateString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <p className="text-xs text-slate-400 font-medium italic">Belum ada riwayat.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-slate-900 rounded-3xl overflow-hidden text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 -mr-8 -mt-8 rounded-full blur-2xl" />
                        <CardContent className="p-6 space-y-4">
                            <h4 className="font-black text-teal-400 text-[10px] uppercase tracking-widest">Tips Update Stok</h4>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                Anda bisa mengupdate stok secara satuan melalui tabel, atau menggunakan file Excel untuk update masif sekaligus. Setiap perubahan akan dicatat dalam riwayat.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
