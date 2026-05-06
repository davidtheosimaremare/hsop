"use client";

import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { 
    Upload, 
    Download, 
    Search, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    RefreshCw, 
    FileSpreadsheet, 
    Check, 
    X, 
    ChevronLeft, 
    ChevronRight,
    ArrowUpRight,
    Minus,
    TrendingUp,
    TrendingDown,
    Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { comparePricesWithExcel, updateAccuratePrices, ComparePriceItem } from "@/app/actions/price-sync";
import { useToast } from "@/components/ui/toast";

export default function PriceUpdateClient() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
    
    // Data list parsed from excel & compared with database
    const [comparisonList, setComparisonList] = useState<ComparePriceItem[]>([]);
    
    // Filters and search states
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "DIFFERENT" | "SAME" | "NOT_FOUND">("ALL");
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 100; // As requested: "satu halaman isinya 100"

    // Selection state for checkboxes (stores SKUs of selected items)
    const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());

    // Syncing process states
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; logs: string[] }>({
        current: 0,
        total: 0,
        logs: []
    });
    const [showProgressModal, setShowProgressModal] = useState<boolean>(false);

    // Download a ready-to-use template Excel file
    const handleDownloadTemplate = () => {
        const headers = [
            { "SKU": "SIEMENS-3RT2015-1AP01", "Harga Baru": 350000 },
            { "SKU": "SIEMENS-5SL6106-7CC", "Harga Baru": 75000 }
        ];
        const ws = XLSX.utils.json_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Update Harga");
        XLSX.writeFile(wb, "template-update-harga-accurate.xlsx");
        toast.success("Template Excel Diunduh! Silakan isi file Excel ini dengan SKU dan Harga Baru Anda.");
    };

    // Parse Excel file upload and fetch DB comparisons
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsLoadingFile(true);
        setSelectedSkus(new Set());
        setComparisonList([]);
        setCurrentPage(1);

        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const workbook = XLSX.read(bstr, { type: "binary" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

                    if (rows.length === 0) {
                        throw new Error("File Excel kosong atau tidak terbaca.");
                    }

                    // Smart map headers case-insensitively
                    const itemsToCompare: { sku: string; price: number }[] = [];
                    for (const row of rows) {
                        let sku = "";
                        let price = 0;

                        for (const key of Object.keys(row)) {
                            const normalizedKey = key.trim().toLowerCase();
                            if (
                                normalizedKey === "sku" || 
                                normalizedKey === "no" || 
                                normalizedKey === "item no" || 
                                normalizedKey === "itemno" || 
                                normalizedKey === "item_no" ||
                                normalizedKey === "kode" ||
                                normalizedKey === "kode barang"
                            ) {
                                sku = String(row[key] || "").trim();
                            } else if (
                                normalizedKey === "price" || 
                                normalizedKey === "harga" || 
                                normalizedKey === "new price" || 
                                normalizedKey === "harga baru" || 
                                normalizedKey === "unit price" || 
                                normalizedKey === "unitprice" ||
                                normalizedKey === "harga_baru"
                            ) {
                                const rawVal = row[key];
                                price = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal || "").replace(/[^0-9.-]+/g, ""));
                            }
                        }

                        if (sku && !isNaN(price) && price >= 0) {
                            itemsToCompare.push({ sku, price });
                        }
                    }

                    if (itemsToCompare.length === 0) {
                        throw new Error("Format kolom tidak dikenal. Pastikan terdapat kolom 'SKU' dan 'Harga Baru'.");
                    }

                    // Call Server Action to compare prices against database
                    const compared = await comparePricesWithExcel(itemsToCompare);
                    setComparisonList(compared);

                    // Pre-select items that actually have different prices to save time for admin!
                    const preSelected = new Set(
                        compared
                            .filter(item => item.status === "DIFFERENT")
                            .map(item => item.sku)
                    );
                    setSelectedSkus(preSelected);

                    toast.success(`Excel Berhasil Dimuat! Terbaca ${compared.length} produk.`);
                } catch (err: any) {
                    toast.error(err.message || "Gagal Membaca File. Terjadi kesalahan saat parsing Excel.");
                } finally {
                    setIsLoadingFile(false);
                }
            };
            reader.readAsBinaryString(file);
        } catch (err: any) {
            toast.error(err.message || "Gagal memproses file.");
            setIsLoadingFile(false);
        }
    };

    // Filtering logic
    const filteredList = useMemo(() => {
        return comparisonList.filter(item => {
            // Search filter
            const matchesSearch = 
                item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Status filter
            const matchesStatus = 
                statusFilter === "ALL" || 
                item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [comparisonList, searchQuery, statusFilter]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredList.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        const skip = (currentPage - 1) * itemsPerPage;
        return filteredList.slice(skip, skip + itemsPerPage);
    }, [filteredList, currentPage]);

    // Stats calculations
    const stats = useMemo(() => {
        const total = comparisonList.length;
        const different = comparisonList.filter(i => i.status === "DIFFERENT").length;
        const same = comparisonList.filter(i => i.status === "SAME").length;
        const notFound = comparisonList.filter(i => i.status === "NOT_FOUND").length;

        return { total, different, same, notFound };
    }, [comparisonList]);

    // Page selection handlers
    const isAllPageSelected = useMemo(() => {
        if (paginatedItems.length === 0) return false;
        return paginatedItems.every(item => selectedSkus.has(item.sku) || item.status === "NOT_FOUND");
    }, [paginatedItems, selectedSkus]);

    const handleSelectAllPage = () => {
        const newSelected = new Set(selectedSkus);
        const pageSkus = paginatedItems.filter(item => item.status !== "NOT_FOUND");

        if (isAllPageSelected) {
            // Unselect all on this page
            pageSkus.forEach(item => newSelected.delete(item.sku));
        } else {
            // Select all valid items on this page
            pageSkus.forEach(item => newSelected.add(item.sku));
        }
        setSelectedSkus(newSelected);
    };

    const handleRowSelect = (sku: string) => {
        const newSelected = new Set(selectedSkus);
        if (newSelected.has(sku)) {
            newSelected.delete(sku);
        } else {
            newSelected.add(sku);
        }
        setSelectedSkus(newSelected);
    };

    // Bulk synchronizer execution
    const handleSyncToAccurate = async () => {
        if (selectedSkus.size === 0) {
            toast.info("Tidak ada produk terpilih. Silakan pilih minimal 1 produk.");
            return;
        }

        const itemsToSync = comparisonList.filter(item => selectedSkus.has(item.sku));
        
        setIsSyncing(true);
        setShowProgressModal(true);
        setSyncProgress({
            current: 0,
            total: itemsToSync.length,
            logs: ["Memulai sinkronisasi harga ke Accurate..."]
        });

        // Run batch updates sequentially/concurrently to keep admin updated in real-time
        // We do small batches of 5 to allow progress visibility
        const batchSize = 5;
        const results: { sku: string; success: boolean; message: string }[] = [];

        for (let i = 0; i < itemsToSync.length; i += batchSize) {
            const batch = itemsToSync.slice(i, i + batchSize);
            
            setSyncProgress(prev => ({
                ...prev,
                logs: [
                    ...prev.logs,
                    `Sinkronisasi batch ${Math.floor(i / batchSize) + 1} (${batch.map(b => b.sku).join(", ")})`
                ]
            }));

            const batchPayload = batch.map(b => ({
                sku: b.sku,
                accurateId: b.accurateId,
                newPrice: b.newPrice
            }));

            try {
                const batchRes = await updateAccuratePrices(batchPayload);
                results.push(...batchRes);

                // Add to real-time logs
                const logsToAdd = batchRes.map(res => 
                    res.success 
                        ? `✅ [SUKSES] SKU ${res.sku}: ${res.message}`
                        : `❌ [GAGAL] SKU ${res.sku}: ${res.message}`
                );

                setSyncProgress(prev => ({
                    ...prev,
                    current: Math.min(prev.current + batch.length, prev.total),
                    logs: [...prev.logs, ...logsToAdd]
                }));
            } catch (err: any) {
                const logsToAdd = batch.map(b => `❌ [GAGAL] SKU ${b.sku}: Gagal mengirim permintaan ke server.`);
                setSyncProgress(prev => ({
                    ...prev,
                    current: Math.min(prev.current + batch.length, prev.total),
                    logs: [...prev.logs, ...logsToAdd]
                }));
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        setSyncProgress(prev => ({
            ...prev,
            logs: [
                ...prev.logs,
                `🏁 Sinkronisasi selesai! Berhasil: ${successCount} | Gagal: ${failureCount}`
            ]
        }));

        setIsSyncing(false);

        // Update the main comparison list local price for success items
        const successSkus = new Set(results.filter(r => r.success).map(r => r.sku));
        setComparisonList(prev => 
            prev.map(item => {
                if (successSkus.has(item.sku)) {
                    return {
                        ...item,
                        currentPrice: item.newPrice,
                        status: "SAME" as const
                    };
                }
                return item;
            })
        );

        // Remove success skus from active selection
        const newSelected = new Set(selectedSkus);
        successSkus.forEach(sku => newSelected.delete(sku));
        setSelectedSkus(newSelected);

        toast.success(`Sinkronisasi Selesai! Berhasil sinkronisasi ${successCount} produk ke Accurate & Database lokal.`);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1.5">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sinkronisasi Harga Accurate</h1>
                    <p className="text-slate-500 font-medium">Bandingkan harga produk dari file Excel dengan Accurate dan perbarui secara masal.</p>
                </div>
                <Button 
                    onClick={handleDownloadTemplate} 
                    variant="outline" 
                    className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-all shrink-0 inline-flex items-center gap-2"
                >
                    <Download className="w-4 h-4 text-slate-500" />
                    Unduh Template Excel
                </Button>
            </div>

            {/* Drag & Drop Excel Upload Zone */}
            <Card className="border-2 border-dashed border-slate-200 bg-white hover:border-red-500/50 transition-all rounded-2xl overflow-hidden shadow-sm">
                <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
                            <FileSpreadsheet className="w-8 h-8 text-red-600 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-800 text-base">Unggah Berkas Excel Harga Baru</h3>
                            <p className="text-xs text-slate-400 max-w-md mx-auto">
                                Unggah file spreadsheet berformat <span className="font-semibold text-slate-600">.xlsx</span> atau <span className="font-semibold text-slate-600">.xls</span>. Kolom wajib memiliki header <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-red-600 text-[10px]">SKU</span> dan <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-red-600 text-[10px]">Harga Baru</span>.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoadingFile}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-6 rounded-xl transition-all shadow-md shadow-red-600/10 inline-flex items-center gap-2"
                            >
                                {isLoadingFile ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {isLoadingFile ? "Membaca Excel..." : "Pilih File"}
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>

                        {fileName && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                {fileName}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {comparisonList.length > 0 && (
                <>
                    {/* Horizontal Statistics Grid */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                                <FileSpreadsheet className="h-5 w-5 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total di Excel</p>
                                <div className="text-2xl font-black text-slate-900 leading-none">{stats.total} <span className="text-[11px] font-bold text-slate-400">Item</span></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-gradient-to-br from-amber-50 to-white rounded-2xl p-4 border border-amber-100 shadow-sm group">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">Berbeda Harga</p>
                                <div className="text-2xl font-black text-amber-700 leading-none">{stats.different} <span className="text-[11px] font-bold text-amber-500">Item</span></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100/80 flex items-center justify-center border border-emerald-200 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Sama Harga</p>
                                <div className="text-2xl font-black text-emerald-700 leading-none">{stats.same} <span className="text-[11px] font-bold text-emerald-500">Item</span></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-gradient-to-br from-red-50 to-white rounded-2xl p-4 border border-red-100 shadow-sm">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100/80 flex items-center justify-center border border-red-200 text-red-600">
                                <XCircle className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-0.5">Tidak Ditemukan</p>
                                <div className="text-2xl font-black text-red-700 leading-none">{stats.notFound} <span className="text-[11px] font-bold text-red-500">Item</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Table Filters and Controls */}
                    <Card className="border-none bg-white rounded-2xl shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-slate-50 py-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Cari SKU atau nama produk..."
                                        value={searchQuery}
                                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        className="pl-9 h-10 bg-slate-50 border-transparent focus:bg-white focus:ring-red-600/20 focus:border-red-600 rounded-xl transition-all text-sm font-medium"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                                    className="h-10 bg-slate-50 border-transparent border focus:border-red-600 focus:ring-0 rounded-xl px-3 text-xs font-bold text-slate-700 cursor-pointer appearance-none min-w-[150px]"
                                >
                                    <option value="ALL">Semua Status</option>
                                    <option value="DIFFERENT">Berbeda Harga</option>
                                    <option value="SAME">Sama Harga</option>
                                    <option value="NOT_FOUND">Tidak Ditemukan</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                    Pilih: <span className="text-red-600 font-extrabold">{selectedSkus.size}</span> / {comparisonList.filter(c => c.status !== "NOT_FOUND").length} Item
                                </div>
                                <Button
                                    onClick={handleSyncToAccurate}
                                    disabled={selectedSkus.size === 0}
                                    className="bg-red-600 hover:bg-red-700 disabled:opacity-30 text-white font-bold h-10 px-5 rounded-xl transition-all inline-flex items-center gap-2 shadow-lg shadow-red-600/10"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    Update Terpilih ke Accurate
                                </Button>
                            </div>
                        </CardHeader>

                        {/* Comparison Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="px-6 py-3.5 text-center w-[50px]">
                                            <input
                                                type="checkbox"
                                                checked={isAllPageSelected}
                                                onChange={handleSelectAllPage}
                                                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider w-[200px]">SKU / Kode</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Produk</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-[150px]">Harga Saat Ini (DB)</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-[150px]">Harga Baru (Excel)</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-[150px]">Selisih</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-[160px]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-medium text-sm text-slate-700">
                                    {paginatedItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                                                Tidak ada produk yang cocok dengan filter pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedItems.map((item) => {
                                            const isSelected = selectedSkus.has(item.sku);
                                            const isNotFound = item.status === "NOT_FOUND";
                                            const diffVal = item.newPrice - item.currentPrice;
                                            const diffPct = item.currentPrice > 0 ? (diffVal / item.currentPrice) * 100 : 0;

                                            return (
                                                <tr 
                                                    key={item.sku} 
                                                    className={`hover:bg-slate-50/40 transition-colors ${isSelected ? "bg-red-50/10" : ""}`}
                                                >
                                                    <td className="px-6 py-3 text-center align-middle">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            disabled={isNotFound}
                                                            onChange={() => handleRowSelect(item.sku)}
                                                            className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3 font-semibold text-slate-950 font-mono text-xs">{item.sku}</td>
                                                    <td className="px-6 py-3 text-xs text-slate-600 max-w-xs truncate" title={item.name}>{item.name}</td>
                                                    <td className="px-6 py-3 text-right">
                                                        {isNotFound ? (
                                                            <span className="text-slate-300">-</span>
                                                        ) : (
                                                            <span>Rp {item.currentPrice.toLocaleString("id-ID")}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-semibold text-slate-900">
                                                        Rp {item.newPrice.toLocaleString("id-ID")}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-xs">
                                                        {isNotFound ? (
                                                            <span className="text-slate-300">-</span>
                                                        ) : item.status === "SAME" ? (
                                                            <span className="text-slate-400 inline-flex items-center gap-0.5">
                                                                <Minus className="w-3.5 h-3.5" />
                                                                0%
                                                            </span>
                                                        ) : diffVal > 0 ? (
                                                            <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5">
                                                                <TrendingUp className="w-3 h-3" />
                                                                +{diffPct.toFixed(1)}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5">
                                                                <TrendingDown className="w-3 h-3" />
                                                                {diffPct.toFixed(1)}%
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        {item.status === "DIFFERENT" ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                                                Berbeda Harga
                                                            </span>
                                                        ) : item.status === "SAME" ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                                                <Check className="w-3 h-3 shrink-0" />
                                                                Sama Harga
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                                                                <X className="w-3 h-3 shrink-0" />
                                                                Tidak Ada
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                                    Menampilkan {Math.min(filteredList.length, (currentPage - 1) * itemsPerPage + 1)}—{Math.min(currentPage * itemsPerPage, filteredList.length)} Dari {filteredList.length} DATA
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-3 rounded-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    >
                                        Sebelumnya
                                    </Button>

                                    <div className="px-4 h-9 flex items-center bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            Halaman {currentPage} <span className="mx-2 text-slate-300">/</span> {totalPages}
                                        </span>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-3 rounded-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    >
                                        Selanjutnya
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </>
            )}

            {/* Real-time Sync Progress Modal */}
            {showProgressModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <RefreshCw className={`w-4 h-4 text-red-600 ${isSyncing ? "animate-spin" : ""}`} />
                                Sinkronisasi Harga Accurate
                            </h3>
                            {!isSyncing && (
                                <button 
                                    onClick={() => setShowProgressModal(false)}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Progress bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Progress Sinkronisasi</span>
                                    <span>{syncProgress.current} / {syncProgress.total} ({syncProgress.total > 0 ? Math.round((syncProgress.current / syncProgress.total) * 100) : 0}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-red-600 h-full rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Live Console Logs */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Logs</label>
                                <div className="bg-slate-900 text-slate-200 font-mono text-xs p-4 rounded-xl h-[260px] overflow-y-auto space-y-2 border border-slate-800 flex flex-col-reverse shadow-inner">
                                    <div className="flex flex-col-reverse space-y-2 space-y-reverse">
                                        {[...syncProgress.logs].reverse().map((log, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`py-0.5 ${
                                                    log.includes("✅") ? "text-emerald-400 font-medium" : 
                                                    log.includes("❌") ? "text-rose-400 font-medium" : 
                                                    log.includes("🏁") ? "text-cyan-400 font-extrabold py-1 border-t border-slate-800" : 
                                                    "text-slate-400"
                                                }`}
                                            >
                                                {log}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                            <Button
                                disabled={isSyncing}
                                onClick={() => setShowProgressModal(false)}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-6 rounded-xl transition-all"
                            >
                                {isSyncing ? "Menyinkronkan..." : "Selesai & Tutup"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
