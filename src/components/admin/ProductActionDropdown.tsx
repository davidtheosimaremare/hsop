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
import { Settings2, RefreshCw, Package, Image as ImageIcon, FileText } from "lucide-react";
import { syncProductsAction, syncStockOnlyAction } from "@/app/actions/product";
import { toast } from "sonner";
import { ProductImageImporter } from "./ProductImageImporter";
import { ProductDescriptionImporter } from "./ProductDescriptionImporter";

export default function ProductActionDropdown() {
    const [isPendingFull, startFullTransition] = useTransition();
    const [isPendingStock, startStockTransition] = useTransition();

    const [isImageImporterOpen, setIsImageImporterOpen] = useState(false);
    const [isDescImporterOpen, setIsDescImporterOpen] = useState(false);

    const isPending = isPendingFull || isPendingStock;

    const handleFullSync = () => {
        startFullTransition(async () => {
            const result = await syncProductsAction();
            if (result.success) {
                toast.success(result.message || "Sinkronisasi Berhasil");
            } else {
                toast.error(result.message || "Gagal sinkronisasi");
            }
        });
    };

    const handleStockSync = () => {
        startStockTransition(async () => {
            const result = await syncStockOnlyAction();
            if (result.success) {
                toast.success(result.message || "Sinkronisasi Stok Berhasil");
            } else {
                toast.error(result.message || "Gagal sinkronisasi stok");
            }
        });
    };

    return (
        <div className="flex items-center gap-2">
            {/* Sync Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        disabled={isPending}
                        className="bg-red-600 hover:bg-red-700 text-white transition-all rounded-xl border-none h-10 px-4 font-bold text-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isPending ? "animate-spin" : ""}`} />
                        {isPending ? "Memproses..." : "Sinkronisasi Accurate"}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-100 p-2">
                    <DropdownMenuLabel className="font-black text-gray-400 text-[10px] uppercase tracking-widest px-2 py-1.5">Aksi Sinkronisasi</DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1 bg-gray-50" />
                    <DropdownMenuItem
                        onClick={handleStockSync}
                        disabled={isPending}
                        className="cursor-pointer rounded-lg hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 py-2.5"
                    >
                        <Package className="w-4 h-4 mr-2 text-gray-400 group-hover:text-red-600" />
                        <span className="font-bold">Sync Stok Saja</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleFullSync}
                        disabled={isPending}
                        className="cursor-pointer rounded-lg hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 py-2.5"
                    >
                        <RefreshCw className="w-4 h-4 mr-2 text-gray-400 group-hover:text-red-600" />
                        <span className="font-bold">Sync Semua Data</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Import Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="border-slate-200 hover:bg-slate-50 text-slate-700 transition-all rounded-xl h-10 px-4 font-bold text-xs"
                    >
                        <FileText className="w-3.5 h-3.5 mr-2 text-slate-500" />
                        Import Data
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-100 p-2">
                    <DropdownMenuLabel className="font-black text-gray-400 text-[10px] uppercase tracking-widest px-2 py-1.5">Pilih Sumber Data</DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1 bg-gray-50" />
                    <DropdownMenuItem
                        onClick={() => setIsImageImporterOpen(true)}
                        className="cursor-pointer rounded-lg py-2.5 focus:bg-slate-50"
                    >
                        <ImageIcon className="w-4 h-4 mr-2 text-slate-400" />
                        <span className="font-bold">Import Gambar (CSV)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setIsDescImporterOpen(true)}
                        className="cursor-pointer rounded-lg py-2.5 focus:bg-slate-50"
                    >
                        <FileText className="w-4 h-4 mr-2 text-slate-400" />
                        <span className="font-bold">Import Deskripsi (CSV)</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ProductImageImporter
                open={isImageImporterOpen}
                onOpenChange={setIsImageImporterOpen}
                hideTrigger={true}
            />

            <ProductDescriptionImporter
                open={isDescImporterOpen}
                onOpenChange={setIsDescImporterOpen}
                hideTrigger={true}
            />
        </div>
    );
}
