"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Search, 
    Plus, 
    FileUp, 
    FileDown, 
    Package, 
    MoreHorizontal, 
    Edit, 
    Trash2, 
    CheckCircle, 
    Clock, 
    XCircle,
    Loader2,
    Filter,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { 
    getVendorProductsAction, 
    deleteVendorProductAction,
    bulkImportVendorProductsAction 
} from "@/app/actions/vendor-product";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function VendorProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [isPending, startTransition] = useTransition();

    const fetchProducts = async () => {
        setLoading(true);
        const result = await getVendorProductsAction();
        if (result.success) {
            setProducts(result.products || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
        
        const result = await deleteVendorProductAction(id);
        if (result.success) {
            toast.success("Produk berhasil dihapus");
            fetchProducts();
        } else {
            toast.error(result.error || "Gagal menghapus produk");
        }
    };

    const handleExportTemplate = () => {
        // Headers according to requested field mapping
        const template = [
            { 
                "Kategori Barang": "Contoh: PLC", 
                "Kode Barang (MLFB/ SKU)": "CONTOH-123", 
                "Nama Barang": "Siemens S7-1200 CPU 1214C", 
                "Deskripsi/Detail produk (optional)": "Keterangan detail produk...", 
                "Def. Hrg. Jual Satuan": 5500000, 
                "Merek Barang": "Siemens", 
                "Quantity/Stock": 10,
                "Link Gambar (optional)": "https://example.com/image.jpg"
            },
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Template_Import_Produk_Vendor.xlsx");
    };

    const handleExportData = () => {
        if (products.length === 0) {
            toast.error("Tidak ada data produk untuk diekspor");
            return;
        }

        const dataToExport = products.map(p => ({
            "Nama Barang": p.name,
            "Kode Barang (MLFB/ SKU)": p.sku,
            "Merek Barang": p.brand || "—",
            "Kategori Barang": p.category || "—",
            "Harga Jual": p.price,
            "Stok": p.availableToSell,
            "Status": p.status === "APPROVED" ? "Disetujui" : p.status === "PENDING" ? "Menunggu" : "Ditolak",
            "Deskripsi": p.description || ""
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Produk Vendor");
        XLSX.writeFile(wb, `Data_Produk_Vendor_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Data produk berhasil diekspor");
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

                // Map Excel headers to Database fields
                const mappedData = rawData.map(row => ({
                    category: row["Kategori Barang"],
                    sku: row["Kode Barang (MLFB/ SKU)"],
                    name: row["Nama Barang"],
                    description: row["Deskripsi/Detail produk (optional)"],
                    price: parseFloat(row["Def. Hrg. Jual Satuan"]) || 0,
                    brand: row["Merek Barang"],
                    stock: parseInt(row["Quantity/Stock"]) || 0,
                    externalImageUrl: row["Link Gambar (optional)"]
                }));

                const result = await bulkImportVendorProductsAction(mappedData);
                if (result.success) {
                    toast.success(`${result.count} produk berhasil diimpor dan menunggu persetujuan`);
                    fetchProducts();
                } else {
                    toast.error(result.error || "Gagal mengimpor produk");
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

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"><CheckCircle className="w-3 h-3 mr-1" /> Disetujui</Badge>;
            case "PENDING":
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"><Clock className="w-3 h-3 mr-1" /> Menunggu</Badge>;
            case "REJECTED":
                return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">{status}</Badge>;
        }
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total: {products.length} Produk</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Produk Saya</h1>
                    <p className="text-slate-500 font-medium mt-2">Kelola, perbarui, dan pantau status verifikasi produk Anda.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" onClick={handleExportTemplate} className="rounded-2xl border-slate-200 font-bold text-xs h-11 px-5 shadow-sm hover:bg-slate-50 transition-all">
                        <FileDown className="w-4 h-4 mr-2 text-teal-600" />
                        Template
                    </Button>
                    <Button variant="outline" onClick={handleExportData} className="rounded-2xl border-slate-200 font-bold text-xs h-11 px-5 shadow-sm hover:bg-slate-50 transition-all">
                        <FileDown className="w-4 h-4 mr-2 text-red-600" />
                        Ekspor Data
                    </Button>
                    <div className="relative">
                        <Input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="excel-import"
                            onChange={handleImportExcel}
                            disabled={isImporting}
                        />
                        <Button variant="outline" asChild className="rounded-2xl border-slate-200 font-bold text-xs h-11 px-5 shadow-sm hover:bg-slate-50 transition-all cursor-pointer">
                            <label htmlFor="excel-import">
                                {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-teal-600" /> : <FileUp className="w-4 h-4 mr-2 text-teal-600" />}
                                Impor Excel
                            </label>
                        </Button>
                    </div>
                    <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white rounded-2xl h-11 px-6 font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-600/20 transition-all active:scale-95">
                        <Link href="/vendor/products/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Produk Baru
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filter & Table Card */}
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border border-slate-100">
                <CardHeader className="p-8 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                            <Input
                                placeholder="Cari nama, SKU, merek, atau kategori..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 pl-12 bg-slate-50/50 border-transparent focus:bg-white focus:ring-teal-500 focus:border-teal-500 rounded-2xl font-medium transition-all"
                            />
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl">
                            <Filter className="w-3.5 h-3.5 mr-2" />
                            Filter Lanjut
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto px-4 pb-8">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4 font-black">Detail Produk</th>
                                    <th className="px-6 py-4 font-black">Merek</th>
                                    <th className="px-6 py-4 font-black">Kategori</th>
                                    <th className="px-6 py-4 font-black">Harga Jual</th>
                                    <th className="px-6 py-4 font-black">Stok</th>
                                    <th className="px-6 py-4 font-black">Status</th>
                                    <th className="px-6 py-4 text-right font-black">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="space-y-2">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
                                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                    <Package className="w-10 h-10 text-slate-200" />
                                                </div>
                                                <h3 className="font-black text-slate-800 uppercase tracking-widest mb-1">Tidak Ada Data</h3>
                                                <p className="text-xs text-slate-400 font-medium">Coba gunakan kata kunci pencarian lain atau tambah produk baru.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr key={product.id} className="group transition-all">
                                            <td className="px-6 py-4 bg-white border-y border-l border-slate-50 group-hover:bg-slate-50/50 first:rounded-l-3xl transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-sm">
                                                        {product.image ? (
                                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-6 h-6 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">{product.name}</p>
                                                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-0.5">{product.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 bg-white border-y border-slate-50 group-hover:bg-slate-50/50 transition-all">
                                                <Badge variant="outline" className="rounded-lg border-slate-200 font-bold text-[10px] text-slate-600 bg-slate-50/30">
                                                    {product.brand || "TANPA MEREK"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 bg-white border-y border-slate-50 group-hover:bg-slate-50/50 transition-all">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{product.category || "—"}</p>
                                            </td>
                                            <td className="px-6 py-4 bg-white border-y border-slate-50 group-hover:bg-slate-50/50 transition-all">
                                                <p className="text-sm font-black text-slate-900">Rp {product.price.toLocaleString("id-ID")}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Per Satuan</p>
                                            </td>
                                            <td className="px-6 py-4 bg-white border-y border-slate-50 group-hover:bg-slate-50/50 transition-all">
                                                <div className="flex items-center gap-2">
                                                    <p className={cn(
                                                        "text-sm font-black",
                                                        product.availableToSell > 0 ? "text-slate-900" : "text-red-500"
                                                    )}>
                                                        {product.availableToSell}
                                                    </p>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 bg-white border-y border-slate-50 group-hover:bg-slate-50/50 transition-all">
                                                {getStatusBadge(product.status)}
                                            </td>
                                            <td className="px-6 py-4 bg-white border-y border-r border-slate-50 group-hover:bg-slate-50/50 last:rounded-r-3xl text-right transition-all">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white hover:shadow-md transition-all">
                                                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-2xl border-slate-100 p-2 animate-in slide-in-from-top-2 duration-200">
                                                        <DropdownMenuItem asChild className="cursor-pointer py-3 px-4 rounded-xl focus:bg-teal-50 focus:text-teal-700 transition-colors">
                                                            <Link href={`/vendor/products/${product.id}/edit`} className="flex items-center w-full">
                                                                <Edit className="w-4 h-4 mr-3" />
                                                                <span className="font-black text-xs uppercase tracking-widest">Edit Produk</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDelete(product.id)}
                                                            className="cursor-pointer py-3 px-4 rounded-xl focus:bg-red-50 focus:text-red-700 text-red-600 transition-colors mt-1"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-3" />
                                                            <span className="font-black text-xs uppercase tracking-widest">Hapus</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
