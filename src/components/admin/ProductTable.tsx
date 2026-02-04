"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Settings, Check } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
    id: string;
    sku: string;
    name: string;
    brand: string | null;
    category: string | null;
    itemType: string | null;
    availableToSell: number;
    price: number;
    isVisible?: boolean;
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

    const toggleColumn = (columnId: string) => {
        setVisibleColumns((prev) =>
            prev.includes(columnId)
                ? prev.filter((id) => id !== columnId)
                : [...prev, columnId]
        );
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
            <div className="absolute right-0 -top-10 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
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
                                <TableCell colSpan={visibleColumns.length} className="text-center py-10 text-gray-500">
                                    Tidak ada produk yang ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow
                                    key={product.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                    onClick={() => router.push(`/admin/products/${product.id}`)}
                                >
                                    {visibleColumns.includes("sku") && <TableCell className="font-medium text-gray-600">{product.sku}</TableCell>}
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
