"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Search, 
    AlertTriangle, 
    CheckCircle2, 
    RefreshCw, 
    Check, 
    X, 
    Play,
    Tag,
    Layers,
    Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSyncableBrands, compareBrandsForSync, updateAccurateBrands, BrandSyncItem } from "@/app/actions/brand-sync";
import { useToast } from "@/components/ui/toast";

export default function BrandUpdateClient() {
    const { toast } = useToast();
    const [availableBrands, setAvailableBrands] = useState<{ id: string; name: string; accurateId: number | null }[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string>("");
    const [isLoadingBrands, setIsLoadingBrands] = useState<boolean>(true);
    const [isComparing, setIsComparing] = useState<boolean>(false);
    
    // Comparison data list
    const [comparisonList, setComparisonList] = useState<BrandSyncItem[]>([]);
    
    // Filters and search states
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "DIFFERENT" | "SAME">("ALL");
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 100;

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
    const [rowSyncingSku, setRowSyncingSku] = useState<string | null>(null);

    // 1. Fetch available brands on load
    useEffect(() => {
        async function loadBrands() {
            try {
                const brands = await getSyncableBrands();
                // Map the Prisma Brand to fit our state structure
                const mappedBrands = brands.map(b => ({
                    id: b.id,
                    name: b.name,
                    accurateId: b.accurateId
                }));
                setAvailableBrands(mappedBrands);
                
                // Pre-select SIEMENS brand if it exists
                const siemensBrand = mappedBrands.find(b => b.name.toUpperCase() === "SIEMENS");
                if (siemensBrand) {
                    setSelectedBrandId(siemensBrand.id);
                } else if (mappedBrands.length > 0) {
                    setSelectedBrandId(mappedBrands[0].id);
                }
            } catch (err) {
                console.error("Failed to load brands:", err);
                toast.error("Gagal memuat daftar brand.");
            } finally {
                setIsLoadingBrands(false);
            }
        }
        loadBrands();
    }, []);

    // Find details of the selected brand
    const selectedBrandDetails = useMemo(() => {
        return availableBrands.find(b => b.id === selectedBrandId) || null;
    }, [availableBrands, selectedBrandId]);

    // 2. Fetch comparisons
    const handleCompareBrands = async () => {
        if (!selectedBrandDetails || selectedBrandDetails.accurateId === null) {
            toast.error("Silakan pilih brand yang valid dengan Accurate ID.");
            return;
        }

        setIsComparing(true);
        setComparisonList([]);
        setSelectedSkus(new Set());
        setCurrentPage(1);

        try {
            const data = await compareBrandsForSync(selectedBrandDetails.name, selectedBrandDetails.accurateId);
            setComparisonList(data);
            
            // Pre-select items that need brand update (status: DIFFERENT)
            const preSelected = new Set(
                data
                    .filter(item => item.status === "DIFFERENT")
                    .map(item => item.sku)
            );
            setSelectedSkus(preSelected);

            if (data.length === 0) {
                toast.info(`Tidak ditemukan produk Accurate untuk brand ${selectedBrandDetails.name}.`);
            } else {
                toast.success(`Daftar produk berhasil dimuat! Ditemukan ${data.length} produk.`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Gagal membandingkan brand produk.");
        } finally {
            setIsComparing(false);
        }
    };

    // Sync single row item to Accurate
    const handleSyncSingleRow = async (item: BrandSyncItem) => {
        if (rowSyncingSku) return;
        setRowSyncingSku(item.sku);
        try {
            const result = await updateAccurateBrands([{
                sku: item.sku,
                accurateId: item.accurateId,
                targetBrandId: item.recommendedBrandId,
                targetBrandName: item.recommendedBrandName
            }]);

            if (result && result[0]) {
                const res = result[0];
                if (res.success) {
                    toast.success(`Berhasil update brand SKU ${item.sku} ke Accurate & Database!`);
                    setComparisonList(prev => 
                        prev.map(p => {
                            if (p.sku === item.sku) {
                                return {
                                    ...p,
                                    accurateBrandId: item.recommendedBrandId,
                                    accurateBrandName: item.recommendedBrandName,
                                    localBrandName: item.recommendedBrandName,
                                    status: "SAME" as const
                                };
                            }
                            return p;
                        })
                    );
                    const newSelected = new Set(selectedSkus);
                    newSelected.delete(item.sku);
                    setSelectedSkus(newSelected);
                } else {
                    toast.error(`Gagal update SKU ${item.sku}: ${res.message}`);
                }
            } else {
                toast.error(`Gagal sinkronisasi SKU ${item.sku}`);
            }
        } catch (err: any) {
            toast.error(`Gagal sinkronisasi SKU ${item.sku}: ${err.message || err}`);
        } finally {
            setRowSyncingSku(null);
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

        return { total, different, same };
    }, [comparisonList]);

    // Page selection handlers
    const isAllPageSelected = useMemo(() => {
        if (paginatedItems.length === 0) return false;
        return paginatedItems.every(item => selectedSkus.has(item.sku));
    }, [paginatedItems, selectedSkus]);

    const handleSelectAllPage = () => {
        const newSelected = new Set(selectedSkus);

        if (isAllPageSelected) {
            // Unselect all on this page
            paginatedItems.forEach(item => newSelected.delete(item.sku));
        } else {
            // Select all on this page
            paginatedItems.forEach(item => newSelected.add(item.sku));
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
            logs: [`Memulai sinkronisasi brand ${selectedBrandDetails?.name} ke Accurate & Database lokal...`]
        });

        // Run updates in concurrent batches of 5
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
                targetBrandId: b.recommendedBrandId,
                targetBrandName: b.recommendedBrandName
            }));

            try {
                const batchRes = await updateAccurateBrands(batchPayload);
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
                `🏁 Sinkronisasi brand selesai! Berhasil: ${successCount} | Gagal: ${failureCount}`
            ]
        }));

        setIsSyncing(false);

        // Update local comparison lists for successful updates
        const successSkus = new Set(results.filter(r => r.success).map(r => r.sku));
        setComparisonList(prev => 
            prev.map(item => {
                if (successSkus.has(item.sku)) {
                    return {
                        ...item,
                        accurateBrandId: item.recommendedBrandId,
                        accurateBrandName: item.recommendedBrandName,
                        localBrandName: item.recommendedBrandName,
                        status: "SAME" as const
                    };
                }
                return item;
            })
        );

        // Remove success skus from selection
        const newSelected = new Set(selectedSkus);
        successSkus.forEach(sku => newSelected.delete(sku));
        setSelectedSkus(newSelected);

        toast.success(`Sinkronisasi selesai! Berhasil memperbarui brand ${successCount} produk.`);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="space-y-1.5">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sinkronisasi Brand Accurate</h1>
                <p className="text-slate-500 font-medium">Temukan produk Accurate berdasarkan prefix nama/SKU dan sinkronisasikan brand mereka secara masal.</p>
            </div>

            {/* Selector Card */}
            <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center gap-3">
                    <Sliders className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-base font-black text-slate-800">Pilih Brand Untuk Sinkronisasi</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 max-w-2xl">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Brand Target</label>
                            {isLoadingBrands ? (
                                <div className="h-10 bg-slate-50 rounded-xl border border-slate-100 animate-pulse flex items-center px-3 text-xs text-slate-400 font-medium">
                                    Memuat daftar brand...
                                </div>
                            ) : (
                                <select
                                    value={selectedBrandId}
                                    onChange={e => {
                                        setSelectedBrandId(e.target.value);
                                        setComparisonList([]);
                                        setSelectedSkus(new Set());
                                    }}
                                    className="w-full h-10 bg-slate-50 border-transparent border focus:border-red-600 focus:ring-0 rounded-xl px-3 text-sm font-bold text-slate-800 cursor-pointer appearance-none"
                                >
                                    <option value="" disabled>-- Pilih Brand --</option>
                                    {availableBrands.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} (Accurate ID: {b.accurateId})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <Button
                            onClick={handleCompareBrands}
                            disabled={isComparing || !selectedBrandId || isLoadingBrands}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-6 rounded-xl transition-all shadow-md shadow-red-600/10 inline-flex items-center gap-2 shrink-0"
                        >
                            {isComparing ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                            {isComparing ? "Membandingkan..." : "Cari & Bandingkan"}
                        </Button>
                    </div>

                    {selectedBrandDetails && (
                        <div className="text-xs text-slate-400 font-medium bg-red-50/20 border border-red-100/30 p-3 rounded-xl max-w-2xl">
                            ℹ️ Pencarian akan memindai seluruh produk Accurate yang diawali dengan nama <span className="font-bold text-red-600">"{selectedBrandDetails.name}"</span> (misal: <span className="italic">SIEMENS ACB ...</span>) dan akan merekomendasikan Accurate Brand ID <span className="font-bold text-slate-700">{selectedBrandDetails.accurateId}</span>.
                        </div>
                    )}
                </CardContent>
            </Card>

            {comparisonList.length > 0 && (
                <>
                    {/* Stats Blocks */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                                <Layers className="h-5 w-5 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Produk Terkait</p>
                                <div className="text-2xl font-black text-slate-900 leading-none">{stats.total} <span className="text-[11px] font-bold text-slate-400">Item</span></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-gradient-to-br from-amber-50 to-white rounded-2xl p-4 border border-amber-100 shadow-sm group">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">Brand Berbeda / Kosong</p>
                                <div className="text-2xl font-black text-amber-700 leading-none">{stats.different} <span className="text-[11px] font-bold text-amber-500">Item</span></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100/80 flex items-center justify-center border border-emerald-200 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Brand Sesuai</p>
                                <div className="text-2xl font-black text-emerald-700 leading-none">{stats.same} <span className="text-[11px] font-bold text-emerald-500">Item</span></div>
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
                                    <option value="DIFFERENT">Berbeda / Kosong</option>
                                    <option value="SAME">Brand Sesuai</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                    Pilih: <span className="text-red-600 font-extrabold">{selectedSkus.size}</span> / {comparisonList.length} Item
                                </div>
                                <Button
                                    onClick={handleSyncToAccurate}
                                    disabled={selectedSkus.size === 0}
                                    className="bg-red-600 hover:bg-red-700 disabled:opacity-30 text-white font-bold h-10 px-5 rounded-xl transition-all inline-flex items-center gap-2 shadow-lg shadow-red-600/10"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    Update Brand Terpilih ke Accurate
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
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider w-[180px]">SKU / Kode</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Produk</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider w-[150px]">Brand Accurate</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider w-[150px]">Brand DB Lokal</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider w-[150px]">Rekomendasi</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-[150px]">Status</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-[120px]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-medium text-sm text-slate-700">
                                    {paginatedItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                                                Tidak ada produk yang cocok dengan filter pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedItems.map((item) => {
                                            const isSelected = selectedSkus.has(item.sku);

                                            return (
                                                <tr 
                                                    key={item.sku} 
                                                    className={`hover:bg-slate-50/40 transition-colors ${isSelected ? "bg-red-50/10" : ""}`}
                                                >
                                                    <td className="px-6 py-3 text-center align-middle">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleRowSelect(item.sku)}
                                                            className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3 font-semibold text-slate-950 font-mono text-xs">{item.sku}</td>
                                                    <td className="px-6 py-3 text-xs text-slate-600 max-w-xs truncate" title={item.name}>{item.name}</td>
                                                    <td className="px-6 py-3 text-xs text-slate-500">
                                                        {item.accurateBrandName ? (
                                                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                                                {item.accurateBrandName}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Belum diset</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-xs text-slate-500">
                                                        {item.localBrandName ? (
                                                            <span className="font-bold text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                                                                {item.localBrandName}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Belum diset</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-xs">
                                                        <span className="font-extrabold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                                            <Tag className="w-3 h-3" />
                                                            {item.recommendedBrandName}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        {item.status === "DIFFERENT" ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                                                Butuh Sync
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                                                <Check className="w-3 h-3 shrink-0" />
                                                                Sudah Sesuai
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-center align-middle">
                                                        {item.status === "DIFFERENT" ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={!!rowSyncingSku}
                                                                onClick={() => handleSyncSingleRow(item)}
                                                                className="h-8 px-2.5 rounded-lg border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-extrabold inline-flex items-center justify-center gap-1 transition-all"
                                                            >
                                                                {rowSyncingSku === item.sku ? (
                                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                                ) : (
                                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                                )}
                                                                {rowSyncingSku === item.sku ? "Sync..." : "Sync"}
                                                            </Button>
                                                        ) : (
                                                            <span className="text-emerald-600 text-xs font-bold inline-flex items-center justify-center gap-1">
                                                                <Check className="w-3.5 h-3.5" />
                                                                Selesai
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
                                Sinkronisasi Brand Accurate
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
