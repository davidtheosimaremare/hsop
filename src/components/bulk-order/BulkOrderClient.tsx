"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ShoppingCart, Trash2, CheckCircle2, ChevronRight, FileSpreadsheet, X, UploadCloud, Download, GripVertical, Plus, Minus, RotateCcw, Edit2, RotateCw, AlertCircle, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useCart } from "@/lib/useCart";
import { searchCustomersForSales } from "@/app/actions/customer";
import { searchProductBySku, searchProductsBySkus, searchBulkProducts, getBulkOrderCategories, BulkOrderProduct, createSalesQuotationAccurate, getNextQuotationNumber } from "@/app/actions/bulk-order";
import { getProductSpecFilters } from "@/app/actions/product-public";
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
    isCustomerDiscount?: boolean;
    stockStatus?: 'READY' | 'INDENT';
    customId: string;
    isCustom?: boolean;
    isNotFound?: boolean;
    salesDiscount1?: number;
    salesDiscount2?: number;
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
    const [activeTab, setActiveTab] = useState<'search' | 'paste'>('search');
    const [pasteContent, setPasteContent] = useState("");
    const [isProcessingPaste, setIsProcessingPaste] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [suggestions, setSuggestions] = useState<BulkOrderProduct[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);


    // Custom Product Modal State
    const [notes, setNotes] = useState("Status STOCK tidak mengikat\nStatus NO STOCK indent 14-16 weeks\nPrice Loco Jabodetabek\nValidity for a month");
    const [customerQuery, setCustomerQuery] = useState("");
    const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [customProduct, setCustomProduct] = useState({
        sku: "",
        name: "",
        price: 0,
        qty: 1
    });

    // Replace Product Modal State
    const [replaceState, setReplaceState] = useState<{isOpen: boolean, customId: string | null}>({isOpen: false, customId: null});
    const [replaceInput, setReplaceInput] = useState("");
    const [replaceCategory, setReplaceCategory] = useState("all");
    const [replaceStock, setReplaceStock] = useState<"all" | "ready">("all");
    const [replacePole, setReplacePole] = useState("");
    const [replaceAmpere, setReplaceAmpere] = useState("");
    const [replaceKa, setReplaceKa] = useState("");
    const [categories, setCategories] = useState<string[]>([]);
    const [availableSpecs, setAvailableSpecs] = useState<{ poles: string[]; amperes: string[]; breakingCapacities: string[]; }>({ poles: [], amperes: [], breakingCapacities: [] });
    const [replaceSuggestions, setReplaceSuggestions] = useState<BulkOrderProduct[]>([]);
    const [isSearchingReplace, setIsSearchingReplace] = useState(false);
    const replaceDebounceRef = useRef<NodeJS.Timeout | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const { addItem } = useCart();
    const router = useRouter();
    const { getPriceInfo, isLoggedIn, customerDiscount, categoryMappings, discountRules, userRole } = usePricing();

    const [isCreatingAccurateSq, setIsCreatingAccurateSq] = useState(false);
    const [nextHsqNo, setNextHsqNo] = useState<string>("");
    const [isSyncingHsq, setIsSyncingHsq] = useState(false);
    const [hideDiscountInAccurate, setHideDiscountInAccurate] = useState(false);
    const [bulkDisc1, setBulkDisc1] = useState<number>(0);
    const [bulkDisc2, setBulkDisc2] = useState<number>(0);

    const applyBulkDiscount = () => {
        setItems(prev => prev.map(item => ({
            ...item,
            salesDiscount1: bulkDisc1,
            salesDiscount2: bulkDisc2
        })));
        toast.success(`Diskon masal ${bulkDisc1}% + ${bulkDisc2}% diterapkan ke semua produk.`);
    };

    const fetchNextHsq = async () => {
        setIsSyncingHsq(true);
        try {
            const num = await getNextQuotationNumber();
            setNextHsqNo(num);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSyncingHsq(false);
        }
    };

    useEffect(() => {
        if (userRole === 'SALES') {
            fetchNextHsq();
        }
    }, [userRole]);

    const updateItemDiscount = (id: string, field: 'd1' | 'd2', value: number) => {
        setItems(prev => prev.map(item => {
            if (item.customId === id) {
                return { 
                    ...item, 
                    salesDiscount1: field === 'd1' ? value : item.salesDiscount1,
                    salesDiscount2: field === 'd2' ? value : item.salesDiscount2
                };
            }
            return item;
        }));
    };

    const updateQtyDirect = (id: string, newQty: number) => {
        const qty = Math.max(1, isNaN(newQty) ? 1 : newQty);

        setItems(prev => {
            const item = prev.find(i => i.customId === id);
            if (!item) return prev;

            // Custom / Indent items: just update qty directly
            if (item.isCustom || item.stockStatus !== 'READY') {
                return prev.map(i => i.customId === id ? { ...i, qty } : i);
            }

            const stock = Number(item.availableToSell || 0);
            // No stock info → just update directly
            if (stock <= 0) {
                return prev.map(i => i.customId === id ? { ...i, qty } : i);
            }

            const readyQty = Math.min(qty, stock);
            const indentQty = qty - readyQty;

            // Derive the paired INDENT customId (same product id pattern)
            const productId = id.replace('-READY', '');
            const indentId = `${productId}-INDENT`;

            let newList = prev.map(i => {
                if (i.customId === id) return { ...i, qty: readyQty };
                return i;
            });

            if (indentQty > 0) {
                const existingIndentIdx = newList.findIndex(i => i.customId === indentId);
                if (existingIndentIdx > -1) {
                    // Update existing INDENT row
                    newList = newList.map(i =>
                        i.customId === indentId ? { ...i, qty: indentQty } : i
                    );
                } else {
                    // Create new INDENT row right after the READY row
                    const readyIdx = newList.findIndex(i => i.customId === id);
                    const indentPriceInfo = getPriceInfo(item.price, item.category, 0);
                    const indentItem: BulkItem = {
                        ...item,
                        qty: indentQty,
                        finalPrice: indentPriceInfo.discountedPriceWithPPN,
                        originalPrice: indentPriceInfo.hasDiscount ? indentPriceInfo.originalPriceWithPPN : undefined,
                        hasDiscount: indentPriceInfo.hasDiscount,
                        isCustomerDiscount: indentPriceInfo.isCustomerDiscount,
                        stockStatus: 'INDENT',
                        customId: indentId,
                    };
                    newList.splice(readyIdx + 1, 0, indentItem);
                    toast.info(`Pesanan total ${qty} melebihi stok Ready (${stock}). Sisa ${indentQty} otomatis dialihkan ke status Indent.`);
                }
            } else {
                // Remove INDENT row if it exists and we no longer need it
                newList = newList.filter(i => i.customId !== indentId);
            }

            return newList;
        });
    };
    
    
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

    // Customer search useEffect - calls server action
    useEffect(() => {
        if (!customerQuery || customerQuery.trim().length < 2) {
            setCustomerSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearchingCustomer(true);
            try {
                const data = await searchCustomersForSales(customerQuery);
                setCustomerSearchResults(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("Customer search error:", e);
                setCustomerSearchResults([]);
            } finally {
                setIsSearchingCustomer(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [customerQuery]);

    
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
            const newIsCustomerDiscount = priceInfo.isCustomerDiscount;
            
            if (
                item.finalPrice !== newFinal || 
                item.originalPrice !== newOriginal || 
                item.hasDiscount !== newHasDiscount ||
                item.isCustomerDiscount !== newIsCustomerDiscount
            ) {
                changed = true;
                return {
                    ...item,
                    finalPrice: newFinal,
                    originalPrice: newOriginal,
                    hasDiscount: newHasDiscount,
                    isCustomerDiscount: newIsCustomerDiscount
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

        if (hasMinQuery) {
            setIsSearchingSuggestions(true);
            debounceRef.current = setTimeout(async () => {
                try {
                    const results = await searchBulkProducts({
                        query: skuInput,
                        category: "all",
                        stockFilter: "all",
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
    }, [skuInput]);

    const handleSkuSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!skuInput.trim()) return;
        await addProductBySku(skuInput);
    };

    // Fetch categories on mount
    useEffect(() => {
        getBulkOrderCategories().then(setCategories).catch(console.error);
    }, []);

    // Debounced search for replace modal
    useEffect(() => {
        if (replaceDebounceRef.current) clearTimeout(replaceDebounceRef.current);

        const hasMinQuery = replaceInput.trim().length >= 2 || replaceCategory !== 'all' || replacePole !== '' || replaceAmpere !== '' || replaceKa !== '';

        if (hasMinQuery) {
            setIsSearchingReplace(true);
            replaceDebounceRef.current = setTimeout(async () => {
                try {
                    const [results, specs] = await Promise.all([
                        searchBulkProducts({
                            query: replaceInput,
                            category: replaceCategory,
                            stockFilter: replaceStock,
                            pole: replacePole || undefined,
                            ampere: replaceAmpere || undefined,
                            breakingCapacity: replaceKa || undefined
                        }),
                        getProductSpecFilters({
                            query: replaceInput,
                            category: replaceCategory,
                        })
                    ]);
                    setReplaceSuggestions(results);
                    setAvailableSpecs(specs);
                } catch (error) {
                    console.error("Replace suggestion error:", error);
                } finally {
                    setIsSearchingReplace(false);
                }
            }, 300);
        } else {
            setReplaceSuggestions([]);
            setAvailableSpecs({ poles: [], amperes: [], breakingCapacities: [] });
        }

        return () => {
            if (replaceDebounceRef.current) clearTimeout(replaceDebounceRef.current);
        };
    }, [replaceInput, replaceCategory, replacePole, replaceAmpere, replaceKa, replaceStock]);

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

    const addItemToList = (product: BulkOrderProduct, qty: number, isCustom: boolean = false, isNotFound: boolean = false) => {
        const stock = Number(product.availableToSell || 0);

        // Ready Price (Stock > 0)
        const readyPriceInfo = getPriceInfo(product.price, product.category, 100);
        // Indent Price (Stock = 0)
        const indentPriceInfo = getPriceInfo(product.price, product.category, 0);

        setItems(prev => {
            const newItems = prev.map(item => ({ ...item }));
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
                isCustomerDiscount: pInfo.isCustomerDiscount,
                stockStatus: type,
                customId: `${product.id}-${type}`,
                isCustom,
                salesDiscount1: userRole === 'SALES' ? 30 : undefined,
                salesDiscount2: userRole === 'SALES' ? 37 : undefined
            });

            if (isCustom) {
                const customId = isNotFound ? `not-found-${product.sku}` : `custom-${product.sku}`;
                const existingIdx = newItems.findIndex(p => p.customId === customId);
                if (existingIdx > -1) {
                    newItems[existingIdx] = { ...newItems[existingIdx], qty: newItems[existingIdx].qty + qty };
                } else {
                    itemsToAdd.push({
                        ...product,
                        qty,
                        finalPrice: Math.ceil((product.price * 1.11) / 1000) * 1000,
                        hasDiscount: false,
                        stockStatus: 'INDENT',
                        customId,
                        isCustom: true,
                        isNotFound,
                        salesDiscount1: userRole === 'SALES' ? 30 : undefined,
                        salesDiscount2: userRole === 'SALES' ? 37 : undefined
                    });
                }
            } else {
                let remainingQty = qty;

                if (stock > 0) {
                    const existingReadyIdx = newItems.findIndex(p => p.customId === `${product.id}-READY`);
                    const currentListReadyQty = existingReadyIdx > -1 ? newItems[existingReadyIdx].qty : 0;
                    const availableForReady = Math.max(0, stock - currentListReadyQty);

                    if (availableForReady > 0) {
                        const toAddReady = Math.min(remainingQty, availableForReady);
                        if (existingReadyIdx > -1) {
                            newItems[existingReadyIdx] = { ...newItems[existingReadyIdx], qty: newItems[existingReadyIdx].qty + toAddReady };
                        } else {
                            itemsToAdd.push(createItem('READY', toAddReady, readyPriceInfo));
                        }
                        remainingQty -= toAddReady;
                    }
                }

                if (remainingQty > 0) {
                    const existingIndentIdx = newItems.findIndex(p => p.customId === `${product.id}-INDENT`);
                    if (existingIndentIdx > -1) {
                        newItems[existingIndentIdx] = { ...newItems[existingIndentIdx], qty: newItems[existingIndentIdx].qty + remainingQty };
                    } else {
                        itemsToAdd.push(createItem('INDENT', remainingQty, indentPriceInfo));
                    }
                }
            }

            return [...newItems, ...itemsToAdd];
        });
    };

    const handleReplaceSuggestionClick = (suggestion: BulkOrderProduct) => {
        if (!replaceState.customId) return;
        
        // Find the old item to keep its quantity
        const oldItem = items.find(i => i.customId === replaceState.customId);
        const qtyToKeep = oldItem ? oldItem.qty : 1;

        // Remove the old item
        removeItem(replaceState.customId);

        // Add the new item
        addItemToList(suggestion, qtyToKeep);

        // Close and reset
        setReplaceState({ isOpen: false, customId: null });
        setReplaceInput("");
        setReplaceSuggestions([]);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.customId !== id));
    };

    const clearAll = () => {
        setItems([]);
    };

    const handleProcessPaste = async () => {
        if (!pasteContent.trim()) return;
        setIsProcessingPaste(true);
        
        const rawLines = pasteContent.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        if (rawLines.length === 0) {
            setIsProcessingPaste(false);
            return;
        }
        
        const skuMap = new Map<string, { qty: number, originalSku: string }>();
        rawLines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            let skuRaw: string;
            let qty: number;
            if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
                qty = parseInt(parts[parts.length - 1], 10);
                skuRaw = parts.slice(0, -1).join(' ');
            } else {
                qty = 1;
                skuRaw = line.trim();
            }
            if (!skuRaw) return;
            const cleanSku = skuRaw.toLowerCase();
            const existing = skuMap.get(cleanSku);
            if (existing) {
                skuMap.set(cleanSku, { ...existing, qty: existing.qty + qty });
            } else {
                skuMap.set(cleanSku, { qty, originalSku: skuRaw });
            }
        });
        
        const uniqueSkus = Array.from(skuMap.keys());
        
        try {
            const products = await searchProductsBySkus(uniqueSkus);
            
            uniqueSkus.forEach(sku => {
                const mapData = skuMap.get(sku)!;
                const product = products.find(p => p.sku.toLowerCase() === sku);
                
                if (product) {
                    addItemToList(product, mapData.qty);
                } else {
                    const notFoundProduct: BulkOrderProduct = {
                        id: `not-found-${Date.now()}-${sku}`,
                        sku: mapData.originalSku,
                        name: "Tidak Ditemukan",
                        price: 0,
                        image: null,
                        availableToSell: 0,
                        brand: "-",
                        category: "Not Found",
                        isValid: false
                    };
                    addItemToList(notFoundProduct, mapData.qty, true, true);
                }
            });
            
            setPasteContent("");
            setActiveTab('search');
        } catch (error) {
            console.error("Paste error", error);
            alert("Terjadi kesalahan saat memproses SKU.");
        } finally {
            setIsProcessingPaste(false);
        }
    };

    const handleCreateAccurateSq = async () => {
        if (items.length === 0) return;
        setIsCreatingAccurateSq(true);
        try {
            if (!selectedCustomer) {
                alert("Silakan pilih Pelanggan terlebih dahulu sebelum membuat Penawaran Accurate.");
                setIsCreatingAccurateSq(false);
                return;
            }

            const customerInfo = {
                name: selectedCustomer.company || selectedCustomer.name,
                address: selectedCustomer.address || '',
                customer: selectedCustomer
            };
            
            const res = await createSalesQuotationAccurate(items.map(i => {
                const basePrice = userRole === 'SALES' ? Math.ceil(i.price / 1000) * 1000 : i.finalPrice;
                const d1 = i.salesDiscount1 || 0;
                const d2 = i.salesDiscount2 || 0;
                const combinedDiscount = 1 - (1 - d1 / 100) * (1 - d2 / 100);
                const discountedPrice = basePrice - (basePrice * combinedDiscount);

                // Sembunyikan diskon: kirim harga akhir sebagai harga dasar, tanpa kolom diskon
                if (hideDiscountInAccurate) {
                    return {
                        productSku: i.sku,
                        productName: i.name,
                        price: Math.round(discountedPrice),
                        basePrice: Math.round(discountedPrice),
                        quantity: i.qty,
                        isAvailable: true, // Send all items
                        detailNotes: i.stockStatus === 'READY' ? 'STOCK' : 'NO STOCK',
                        discountStr: undefined
                    };
                }

                let itemDiscStr = undefined;
                if (d1 > 0 && d2 > 0) {
                     itemDiscStr = `${d1}+${d2}`;
                } else if (d1 > 0) {
                     itemDiscStr = `${d1}`;
                } else if (d2 > 0) {
                     itemDiscStr = `${d2}`;
                }
                return {
                    productSku: i.sku,
                    productName: i.name,
                    price: discountedPrice,
                    basePrice: userRole === 'SALES' ? Math.ceil(i.price / 1000) * 1000 : i.finalPrice,
                    quantity: i.qty,
                    isAvailable: true, // Send all items
                    detailNotes: i.stockStatus === 'READY' ? 'STOCK' : 'NO STOCK',
                    discountStr: itemDiscStr
                };
            }), customerInfo, 0, notes);

            if (res.success) {
                alert(`Berhasil membuat Penawaran di Accurate: ${res.quotationNo}`);
            } else {
                alert(`Terjadi kesalahan: ${res.message}`);
            }
        } catch (error: any) {
            alert(error.message || "Gagal membuat penawaran.");
        } finally {
            setIsCreatingAccurateSq(false);
            fetchNextHsq();
        }
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

                        const skuMap = new Map<string, { qty: number, originalSku: string }>();
                        
                        data.forEach(row => {
                            const sku = row['SKU'] || row['sku'];
                            let qty = parseInt(row['QTY'] || row['qty']);
                            if (isNaN(qty)) qty = 1;
                            
                            if (sku) {
                                const cleanSku = String(sku).trim();
                                if (cleanSku) {
                                    const lowerSku = cleanSku.toLowerCase();
                                    const existing = skuMap.get(lowerSku);
                                    if (existing) {
                                        skuMap.set(lowerSku, { ...existing, qty: existing.qty + qty });
                                    } else {
                                        skuMap.set(lowerSku, { qty: qty, originalSku: cleanSku });
                                    }
                                }
                            }
                        });

                        const skusToFetch = Array.from(skuMap.keys());
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

    const processFoundSkus = async (skusToFetch: string[], skuMap: Map<string, { qty: number, originalSku: string }>) => {
        if (skusToFetch.length === 0) {
            alert("Tidak ada SKU valid ditemukan di file.");
            return;
        }

        const products = await searchProductsBySkus(skusToFetch);

        let addedCount = 0;
        skusToFetch.forEach(sku => {
            const mapData = skuMap.get(sku)!;
            const product = products.find(p => p.sku.toLowerCase() === sku);
            
            if (product) {
                addItemToList(product, mapData.qty);
                addedCount++;
            } else {
                const notFoundProduct: BulkOrderProduct = {
                    id: `not-found-${Date.now()}-${sku}`,
                    sku: mapData.originalSku,
                    name: "Tidak Ditemukan",
                    price: 0,
                    image: null,
                    availableToSell: 0,
                    brand: "-",
                    category: "Not Found",
                    isValid: false
                };
                addItemToList(notFoundProduct, mapData.qty, true, true);
            }
        });

        if (addedCount === 0) {
            alert("Tidak ada produk yang cocok dengan SKU di database.");
        } else {
            alert(`Berhasil impor ${addedCount} produk yang ditemukan.`);
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

    const updateQty = (id: string, delta: number) => {
        setItems(prev => {
            const item = prev.find(i => i.customId === id);
            if (!item) return prev;

            if (item.isCustom) {
                return prev.map(i => i.customId === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
            }

            const baseId = item.id;
            const relatedItems = prev.filter(i => i.id === baseId && !i.isCustom);
            const currentTotalQty = relatedItems.reduce((sum, i) => sum + i.qty, 0);
            const newTotalQty = Math.max(1, currentTotalQty + delta);

            if (newTotalQty === currentTotalQty) return prev;

            const stock = item.availableToSell;
            const newReadyQty = Math.min(newTotalQty, stock);
            const newIndentQty = newTotalQty - newReadyQty;

            let newItems = [...prev];

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
                        isCustomerDiscount: readyPriceInfo.isCustomerDiscount,
                        stockStatus: 'READY',
                        customId: readyId,
                    };
                    const insertIdx = newItems.findIndex(i => i.id === baseId);
                    newItems.splice(insertIdx > -1 ? insertIdx : newItems.length, 0, newItem);
                }
            } else if (readyIdx > -1) {
                newItems.splice(readyIdx, 1);
            }

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
                        isCustomerDiscount: indentPriceInfo.isCustomerDiscount,
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

    const downloadPDF = async () => {
        const data = {
            quotationNo: `EST-${new Date().getTime()}`,
            createdAt: new Date().toISOString(),
            status: "ESTIMASI",
            title: "PENAWARAN PENJUALAN", // from image
            typeLabel: "Nomor", // from image
            totalAmount: totalAmount, // subtotal
            customerName: selectedCustomer?.name || "Customer",
            customerAddress: selectedCustomer?.detail?.address || "-",
            customerPhone: selectedCustomer?.detail?.mobileNo || "-",
            customerAttention: selectedCustomer?.name || "Customer",
            paymentTerm: "Cash Before Delivery", // match image
            subTotal: totalAmount,
            discountAmount: 0, // currently bulk order UI doesn't have a global discount field beyond the items
            taxAmount: Math.ceil(totalAmount * 0.11),
            otherFees: 0,
            grandTotal: Math.ceil(totalAmount * 1.11),
            items: items.filter(i => !i.isNotFound).map(item => {
                const basePrice = userRole === 'SALES' ? Math.ceil(item.price / 1000) * 1000 : item.finalPrice;
                const d1 = item.salesDiscount1 || 0;
                const d2 = item.salesDiscount2 || 0;
                let itemDiscStr = "%"; // Default or calculated
                if (d1 > 0 && d2 > 0) itemDiscStr = `${d1}+${d2}%`;
                else if (d1 > 0) itemDiscStr = `${d1}%`;
                else if (d2 > 0) itemDiscStr = `${d2}%`;

                return {
                    productSku: item.sku,
                    productName: item.name,
                    brand: item.brand || "",
                    quantity: item.qty,
                    price: basePrice, // show base price in the table
                    finalPrice: item.finalPrice, // total harga
                    stockStatus: item.stockStatus === 'READY' ? 'READY' : 'INDENT',
                    note: item.stockStatus === 'READY' ? 'STOCK' : 'NO STOCK',
                    discountStr: hideDiscountInAccurate ? undefined : itemDiscStr
                };
            })
        };
        await exportQuotationPDF(data);
    };

    const downloadExcel = async () => {
        const data = {
            quotationNo: `EST-${new Date().getTime()}`,
            createdAt: new Date().toISOString(),
            status: "ESTIMASI",
            title: "PENAWARAN PENJUALAN", // from image
            typeLabel: "Nomor", // from image
            totalAmount: totalAmount, // subtotal
            customerName: selectedCustomer?.name || "Customer",
            customerAddress: selectedCustomer?.detail?.address || "-",
            customerPhone: selectedCustomer?.detail?.mobileNo || "-",
            customerAttention: selectedCustomer?.name || "Customer",
            paymentTerm: "Cash Before Delivery", // match image
            subTotal: totalAmount,
            discountAmount: 0,
            taxAmount: Math.ceil(totalAmount * 0.11),
            otherFees: 0,
            grandTotal: Math.ceil(totalAmount * 1.11),
            items: items.filter(i => !i.isNotFound).map(item => {
                const basePrice = userRole === 'SALES' ? Math.ceil(item.price / 1000) * 1000 : item.finalPrice;
                const d1 = item.salesDiscount1 || 0;
                const d2 = item.salesDiscount2 || 0;
                let itemDiscStr = "%"; // Default or calculated
                if (d1 > 0 && d2 > 0) itemDiscStr = `${d1}+${d2}%`;
                else if (d1 > 0) itemDiscStr = `${d1}%`;
                else if (d2 > 0) itemDiscStr = `${d2}%`;

                return {
                    productSku: item.sku,
                    productName: item.name,
                    brand: item.brand || "",
                    quantity: item.qty,
                    price: basePrice, // show base price in the table
                    finalPrice: item.finalPrice, // total harga
                    stockStatus: item.stockStatus === 'READY' ? 'READY' : 'INDENT',
                    note: item.stockStatus === 'READY' ? 'STOCK' : 'NO STOCK',
                    discountStr: hideDiscountInAccurate ? undefined : itemDiscStr
                };
            })
        };
        await exportQuotationExcel(data);
    };

    const handleAddToCart = () => {
        items.filter(i => !i.isNotFound).forEach(item => {
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

    let totalAmount = items.reduce((sum, item) => {
        const basePrice = userRole === 'SALES' ? Math.ceil(item.price / 1000) * 1000 : item.finalPrice;
        const d1 = item.salesDiscount1 || 0;
        const d2 = item.salesDiscount2 || 0;
        const combined = 1 - (1 - d1/100) * (1 - d2/100);
        const discountedPrice = basePrice - (basePrice * combined);
        return sum + (discountedPrice * item.qty);
    }, 0);
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4 w-full min-w-0">
                <div className="bg-blue-50/50 border border-blue-100/50 rounded-lg py-2 px-3 flex items-center gap-2 text-xs text-blue-800">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <p>
                        <span className="font-semibold mr-1">Tips:</span>
                        Cari produk satu per satu, copy-paste list SKU, atau unggah Excel di panel samping. Produk dengan stok terbatas otomatis dipisah (Ready/Indent).
                    </p>
                </div>
                
                {userRole === 'SALES' && (
                    <div className="mb-3 relative">
                        <Label className="text-[10px] text-red-500 font-bold mb-1 block">Pelanggan (Wajib diisi)</Label>
                        {selectedCustomer ? (
                            <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                <div>
                                    <p className="font-semibold">{selectedCustomer.company || selectedCustomer.name}</p>
                                    <p className="text-gray-500 text-[10px]">{selectedCustomer.accurateCustomerCode || selectedCustomer.phone}</p>
                                </div>
                                <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Input
                                    placeholder="Cari nama / kode pelanggan..."
                                    value={customerQuery}
                                    onChange={(e) => setCustomerQuery(e.target.value)}
                                    className="h-8 text-xs bg-white"
                                />
                                {customerQuery.trim().length >= 2 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {isSearchingCustomer ? (
                                            <div className="p-2 text-center text-xs text-gray-400">Mencari...</div>
                                        ) : customerSearchResults.length > 0 ? (
                                            customerSearchResults.map(c => (
                                                <div
                                                    key={c.id}
                                                    onClick={() => {
                                                        setSelectedCustomer(c);
                                                        setCustomerQuery("");
                                                        setCustomerSearchResults([]);
                                                    }}
                                                    className="p-2 hover:bg-gray-50 cursor-pointer text-xs border-b border-gray-100 last:border-0"
                                                >
                                                    <p className="font-bold">{c.company || c.name}</p>
                                                    <p className="text-[10px] text-gray-500">{c.accurateCustomerCode} - {c.name}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-2 text-center text-xs text-gray-400">Tidak ditemukan</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                            <input
                                type="checkbox"
                                id="hideDiscountChk"
                                checked={hideDiscountInAccurate}
                                onChange={(e) => setHideDiscountInAccurate(e.target.checked)}
                                className="w-4 h-4 accent-amber-600 cursor-pointer flex-shrink-0"
                            />
                            <label htmlFor="hideDiscountChk" className="text-[11px] text-amber-800 font-semibold cursor-pointer leading-tight">
                                Sembunyikan Diskon di Accurate
                                <span className="block font-normal text-amber-700/80 mt-0.5">Harga akhir (setelah diskon) dikirim sebagai harga dasar. Kolom diskon di Accurate akan kosong.</span>
                            </label>
                        </div>

                        <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                            <Label className="text-[10px] text-blue-800 font-bold mb-2 block">Set Diskon Masal (Untuk semua item)</Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center bg-white border border-blue-200 rounded overflow-hidden">
                                    <span className="bg-gray-100 text-[10px] font-semibold text-gray-600 px-2 border-r border-gray-200 flex items-center h-8">D1</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={bulkDisc1 || ""}
                                        onChange={(e) => setBulkDisc1(Number(e.target.value) || 0)}
                                        className="h-8 border-0 rounded-none text-xs focus-visible:ring-0 text-center"
                                        placeholder="0"
                                    />
                                    <span className="pr-2 text-[10px] text-gray-500">%</span>
                                </div>
                                <span className="text-gray-400 font-bold">+</span>
                                <div className="flex-1 flex items-center bg-white border border-blue-200 rounded overflow-hidden">
                                    <span className="bg-gray-100 text-[10px] font-semibold text-gray-600 px-2 border-r border-gray-200 flex items-center h-8">D2</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={bulkDisc2 || ""}
                                        onChange={(e) => setBulkDisc2(Number(e.target.value) || 0)}
                                        className="h-8 border-0 rounded-none text-xs focus-visible:ring-0 text-center"
                                        placeholder="0"
                                    />
                                    <span className="pr-2 text-[10px] text-gray-500">%</span>
                                </div>
                                <Button 
                                    onClick={applyBulkDiscount}
                                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 px-3 text-white"
                                    disabled={items.length === 0}
                                >
                                    Terapkan
                                </Button>
                            </div>
                        </div>

                        <div className="mt-3">
                            <Label className="text-[10px] text-gray-700 font-bold mb-1 block">Keterangan / Notes (Opsional)</Label>
                            <textarea
                                className="w-full text-xs p-2 border border-gray-200 rounded min-h-[80px]"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Keterangan penawaran..."
                            />
                        </div>
                    </div>
                )}
                
                <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm relative" ref={searchContainerRef}>
                    <div className="flex items-center p-1 bg-gray-100/80 rounded-lg w-fit mb-3">
                        <button 
                            className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-all ${activeTab === 'search' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('search')}
                        >
                            Cari Produk
                        </button>
                        <button 
                            className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-all ${activeTab === 'paste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('paste')}
                        >
                            Copy & Paste List
                        </button>
                    </div>

                    {activeTab === 'search' ? (
                        <form onSubmit={handleSkuSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Ketik SKU atau nama produk untuk ditambahkan..."
                                    value={skuInput}
                                    onChange={e => setSkuInput(e.target.value)}
                                    onFocus={() => {
                                        if (skuInput.trim().length >= 2) setShowSuggestions(true);
                                    }}
                                    className="pl-9 pr-8 h-9 text-sm rounded-md border-gray-300 focus-visible:ring-red-500"
                                    autoComplete="off"
                                />
                                {skuInput && (
                                    <button
                                        type="button"
                                        onClick={() => { setSkuInput(""); setShowSuggestions(false); }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <Button type="submit" disabled={isSearching || !skuInput} variant="red" className="h-9 px-4 rounded-md text-xs font-medium shadow-sm hover:shadow-md transition-all text-sm">
                                {isSearching ? "Mencari..." : "Tambah"}
                            </Button>
                        </form>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <textarea
                                value={pasteContent}
                                onChange={e => setPasteContent(e.target.value)}
                                placeholder="Paste daftar SKU di sini (pisahkan dengan koma atau baris baru)... Contoh:&#10;SKU-A 2&#10;SKU-B 3&#10;SKU-C"
                                className="w-full h-24 p-2.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
                            />
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-400 italic">*SKU yang tidak ditemukan akan ditandai</p>
                                <Button 
                                    onClick={handleProcessPaste} 
                                    disabled={isProcessingPaste || !pasteContent.trim()} 
                                    variant="red" 
                                    className="h-8 px-4 rounded-md font-medium text-xs shadow-sm"
                                >
                                    {isProcessingPaste ? "Memproses..." : "Submit List"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'search' && showSuggestions && (suggestions.length > 0 || isSearchingSuggestions) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-80 overflow-y-auto overflow-x-hidden">
                            {isSearchingSuggestions && (
                                <div className="p-6 text-center text-sm text-gray-400 flex flex-col items-center justify-center gap-3">
                                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    Mencari produk...
                                </div>
                            )}
                            {!isSearchingSuggestions && suggestions.length === 0 && (
                                <div className="p-6 text-center text-sm text-gray-400">
                                    Produk tidak ditemukan
                                </div>
                            )}
                            {!isSearchingSuggestions && suggestions.map((suggestion) => {
                                const priceInfo = getPriceInfo(suggestion.price, suggestion.category || null, suggestion.availableToSell);
                                return (
                                    <button
                                        key={suggestion.id}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 group"
                                    >
                                        <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden text-[10px] flex items-center justify-center text-gray-400">
                                            {suggestion.image ? (
                                                <Image src={suggestion.image} alt={suggestion.name} fill className="object-contain p-1" />
                                            ) : "No Img"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{suggestion.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">SKU: {suggestion.sku}</p>
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${suggestion.availableToSell > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                    {suggestion.availableToSell > 0 ? `Ready: ${suggestion.availableToSell}` : 'Indent'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {userRole !== 'SALES' && priceInfo.hasDiscount && priceInfo.isCustomerDiscount && (
                                                    <span className="text-xs text-gray-400 line-through leading-tight">
                                                        Rp {priceInfo.originalPriceWithPPN.toLocaleString("id-ID")}
                                                    </span>
                                                )}
                                                <p className="text-xs font-bold text-red-600">
                                                    Rp {(userRole === 'SALES' ? (Math.ceil(suggestion.price / 1000) * 1000) : priceInfo.discountedPriceWithPPN).toLocaleString("id-ID")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-7 h-7 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {items.length > 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
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
                                            <col style={{ width: userRole === 'SALES' ? '24%' : '32%' }} />
                                            <col style={{ width: '14%' }} />
                                            <col style={{ width: '12%' }} />
                                            <col style={{ width: '12%' }} />
                                            {userRole === 'SALES' && (
                                                <>
                                                    <col style={{ width: '10%' }} />
                                                    <col style={{ width: '10%' }} />
                                                </>
                                            )}
                                            <col style={{ width: '14%' }} />
                                            <col style={{ width: '6%' }} />
                                        </colgroup>
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="w-[4%]"></th>
                                                <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Produk</th>
                                                <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Harga Satuan</th>
                                                <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                                                <th className="px-3 py-2 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Qty</th>
                                                {userRole === 'SALES' && (
                                                    <>
                                                        <th className="px-2 py-2 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Diskon 1</th>
                                                        <th className="px-2 py-2 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Diskon 2</th>
                                                    </>
                                                )}
                                                <th className="px-3 py-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide">Subtotal</th>
                                                <th className="px-3 py-2.5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {items.map((item) => (
                                                <SortableRow
                                                    key={item.customId}
                                                    item={item}
                                                    updateQty={updateQty}
                                                    updateQtyDirect={updateQtyDirect}
                                                    removeItem={removeItem}
                                                    isLoggedIn={isLoggedIn}
                                                    userRole={userRole}
                                                    updateItemDiscount={updateItemDiscount}
                                                    onReplaceClick={(id) => setReplaceState({ isOpen: true, customId: id })}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-dashed border-gray-200 py-10 text-center shadow-sm">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ShoppingCart className="w-5 h-5 text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-semibold text-sm">Daftar pesanan masih kosong</p>
                        <p className="text-gray-500 mt-1 text-xs max-w-xs mx-auto">Tambahkan produk dari pencarian, copy-paste, atau file Excel.</p>
                    </div>
                )}
            </div>

            <div className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`bg-white rounded-xl border transition-all p-4 shadow-sm ${isDragging
                        ? "border-emerald-500 border-dashed bg-emerald-50/50 scale-[1.02] shadow-emerald-100"
                        : "border-gray-200 border-solid"
                        }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Impor via Excel</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        Masukkan daftar produk dalam jumlah besar dengan format Excel (.xlsx, .csv).
                    </p>
                    
                    <div className="space-y-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full inline-flex justify-center items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            {isUploading ? "Memproses Data..." : "Pilih File Excel"}
                        </button>
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleExcelUpload}
                        />
                        <button
                            onClick={downloadTemplate}
                            className="w-full inline-flex justify-center items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Download className="w-4 h-4 text-gray-400" />
                            Unduh Template
                        </button>
                    </div>
                    
                    {isDragging ? (
                        <p className="text-xs text-center text-emerald-600 font-medium mt-4 animate-pulse">
                            Lepaskan file di sini...
                        </p>
                    ) : (
                        <p className="text-xs text-center text-gray-400 mt-4 italic">
                            * Atau tarik & drop file ke area ini
                        </p>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm">Ringkasan Pesanan</h3>
                    
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 text-xs">Total Macam Item</span>
                            <span className="font-semibold text-gray-900 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-xs">{items.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 text-xs">Total Kuantitas</span>
                            <span className="font-semibold text-gray-900 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-xs">{totalQty}</span>
                        </div>
                        <div className="pt-3 mt-2 border-t border-gray-100 flex flex-col gap-0.5">
                            {userRole === 'SALES' ? (
                                <>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-gray-900 font-bold text-sm">Subtotal</span>
                                        <span className="font-bold text-gray-900 text-sm tracking-tight">
                                            Rp {totalAmount.toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-gray-500 font-bold text-sm">PPN 11%</span>
                                        <span className="font-bold text-gray-500 text-sm tracking-tight">
                                            Rp {Math.ceil(totalAmount * 0.11).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end pt-2 border-t border-gray-100">
                                        <span className="text-gray-900 font-bold text-sm">Total Akhir</span>
                                        <span className="font-black text-red-600 text-base tracking-tight">
                                            Rp {Math.ceil(totalAmount * 1.11).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-end">
                                        <span className="text-gray-900 font-bold text-sm">Total</span>
                                        <span className="font-black text-red-600 text-base tracking-tight">
                                            Rp {totalAmount.toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-right">* Sudah termasuk PPN 11%</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            size="lg"
                            variant="red"
                            onClick={handleAddToCart}
                            disabled={items.length === 0}
                            className="w-full gap-2 h-10 rounded-lg shadow-md shadow-red-100 font-semibold text-sm transition-all hover:shadow-red-200"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Masukkan Keranjang
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={downloadPDF}
                                disabled={items.length === 0}
                                className="inline-flex justify-center items-center gap-1.5 px-2 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <FileDown className="w-4 h-4 text-red-500" />
                                Est. PDF
                            </button>
                            <button
                                onClick={downloadExcel}
                                disabled={items.length === 0}
                                className="inline-flex justify-center items-center gap-1.5 px-2 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                                Est. Excel
                            </button>
                        </div>

                        {userRole === 'SALES' && (
                            <>
                                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold text-red-800">No. Quotation Berikutnya</span>
                                        <button 
                                            onClick={fetchNextHsq} 
                                            disabled={isSyncingHsq}
                                            className="text-xs flex items-center gap-1 text-red-600 hover:text-red-700 bg-white px-2 py-1 rounded border border-red-200 shadow-sm"
                                        >
                                            <RotateCcw className={`w-3 h-3 ${isSyncingHsq ? 'animate-spin' : ''}`} />
                                            Sync
                                        </button>
                                    </div>
                                    <div className="font-mono text-sm font-bold text-red-900 bg-white px-2 py-1.5 rounded border border-red-200">
                                        {nextHsqNo || "Loading..."}
                                    </div>
                                    <p className="text-[10px] text-red-600/80 mt-1.5 leading-tight">
                                        *Nomor di-generate otomatis. Tekan Sync jika ada tim sales lain yang baru membuat penawaran.
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handleCreateAccurateSq}
                                    disabled={items.length === 0 || isCreatingAccurateSq || !selectedCustomer}
                                    className="w-full gap-2 h-10 rounded-lg shadow-sm font-semibold text-sm transition-all border-red-500 text-red-600 hover:bg-red-50 mt-2"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {isCreatingAccurateSq ? "Memproses..." : "Buat Penawaran Accurate"}
                                </Button>
                            </>
                        )}

                        {items.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="w-full inline-flex justify-center items-center gap-1.5 px-3 py-2 mt-2 rounded-lg text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Bersihkan Daftar
                            </button>
                        )}
                    </div>
                </div>
            </div>

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

            <Dialog open={replaceState.isOpen} onOpenChange={(open) => {
                setReplaceState(prev => ({ ...prev, isOpen: open }));
                if (!open) {
                    setReplaceInput("");
                    setReplaceCategory("all");
                    setReplaceStock("all");
                    setReplacePole("");
                    setReplaceAmpere("");
                    setReplaceKa("");
                    setReplaceSuggestions([]);
                }
            }}>
                <DialogContent className="sm:max-w-[800px] w-full max-h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader className="flex flex-row justify-between items-start pr-8">
                        <div>
                            <DialogTitle>Ganti Produk</DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Cari produk baru untuk menggantikan item di baris ini.
                            </p>
                        </div>
                        <div className="mt-1">
                            <button
                                type="button"
                                onClick={() => setReplaceStock(prev => prev === "all" ? "ready" : "all")}
                                className={`text-xs border rounded-md py-1.5 px-3 whitespace-nowrap font-medium transition-colors ${
                                    replaceStock === "ready" 
                                    ? "bg-green-50 border-green-200 text-green-700" 
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                {replaceStock === "ready" ? "✓ Ready Stock" : "Ready Stock Only"}
                            </button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden flex flex-col py-2">
                        {/* FILTER SECTION */}
                        <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
                            <select
                                value={replaceCategory}
                                onChange={(e) => setReplaceCategory(e.target.value)}
                                className="text-xs border border-gray-200 rounded-md py-1.5 px-2 bg-white"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            
                            <select
                                value={replacePole}
                                onChange={(e) => setReplacePole(e.target.value)}
                                className="text-xs border border-gray-200 rounded-md py-1.5 px-2 bg-white"
                            >
                                <option value="">Pole (Semua)</option>
                                {availableSpecs.poles.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>

                            <select
                                value={replaceAmpere}
                                onChange={(e) => setReplaceAmpere(e.target.value)}
                                className="text-xs border border-gray-200 rounded-md py-1.5 px-2 bg-white"
                            >
                                <option value="">Ampere (Semua)</option>
                                {availableSpecs.amperes.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>

                            <select
                                value={replaceKa}
                                onChange={(e) => setReplaceKa(e.target.value)}
                                className="text-xs border border-gray-200 rounded-md py-1.5 px-2 bg-white"
                            >
                                <option value="">Breaking Cap (Semua)</option>
                                {availableSpecs.breakingCapacities.map(k => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>

                        </div>

                        <div className="relative mb-4 flex-shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Ketik SKU atau Nama Produk..."
                                value={replaceInput}
                                onChange={(e) => setReplaceInput(e.target.value)}
                                className="pl-9 bg-gray-50 border-gray-200"
                                autoFocus
                            />
                            {isSearchingReplace && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-1">
                            {replaceSuggestions.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-2">
                                    {replaceSuggestions.map((prod) => (
                                        <button
                                            key={prod.id}
                                            onClick={() => handleReplaceSuggestionClick(prod)}
                                            className="flex flex-col text-left bg-white border border-gray-200 rounded-xl hover:border-red-300 hover:shadow-md transition-all overflow-hidden group"
                                        >
                                            <div className="w-full aspect-square bg-gray-50 relative border-b border-gray-100">
                                                {prod.image ? (
                                                    <Image src={prod.image} alt={prod.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                                                )}
                                            </div>
                                            <div className="p-3 flex flex-col flex-1 w-full">
                                                <p className="text-xs text-gray-500 mb-1">{prod.sku}</p>
                                                <p className="text-xs font-medium text-gray-900 line-clamp-2 mb-3 leading-tight flex-1">{prod.name}</p>
                                                
                                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                                                    <p className="text-sm font-bold text-red-600">
                                                        Rp {prod.price.toLocaleString('id-ID')}
                                                    </p>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${Number(prod.availableToSell || 0) > 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                        {Number(prod.availableToSell || 0) > 0 ? 'Ready' : 'Indent'}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : replaceInput.trim().length >= 2 && !isSearchingReplace ? (
                                <div className="py-8 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                                    Tidak ada produk ditemukan untuk "{replaceInput}"
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                                    <Search className="w-8 h-8 mb-3 opacity-20" />
                                    <p className="text-sm">Ketik untuk mulai mencari produk pengganti</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function SortableRow({ item, updateQty, updateQtyDirect, removeItem, isLoggedIn, userRole, updateItemDiscount, onReplaceClick }: {
    item: BulkItem;
    updateQty: (id: string, delta: number) => void;
    updateQtyDirect: (id: string, qty: number) => void;
    removeItem: (id: string) => void;
    isLoggedIn: boolean;
    userRole: string | null;
    updateItemDiscount: (id: string, field: 'd1' | 'd2', value: number) => void;
    onReplaceClick?: (id: string) => void;
}) {
    const basePrice = userRole === 'SALES' ? Math.ceil(item.price / 1000) * 1000 : item.finalPrice;
                const d1 = item.salesDiscount1 || 0;
                const d2 = item.salesDiscount2 || 0;
                const combined = 1 - (1 - d1/100) * (1 - d2/100);
                const discountedPrice = basePrice - (basePrice * combined);

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
            <td className="px-3 py-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                        {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Img</div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className={`font-medium text-sm line-clamp-1 ${item.isNotFound ? 'text-red-500' : 'text-gray-900'}`}>{item.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">SKU: {item.sku}</p>
                    </div>
                </div>
            </td>
            <td className="px-3 py-2">
                <div className="flex flex-col">
                    {userRole !== 'SALES' && isLoggedIn && item.hasDiscount && item.isCustomerDiscount && item.originalPrice && (
                        <span className="text-xs text-gray-400 line-through leading-tight">
                            Rp {item.originalPrice.toLocaleString("id-ID")}
                        </span>
                    )}
                    <span className="text-sm font-semibold text-red-600 leading-tight">
                        Rp {(userRole === 'SALES' ? Math.ceil(item.price / 1000) * 1000 : item.finalPrice).toLocaleString("id-ID")}
                    </span>
                </div>
            </td>
            <td className="px-3 py-2">
                <div className="flex flex-col gap-1">
                    {item.stockStatus === 'READY' ? (
                        <>
                            <span className="inline-flex items-center w-fit whitespace-nowrap text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                Ready Stock
                            </span>
                            {!item.isCustom && (
                                <span className="text-[10px] text-gray-400 mt-0.5">Tersedia: {item.availableToSell}</span>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="inline-flex items-center w-fit text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Indent
                            </span>
                            {item.isNotFound ? (
                                <span className="text-[10px] text-red-500 font-bold">Tidak Tersedia</span>
                            ) : item.isCustom && (
                                <span className="text-[10px] text-gray-400">Produk Kustom</span>
                            )}
                        </>
                    )}
                </div>
            </td>
            <td className="px-3 py-2">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => updateQty(item.customId, -1)}
                        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                        <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) => updateQtyDirect(item.customId, parseInt(e.target.value))}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="w-10 text-center text-sm font-semibold text-gray-800 tabular-nums border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                        onClick={() => updateQty(item.customId, 1)}
                        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                        <Plus className="w-3 h-3 text-gray-600" />
                    </button>
                </div>
            </td>
            {userRole === 'SALES' && (
                <>
                    <td className="px-2 py-2">
                        <Input 
                            type="number"
                            className="h-8 text-xs text-center px-1 font-mono"
                            value={item.salesDiscount1 || ''}
                            onChange={(e) => updateItemDiscount(item.customId, 'd1', parseFloat(e.target.value) || 0)}
                            placeholder="%"
                        />
                    </td>
                    <td className="px-2 py-2">
                        <Input 
                            type="number"
                            className="h-8 text-xs text-center px-1 font-mono"
                            value={item.salesDiscount2 || ''}
                            onChange={(e) => updateItemDiscount(item.customId, 'd2', parseFloat(e.target.value) || 0)}
                            placeholder="%"
                        />
                    </td>
                </>
            )}
            <td className="px-3 py-2 text-right">
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                    Rp {(discountedPrice * item.qty).toLocaleString("id-ID")}
                </span>
            </td>
            <td className="px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                    {onReplaceClick && (
                        <button
                            onClick={() => onReplaceClick(item.customId)}
                            title="Ganti Produk"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => removeItem(item.customId)}
                        title="Hapus Produk"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
