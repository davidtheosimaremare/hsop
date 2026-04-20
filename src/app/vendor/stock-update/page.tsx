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
    Package,
    Calendar,
    ArrowRight
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

    // Group logs by date
    const groupedLogs = stockLogs.reduce((groups: Record<string, any[]>, log) => {
        const date = new Date(log.createdAt).toLocaleDateString("id-ID", { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(log);
        return groups;
    }, {});

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
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Update Stok</h1>
                    <p className="text-slate-500 font-medium mt-2">Kelola ketersediaan produk Anda secara langsung atau via Excel.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" onClick={handleExportTemplate} className="rounded-2xl border-slate-200 font-bold text-xs h-11 px-5 shadow-sm hover:bg-slate-50 transition-all">
                        <FileDown className="w-4 h-4 mr-2 text-teal-600" />
                        Download Data Excel
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
                                Upload Update Stok
                            </label>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Section: Product List Update */}
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border border-slate-100">
                <CardHeader className="p-8 pb-4">
                    <div className="relative max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                        <Input
                            placeholder="Cari produk berdasarkan nama atau SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 pl-12 bg-slate-50/50 border-transparent focus:bg-white focus:ring-teal-500 rounded-2xl font-medium"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto px-6 pb-8">
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-2">Informasi Produk</th>
                                    <th className="px-6 py-2 text-center">Stok Saat Ini</th>
                                    <th className="px-6 py-2">Input Stok Baru</th>
                                    <th className="px-6 py-2 text-right">Aksi</th>
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
                                            <p className="text-slate-400 font-bold uppercase tracking-widest">Tidak ada produk ditemukan.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((p) => (
                                        <tr key={p.id} className="group">
                                            <td className="px-6 py-4 bg-white border-y border-l border-slate-50 first:rounded-l-3xl shadow-sm">
                                                <p className="text-sm font-black text-slate-900 truncate max-w-[400px]">{p.name}</p>
                                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-0.5">{p.sku}</p>
                                            </td>
                                            <td className="px-6 py-4 bg-white border-y border-slate-50 text-center shadow-sm">
                                                <span className="inline-flex h-9 px-4 items-center rounded-xl bg-slate-50 font-black text-sm text-slate-900 border border-slate-100">
                                                    {p.availableToSell}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 bg-white border-y border-slate-50 shadow-sm">
                                                <Input 
                                                    type="number"
                                                    placeholder="Set Stok..."
                                                    value={newStocks[p.id] || ""}
                                                    onChange={(e) => setNewStocks(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                    className="h-10 w-32 bg-slate-50 border-slate-200 rounded-xl font-black text-center focus:bg-white focus:ring-teal-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 bg-white border-y border-r border-slate-50 last:rounded-r-3xl text-right shadow-sm">
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleUpdateSingle(p)}
                                                    disabled={isUpdating === p.id}
                                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95"
                                                >
                                                    {isUpdating === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update Stok"}
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

            {/* Activity Log Section (FULL WIDTH AT BOTTOM) */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100">
                        <History className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Riwayat Perubahan Stok</h2>
                        <p className="text-xs text-slate-500 font-medium">Log aktivitas pembaharuan inventaris Anda.</p>
                    </div>
                </div>

                <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border border-slate-100">
                    <CardContent className="p-8">
                        {loadingLogs ? (
                            <div className="py-20 flex justify-center">
                                <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
                            </div>
                        ) : Object.keys(groupedLogs).length > 0 ? (
                            <div className="space-y-10">
                                {Object.entries(groupedLogs).map(([date, logs]) => (
                                    <div key={date} className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full">
                                                <Calendar className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{date}</span>
                                            </div>
                                            <div className="h-px flex-1 bg-slate-100" />
                                        </div>
                                        
                                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                            {logs.map((log) => (
                                                <div key={log.id} className="p-4 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <Badge className={cn(
                                                            "text-[9px] font-black px-2 py-0.5 rounded-full border-none",
                                                            log.changeValue > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                        )}>
                                                            {log.changeValue > 0 ? `+${log.changeValue}` : log.changeValue} Units
                                                        </Badge>
                                                        <span className="text-[10px] font-bold text-slate-300">
                                                            {new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-teal-600 transition-colors">{log.product?.name}</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.product?.sku}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase">Lama</span>
                                                                <span className="text-xs font-bold text-slate-500">{log.oldStock}</span>
                                                            </div>
                                                            <ArrowRight className="w-3 h-3 text-slate-300" />
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-black text-teal-600 uppercase">Baru</span>
                                                                <span className="text-sm font-black text-slate-900">{log.newStock}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase block">Metode</span>
                                                            <span className="text-[10px] font-bold text-slate-600">{log.source.replace('_', ' ')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <History className="h-8 w-8 text-slate-200" />
                                </div>
                                <h3 className="font-bold text-slate-800">Belum Ada Riwayat</h3>
                                <p className="text-xs text-slate-400 mt-1">Perubahan stok Anda akan muncul di sini secara detail.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
