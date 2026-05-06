"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Download, Trash2, ShoppingCart, Plus, Minus, AlertCircle, FileSpreadsheet, X, FileDown, RotateCcw, GripVertical } from "lucide-react";
import * as XLSX from "xlsx";
import { useCart } from "@/lib/useCart";
import { searchProductBySku, searchProductsBySkus, searchBulkProducts, getBulkOrderCategories, BulkOrderProduct } from "@/app/actions/bulk-order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePricing } from "@/lib/PricingContext";
import { exportQuotationPDF, exportQuotationExcel } from "@/lib/export-quotation";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BulkItem extends BulkOrderProduct {
    qty: number;
    finalPrice: number;
    originalPrice?: number;
    hasDiscount: boolean;
    stockStatus?: 'READY' | 'INDENT';
    customId: string;
    isCustom?: boolean;
}

export default function BulkOrderClient() {
    const [items, setItems] = useState<BulkItem[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem('bulk-order-items');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [skuInput, setSkuInput] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [suggestions, setSuggestions] = useState<BulkOrderProduct[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStock, setFilterStock] = useState<'all' | 'ready' | 'indent'>("all");
    const [categories, setCategories] = useState<string[]>([]);

    // Custom Product Modal State
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [customProduct, setCustomProduct] = useState({
        sku: "",
        name: "",
        price: 0,
        qty: 1
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const { addItem } = useCart();
    const router = useRouter();
    const { getPriceInfo, isLoggedIn, customerDiscount, categoryMappings, discountRules } = usePricing();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.customId === active.id);
            const newIndex = items.findIndex((item) => item.customId === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);
        }
    };

    // Load categories on mount
    useEffect(() => {
        getBulkOrderCategories().then(setCategories).catch(console.error);
    }, []);

    // Recalculate prices of all items when pricing context is loaded or changed
    useEffect(() => {
        if (items.length === 0) return;
        
        let changed = false;
        const updatedItems = items.map(item => {
            if (item.isCustom) return item; // Custom products keep their manual price
            
            const isReady = item.stockStatus === 'READY';
            const priceInfo = getPriceInfo(item.price, item.category, isReady ? 100 : 0);
            
            const newFinal = priceInfo.discountedPriceWithPPN;
            const newOriginal = priceInfo.hasDiscount ? priceInfo.originalPriceWithPPN : undefined;
            const newHasDiscount = priceInfo.hasDiscount;
            
            if (item.finalPrice !== newFinal || item.originalPrice !== newOriginal || item.hasDiscount !== newHasDiscount) {
                changed = true;
                return {
                    ...item,
                    finalPrice: newFinal,
                    originalPrice: newOriginal,
                    hasDiscount: newHasDiscount
                };
            }
            return item;
        });
        
        if (changed) {
            setItems(updatedItems);
        }
    }, [customerDiscount, categoryMappings, discountRules, getPriceInfo]);

    // Persist items to localStorage on every change
    useEffect(() => {
        try {
            localStorage.setItem('bulk-order-items', JSON.stringify(items));
        } catch {
            // ignore quota errors
        }
    }, [items]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search for suggestions
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const hasMinQuery = skuInput.trim().length >= 2;
        const hasActiveFilter = filterCategory !== "all" || filterStock !== "all";

        if (hasMinQuery || (skuInput.trim().length >= 0 && hasActiveFilter)) {
            setIsSearchingSuggestions(true);
            debounceRef.current = setTimeout(async () => {
                try {
                    const results = await searchBulkProducts({
                        query: skuInput,
                        category: filterCategory,
                        stockFilter: filterStock,
                    });
                    setSuggestions(results);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Suggestion error:", error);
                } finally {
                    setIsSearchingSuggestions(false);
                }
            }, 300);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [skuInput, filterCategory, filterStock]);

    const handleSkuSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!skuInput.trim()) return;
        await addProductBySku(skuInput);
    };

    const handleSuggestionClick = (suggestion: BulkOrderProduct) => {
        setShowSuggestions(false);
        setSkuInput("");
        addItemToList(suggestion, 1);
    };

    const addProductBySku = async (sku: string) => {
        setIsSearching(true);
        setShowSuggestions(false);
        try {
            const product = await searchProductBySku(sku);
            if (product) {
                addItemToList(product, 1);
                setSkuInput("");
            } else {
                // Open custom product modal with the searched SKU
                setCustomProduct({
                    sku: sku,
                    name: "",
                    price: 0,
                    qty: 1
                });
                setIsCustomModalOpen(true);
            }
        } catch (error) {
            console.error(error);
            alert("Error mencari produk");
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddCustomProduct = () => {
        if (!customProduct.sku || !customProduct.name || customProduct.price <= 0) {
            alert("Mohon lengkapi data produk (SKU, Nama, dan Harga harus valid)");
            return;
        }

        const product: BulkOrderProduct = {
            id: `custom-${Date.now()}`,
            sku: customProduct.sku,
            name: customProduct.name,
            price: customProduct.price,
            image: null,
            availableToSell: 0,
            brand: "Custom",
            category: "Custom",
            isValid: true
        };

        addItemToList(product, customProduct.qty, true);
        setIsCustomModalOpen(false);
        setSkuInput("");
    };

    const addItemToList = (product: BulkOrderProduct, qty: number, isCustom: boolean = false) => {
        const stock = Number(product.availableToSell || 0);
        console.log(`Adding product ${product.sku}: Qty ${qty}, Stock ${stock}`);

        // Ready Price (Stock > 0)
        const readyPriceInfo = getPriceInfo(product.price, product.category, 100);
        // Indent Price (Stock = 0)
        const indentPriceInfo = getPriceInfo(product.price, product.category, 0);

        setItems(prev => {
            let newItems = [...prev];
            const itemsToAdd: BulkItem[] = [];

            const createItem = (
                type: 'READY' | 'INDENT',
                quantity: number,
                pInfo: ReturnType<typeof getPriceInfo>
            ): BulkItem => ({
                ...product,
                qty: quantity,
                finalPrice: pInfo.discountedPriceWithPPN,
                originalPrice: pInfo.hasDiscount ? pInfo.originalPriceWithPPN : undefined,
                hasDiscount: pInfo.hasDiscount,
                stockStatus: type,
                customId: `${product.id}-${type}`,
                isCustom
            });

            if (isCustom) {
                // Custom products are always "Indent" as they aren't in DB
                const customId = `custom-${product.sku}`;
                const existingIdx = newItems.findIndex(p => p.customId === customId);
                if (existingIdx > -1) {
                    newItems[existingIdx].qty += qty;
                } else {
                    itemsToAdd.push({
                        ...product,
                        qty,
                        finalPrice: product.price * 1.11, // Manual price + PPN for custom
                        hasDiscount: false,
                        stockStatus: 'INDENT',
                        customId,
                        isCustom: true
                    });
                }
            } else {
                let remainingQty = qty;

                // 1. Fill Ready Stock first
                if (stock > 0) {
                    const existingReadyIdx = newItems.findIndex(p => p.customId === `${product.id}-READY`);
                    const currentListReadyQty = existingReadyIdx > -1 ? newItems[existingReadyIdx].qty : 0;
                    const availableForReady = Math.max(0, stock - currentListReadyQty);

                    if (availableForReady > 0) {
                        const toAddReady = Math.min(remainingQty, availableForReady);
                        if (existingReadyIdx > -1) {
                            newItems[existingReadyIdx].qty += toAddReady;
                        } else {
                            itemsToAdd.push(createItem('READY', toAddReady, readyPriceInfo));
                        }
                        remainingQty -= toAddReady;
                    }
                }

                // 2. Excess goes to Indent
                if (remainingQty > 0) {
                    const existingIndentIdx = newItems.findIndex(p => p.customId === `${product.id}-INDENT`);
                    if (existingIndentIdx > -1) {
                        newItems[existingIndentIdx].qty += remainingQty;
                    } else {
                        itemsToAdd.push(createItem('INDENT', remainingQty, indentPriceInfo));
                    }
                }
            }

            return [...newItems, ...itemsToAdd];
        });
    };

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await handleFile(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFile = async (file: File) => {
        setIsUploading(true);
        try {
            await new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const bstr = evt.target?.result;
                        const wb = XLSX.read(bstr, { type: 'binary' });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        const data = XLSX.utils.sheet_to_json(ws) as any[];

                        const skuMap = new Map<string, number>();
                        const skusToFetch: string[] = [];

                        data.forEach(row => {
                            const sku = row['SKU'] || row['sku'];
                            const qty = parseInt(row['QTY'] || row['qty'] || '1');
                            if (sku) {
                                const cleanSku = String(sku).trim();
                                if (cleanSku) {
                                    skuMap.set(cleanSku.toLowerCase(), (skuMap.get(cleanSku.toLowerCase()) || 0) + qty);
                                    skusToFetch.push(cleanSku);
                                }
                            }
                        });

                        processFoundSkus(skusToFetch, skuMap);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = reject;
                reader.readAsBinaryString(file);
            });
        } catch (error) {
            console.error("Error processing Excel:", error);
            alert("Gagal memproses file Excel.");
        } finally {
            setIsUploading(false);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
            await handleFile(file);
        } else {
            alert("Mohon masukkan file Excel (.xlsx, .xls, atau .csv)");
        }
    };

    const processFoundSkus = async (skusToFetch: string[], skuMap: Map<string, number>) => {
        if (skusToFetch.length === 0) {
            alert("Tidak ada SKU valid ditemukan di file.");
            return;
        }

        const products = await searchProductsBySkus(skusToFetch);

        let addedCount = 0;
        products.forEach(p => {
            const qty = skuMap.get(p.sku.toLowerCase()) || 1;
            addItemToList(p, qty);
            addedCount++;
        });

        if (addedCount === 0) {
            alert("Tidak ada produk yang cocok dengan SKU di database.");
        } else {
            alert(`Berhasil impor ${addedCount} produk.`);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { SKU: "3VJ10... (Contoh)", QTY: 10 },
            { SKU: "3VJ11... (Contoh)", QTY: 5 },
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "bulk-order-hokiindoshop.xlsx");
    };

    const downloadResult = () => {
        const rows = items.map(item => ({
            "Nama Produk": item.name,
            "SKU": item.sku,
            "Brand": item.brand || "",
            "Status Stok": item.stockStatus === 'READY' ? "Ready Stock" : item.stockStatus === 'INDENT' ? "Indent" : "Ready Stock",
            "Harga Satuan (Rp)": item.finalPrice,
            "QTY": item.qty,
            "Subtotal (Rp)": item.finalPrice * item.qty,
        }));

        // Append total row
        rows.push({
            "Nama Produk": "",
            "SKU": "",
            "Brand": "",
            "Status Stok": "",
            "Harga Satuan (Rp)": 0,
            "QTY": 0,
            "Subtotal (Rp)": 0,
        });
        rows.push({
            "Nama Produk": "TOTAL ESTIMASI (Termasuk PPN)",
            "SKU": "",
            "Brand": "",
            "Status Stok": "",
            "Harga Satuan (Rp)": 0,
            "QTY": 0,
            "Subtotal (Rp)": totalAmount,
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bulk Order");
        XLSX.writeFile(wb, `bulk-order-hasil-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Link Ready and Indent rows for the same product
    const updateQty = (id: string, delta: number) => {
        setItems(prev => {
            const item = prev.find(i => i.customId === id);
            if (!item) return prev;

            if (item.isCustom) {
                return prev.map(i => i.customId === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
            }

            // Find all rows for this specific product (Ready & Indent)
            const baseId = item.id;
            const relatedItems = prev.filter(i => i.id === baseId && !i.isCustom);
            const currentTotalQty = relatedItems.reduce((sum, i) => sum + i.qty, 0);
            const newTotalQty = Math.max(1, currentTotalQty + delta);

            if (newTotalQty === currentTotalQty) return prev;

            const stock = item.availableToSell;
            const newReadyQty = Math.min(newTotalQty, stock);
            const newIndentQty = newTotalQty - newReadyQty;

            // Update existing rows and potentially remove/add
            let newItems = [...prev];

            // 1. Update/Remove Ready Row
            const readyId = `${baseId}-READY`;
            const readyIdx = newItems.findIndex(i => i.customId === readyId);
            if (newReadyQty > 0) {
                if (readyIdx > -1) {
                    newItems[readyIdx] = { ...newItems[readyIdx], qty: newReadyQty };
                } else {
                    const readyPriceInfo = getPriceInfo(item.price, item.category, 100);
                    const newItem: BulkItem = {
                        ...item,
                        qty: newReadyQty,
                        finalPrice: readyPriceInfo.discountedPriceWithPPN,
                        originalPrice: readyPriceInfo.hasDiscount ? readyPriceInfo.originalPriceWithPPN : undefined,
                        hasDiscount: readyPriceInfo.hasDiscount,
                        stockStatus: 'READY',
                        customId: readyId,
                    };
                    const insertIdx = newItems.findIndex(i => i.id === baseId);
                    newItems.splice(insertIdx > -1 ? insertIdx : newItems.length, 0, newItem);
                }
            } else if (readyIdx > -1) {
                newItems.splice(readyIdx, 1);
            }

            // 2. Update/Remove Indent Row
            const indentId = `${baseId}-INDENT`;
            const indentIdx = newItems.findIndex(i => i.customId === indentId);
            if (newIndentQty > 0) {
                if (indentIdx > -1) {
                    newItems[indentIdx] = { ...newItems[indentIdx], qty: newIndentQty };
                } else {
                    const indentPriceInfo = getPriceInfo(item.price, item.category, 0);
                    const newItem: BulkItem = {
                        ...item,
                        qty: newIndentQty,
                        finalPrice: indentPriceInfo.discountedPriceWithPPN,
                        originalPrice: indentPriceInfo.hasDiscount ? indentPriceInfo.originalPriceWithPPN : undefined,
                        hasDiscount: indentPriceInfo.hasDiscount,
                        stockStatus: 'INDENT',
                        customId: indentId,
                    };
                    const rIdx = newItems.findIndex(i => i.customId === readyId);
                    newItems.splice(rIdx > -1 ? rIdx + 1 : newItems.length, 0, newItem);
                }
            } else if (indentIdx > -1) {
                newItems.splice(indentIdx, 1);
            }

            return newItems;
        });
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.customId !== id));
    };

    const clearAll = () => {
        setItems([]);
    };

    const downloadPDF = async () => {
        const data = {
            quotationNo: `EST-${new Date().getTime()}`,
            createdAt: new Date().toISOString(),
            status: "ESTIMASI",
            title: "ESTIMASI HARGA",
            typeLabel: "Nomor Estimasi",
            totalAmount: totalAmount,
            items: items.map(item => ({
                productSku: item.sku,
                productName: item.name,
                brand: item.brand || "",
                quantity: item.qty,
                price: item.finalPrice,
                stockStatus: item.stockStatus === 'READY' ? 'READY' : 'INDENT'
            }))
        };
        await exportQuotationPDF(data);
    };

    const downloadExcel = async () => {
        const data = {
            quotationNo: `EST-${new Date().getTime()}`,
            createdAt: new Date().toISOString(),
            status: "ESTIMASI",
            title: "ESTIMASI HARGA",
            typeLabel: "Nomor Estimasi",
            totalAmount: totalAmount,
            items: items.map(item => ({
                productSku: item.sku,
                productName: item.name,
                brand: item.brand || "",
                quantity: item.qty,
                price: item.finalPrice,
                stockStatus: item.stockStatus === 'READY' ? 'READY' : 'INDENT'
            }))
        };
        await exportQuotationExcel(data);
    };

    const handleAddToCart = () => {
        items.forEach(item => {
            let itemName = item.name;
            if (item.isCustom) {
                itemName = `${item.name} (Custom - Menunggu Update Admin)`;
            } else if (item.stockStatus) {
                itemName = `${item.name} (${item.stockStatus === 'READY' ? 'Ready Stock' : 'Indent'})`;
            }

            addItem({
                id: item.customId,
                originalId: item.isCustom ? item.id : item.id,
                sku: item.sku,
                name: itemName,
                brand: item.brand || "",
                price: item.finalPrice,
                image: item.image,
                availableToSell: item.availableToSell,
                stockStatus: item.stockStatus
            }, item.qty);
        });
        router.push("/keranjang");
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.finalPrice * item.qty), 0);
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Cara Menggunakan Bulk Order:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                        <li>Unduh template Excel, isi kolom SKU dan QTY, lalu unggah kembali.</li>
                        <li>Atau cari produk satu per satu menggunakan kolom pencarian di bawah.</li>
                        <li>Produk dengan stok terbatas akan otomatis dipisah menjadi baris Ready & Indent.</li>
                    </ul>
                </div>
            </div>

            {/* Actions Bar */}
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`bg-white rounded-xl border-2 transition-all p-4 ${isDragging
                    ? "border-red-500 border-dashed bg-red-50/50 scale-[1.01] shadow-lg"
                    : "border-gray-200 border-solid"
                    }`}
            >
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pointer-events-auto">
                    {/* File Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {isDragging ? (
                            <div className="flex items-center gap-2 text-red-600 font-bold animate-pulse py-2 px-4">
                                <FileSpreadsheet className="w-5 h-5" />
                                Lepaskan file untuk impor...
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={downloadTemplate}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Template Excel
                                </button>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleExcelUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    {isUploading ? "Memproses..." : "Impor Excel"}
                                </button>
                                <p className="hidden lg:block text-xs text-gray-400 italic ml-2">
                                    * Anda juga bisa tarik & drop file di sini
                                </p>
                            </>
                        )}
                    </div>

                    <div className="hidden md:block w-px h-8 bg-gray-200 self-center" />

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-red-500 outline-none bg-white min-w-[140px]"
                        >
                            <option value="all">Semua Kategori</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <select
                            value={filterStock}
                            onChange={(e) => setFilterStock(e.target.value as any)}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-red-500 outline-none bg-white min-w-[110px]"
                        >
                            <option value="all">Semua Stok</option>
                            <option value="ready">Ready</option>
                            <option value="indent">Indent</option>
                        </select>
                    </div>

                    <div className="hidden md:block w-px h-8 bg-gray-200 self-center" />

                    {/* SKU Search */}
                    <div className="w-full md:max-w-sm relative" ref={searchContainerRef}>
                        <form onSubmit={handleSkuSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Cari SKU atau nama produk..."
                                    value={skuInput}
                                    onChange={e => setSkuInput(e.target.value)}
                                    onFocus={() => {
                                        const hasMinQuery = skuInput.trim().length >= 2;
                                        const hasActiveFilter = filterCategory !== "all" || filterStock !== "all";
                                        if (hasMinQuery || hasActiveFilter) setShowSuggestions(true);
                                    }}
                                    className="pl-9 pr-8"
                                    autoComplete="off"
                                />
                                {skuInput && (
                                    <button
                                        type="button"
                                        onClick={() => { setSkuInput(""); setShowSuggestions(false); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <Button type="submit" disabled={isSearching || !skuInput} variant="red">
                                {isSearching ? "..." : "Tambah"}
                            </Button>
                        </form>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && (suggestions.length > 0 || isSearchingSuggestions) && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-96 overflow-y-auto">
                                {isSearchingSuggestions && (
                                    <div className="p-4 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                        Mencari produk...
                                    </div>
                                )}
                                {!isSearchingSuggestions && suggestions.length === 0 && (
                                    <div className="p-4 text-center text-sm text-gray-400">
                                        Produk tidak ditemukan
                                    </div>
                                )}
                                {!isSearchingSuggestions && suggestions.map((suggestion) => {
                                    const priceInfo = getPriceInfo(suggestion.price, suggestion.category || null, suggestion.availableToSell);
                                    return (
                                        <button
                                            key={suggestion.id}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                                        >
                                            <div className="w-9 h-9 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden text-xs flex items-center justify-center text-gray-400">
                                                {suggestion.image ? (
                                                    <Image src={suggestion.image} alt={suggestion.name} fill className="object-contain p-1" />
                                                ) : "No Img"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{suggestion.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-gray-400">SKU: {suggestion.sku}</p>
                                                    <span className={`text-[10px] font-medium px-1.5 py-0 rounded-sm ${suggestion.availableToSell > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                        {suggestion.availableToSell > 0 ? `Ready: ${suggestion.availableToSell}` : 'Indent'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {priceInfo.hasDiscount && (
                                                        <span className="text-xs text-gray-400 line-through leading-tight">
                                                            Rp {priceInfo.originalPriceWithPPN.toLocaleString("id-ID")}
                                                        </span>
                                                    )}
                                                    <p className="text-xs font-semibold text-red-600">Rp {priceInfo.discountedPriceWithPPN.toLocaleString("id-ID")}</p>
                                                    {priceInfo.hasDiscount && priceInfo.discountStr && (
                                                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                                                            -{priceInfo.discountStr}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Plus className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Table */}
            {items.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={items.map(i => i.customId)}
                                strategy={verticalListSortingStrategy}
                            >
                                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                    <colgroup>
                                        <col style={{ width: '4%' }} />
                                        <col style={{ width: '32%' }} />
                                        <col style={{ width: '16%' }} />
                                        <col style={{ width: '12%' }} />
                                        <col style={{ width: '14%' }} />
                                        <col style={{ width: '16%' }} />
                                        <col style={{ width: '6%' }} />
                                    </colgroup>
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="w-[4%]"></th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga Satuan</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Subtotal</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((item) => (
                                            <SortableRow
                                                key={item.customId}
                                                item={item}
                                                updateQty={updateQty}
                                                removeItem={removeItem}
                                                isLoggedIn={isLoggedIn}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </SortableContext>
                        </DndContext>
                    </div>

                    {/* Footer Summary + Actions */}
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            {/* Summary */}
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div>
                                    <span className="text-gray-400">Total item: </span>
                                    <span className="font-semibold text-gray-800">{items.length} baris</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Total qty: </span>
                                    <span className="font-semibold text-gray-800 tabular-nums">{totalQty}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Estimasi total: </span>
                                    <span className="font-bold text-red-600 tabular-nums text-base">
                                        Rp {totalAmount.toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center justify-end gap-3">
                                <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-xl border border-gray-200/50">
                                    <button
                                        onClick={clearAll}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-white transition-all"
                                        title="Bersihkan daftar"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Bersihkan
                                    </button>
                                    <div className="w-px h-4 bg-gray-200 mx-1" />
                                    <button
                                        onClick={downloadPDF}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-white transition-all shadow-sm"
                                    >
                                        <FileDown className="w-3.5 h-3.5 text-red-500" />
                                        Estimasi PDF
                                    </button>
                                    <button
                                        onClick={downloadExcel}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-white transition-all shadow-sm"
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                                        Excel
                                    </button>
                                </div>
                                <Button
                                    size="lg"
                                    variant="red"
                                    onClick={handleAddToCart}
                                    className="gap-2 h-11 px-6 shadow-lg shadow-red-100"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    Masukkan ke Keranjang
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">* Harga estimasi sudah termasuk PPN 11%</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 text-center">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">Daftar bulk order masih kosong</p>
                    <p className="text-sm text-gray-400 mt-1">Cari produk atau impor file Excel untuk memulai.</p>
                </div>
            )}

            {/* Custom Product Modal */}
            <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Tambah Produk Kustom</DialogTitle>
                        <p className="text-sm text-gray-500">
                            Produk dengan SKU <span className="font-bold">{customProduct.sku}</span> tidak ditemukan. Masukkan detail produk secara manual.
                        </p>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="custom-sku">SKU</Label>
                            <Input
                                id="custom-sku"
                                value={customProduct.sku}
                                onChange={(e) => setCustomProduct({ ...customProduct, sku: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="custom-name">Nama Produk</Label>
                            <Input
                                id="custom-name"
                                value={customProduct.name}
                                placeholder="Contoh: Lampu LED 10W"
                                onChange={(e) => setCustomProduct({ ...customProduct, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="custom-price">Harga Satuan (Sebelum PPN)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                                <Input
                                    id="custom-price"
                                    type="number"
                                    className="pl-9"
                                    value={customProduct.price || ""}
                                    onChange={(e) => setCustomProduct({ ...customProduct, price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400">* Harga akan diupdate oleh admin setelah sinkronisasi Accurate.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="custom-qty">Jumlah (Qty)</Label>
                            <Input
                                id="custom-qty"
                                type="number"
                                min="1"
                                value={customProduct.qty}
                                onChange={(e) => setCustomProduct({ ...customProduct, qty: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCustomModalOpen(false)}>Batal</Button>
                        <Button variant="red" onClick={handleAddCustomProduct}>Tambah ke Daftar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function SortableRow({ item, updateQty, removeItem, isLoggedIn }: {
    item: BulkItem;
    updateQty: (id: string, delta: number) => void;
    removeItem: (id: string) => void;
    isLoggedIn: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.customId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <tr ref={setNodeRef} style={style} className={`hover:bg-gray-50/50 transition-colors ${isDragging ? 'bg-red-50/30' : ''}`}>
            {/* Drag Grip Handle */}
            <td className="px-2 py-3 text-center align-middle">
                <button
                    {...attributes}
                    {...listeners}
                    type="button"
                    className="p-1.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing rounded hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
                    title="Geser untuk mengurutkan"
                >
                    <GripVertical className="w-4 h-4" />
                </button>
            </td>

            {/* Product */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                        {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Img</div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
                    </div>
                </div>
            </td>

            {/* Price — fixed width, no layout shift */}
            <td className="px-4 py-3">
                <div className="flex flex-col">
                    {isLoggedIn && item.hasDiscount && item.originalPrice && (
                        <span className="text-xs text-gray-400 line-through leading-tight">
                            Rp {item.originalPrice.toLocaleString("id-ID")}
                        </span>
                    )}
                    <span className="text-sm font-semibold text-red-600 leading-tight">
                        Rp {item.finalPrice.toLocaleString("id-ID")}
                    </span>
                </div>
            </td>

            {/* Stock Status */}
            <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                    {item.stockStatus === 'READY' ? (
                        <>
                            <span className="inline-flex items-center w-fit text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                Ready Stock
                            </span>
                            {!item.isCustom && (
                                <span className="text-[10px] text-gray-400">Tersedia: {item.availableToSell}</span>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="inline-flex items-center w-fit text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Indent
                            </span>
                            {item.isCustom && (
                                <span className="text-[10px] text-gray-400">Produk Kustom</span>
                            )}
                        </>
                    )}
                </div>
            </td>

            {/* Qty — fixed width stepper */}
            <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => updateQty(item.customId, -1)}
                        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                        <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-gray-800 tabular-nums select-none">
                        {item.qty}
                    </span>
                    <button
                        onClick={() => updateQty(item.customId, 1)}
                        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                        <Plus className="w-3 h-3 text-gray-600" />
                    </button>
                </div>
            </td>

            {/* Subtotal — fixed width, tabular nums */}
            <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                    Rp {(item.finalPrice * item.qty).toLocaleString("id-ID")}
                </span>
            </td>

            {/* Remove */}
            <td className="px-4 py-3 text-center">
                <button
                    onClick={() => removeItem(item.customId)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </td>
        </tr>
    );
}
