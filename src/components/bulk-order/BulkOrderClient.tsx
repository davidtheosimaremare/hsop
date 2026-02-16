"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Upload, Download, Trash2, ShoppingCart, Plus, Minus, AlertCircle, FileSpreadsheet, X } from "lucide-react";
import * as XLSX from "xlsx";
import { useCart } from "@/lib/useCart";
import { searchProductBySku, searchProductsBySkus, BulkOrderProduct, parsePdfBulkOrder } from "@/app/actions/bulk-order";
import { quickSearch, QuickSearchResult } from "@/app/actions/search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePricing } from "@/lib/PricingContext";

interface BulkItem extends BulkOrderProduct {
    qty: number;
    finalPrice: number;
    originalPrice?: number;
    hasDiscount: boolean;
    stockStatus?: 'READY' | 'INDENT';
    customId: string;
}

export default function BulkOrderClient() {
    const [items, setItems] = useState<BulkItem[]>([]);
    const [skuInput, setSkuInput] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [suggestions, setSuggestions] = useState<QuickSearchResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const { addItem } = useCart();
    const router = useRouter();
    const { getPriceInfo, isLoggedIn } = usePricing();

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

        if (skuInput.trim().length >= 2) {
            debounceRef.current = setTimeout(async () => {
                try {
                    const results = await quickSearch(skuInput);
                    setSuggestions(results);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Suggestion error:", error);
                }
            }, 300);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [skuInput]);

    const handleSkuSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!skuInput.trim()) return;
        await addProductBySku(skuInput);
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
                alert("Produk tidak ditemukan dengan SKU: " + sku);
            }
        } catch (error) {
            console.error(error);
            alert("Error mencari produk");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSuggestionClick = (suggestion: QuickSearchResult) => {
        addProductBySku(suggestion.sku);
    };

    const addItemToList = (product: BulkOrderProduct, qty: number) => {
        const stock = product.availableToSell || 0;

        // Calculate prices
        const readyPriceInfo = getPriceInfo(product.price, product.category, 100);
        const indentPriceInfo = getPriceInfo(product.price, product.category, 0);
        const pricesEqual = readyPriceInfo.discountedPriceWithPPN === indentPriceInfo.discountedPriceWithPPN;

        setItems(prev => {
            let newItems = [...prev];
            const itemsToAdd: BulkItem[] = [];

            // Helper to create item object
            const createItem = (
                type: 'READY' | 'INDENT' | 'MIXED',
                quantity: number,
                pInfo: ReturnType<typeof getPriceInfo>
            ): BulkItem => ({
                ...product,
                qty: quantity,
                finalPrice: pInfo.discountedPriceWithPPN,
                originalPrice: pInfo.hasDiscount ? pInfo.originalPriceWithPPN : undefined,
                hasDiscount: pInfo.hasDiscount,
                stockStatus: type === 'MIXED' ? undefined : type,
                customId: type === 'MIXED' ? product.id : `${product.id}-${type}`
            });

            // Logic 1: Prices Equal -> Merge as one row (User says "Jika ... harganya berbeda". So equals = merge)
            if (pricesEqual) {
                // Check if existing mixed/merged item exists
                const existingIdx = newItems.findIndex(p => p.customId === product.id);
                if (existingIdx > -1) {
                    newItems[existingIdx].qty += qty;
                } else {
                    // Check if we already have split items for this ID? (Edge case: old split items exist then price becomes equal?)
                    // For now assume consistent state.
                    itemsToAdd.push(createItem('MIXED', qty, readyPriceInfo));
                }
            }
            // Logic 2: Split needed
            else {
                let remainingQty = qty;

                // Add Ready Stock portion
                if (stock > 0) {
                    const existingReadyIdx = newItems.findIndex(p => p.customId === `${product.id}-READY`);
                    // We only add 'Ready' up to the stock limit across ALL entries?
                    // Currently Simplification: We add to Ready pile as much as possible from THIS addition.
                    // But if list already has 5 ready and stock is 5, we shouldn't add more ready.

                    let currentListReadyQty = existingReadyIdx > -1 ? newItems[existingReadyIdx].qty : 0;
                    let availableForReady = Math.max(0, stock - currentListReadyQty);

                    let toAddReady = Math.min(remainingQty, availableForReady);

                    if (toAddReady > 0) {
                        if (existingReadyIdx > -1) {
                            newItems[existingReadyIdx].qty += toAddReady;
                        } else {
                            itemsToAdd.push(createItem('READY', toAddReady, readyPriceInfo));
                        }
                        remainingQty -= toAddReady;
                    }
                }

                // Add Indent portion
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
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const parsedItems = await parsePdfBulkOrder(formData);

            if (!parsedItems || parsedItems.length === 0) {
                alert("Tidak ditemukan SKU valid dalam file PDF ini. Pastikan file PDF berbasis teks dan mengandung SKU & QTY.");
                return;
            }

            const skuMap = new Map<string, number>();
            const skusToFetch: string[] = [];

            parsedItems.forEach(item => {
                const cleanSku = item.sku.trim();
                // Simple additional check: SKU usually > 3 chars
                if (cleanSku && cleanSku.length > 3) {
                    skuMap.set(cleanSku.toLowerCase(), (skuMap.get(cleanSku.toLowerCase()) || 0) + item.qty);
                    skusToFetch.push(cleanSku);
                }
            });

            processFoundSkus(skusToFetch, skuMap);

        } catch (error: any) {
            console.error("Error processing PDF:", error);
            alert(error.message || "Gagal memproses file PDF.");
        } finally {
            setIsUploading(false);
            if (pdfInputRef.current) pdfInputRef.current.value = "";
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

    const updateQty = (id: string, delta: number) => {
        setItems(prev => {
            const newItems = prev.map(item => {
                if (item.customId === id) {
                    let newQty = item.qty + delta;
                    if (item.stockStatus === 'READY') {
                        newQty = Math.min(newQty, item.availableToSell);
                    }
                    newQty = Math.max(1, newQty);
                    return { ...item, qty: newQty };
                }
                return item;
            });
            return newItems;
        });
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.customId !== id));
    };

    const handleAddToCart = () => {
        items.forEach(item => {
            addItem({
                id: item.customId,
                originalId: item.id,
                sku: item.sku,
                name: item.stockStatus ? `${item.name} (${item.stockStatus === 'READY' ? 'Ready Stock' : 'Indent'})` : item.name,
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Top Stats / Info */}
            <div className="mb-8">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Cara Menggunakan Bulk Order:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Unduh template Excel yang tersedia.</li>
                            <li>Isi kolom SKU dan QTY sesuai kebutuhan.</li>
                            <li>Unggah kembali file Excel yang sudah diisi.</li>
                            <li>Atau cari produk satu per satu menggunakan kolom pencarian SKU di bawah.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-start bg-gray-50 p-4 rounded-xl border border-gray-200">

                {/* File Imports */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" onClick={downloadTemplate} className="gap-2 text-xs md:text-sm">
                        <Download className="w-4 h-4" />
                        Template Excel
                    </Button>
                    <div className="relative flex gap-2">
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleExcelUpload}
                        />
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            ref={pdfInputRef}
                            onChange={handlePdfUpload}
                        />
                        <Button
                            variant="default"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm"
                        >
                            {isUploading ? "..." : (
                                <>
                                    <FileSpreadsheet className="w-4 h-4" />
                                    Impor Excel
                                </>
                            )}
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => pdfInputRef.current?.click()}
                            disabled={isUploading}
                            className="gap-2 bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm"
                        >
                            {isUploading ? "..." : (
                                <>
                                    <FileSpreadsheet className="w-4 h-4" />
                                    Impor PDF
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="hidden md:block w-px h-8 bg-gray-300 mx-2 self-center"></div>

                {/* SKU Search */}
                <div className="w-full md:max-w-md relative" ref={searchContainerRef}>
                    <form onSubmit={handleSkuSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Cari SKU Produk..."
                                value={skuInput}
                                onChange={e => setSkuInput(e.target.value)}
                                onFocus={() => {
                                    if (skuInput.trim().length >= 2) setShowSuggestions(true);
                                }}
                                className="pl-9"
                                autoComplete="off"
                            />
                            {skuInput && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSkuInput("");
                                        setShowSuggestions(false);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" disabled={isSearching || !skuInput} variant="red">
                            {isSearching ? "..." : "Tambah"}
                        </Button>
                    </form>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-80 overflow-y-auto w-full">
                            {suggestions.map((suggestion) => {
                                const priceInfo = getPriceInfo(suggestion.price, null, 100); // We don't have category/stock in quick search yet, maybe improvement for later
                                return (
                                    <button
                                        key={suggestion.id}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                                    >
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden text-xs flex items-center justify-center text-gray-400">
                                            {suggestion.image ? (
                                                <Image src={suggestion.image} alt={suggestion.name} fill className="object-contain p-1" />
                                            ) : "No Img"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{suggestion.name}</p>
                                            <p className="text-xs text-gray-500">SKU: {suggestion.sku}</p>
                                            <div className="flex flex-col">
                                                {/* This quick search pricing might be slightly off if category rules apply,
                                                    but for simple SKU suggestion it's acceptable or we can just show base price.
                                                    Ideally quickSearch should return category too.
                                                    For now let's just show the raw price with PPN as a baseline or handle it simply.
                                                 */}
                                                {/* Using basic formatting for now since quick search result doesn't have full data */}
                                                <p className="text-xs font-bold text-red-600">Rp {priceInfo.discountedPriceWithPPN.toLocaleString("id-ID")}</p>
                                            </div>
                                        </div>
                                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Product List */}
            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3">Produk</th>
                                <th className="px-4 py-3">Harga</th>
                                <th className="px-4 py-3">Stok</th>
                                <th className="px-4 py-3 text-center">Qty</th>
                                <th className="px-4 py-3 text-right">Subtotal</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <tr key={item.customId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                                                {item.image ? (
                                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                                                <p className="text-xs text-gray-500">{item.brand}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        <div className="flex flex-col">
                                            {isLoggedIn && item.hasDiscount && item.originalPrice && (
                                                <span className="text-xs text-gray-400 line-through">
                                                    Rp {item.originalPrice.toLocaleString("id-ID")}
                                                </span>
                                            )}
                                            <span className="text-red-600">
                                                Rp {item.finalPrice.toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.stockStatus === 'READY' ? (
                                            <span className="text-green-600 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                                                Ready Stock
                                            </span>
                                        ) : item.stockStatus === 'INDENT' ? (
                                            <span className="text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                                                Indent
                                            </span>
                                        ) : (
                                            // Mixed or Unspecified (Prices Equal logic)
                                            item.availableToSell > 0 ? (
                                                item.qty <= item.availableToSell ? (
                                                    <span className="text-green-600 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                                                        Ready Stock
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="text-green-600 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                                                            Ready: {item.availableToSell}
                                                        </span>
                                                        <span className="text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                                                            Indent: {item.qty - item.availableToSell}
                                                        </span>
                                                    </div>
                                                )
                                            ) : (
                                                <span className="text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                                                    Indent
                                                </span>
                                            )
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => updateQty(item.customId, -1)} className="p-1 rounded bg-gray-100 hover:bg-gray-200">
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-8 text-center font-medium">{item.qty}</span>
                                            <button
                                                onClick={() => updateQty(item.customId, 1)}
                                                className={`p-1 rounded bg-gray-100 hover:bg-gray-200 ${item.stockStatus === 'READY' && item.qty >= item.availableToSell ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={item.stockStatus === 'READY' && item.qty >= item.availableToSell}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                                        Rp {(item.finalPrice * item.qty).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => removeItem(item.customId)} className="text-red-500 hover:text-red-700 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-semibold text-gray-900 border-t-2 border-gray-200">
                            <tr>
                                <td colSpan={4} className="px-4 py-3 text-right">Total Estimasi (Termasuk PPN):</td>
                                <td className="px-4 py-3 text-right text-lg text-red-600">
                                    Rp {totalAmount.toLocaleString("id-ID")}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="mt-6 flex justify-end">
                        <Button
                            size="lg"
                            variant="red"
                            onClick={handleAddToCart}
                            className="w-full md:w-auto gap-2"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Masukkan ke Keranjang
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>Daftar bulk order masih kosong.</p>
                    <p className="text-sm">Silakan cari produk atau impor file Excel untuk memulai.</p>
                </div>
            )}
        </div>
    );
}
