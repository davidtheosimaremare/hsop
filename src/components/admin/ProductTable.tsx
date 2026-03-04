"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Settings, Check, FileDown, Loader2, Eye, EyeOff, Package, ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from "xlsx";
import { getProductExportData } from "@/app/actions/product";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
    id: string;
    sku: string;
    name: string;
    image: string | null;
    brand: string | null;
    category: string | null;
    itemType: string | null;
    availableToSell: number;
    price: number;
    description?: string | null;
    isVisible?: boolean;
    createdAt?: Date;
}

interface ProductTableProps {
    products: Product[];
    totalProducts: number;
    skip: number;
    sortField: string;
    sortOrder: string;
    queryParams: string;
}

type Column = {
    id: string;
    label: string;
    sortable: boolean;
    align: "left" | "right" | "center";
};

const ALL_COLUMNS: Column[] = [
    { id: "image", label: "Gambar", sortable: false, align: "center" },
    { id: "sku", label: "SKU / No", sortable: true, align: "left" },
    { id: "name", label: "Nama Produk", sortable: true, align: "left" },
    { id: "category", label: "Kategori", sortable: false, align: "left" },
    { id: "brand", label: "Merk", sortable: true, align: "left" },
    { id: "itemType", label: "Tipe", sortable: true, align: "left" },
    { id: "availableToSell", label: "Stok", sortable: true, align: "right" },
    { id: "price", label: "Harga", sortable: true, align: "right" },
];

