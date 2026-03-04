"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    RefreshCw, 
    Upload, 
    FileImage, 
    FileText, 
    ChevronDown, 
    Loader2, 
    Clock,
    Database,
    Zap
} from "lucide-react";
import { 
    syncProductsAction, 
    syncStockOnlyAction 
} from "@/app/actions/product";
import { ProductImageImporter } from "./ProductImageImporter";
import { ProductDescriptionImporter } from "./ProductDescriptionImporter";
import { toast } from "sonner";

export default function ProductActionGroups() {
    const [isPendingFull, startFullTransition] = useTransition();
    const [isPendingStock, startStockTransition] = useTransition();
    
    // Dialog states
    const [showImageImport, setShowImageImport] = useState(false);
    const [showDescImport, setShowDescImport] = useState(false);

    const handleFullSync = () => {
        startFullTransition(async () => {
            const result = await syncProductsAction();
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    };

    const handleStockSync = () => {
        startStockTransition(async () => {
            const result = await syncStockOnlyAction();
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    };

    const isSyncing = isPendingFull || isPendingStock;

    return (
        <div className="flex items-center gap-2">
            {/* IMPORT GROUP */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 rounded-xl border-gray-200 font-bold text-xs gap-2 px-4 shadow-sm hover:bg-gray-50">
                        <Upload className="w-4 h-4 text-gray-500" />
                        Import Data
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-1">
                    <DropdownMenuLabel className="text-[10px] uppercase font-black text-gray-400 px-2 py-2">Opsi Batch Import</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        className="rounded-lg py-2.5 cursor-pointer gap-3" 
                        onClick={() => setShowImageImport(true)}
                    >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <FileImage className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">Import Gambar</span>
                            <span className="text-[10px] text-gray-400 italic">CSV (SKU, Image_URL)</span>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        className="rounded-lg py-2.5 cursor-pointer gap-3"
                        onClick={() => setShowDescImport(true)}
                    >
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">Import Deskripsi</span>
                            <span className="text-[10px] text-gray-400 italic">CSV (SKU, Description)</span>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* SYNC GROUP */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        disabled={isSyncing}
                        className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-2 px-4 shadow-lg shadow-red-100 transition-all active:scale-95"
                    >
                        {isSyncing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        Sinkronisasi
                        <ChevronDown className="w-3 h-3 text-red-200" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl p-1">
                    <DropdownMenuLabel className="text-[10px] uppercase font-black text-gray-400 px-2 py-2 text-center">Sinkronisasi Accurate</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                        className="rounded-lg py-3 cursor-pointer gap-3"
                        onClick={handleStockSync}
                        disabled={isSyncing}
                    >
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col flex-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">Sinkron Stok Saja</span>
                                <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Cepat</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                <Clock className="w-3 h-3" /> Estimasi: 1 - 2 Menit
                            </div>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                        className="rounded-lg py-3 cursor-pointer gap-3 mt-1"
                        onClick={handleFullSync}
                        disabled={isSyncing}
                    >
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                            <Database className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col flex-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">Sinkron Keseluruhan</span>
                                <span className="text-[10px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Penuh</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                <Clock className="w-3 h-3" /> Estimasi: 5 - 10 Menit
                            </div>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden Importers (Controlled by state) */}
            <ProductImageImporter 
                open={showImageImport} 
                onOpenChange={setShowImageImport} 
            />
            <ProductDescriptionImporter 
                open={showDescImport} 
                onOpenChange={setShowDescImport} 
            />
        </div>
    );
}
