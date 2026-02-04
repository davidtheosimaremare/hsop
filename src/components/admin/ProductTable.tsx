"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Settings, Check, FileDown, Loader2 } from "lucide-react";
import Link from "next/link";
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

interface Product {
    id: string;
    sku: string;
    name: string;
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
    queryParams: string; // Pre-built query string for sort links (excluding sort/order)
}

type Column = {
    id: string;
    label: string;
    sortable: boolean;
    align: "left" | "right";
};

const ALL_COLUMNS: Column[] = [
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
    // Default visible columns: SKU, Name, Category, Stock, Price (Hidden: Brand, Type)
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["sku", "name", "category", "availableToSell", "price"]);
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
                    // Export only selected rows from current view client-side data
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
                    // Fetch ALL data from server respecting current filters
                    const params = new URLSearchParams(queryParams);
                    const filters = {
                        query: params.get("q") || undefined,
                        brand: params.get("brand") || undefined,
                        category: params.get("category") || undefined,
                        stockStatus: params.get("stockStatus") || undefined,
                    };
                    dataToExport = await getProductExportData(filters);
                }

                // Generate Excel
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
        return sortOrder === "asc" ? <ArrowUp className="ml-1 h-3 w-3 inline" /> : <ArrowDown className="ml-1 h-3 w-3 inline" />;
    };

    return (
        <div className="space-y-4 relative mt-8">
            <div className="absolute right-0 -top-12 z-10 flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 gap-2" disabled={isExporting}>
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                            Export Excel
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Pilih Opsi Export</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExport("all")}>
                            Export Semua (Sesuai Filter)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport("selected")} disabled={selectedRows.length === 0}>
                            Export Terpilih ({selectedRows.length})
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted border">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuLabel>Pilih Kolom</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {ALL_COLUMNS.map((column) => (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={visibleColumns.includes(column.id)}
                                onCheckedChange={() => toggleColumn(column.id)}
                            >
                                {column.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <Checkbox
                                    checked={products.length > 0 && selectedRows.length === products.length}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            {ALL_COLUMNS.filter(col => visibleColumns.includes(col.id)).map((col) => (
                                <TableHead key={col.id} className={col.align === "right" ? "text-right" : ""}>
                                    {col.sortable ? (
                                        <Link href={getSortLink(col.id)}>
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
                                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-10 text-gray-500">
                                    Tidak ada produk yang ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow
                                    key={product.id}
                                    className={`hover:bg-muted/50 transition-colors group ${selectedRows.includes(product.id) ? "bg-muted" : ""}`}
                                    onClick={(e) => {
                                        // Prevent navigation if clicking checkbox
                                        if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                                        router.push(`/admin/products/${product.id}`);
                                    }}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.includes(product.id)}
                                            onCheckedChange={() => toggleSelectRow(product.id)}
                                            aria-label="Select row"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </TableCell>
                                    {visibleColumns.includes("sku") && <TableCell className="font-medium text-gray-600 cursor-pointer">{product.sku}</TableCell>}
                                    {visibleColumns.includes("name") && (
                                        <TableCell>
                                            <span className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                                                {product.name}
                                            </span>
                                            {!product.isVisible && (
                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    Hidden
                                                </span>
                                            )}
                                        </TableCell>
                                    )}
                                    {visibleColumns.includes("category") && <TableCell>{product.category || "-"}</TableCell>}
                                    {visibleColumns.includes("brand") && <TableCell>{product.brand || "-"}</TableCell>}
                                    {visibleColumns.includes("itemType") && <TableCell>{product.itemType || "-"}</TableCell>}
                                    {visibleColumns.includes("availableToSell") && (
                                        <TableCell className="text-right">
                                            {product.availableToSell <= 5 ? (
                                                <span className="text-red-600 font-bold">{product.availableToSell}</span>
                                            ) : (
                                                <span className="text-green-600 font-bold">{product.availableToSell}</span>
                                            )}
                                        </TableCell>
                                    )}
                                    {visibleColumns.includes("price") && (
                                        <TableCell className="text-right">
                                            Rp {product.price.toLocaleString("id-ID")}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-gray-500">
                    Menampilkan {Math.min(skip + 1, totalProducts)} sampai {Math.min(skip + products.length, totalProducts)} dari {totalProducts} data
                </div>
            </div>
        </div >
    );
}