export default function ProductTable({
    products,
    totalProducts,
    skip,
    sortField,
    sortOrder,
    queryParams,
}: ProductTableProps) {
    const router = useRouter();
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["image", "sku", "name", "category", "availableToSell", "price"]);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isExporting, startExportTransition] = useTransition();

    const toggleColumn = (columnId: string) => {
        setVisibleColumns((prev) =>
            prev.includes(columnId)
                ? prev.filter((id) => id !== columnId)
                : [...prev, columnId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedRows.length === products.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(products.map(p => p.id));
        }
    };

    const toggleSelectRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const handleExport = async (type: "all" | "selected") => {
        startExportTransition(async () => {
            try {
                let dataToExport;

                if (type === "selected") {
                    const selectedProducts = products.filter(p => selectedRows.includes(p.id));
                    dataToExport = selectedProducts.map(p => ({
                        "SKU": p.sku,
                        "Nama Produk": p.name,
                        "Merk": p.brand || "-",
                        "Kategori": p.category || "-",
                        "Tipe": p.itemType || "-",
                        "Stok": p.availableToSell,
                        "Harga": p.price,
                        "Deskripsi": p.description || "-",
                        "Status": p.isVisible ? "Aktif" : "Sembunyi",
                    }));
                } else {
                    const params = new URLSearchParams(queryParams);
                    const filters = {
                        query: params.get("q") || undefined,
                        brand: params.get("brand") || undefined,
                        category: params.get("category") || undefined,
                        stockStatus: params.get("stockStatus") || undefined,
                    };
                    dataToExport = await getProductExportData(filters);
                }

                const ws = XLSX.utils.json_to_sheet(dataToExport);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Products");
                XLSX.writeFile(wb, `Products_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);

            } catch (error) {
                console.error("Export failed:", error);
                alert("Gagal melakukan export data. Silakan coba lagi.");
            }
        });
    };

    const getSortLink = (field: string) => {
        const newOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc";
        return `?${queryParams}&sort=${field}&order=${newOrder}`;
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return null;
        return sortOrder === "asc" ? <ArrowUp className="ml-1 h-3 w-3 inline text-red-600" /> : <ArrowDown className="ml-1 h-3 w-3 inline text-red-600" />;
    };

    return (
        <div className="flex flex-col w-full">
            {/* Toolbar Area */}
            <div className="flex items-center justify-between gap-2 px-5 pb-3 bg-white">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Daftar Produk</h3>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 px-4 gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all rounded-xl font-bold"
                                disabled={isExporting}
                            >
                                {isExporting ? <Loader2 className="h-4 w-4 animate-spin text-red-600" /> : <FileDown className="h-4 w-4 text-slate-500" />}
                                Export Excel
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200 p-2 shadow-xl">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 py-1">Pilih Opsi Export</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem className="rounded-lg font-medium py-2.5" onClick={() => handleExport("all")}>
                                Semua Sesuai Filter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="rounded-lg font-medium py-2.5 text-red-600 focus:text-red-700"
                                onClick={() => handleExport("selected")}
                                disabled={selectedRows.length === 0}
                            >
                                Item Terpilih ({selectedRows.length})
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 bg-white hover:bg-slate-50 rounded-xl">
                                <Settings className="h-4 w-4 text-slate-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-slate-200 p-2 shadow-xl">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 py-1">Tampilkan Kolom</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            {ALL_COLUMNS.map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="rounded-lg capitalize py-2 font-medium"
                                    checked={visibleColumns.includes(column.id)}
                                    onCheckedChange={() => toggleColumn(column.id)}
                                >
                                    {column.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Table Area */}
            <div className="w-full border-t border-slate-100 bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="w-[50px] px-4">
                                <Checkbox
                                    className="border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 rounded-md"
                                    checked={products.length > 0 && selectedRows.length === products.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            {ALL_COLUMNS.filter(col => visibleColumns.includes(col.id)).map((col) => (
                                <TableHead key={col.id} className={cn(
                                    "px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500",
                                    col.align === "right" ? "text-right" : "",
                                    col.align === "center" ? "text-center" : ""
                                )}>
                                    {col.sortable ? (
                                        <Link href={getSortLink(col.id)} className="hover:text-red-600 transition-colors flex items-center">
                                            {col.label} <SortIcon field={col.id} />
                                        </Link>
                                    ) : (
                                        col.label
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-20 bg-white">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                            <Package className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">Tidak ada produk ditemukan.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow
                                    key={product.id}
                                    className={cn(
                                        "group border-slate-50 transition-all duration-300 cursor-pointer relative",
                                        "hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:scale-[1.002] hover:z-10",
                                        selectedRows.includes(product.id) ? "bg-red-50/20" : "bg-white"
                                    )}
                                    onClick={() => router.push(`/admin/products/${encodeURIComponent(product.sku)}`)}
                                >
                                    <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            className="border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 rounded-md"
                                            checked={selectedRows.includes(product.id)}
                                            onCheckedChange={() => toggleSelectRow(product.id)}
                                        />
                                    </TableCell>

                                    {visibleColumns.includes("image") && (
                                        <TableCell className="px-3 py-2 text-center w-[60px]">
                                            <div className="relative w-10 h-10 mx-auto rounded-lg overflow-hidden bg-slate-50 border border-slate-100 group-hover:border-red-100 transition-colors shadow-sm">
                                                {product.image ? (
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-slate-300 group-hover:text-red-300 transition-colors">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}

                                    {visibleColumns.includes("sku") && (
                                        <TableCell className="px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100/50 group-hover:border-red-100/50 group-hover:bg-red-50/50 transition-all tracking-wider">
                                                    {product.sku}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(product.sku);
                                                        toast.success("SKU disalin ke clipboard", {
                                                            description: product.sku
                                                        });
                                                    }}
                                                    title="Copy SKU"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                    <span className="sr-only">Copy SKU</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}

                                    {visibleColumns.includes("name") && (
                                        <TableCell className="px-3 min-w-[180px]">
                                            <div className="py-2">
                                                <p className="font-bold text-slate-800 group-hover:text-red-700 transition-colors leading-snug tracking-tight text-[13px]">
                                                    {product.name}
                                                </p>
                                                {!product.isVisible && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 w-fit mt-1">
                                                        <EyeOff className="w-2.5 h-2.5" /> Hidden
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}

                                    {visibleColumns.includes("category") && (
                                        <TableCell className="px-3">
                                            <div className="text-[9px] font-bold tracking-widest uppercase text-slate-600 bg-slate-50 px-2.5 py-1 rounded w-fit border border-slate-100 group-hover:bg-white group-hover:border-red-100 transition-all">
                                                {product.category || "-"}
                                            </div>
                                        </TableCell>
                                    )}

                                    {visibleColumns.includes("brand") && (
                                        <TableCell className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            {product.brand || "-"}
                                        </TableCell>
                                    )}

                                    {visibleColumns.includes("itemType") && <TableCell className="px-4 text-xs text-slate-400 italic">{product.itemType || "-"}</TableCell>}

                                    {visibleColumns.includes("availableToSell") && (
                                        <TableCell className="px-3 text-right">
                                            <div className={cn(
                                                "inline-flex items-center justify-end gap-1 px-2 py-1 rounded font-bold text-sm",
                                                product.availableToSell <= 5
                                                    ? "bg-red-50 text-red-600 border border-red-100"
                                                    : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                            )}>
                                                <span className="text-[14px] leading-none tracking-tight">
                                                    {product.availableToSell}
                                                </span>
                                            </div>
                                        </TableCell>
                                    )}

                                    {visibleColumns.includes("price") && (
                                        <TableCell className="px-3 text-right">
                                            <div className="flex flex-col items-end justify-center h-full">
                                                <div className="text-[14px] font-bold text-slate-900 group-hover:text-red-700 transition-colors leading-none tracking-tight">
                                                    <span className="text-[9px] font-medium opacity-50 mr-1 italic">Rp</span>
                                                    {product.price.toLocaleString("id-ID")}
                                                </div>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

        </div>
    );
}

