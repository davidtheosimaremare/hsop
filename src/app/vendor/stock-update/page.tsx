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
    XCircle, 
    AlertCircle, 
    History,
    RefreshCw,
    Search,
    Package,
    Plus,
    X,
    Check,
    ChevronsUpDown
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { 
    verifyStockUpdateDataAction, 
    confirmStockUpdateAction, 
    getVendorStockLogsAction 
} from "@/app/actions/vendor-stock";
import { getVendorProductsAction } from "@/app/actions/vendor-product";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function VendorStockUpdatePage() {
    const [isImporting, setIsImporting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [stockLogs, setStockLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    
    // Manual Input States
    const [vendorProducts, setVendorProducts] = useState<any[]>([]);
    const [openProductList, setOpenProductList] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [manualStock, setManualStock] = useState<string>("");

    const fetchLogs = async () => {
        setLoadingLogs(true);
        const result = await getVendorStockLogsAction();
        if (result.success) {
            setStockLogs(result.logs || []);
        }
        setLoadingLogs(false);
    };

    const fetchVendorProducts = async () => {
        const result = await getVendorProductsAction();
        if (result.success) {
            setVendorProducts(result.products || []);
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchVendorProducts();
    }, []);

    const handleExportTemplate = () => {
        // Updated to match the "data excel sebelumnya" format (same headers as products import)
        const template = [
            { 
                "Kategori Barang": "PLC", 
                "Kode Barang (MLFB/ SKU)": "6ES7214-1AG40-0XB0", 
                "Nama Barang": "Siemens S7-1200 CPU 1214C", 
                "Deskripsi/Detail produk (optional)": "", 
                "Def. Hrg. Jual Satuan": 0, 
                "Merek Barang": "Siemens", 
                "Quantity/Stock": 15,
                "Link Gambar (optional)": ""
            },
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Update_Stok");
        XLSX.writeFile(wb, "Template_Update_Stok_Vendor.xlsx");
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

                // Map Excel headers based on the full product template format
                const mappedData = rawData.map(row => ({
                    sku: (row["Kode Barang (MLFB/ SKU)"] || "").toString().trim(),
                    stock: parseInt(row["Quantity/Stock"] || 0)
                })).filter(item => item.sku);

                const result = await verifyStockUpdateDataAction(mappedData);
                if (result.success && result.results) {
                    // Combine with existing preview data or replace
                    setPreviewData(prev => {
                        const existingSkus = new Set(prev.map(p => p.sku));
                        const newEntries = result.results.filter(r => !existingSkus.has(r.sku));
                        return [...prev, ...newEntries];
                    });
                    toast.success(`${result.results.length} baris data diproses`);
                } else {
                    toast.error(result.error || "Gagal verifikasi data");
                }
            } catch (err) {
                toast.error("Terjadi kesalahan saat membaca file Excel");
            } finally {
                setIsImporting(false);
                e.target.value = ""; // Reset input
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleAddManual = () => {
        if (!selectedProduct || manualStock === "") {
            toast.error("Pilih produk dan masukkan stok baru");
            return;
        }

        const newStock = parseInt(manualStock);
        if (isNaN(newStock)) {
            toast.error("Stok harus berupa angka");
            return;
        }

        // Check if already in preview
        if (previewData.some(p => p.sku === selectedProduct.sku)) {
            toast.error("Produk sudah ada di daftar pratinjau");
            return;
        }

        const manualEntry = {
            sku: selectedProduct.sku,
            name: selectedProduct.name,
            productId: selectedProduct.id,
            oldStock: selectedProduct.availableToSell,
            stock: newStock,
            status: "FOUND"
        };

        setPreviewData(prev => [manualEntry, ...prev]);
        setSelectedProduct(null);
        setManualStock("");
        toast.success("Produk ditambahkan ke daftar pratinjau");
    };

    const removeFromPreview = (sku: string) => {
        setPreviewData(prev => prev.filter(p => p.sku !== sku));
    };

    const handleConfirmUpdate = async () => {
        const validUpdates = previewData
            .filter(item => item.status === "FOUND")
            .map(item => ({
                productId: item.productId,
                oldStock: item.oldStock,
                newStock: item.stock,
                source: "MANUAL_BULK"
            }));

        if (validUpdates.length === 0) {
            toast.error("Tidak ada data valid untuk diperbarui");
            return;
        }

        setIsUpdating(true);
        const result = await confirmStockUpdateAction(validUpdates);
        if (result.success) {
            toast.success(`${result.count} stok produk berhasil diperbarui`);
            setPreviewData([]);
            fetchLogs();
            fetchVendorProducts(); // Refresh vendor products list for current stock info
        } else {
            toast.error(result.error || "Gagal memperbarui stok");
        }
        setIsUpdating(false);
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="border-teal-200 text-teal-700 bg-teal-50/50 px-2 py-0 text-[10px] font-black uppercase tracking-widest">
                            Inventaris
                        </Badge>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Management</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Update Stok</h1>
                    <p className="text-slate-500 font-medium mt-2">Perbarui stok secara manual atau impor dari file Excel.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" onClick={handleExportTemplate} className="rounded-2xl border-slate-200 font-bold text-xs h-11 px-5 shadow-sm hover:bg-slate-50 transition-all">
                        <FileDown className="w-4 h-4 mr-2 text-teal-600" />
                        Template Excel
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
                {/* Main Section: Manual Input & Preview */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Manual Entry Card */}
                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-slate-100">
                        <CardHeader className="p-6 pb-2 border-b border-slate-50">
                            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Plus className="h-4 w-4 text-teal-600" />
                                Input Stok Manual
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Produk</Label>
                                    <Popover open={openProductList} onOpenChange={setOpenProductList}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm"
                                            >
                                                {selectedProduct ? (
                                                    <span className="truncate">{selectedProduct.name}</span>
                                                ) : (
                                                    <span className="text-slate-400">Pilih produk Anda...</span>
                                                )}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl shadow-2xl border-slate-100" align="start">
                                            <Command>
                                                <CommandInput placeholder="Cari nama atau SKU..." className="font-medium" />
                                                <CommandList>
                                                    <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                                    <CommandGroup>
                                                        {vendorProducts.map((p) => (
                                                            <CommandItem
                                                                key={p.id}
                                                                value={p.name + p.sku}
                                                                onSelect={() => {
                                                                    setSelectedProduct(p);
                                                                    setOpenProductList(false);
                                                                }}
                                                                className="py-3 px-4 cursor-pointer hover:bg-teal-50 transition-colors"
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-sm text-slate-900">{p.name}</span>
                                                                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{p.sku} • Stok: {p.availableToSell}</span>
                                                                </div>
                                                                <Check
                                                                    className={cn(
                                                                        "ml-auto h-4 w-4 text-teal-600",
                                                                        selectedProduct?.id === p.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="w-full md:w-32 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stok Baru</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        value={manualStock}
                                        onChange={(e) => setManualStock(e.target.value)}
                                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-black text-lg focus:bg-white transition-all"
                                    />
                                </div>
                                <Button 
                                    onClick={handleAddManual}
                                    className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
                                >
                                    Tambah
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview Table Card */}
                    <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 min-h-[400px]">
                        <CardHeader className="p-8 pb-4 border-b border-slate-50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                    <RefreshCw className="h-5 w-5 text-teal-600" />
                                    Daftar Antrean Update
                                </CardTitle>
                                {previewData.length > 0 && (
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => setPreviewData([])}
                                            className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 rounded-xl"
                                        >
                                            Kosongkan
                                        </Button>
                                        <Button 
                                            onClick={handleConfirmUpdate} 
                                            disabled={isUpdating}
                                            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 px-6 font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-600/20 transition-all active:scale-95"
                                        >
                                            {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                            Simpan Semua
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {previewData.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
                                            <tr>
                                                <th className="px-6 py-4">SKU / Nama Produk</th>
                                                <th className="px-6 py-4 text-center">Stok Lama</th>
                                                <th className="px-6 py-4 text-center">Stok Baru</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {previewData.map((item, i) => (
                                                <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-0.5">{item.sku}</p>
                                                            <p className="text-sm font-bold text-slate-900 truncate max-w-[250px]">{item.name || "-"}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm font-bold text-slate-400">{item.oldStock ?? "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm font-black text-slate-900">{item.stock}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {item.status === "FOUND" ? (
                                                            <Badge className="bg-green-100 text-green-700 border-none px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                                <CheckCircle className="w-3 h-3 mr-1" /> OK
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-red-100 text-red-700 border-none px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                                <XCircle className="w-3 h-3 mr-1" /> {item.message || "Error"}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => removeFromPreview(item.sku)}
                                                            className="h-8 w-8 text-slate-300 hover:text-red-500 rounded-lg"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 text-center px-6">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                        <Package className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-widest mb-2">Daftar Kosong</h3>
                                    <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">Input stok secara manual di atas atau unggah file Excel untuk mulai memperbarui ketersediaan.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Log Section */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-slate-100">
                        <CardHeader className="p-6 border-b border-slate-50">
                            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-teal-600" />
                                Riwayat Terakhir
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingLogs ? (
                                <div className="p-12 flex justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                                </div>
                            ) : stockLogs.length > 0 ? (
                                <div className="max-h-[500px] overflow-y-auto">
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
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.source}</span>
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
                                    <p className="text-xs text-slate-400 font-medium italic">Belum ada aktivitas.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-teal-50 rounded-3xl overflow-hidden border border-teal-100">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
                                    <AlertCircle className="h-5 w-5 text-white" />
                                </div>
                                <h4 className="font-black text-teal-800 text-xs uppercase tracking-widest leading-tight">Panduan Cepat</h4>
                            </div>
                            <ul className="space-y-2">
                                {[
                                    "Gunakan template Excel yang selaras dengan daftar produk.",
                                    "Input manual dapat digabungkan dengan hasil impor Excel.",
                                    "Data yang ditambahkan akan masuk ke antrean pratinjau.",
                                    "Klik 'Simpan Semua' untuk menerapkan perubahan stok."
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-2 text-[11px] text-teal-700/80 font-medium leading-relaxed">
                                        <div className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
