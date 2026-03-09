"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Loader2,
    Mail,
    Phone,
    User,
    Package,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Send,
    BadgePercent,
    MessageSquare,
    Info,
    Plus,
    Trash2,
    Save,
    Clock,
    History,
    Search,
    ChevronDown,
    ChevronUp,
    FileText,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    FileUp,
    FileSearch,
    Truck,
    Upload,
    Download,
    CheckCircle,
    Tag,
    Check,
    X,
    PackageCheck,
} from "lucide-react";
import { getQuotationDetail, processQuotation, submitQuotationOffer, saveQuotationDraft, fetchAccurateQuotationList, updateQuotationHSQ, approveHsq, respondToSpecialDiscountRequest } from "@/app/actions/quotation";
import { uploadFile } from "@/app/actions/upload";
import { getProductsForAlternative, getProductCategories } from "@/app/actions/product";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { calculatePriceInfo } from "@/lib/pricing";
import { getCustomerPricingDataById, type CustomerPricingData } from "@/app/actions/customer-pricing";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Penawaran Masuk", color: "text-yellow-700", bg: "bg-yellow-100 border-yellow-200" },
    OFFERED: { label: "Penawaran", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
    CONFIRMED: { label: "PO Diterima", color: "text-violet-700", bg: "bg-violet-100 border-violet-200" },
    PROCESSING: { label: "Pesanan (HSO)", color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
    SHIPPED: { label: "Dikirim", color: "text-sky-700", bg: "bg-sky-100 border-sky-200" },
    COMPLETED: { label: "Selesai", color: "text-green-700", bg: "bg-green-100 border-green-200" },
    CANCELLED: { label: "Dibatalkan", color: "text-red-700", bg: "bg-red-100 border-red-200" },
};

interface Alternative {
    id?: string;
    productSku: string;
    productName: string;
    brand?: string;
    price: number;
    image?: string;
    availableToSell?: number;
    quantity: number;
    note?: string;
}

interface ItemState {
    id: string;
    productSku: string;
    productName: string;
    brand: string;
    quantity: number;
    price: number;
    basePrice?: number | null;
    discountPercent?: number | null;
    discountStr?: string | null;
    isAvailable: boolean | null;
    availableQty: number | null;
    adminNote: string;
    currentStock: number;
    currentPrice: number;
    image?: string;
    category?: string;
    alternatives: Alternative[];
}

export default function QuotationDetailPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const fromOrders = searchParams.get("from") === "orders";

    const [quotation, setQuotation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Editable state
    const [items, setItems] = useState<ItemState[]>([]);
    const [adminNotes, setAdminNotes] = useState("");
    const [specialDiscount, setSpecialDiscount] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [pricingData, setPricingData] = useState<CustomerPricingData | null>(null);

    // Search for alternatives
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeItemForAlt, setActiveItemForAlt] = useState<string | null>(null);
    const [stockFilter, setStockFilter] = useState<string>("all");
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Process Dialog state
    const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
    const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessingRequest, setIsProcessingRequest] = useState(false);
    const [officialNo, setOfficialNo] = useState("");
    const [accurateId, setAccurateId] = useState<number | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [accurateDocs, setAccurateDocs] = useState<any[]>([]);
    const [isFetchingDocs, setIsFetchingDocs] = useState(false);
    const [docSearch, setDocSearch] = useState("");
    const [hsqPage, setHsqPage] = useState(1);
    const [hsqHasMore, setHsqHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Update HSQ Dialog state (edit penawaran saat OFFERED tapi belum HSO)
    const [isUpdateHsqDialogOpen, setIsUpdateHsqDialogOpen] = useState(false);
    const [updateHsqNo, setUpdateHsqNo] = useState("");
    const [updateAccurateId, setUpdateAccurateId] = useState<number | null>(null);
    const [updatePdfFile, setUpdatePdfFile] = useState<File | null>(null);
    const [updateAccurateDocs, setUpdateAccurateDocs] = useState<any[]>([]);
    const [isFetchingUpdateDocs, setIsFetchingUpdateDocs] = useState(false);
    const [updateHsqPage, setUpdateHsqPage] = useState(1);
    const [updateHsqHasMore, setUpdateHsqHasMore] = useState(false);
    const [isLoadingMoreUpdate, setIsLoadingMoreUpdate] = useState(false);
    const [isUpdatingHsq, setIsUpdatingHsq] = useState(false);

    const fmtPrice = (p: number) => new Intl.NumberFormat("id-ID").format(Math.round(p));

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const result = await getQuotationDetail(id);
        if (result.success && result.quotation) {
            const q = result.quotation;
            setQuotation(q);
            setItems(
                q.items.map((item: any) => ({
                    id: item.id,
                    productSku: item.productSku,
                    productName: item.productName,
                    brand: item.brand,
                    quantity: item.quantity,
                    price: item.price,
                    basePrice: item.basePrice,
                    discountPercent: item.discountPercent,
                    discountStr: item.discountStr,
                    isAvailable: item.isAvailable,
                    availableQty: item.availableQty ?? item.currentStock,
                    adminNote: item.adminNote || "",
                    currentStock: item.currentStock,
                    currentPrice: item.currentPrice,
                    image: item.image,
                    category: item.category,
                    alternatives: item.alternatives || [],
                }))
            );
            setAdminNotes(q.adminNotes || "");
            setSpecialDiscount(q.specialDiscountNote || (q.specialDiscount != null ? String(q.specialDiscount) : ""));

            // Get customer pricing data
            if (q.customerId) {
                const pData = await getCustomerPricingDataById(q.customerId);
                setPricingData(pData);
            }
        }
        setIsLoading(false);
    }, [id]);

    const fetchCategories = useCallback(async () => {
        const result = await getProductCategories();
        if (result.success) {
            setCategories(result.categories || []);
        }
    }, []);

    useEffect(() => {
        loadData();
        fetchCategories();
    }, [loadData, fetchCategories]);

    const handleProcess = async () => {
        setIsProcessing(true);

        let pdfPath = quotation.adminQuotePdfPath;
        if (pdfFile) {
            const formData = new FormData();

            // Rename file to match officialNo + timestamp for descriptive uniqueness
            const fileExt = pdfFile.name.split('.').pop() || 'pdf';
            const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
            const sanitizedNo = officialNo.replace(/[^a-zA-Z0-9]/g, '-');
            const newFileName = `${sanitizedNo}-${timestamp}.${fileExt}`;

            const renamedFile = new File([pdfFile], newFileName, { type: pdfFile.type });
            formData.append("file", renamedFile);
            const uploadRes = await uploadFile(formData, true, "files");
            if (uploadRes.success) {
                pdfPath = uploadRes.url;
            } else {
                toast.error("Gagal mengupload file PDF");
                setIsProcessing(false);
                return;
            }
        }

        const result = await processQuotation(id, {
            officialNo: officialNo,
            accurateId: accurateId || undefined,
            pdfPath: pdfPath
        });

        if (result.success) {
            toast.success("Quotation berhasil dikonfirmasi");
            setIsProcessDialogOpen(false);

            // Redirect to the new URL with the official HSQ number
            router.push(`/admin/sales/quotations/${encodeURIComponent(result.quotationNo!)}`);

            // Still call loadData in case we are already on that URL or to refresh state
            await loadData();
        } else {
            toast.error(result.error || "Gagal memproses quotation");
        }
        setIsProcessing(false);
    };

    const fetchAccurateDocs = async (search?: string, page: number = 1, append: boolean = false) => {
        if (page === 1) setIsFetchingDocs(true);
        else setIsLoadingMore(true);
        const res = await fetchAccurateQuotationList(search, page);
        if (res.success) {
            if (append) {
                setAccurateDocs(prev => [...prev, ...(res.docs || [])]);
            } else {
                setAccurateDocs(res.docs || []);
            }
            setHsqHasMore(res.hasMore ?? false);
            setHsqPage(page);
        }
        if (page === 1) setIsFetchingDocs(false);
        else setIsLoadingMore(false);
    };

    const fetchUpdateAccurateDocs = async (search?: string, page: number = 1, append: boolean = false) => {
        if (page === 1) setIsFetchingUpdateDocs(true);
        else setIsLoadingMoreUpdate(true);
        const res = await fetchAccurateQuotationList(search, page);
        if (res.success) {
            if (append) {
                setUpdateAccurateDocs(prev => [...prev, ...(res.docs || [])]);
            } else {
                setUpdateAccurateDocs(res.docs || []);
            }
            setUpdateHsqHasMore(res.hasMore ?? false);
            setUpdateHsqPage(page);
        }
        if (page === 1) setIsFetchingUpdateDocs(false);
        else setIsLoadingMoreUpdate(false);
    };

    const handleUpdateHsq = async () => {
        setIsUpdatingHsq(true);
        try {
            let pdfPath = quotation?.adminQuotePdfPath;

            if (updatePdfFile) {
                const formData = new FormData();
                const fileExt = updatePdfFile.name.split('.').pop() || 'pdf';
                const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
                const sanitizedNo = (updateHsqNo || quotation?.quotationNo || "HSQ").replace(/[^a-zA-Z0-9]/g, '-');
                const newFileName = `${sanitizedNo}-${timestamp}.${fileExt}`;
                const renamedFile = new File([updatePdfFile], newFileName, { type: updatePdfFile.type });
                formData.append("file", renamedFile);
                const uploadRes = await uploadFile(formData, true, "files");
                if (uploadRes.success) {
                    pdfPath = uploadRes.url;
                } else {
                    toast.error("Gagal mengupload file PDF");
                    setIsUpdatingHsq(false);
                    return;
                }
            }

            const result = await updateQuotationHSQ(id, {
                officialNo: updateHsqNo || undefined,
                accurateId: updateAccurateId || undefined,
                pdfPath: pdfPath || undefined,
                adminNotes: adminNotes || undefined,
                specialDiscount: effectiveTotalPercent || 0,
                specialDiscountNote: specialDiscount || undefined,
                items: items.map(item => ({
                    id: item.id,
                    productSku: item.productSku,
                    productName: item.productName,
                    brand: item.brand,
                    quantity: item.quantity,
                    price: item.price,
                    basePrice: item.basePrice,
                    isAvailable: item.isAvailable,
                    availableQty: item.availableQty,
                    adminNote: item.adminNote,
                    alternatives: item.alternatives,
                })),
            });

            if (result.success) {
                toast.success("Penawaran HSQ berhasil diperbarui");
                setIsUpdateHsqDialogOpen(false);
                setUpdatePdfFile(null);
                await loadData();
            } else {
                toast.error(result.error || "Gagal memperbarui penawaran");
            }
        } catch (e) {
            toast.error("Terjadi kesalahan");
        }
        setIsUpdatingHsq(false);
    };

    const updateItem = (itemId: string, updates: Partial<ItemState>) => {
        setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    };

    const removeItem = async (itemId: string) => {
        const confirm = window.confirm("Hapus produk ini dari daftar penawaran?");
        if (!confirm) return;
        const newItems = items.filter(item => item.id !== itemId);
        setItems(newItems);
        toast.info("Menghapus produk...");
        await triggerSaveDraft(newItems);
    };

    const triggerSaveDraft = async (updatedItems?: ItemState[]) => {
        setIsSaving(true);
        const itemsToSave = updatedItems || items;
        try {
            const result = await saveQuotationDraft(id, {
                adminNotes: adminNotes || null,
                specialDiscount: effectiveTotalPercent,
                specialDiscountNote: specialDiscount,
                items: itemsToSave.map(item => ({
                    id: item.id,
                    productSku: item.productSku,
                    productName: item.productName,
                    brand: item.brand,
                    quantity: item.quantity,
                    price: item.price,
                    basePrice: item.basePrice,
                    isAvailable: item.isAvailable,
                    availableQty: item.availableQty,
                    adminNote: item.adminNote || null,
                    alternatives: item.alternatives.map(alt => ({
                        productSku: alt.productSku,
                        productName: alt.productName,
                        brand: alt.brand,
                        quantity: alt.quantity,
                        price: alt.price,
                        note: alt.note
                    }))
                })),
            });
            if (result.success) {
                toast.success("Draft berhasil disimpan ke database");
                await loadData();
                return true;
            } else {
                toast.error(result.error || "Gagal menyimpan draft");
                return false;
            }
        } catch (err) {
            console.error("Save draft error:", err);
            toast.error("Terjadi kesalahan saat menyimpan draft");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleAcceptDiscountRequest = async () => {
        setIsProcessingRequest(true);
        try {
            const res = await respondToSpecialDiscountRequest(id, true);
            if (res.success) {
                toast.success("Permintaan diskon diterima");
                setTimeout(() => {
                    document.getElementById("discount-box")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 300);
                await loadData();
            } else {
                toast.error(res.error || "Gagal memproses permintaan");
            }
        } catch (e) {
            toast.error("Terjadi kesalahan");
        }
        setIsProcessingRequest(false);
    };

    const handleRejectDiscountRequest = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Harap masukkan alasan penolakan");
            return;
        }
        setIsProcessingRequest(true);
        try {
            const res = await respondToSpecialDiscountRequest(id, false, rejectionReason);
            if (res.success) {
                toast.success("Permintaan diskon ditolak");
                setIsRejectionDialogOpen(false);
                setRejectionReason("");
                await loadData();
            } else {
                toast.error(res.error || "Gagal memproses permintaan");
            }
        } catch (e) {
            toast.error("Terjadi kesalahan");
        }
        setIsProcessingRequest(false);
    };

    const handleSaveDraft = async () => {
        await triggerSaveDraft();
    };

    const handleSubmitOffer = async () => {
        const confirm = window.confirm("Kirim penawaran ini ke customer?");
        if (!confirm) return;

        setIsSubmitting(true);
        const result = await submitQuotationOffer(id, {
            adminNotes: adminNotes || null,
            specialDiscount: effectiveTotalPercent,
            specialDiscountNote: specialDiscount,
            items: items.map(item => ({
                id: item.id,
                productSku: item.productSku,
                productName: item.productName,
                brand: item.brand,
                quantity: item.quantity,
                price: item.price,
                basePrice: item.basePrice,
                isAvailable: item.isAvailable,
                availableQty: item.availableQty,
                adminNote: item.adminNote || null,
                alternatives: item.alternatives.map(alt => ({
                    productSku: alt.productSku,
                    productName: alt.productName,
                    brand: alt.brand,
                    quantity: alt.quantity,
                    price: alt.price,
                    note: alt.note
                }))
            })),
        });
        if (result.success) {
            toast.success("Penawaran berhasil dikirim");
            router.push("/admin/sales/quotations");
        } else {
            toast.error(result.error || "Gagal mengirim penawaran");
        }
        setIsSubmitting(false);
    };

    const searchAltProducts = async (query: string, category?: string, targetName?: string, stockStatus: string = "all", page: number = 1) => {
        setIsSearching(true);
        const result = await getProductsForAlternative(category || "All", query, stockStatus, page, 24);
        if (result.success) {
            let prods = result.products || [];

            // Client-side relevance sort based on similarity to original product name
            if (targetName && targetName !== "Produk Baru") {
                const targetWords = targetName.toLowerCase().split(/[\s,.-]+/).filter(Boolean);

                prods = [...prods].sort((a: any, b: any) => {
                    let scoreA = 0;
                    let scoreB = 0;

                    if (query.trim()) {
                        const q = query.trim().toLowerCase();
                        const nA = a.name.toLowerCase();
                        const sA = a.sku.toLowerCase();
                        if (nA === q || sA === q) scoreA += 1000;
                        else if (nA.startsWith(q) || sA.startsWith(q)) scoreA += 500;
                        else if (nA.includes(q) || sA.includes(q)) scoreA += 100;

                        const nB = b.name.toLowerCase();
                        const sB = b.sku.toLowerCase();
                        if (nB === q || sB === q) scoreB += 1000;
                        else if (nB.startsWith(q) || sB.startsWith(q)) scoreB += 500;
                        else if (nB.includes(q) || sB.includes(q)) scoreB += 100;
                    }

                    // Word overlap scoring
                    const aWords = a.name.toLowerCase().split(/[\s,.-]+/).filter(Boolean);
                    const bWords = b.name.toLowerCase().split(/[\s,.-]+/).filter(Boolean);

                    const matchCountA = targetWords.filter(w => aWords.includes(w)).length;
                    const matchCountB = targetWords.filter(w => bWords.includes(w)).length;

                    // Add word match weight (boosted if it matches the first few words which are usually brand/series)
                    scoreA += matchCountA * 10;
                    if (aWords[0] === targetWords[0]) scoreA += 20;

                    scoreB += matchCountB * 10;
                    if (bWords[0] === targetWords[0]) scoreB += 20;

                    return scoreB - scoreA;
                });
            } else if (query.trim()) {
                const q = query.trim().toLowerCase();
                prods = [...prods].sort((a: any, b: any) => {
                    const scoreOf = (p: any) => {
                        const name = p.name.toLowerCase();
                        const sku = p.sku.toLowerCase();
                        if (name === q || sku === q) return 0;
                        if (name.startsWith(q) || sku.startsWith(q)) return 1;
                        return 2;
                    };
                    return scoreOf(a) - scoreOf(b);
                });
            }

            setSearchResults(prods);
            if (result.pagination) {
                setCurrentPage(result.pagination.currentPage);
                setTotalPages(result.pagination.totalPages);
                setTotalCount(result.pagination.totalCount);
            }
        }
        setIsSearching(false);
    };

    const addAlternative = (itemId: string, product: any) => {
        let finalPrice = product.price;
        let discountStr = "";

        if (pricingData) {
            const priceInfo = calculatePriceInfo(
                product.price,
                product.category,
                pricingData.customer,
                pricingData.categoryMappings,
                product.availableToSell || 0,
                pricingData.discountRules
            );

            if (priceInfo.hasDiscount) {
                finalPrice = priceInfo.discountedPrice;
                discountStr = priceInfo.discountStr || "";
            }
        }

        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                // Check if already added
                if (item.alternatives.some(a => a.productSku === product.sku)) {
                    toast.error("Produk ini sudah ditambahkan sebagai alternatif");
                    return item;
                }
                return {
                    ...item,
                    alternatives: [
                        ...item.alternatives,
                        {
                            productSku: product.sku,
                            productName: product.name,
                            brand: product.brand,
                            price: finalPrice,
                            image: product.image,
                            availableToSell: product.availableToSell,
                            quantity: item.quantity,
                            note: discountStr ? `Diskon: ${discountStr}` : ""
                        }
                    ]
                };
            }
            return item;
        }));
        toast.success(`Alternatif ditambahkan dengan diskon: ${discountStr || 'N/A'}`);
    };

    const removeAlternative = (itemId: string, sku: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    alternatives: item.alternatives.filter(a => a.productSku !== sku)
                };
            }
            return item;
        }));
    };

    const updateAlternative = (itemId: string, sku: string, updates: Partial<Alternative>) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    alternatives: item.alternatives.map(a => a.productSku === sku ? { ...a, ...updates } : a)
                };
            }
            return item;
        }));
    };
    const replaceWithAlternative = async (itemId: string, alt: Alternative) => {
        const confirm = window.confirm(`Ganti produk ini dengan ${alt.productName}?`);
        if (!confirm) return;

        const newItems = items.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    productSku: alt.productSku,
                    productName: alt.productName,
                    brand: alt.brand || "",
                    price: alt.price,
                    image: alt.image,
                    currentPrice: alt.price,
                    currentStock: alt.availableToSell || 0,
                    availableQty: alt.availableToSell || 0,
                    alternatives: [],
                };
            }
            return item;
        });

        setItems(newItems);
        toast.info("Mengganti produk...");
        await triggerSaveDraft(newItems);
    };

    const addNewItemToQuotation = async (product: any) => {
        let finalPrice = product.price;
        let discountStr = "";
        let discountPercent = 0;

        if (pricingData) {
            const priceInfo = calculatePriceInfo(
                product.price,
                product.category,
                pricingData.customer,
                pricingData.categoryMappings,
                product.availableToSell || 0,
                pricingData.discountRules
            );

            if (priceInfo.hasDiscount) {
                finalPrice = priceInfo.discountedPrice;
                discountStr = priceInfo.discountStr || "";
                // Calculate effective percent if it's multiple discounts
                if (priceInfo.discounts.length > 0) {
                    let multiplier = 1;
                    priceInfo.discounts.forEach(d => { multiplier *= (1 - (d / 100)); });
                    discountPercent = (1 - multiplier) * 100;
                }
            }
        }

        const newId = `new-${Date.now()}`;
        const newItem: ItemState = {
            id: newId,
            productSku: product.sku,
            productName: product.name,
            brand: product.brand || "",
            quantity: 1,
            price: finalPrice,
            basePrice: product.price,
            discountPercent: discountPercent,
            discountStr: discountStr,
            isAvailable: true,
            availableQty: product.availableToSell,
            adminNote: "",
            currentStock: product.availableToSell,
            currentPrice: product.price,
            image: product.image,
            category: product.category,
            alternatives: [],
        };

        const newItems = [...items, newItem];
        setItems(newItems);
        toast.info(`Menambahkan ${product.name}...`);
        await triggerSaveDraft(newItems);
    };
    // Calculate totals
    const originalTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Handle tiered discounts
    const calcEffectivePercent = (str: string) => {
        if (!str) return 0;
        if (str.includes('+')) {
            const parts = str.split('+').map(p => parseFloat(p) || 0);
            let multiplier = 1;
            parts.forEach(p => { multiplier *= (1 - (p / 100)); });
            return (1 - multiplier) * 100;
        }
        return parseFloat(str) || 0;
    };

    const effectiveTotalPercent = calcEffectivePercent(specialDiscount);
    const discountAmount = originalTotal * (effectiveTotalPercent / 100);
    const finalTotal = originalTotal - discountAmount;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
                <p className="text-sm text-gray-500">Memuat detail quotation...</p>
            </div>
        );
    }

    if (!quotation) {
        return (
            <div className="text-center py-20">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700">Quotation tidak ditemukan</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/sales/quotations")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                </Button>
            </div>
        );
    }

    const statusObj = STATUS_CONFIG[quotation.status] || STATUS_CONFIG.PENDING;
    const isHsqApproved = quotation?.isHsqApproved === true;

    // Override label for finalized offer
    const status = (quotation.status === "OFFERED" && isHsqApproved)
        ? { ...statusObj, label: "Penawaran Disetujui", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" }
        : statusObj;

    const isOffered = quotation.status === "OFFERED";
    const isCompleted = quotation.status === "COMPLETED";
    const isInProcess = quotation.status === "PROCESSING";
    const isPending = quotation.status === "PENDING";
    // OFFERED tanpa HSO = masih bisa edit penawaran (user mungkin sudah upload PO / minta diskon)
    const isHsqEditable = isOffered && !quotation.accurateHsoNo && !quotation.accurateHsoId && !isHsqApproved;
    const isEditable = isPending || isInProcess || isHsqEditable;
    const isAdminEditable = isEditable;

    // ══════════════════════════════════════════════════════════════════════════
    // VIEW-ONLY MODE: Jika sudah disetujui (OFFERED/COMPLETED), tampilkan read-only
    // Pengecualian: OFFERED tanpa HSO = masih editable (isHsqEditable)
    // ══════════════════════════════════════════════════════════════════════════
    if ((isOffered || isCompleted) && !fromOrders && !isHsqEditable) {
        const displayTitle = quotation.accurateHsoNo || quotation.quotationNo;

        // Kumpulkan semua dokumen yang tersedia
        const docs: { label: string; url: string; color: string; note?: string }[] = [];
        if (quotation.userPoPath) docs.push({ label: "HPO Customer", url: quotation.userPoPath, color: "text-violet-600 bg-violet-50 border-violet-100", note: quotation.poNotes || undefined });
        if (quotation.adminQuotePdfPath) docs.push({ label: "PDF Penawaran", url: quotation.adminQuotePdfPath, color: "text-red-600 bg-red-50 border-red-100" });
        if (quotation.adminSoPdfPath) docs.push({ label: "Dokumen SO", url: quotation.adminSoPdfPath, color: "text-blue-600 bg-blue-50 border-blue-100" });
        if (quotation.adminDoPdfPath) docs.push({ label: "Surat Jalan", url: quotation.adminDoPdfPath, color: "text-green-600 bg-green-50 border-green-100" });
        if (quotation.invoiceUrl) docs.push({ label: "Invoice", url: quotation.invoiceUrl, color: "text-orange-600 bg-orange-50 border-orange-100" });
        if (quotation.taxInvoiceUrl) docs.push({ label: "Faktur Pajak", url: quotation.taxInvoiceUrl, color: "text-indigo-600 bg-indigo-50 border-indigo-100" });

        return (
            <div className="space-y-5 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.push("/admin/sales/quotations")} className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{displayTitle}</h1>
                                <Badge className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border-2 shadow-sm ${status.bg} ${status.color}`}>
                                    {status.label}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {!isHsqApproved && (
                                    <>
                                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">SQ: {quotation.quotationNo}</span>
                                        {quotation.accurateHsqNo && <span className="text-[10px] font-mono font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">HSQ: {quotation.accurateHsqNo}</span>}
                                    </>
                                )}
                                {quotation.accurateHsoNo && <span className="text-[10px] font-mono font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">HSO: {quotation.accurateHsoNo}</span>}
                                {quotation.accurateDoNo && <span className="text-[10px] font-mono font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded border border-green-200">DO: {quotation.accurateDoNo}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline — compact horizontal */}
                <div className="flex items-center gap-1 flex-wrap bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                    {quotation.createdAt && (
                        <div className="flex items-center gap-1.5 pr-4 border-r border-slate-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-slate-500">Dibuat <span className="text-slate-400">{format(new Date(quotation.createdAt), "dd MMM yyyy, HH:mm")}</span></span>
                        </div>
                    )}
                    {!isHsqApproved && quotation.processedAt && (
                        <div className="flex items-center gap-1.5 px-4 border-r border-slate-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span className="text-[10px] font-bold text-slate-500">HSQ <span className="text-slate-400">{format(new Date(quotation.processedAt), "dd MMM yyyy, HH:mm")}</span></span>
                        </div>
                    )}
                    {!isHsqApproved && quotation.confirmedAt && (
                        <div className="flex items-center gap-1.5 px-4 border-r border-slate-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span className="text-[10px] font-bold text-slate-500">HSO <span className="text-slate-400">{format(new Date(quotation.confirmedAt), "dd MMM yyyy, HH:mm")}</span></span>
                        </div>
                    )}
                    {quotation.shippedAt && (
                        <div className="flex items-center gap-1.5 pl-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] font-bold text-slate-500">Dikirim <span className="text-slate-400">{format(new Date(quotation.shippedAt), "dd MMM yyyy, HH:mm")}</span></span>
                        </div>
                    )}
                </div>

                {/* Customer + Dokumen — side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Customer Info */}
                    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-red-500" /> Customer
                        </h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nama</span>
                                <p className="text-sm font-bold text-slate-900">{quotation.customerCompany || quotation.customerName || "-"}</p>
                            </div>
                            {quotation.customerCompany && (
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PIC</span>
                                    <p className="text-sm font-bold text-slate-900">{quotation.customerName}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                                <p className="text-sm font-bold text-slate-700">{quotation.email}</p>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Telepon</span>
                                <p className="text-sm font-bold text-slate-700">{quotation.phone || "-"}</p>
                            </div>
                            {quotation.shippingAddress && (
                                <div className="col-span-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alamat Pengiriman</span>
                                    <p className="text-sm font-bold text-slate-700">{quotation.shippingAddress}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dokumen Terkait — semua dalam satu box */}
                    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-red-500" /> Dokumen Terkait
                        </h3>
                        {docs.length > 0 ? (
                            <div className="space-y-2">
                                {docs.map((doc, i) => (
                                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-2.5 rounded-lg border hover:opacity-80 transition-opacity ${doc.color}`}>
                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-bold block">{doc.label}</span>
                                            {doc.note ? (
                                                <span className="text-[10px] opacity-70 truncate block">{doc.note}</span>
                                            ) : (
                                                <span className="text-[10px] opacity-60 truncate block">{doc.url.split("/").pop()}</span>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 text-center py-4">Belum ada dokumen terlampir</p>
                        )}
                    </div>
                </div>

                {/* Catatan jika ada */}
                {(quotation.notes || quotation.adminNoteInternal) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {quotation.notes && (
                            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-start gap-3">
                                <MessageSquare className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Catatan Customer</span>
                                    <p className="text-sm text-slate-700">{quotation.notes}</p>
                                </div>
                            </div>
                        )}
                        {quotation.adminNoteInternal && (
                            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-start gap-3">
                                <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Catatan Internal</span>
                                    <p className="text-sm text-slate-700">{quotation.adminNoteInternal}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Product List — full width */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-red-500" /> Daftar Produk ({items.length} item)
                        </h3>
                    </div>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2.5 px-5">Produk</th>
                                <th className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 py-2.5 px-3">Qty</th>
                                <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 py-2.5 px-3">Harga</th>
                                <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 py-2.5 px-5">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="py-2.5 px-5">
                                        <div className="flex items-center gap-3">
                                            {item.image ? (
                                                <img src={item.image} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-100" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                                                    <Package className="w-3.5 h-3.5 text-slate-300" />
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-sm font-bold text-slate-900 block leading-tight">{item.productName}</span>
                                                <span className="text-[10px] font-mono text-slate-400">{item.productSku}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-center py-2.5 px-3">
                                        <span className="text-sm font-bold text-slate-700 font-mono">{item.quantity}</span>
                                    </td>
                                    <td className="text-right py-2.5 px-3">
                                        <span className="text-sm font-bold text-slate-700 font-mono">{fmtPrice(item.price)}</span>
                                        {item.discountStr && <span className="block text-[10px] font-bold text-emerald-600">Disc: {item.discountStr}</span>}
                                    </td>
                                    <td className="text-right py-2.5 px-5">
                                        <span className="text-sm font-bold text-slate-900 font-mono">{fmtPrice(item.price * item.quantity)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Total */}
                    <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-3 flex items-center justify-end gap-8">
                        {discountAmount > 0 && (
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Subtotal</span>
                                <span className="text-sm font-bold text-slate-500 font-mono">{fmtPrice(originalTotal)}</span>
                            </div>
                        )}
                        {discountAmount > 0 && (
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block">Diskon ({specialDiscount})</span>
                                <span className="text-sm font-bold text-emerald-600 font-mono">-{fmtPrice(discountAmount)}</span>
                            </div>
                        )}
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total</span>
                            <span className="text-xl font-black text-red-600 font-mono">{fmtPrice(finalTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl pb-20">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    <span className="cursor-pointer hover:text-red-600 transition-colors" onClick={() => router.push("/admin/sales/quotations")}>Sales Quotations</span>
                    <span>/</span>
                    <span className="text-slate-600">Detail Penawaran</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push(
                                quotation.status === "OFFERED" || quotation.status === "COMPLETED"
                                    ? "/admin/orders"
                                    : "/admin/sales/quotations"
                            )}
                            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {(quotation.status === "OFFERED" || quotation.status === "COMPLETED") && quotation.accurateHsoNo
                                        ? quotation.accurateHsoNo
                                        : quotation.quotationNo}
                                </h1>
                                <Badge className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border-2 shadow-sm ${status.bg} ${status.color}`}>
                                    {status.label}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Dibuat {format(new Date(quotation.createdAt), "dd MMM yyyy, HH:mm")}
                                    {!isHsqApproved && quotation.processedAt && (
                                        <> • Diproses {format(new Date(quotation.processedAt), "dd MMM yyyy, HH:mm")}</>
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {/* SQ ref — only when still PENDING/RFQ stage */}
                                {quotation.status === "PENDING" && (
                                    <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                        <FileSearch className="w-3 h-3 text-slate-500" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">SQ: {quotation.quotationNo}</span>
                                    </div>
                                )}
                                {/* HSQ ref — hidden if OFFERED+ or as per requested to remove when finalized */}
                                {quotation.status === "PENDING" && quotation.accurateHsqNo && quotation.accurateHsqNo !== quotation.quotationNo && (
                                    <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                        <FileSearch className="w-3 h-3 text-slate-500" />
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Ref: {quotation.accurateHsqNo}</span>
                                    </div>
                                )}
                                {/* HDO ref — when exists */}
                                {quotation.accurateDoNo && (
                                    <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                                        <FileText className="w-3 h-3 text-green-500" />
                                        <span className="text-[10px] font-black text-green-700 uppercase tracking-tight">DO: {quotation.accurateDoNo}</span>
                                    </div>
                                )}
                                {/* PDF link */}
                                {quotation.adminQuotePdfPath && (
                                    <a
                                        href={quotation.adminQuotePdfPath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md border border-red-100 hover:bg-red-100 transition-colors group"
                                    >
                                        <FileText className="w-3 h-3 text-red-500" />
                                        <span className="text-[10px] font-black text-red-600 uppercase tracking-tight group-hover:underline">Buka PDF Resmi</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {(isHsqEditable && !fromOrders) && (
                            <Button
                                onClick={async () => {
                                    if (confirm("Apakah Anda yakin ingin menyetujui HSQ ini? Setelah disetujui, penawaran akan dikunci dan tidak dapat diedit lagi.")) {
                                        const res = await approveHsq(quotation.id);
                                        if (res.success) {
                                            toast.success("HSQ berhasil disetujui dan dikunci");
                                            window.location.reload();
                                        } else {
                                            toast.error(res.error || "Gagal menyetujui HSQ");
                                        }
                                    }
                                }}
                                className="h-10 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 group"
                            >
                                <CheckCircle className="w-4 h-4" />
                                HSQ Sudah Disetujui
                            </Button>
                        )}

                        {(isPending && !fromOrders) && (
                            <Dialog open={isProcessDialogOpen} onOpenChange={(open) => {
                                setIsProcessDialogOpen(open);
                                if (open && accurateDocs.length === 0) fetchAccurateDocs("", 1);
                            }}>
                                <DialogTrigger asChild>
                                    <Button
                                        className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider px-6 rounded-xl shadow-lg shadow-red-900/20"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Proses Penawaran
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                                    <div className="p-8 pb-4">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-900 uppercase">
                                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                                    <RefreshCw className="w-5 h-5 text-red-600" />
                                                </div>
                                                Proses Penawaran
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="flex items-center gap-2 mt-4 px-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">SQ: {quotation.quotationNo}</span>
                                        </div>
                                    </div>

                                    <div className="px-8 pb-8 pt-2 space-y-6">
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nomor Penawaran Disetujui (Accurate)</Label>
                                                <div className="relative group/search">
                                                    <FileSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-red-500 transition-colors pointer-events-none" />
                                                    <Input
                                                        placeholder="Cari nomor HSQ..."
                                                        className="pl-11 h-12 border-slate-100 focus-visible:ring-red-500 rounded-2xl font-bold bg-slate-50 hover:bg-slate-100/50 transition-colors text-slate-900"
                                                        value={officialNo}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setOfficialNo(val);
                                                            setAccurateId(null);
                                                            clearTimeout((window as any).__docSearchTimer);
                                                            (window as any).__docSearchTimer = setTimeout(() => {
                                                                setHsqPage(1);
                                                                fetchAccurateDocs(val, 1, false);
                                                            }, 400);
                                                        }}
                                                    />
                                                </div>

                                                {/* HSQ List */}
                                                <div className="h-64 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50/30 divide-y divide-slate-100/70">
                                                    {isFetchingDocs ? (
                                                        <div className="h-full flex flex-col items-center justify-center gap-2">
                                                            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat dari Accurate...</p>
                                                        </div>
                                                    ) : accurateDocs.length === 0 ? (
                                                        <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                                                            <FileSearch className="w-8 h-8" />
                                                            <p className="text-[10px] font-bold uppercase tracking-widest">Tidak ada data</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {accurateDocs.map(doc => (
                                                                <div
                                                                    key={doc.id}
                                                                    className={`p-3.5 cursor-pointer transition-all group/item ${officialNo === doc.no && accurateId === doc.id ? 'bg-red-50 border-l-4 border-red-500' : 'hover:bg-white hover:shadow-sm'}`}
                                                                    onClick={() => {
                                                                        setOfficialNo(doc.no);
                                                                        setAccurateId(doc.id);
                                                                    }}
                                                                >
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <span className={`text-xs font-black uppercase ${officialNo === doc.no && accurateId === doc.id ? 'text-red-600' : 'text-slate-900 group-hover/item:text-red-600'}`}>{doc.no}</span>
                                                                        <span className="text-[9px] font-bold text-slate-400">{doc.date}</span>
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-slate-500 truncate">{doc.customer?.name || "—"}</div>
                                                                </div>
                                                            ))}
                                                            {hsqHasMore && (
                                                                <div className="p-3 text-center">
                                                                    <button
                                                                        onClick={() => fetchAccurateDocs(officialNo, hsqPage + 1, true)}
                                                                        disabled={isLoadingMore}
                                                                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 disabled:text-slate-300 flex items-center gap-1.5 mx-auto"
                                                                    >
                                                                        {isLoadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                                        {isLoadingMore ? "Memuat..." : "Muat Lebih Banyak"}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Upload File PDF (Hasil Accurate)</Label>
                                                <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3 ${pdfFile ? 'border-green-200 bg-green-50/30' : 'border-slate-100 bg-slate-50/50 hover:border-red-200 group/upload'}`}>
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${pdfFile ? 'bg-green-100 text-green-600' : 'bg-white text-slate-400 shadow-sm group-hover/upload:scale-110'}`}>
                                                        {pdfFile ? <CheckCircle2 className="w-6 h-6" /> : <FileUp className="w-6 h-6" />}
                                                    </div>
                                                    <div className="text-center max-w-full px-4 text-slate-900 pointer-events-none">
                                                        <p className="text-xs font-black uppercase tracking-tight truncate max-w-[320px] mx-auto">
                                                            {pdfFile ? pdfFile.name : "Pilih File atau Drag & Drop"}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                                            {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : "PDF Maks 5MB"}
                                                        </p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full"
                                                        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleProcess}
                                            disabled={isProcessing || !officialNo || !pdfFile}
                                            className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-900/20 active:scale-95 transition-all text-sm"
                                        >
                                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                            Konfirmasi & Kirim Penawaran
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                        {(isHsqEditable && !fromOrders) && (
                            <Dialog open={isUpdateHsqDialogOpen} onOpenChange={(open) => {
                                setIsUpdateHsqDialogOpen(open);
                                if (open) {
                                    // Pre-fill dengan nomor HSQ yang sudah ada
                                    setUpdateHsqNo(quotation.accurateHsqNo || "");
                                    setUpdateAccurateId(quotation.accurateHsqId || null);
                                    setUpdatePdfFile(null);
                                    if (updateAccurateDocs.length === 0) fetchUpdateAccurateDocs("", 1);
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider px-6 rounded-xl shadow-lg shadow-blue-900/20"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Update Penawaran
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                                    <div className="p-8 pb-4">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-900 uppercase">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                    <RefreshCw className="w-5 h-5 text-blue-600" />
                                                </div>
                                                Update Penawaran HSQ
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="flex items-center gap-2 mt-4 px-1 flex-wrap">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">SQ: {quotation.quotationNo}</span>
                                            {quotation.accurateHsqNo && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">HSQ Saat Ini: {quotation.accurateHsqNo}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 px-1">Perubahan items dan diskon di halaman ini akan ikut tersimpan.</p>
                                    </div>

                                    <div className="px-8 pb-8 pt-2 space-y-6">
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nomor HSQ (Accurate)</Label>
                                                <div className="relative group/search">
                                                    <FileSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-blue-500 transition-colors pointer-events-none" />
                                                    <Input
                                                        placeholder="Cari atau ketik nomor HSQ..."
                                                        className="pl-11 h-12 border-slate-100 focus-visible:ring-blue-500 rounded-2xl font-bold bg-slate-50 hover:bg-slate-100/50 transition-colors text-slate-900"
                                                        value={updateHsqNo}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setUpdateHsqNo(val);
                                                            setUpdateAccurateId(null);
                                                            clearTimeout((window as any).__updateDocSearchTimer);
                                                            (window as any).__updateDocSearchTimer = setTimeout(() => {
                                                                setUpdateHsqPage(1);
                                                                fetchUpdateAccurateDocs(val, 1, false);
                                                            }, 400);
                                                        }}
                                                    />
                                                </div>

                                                {/* HSQ List */}
                                                <div className="h-52 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50/30 divide-y divide-slate-100/70">
                                                    {isFetchingUpdateDocs ? (
                                                        <div className="h-full flex flex-col items-center justify-center gap-2">
                                                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat dari Accurate...</p>
                                                        </div>
                                                    ) : updateAccurateDocs.length === 0 ? (
                                                        <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                                                            <FileSearch className="w-8 h-8" />
                                                            <p className="text-[10px] font-bold uppercase tracking-widest">Tidak ada data</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {updateAccurateDocs.map(doc => (
                                                                <div
                                                                    key={doc.id}
                                                                    className={`p-3.5 cursor-pointer transition-all group/item ${updateHsqNo === doc.no && updateAccurateId === doc.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-white hover:shadow-sm'}`}
                                                                    onClick={() => {
                                                                        setUpdateHsqNo(doc.no);
                                                                        setUpdateAccurateId(doc.id);
                                                                    }}
                                                                >
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <span className={`text-xs font-black uppercase ${updateHsqNo === doc.no && updateAccurateId === doc.id ? 'text-blue-600' : 'text-slate-900 group-hover/item:text-blue-600'}`}>{doc.no}</span>
                                                                        <span className="text-[9px] font-bold text-slate-400">{doc.date}</span>
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-slate-500 truncate">{doc.customer?.name || "—"}</div>
                                                                </div>
                                                            ))}
                                                            {updateHsqHasMore && (
                                                                <div className="p-3 text-center">
                                                                    <button
                                                                        onClick={() => fetchUpdateAccurateDocs(updateHsqNo, updateHsqPage + 1, true)}
                                                                        disabled={isLoadingMoreUpdate}
                                                                        className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700 disabled:text-slate-300 flex items-center gap-1.5 mx-auto"
                                                                    >
                                                                        {isLoadingMoreUpdate ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                                        {isLoadingMoreUpdate ? "Memuat..." : "Muat Lebih Banyak"}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                    Update File PDF Penawaran {quotation.adminQuotePdfPath ? "(Opsional — kosongkan jika tidak ingin mengganti)" : ""}
                                                </Label>
                                                {quotation.adminQuotePdfPath && !updatePdfFile && (
                                                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 mb-1">
                                                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                        <span className="text-xs font-bold text-slate-600 truncate flex-1">{quotation.adminQuotePdfPath.split("/").pop()}</span>
                                                        <a href={quotation.adminQuotePdfPath} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Buka</a>
                                                    </div>
                                                )}
                                                <div className={`relative border-2 border-dashed rounded-2xl p-5 transition-all flex flex-col items-center justify-center gap-3 ${updatePdfFile ? 'border-green-200 bg-green-50/30' : 'border-slate-100 bg-slate-50/50 hover:border-blue-200 group/upload'}`}>
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${updatePdfFile ? 'bg-green-100 text-green-600' : 'bg-white text-slate-400 shadow-sm group-hover/upload:scale-110'}`}>
                                                        {updatePdfFile ? <CheckCircle2 className="w-5 h-5" /> : <FileUp className="w-5 h-5" />}
                                                    </div>
                                                    <div className="text-center max-w-full px-4 text-slate-900 pointer-events-none">
                                                        <p className="text-xs font-black uppercase tracking-tight truncate max-w-[300px] mx-auto">
                                                            {updatePdfFile ? updatePdfFile.name : "Pilih File PDF Terbaru"}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                                            {updatePdfFile ? `${(updatePdfFile.size / 1024 / 1024).toFixed(2)} MB` : "PDF Maks 5MB"}
                                                        </p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full"
                                                        onChange={(e) => setUpdatePdfFile(e.target.files?.[0] || null)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleUpdateHsq}
                                            disabled={isUpdatingHsq || !updateHsqNo}
                                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-900/20 active:scale-95 transition-all text-sm"
                                        >
                                            {isUpdatingHsq ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                            Simpan Perubahan Penawaran
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            </div>

            {/* Banner Informasi Editability untuk HSQ */}
            {
                isHsqEditable && !fromOrders ? (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-[2rem] p-6 flex items-start gap-6 shadow-sm mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Mode Edit Penawaran Disetujui (HSQ)</h4>
                            <p className="text-xs font-bold text-blue-700/80 mt-1 leading-relaxed">
                                Penawaran ini sudah berstatus HSQ, namun Anda masih dapat mengubah produk, diskon, atau <span className="text-blue-600 underline decoration-blue-300 underline-offset-2 decoration-2">mengganti file PDF penawaran</span> jika terdapat revisi.
                                Klik tombol <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] uppercase mx-1 tracking-wider">Update Penawaran</span> untuk menyimpan perubahan item dan mengupload file PDF baru.
                                <br />
                                Jika sudah final, klik tombol <span className="text-emerald-600 font-bold uppercase mx-1">HSQ Sudah Disetujui</span> di bagian atas untuk mengunci penawaran ini.
                            </p>
                        </div>
                    </div>
                ) : (isHsqApproved && !fromOrders) && (
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] p-6 flex items-start gap-6 shadow-sm mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-emerald-900 uppercase tracking-tight">Penawaran (HSQ) Telah Disetujui</h4>
                            <p className="text-xs font-bold text-emerald-700/80 mt-1 leading-relaxed">
                                Penawaran ini telah disetujui dan dikunci oleh Admin. Item dan diskon sudah tidak dapat diubah lagi.
                                Anda dapat melanjutkan proses ke Pesanan (HSO) setelah customer mengunggah PO.
                            </p>
                        </div>
                    </div>
                )
            }

            {/* Activities summary etc. */}


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (Main Info) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Customer & Product List */}
                    <div className="flex flex-col gap-6">
                        {/* Customer Info Section - Compact & Streamlined */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-x-10 overflow-x-auto no-scrollbar">
                            {/* Identity */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 flex items-center justify-center text-red-600 shadow-inner">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                                            {quotation.customerCompany || quotation.customerName || "No Name"}
                                        </span>
                                        {quotation.customerCompany && (
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 opacity-80 whitespace-nowrap">
                                                PIC: {quotation.customerName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-10 w-px bg-slate-100 flex-shrink-0" />

                            {/* Email */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <a
                                        href={`mailto:${quotation.email}`}
                                        className="text-sm font-bold text-slate-700 hover:text-red-600 transition-colors block leading-none mb-1 whitespace-nowrap decoration-slate-300 hover:underline underline-offset-2"
                                    >
                                        {quotation.email}
                                    </a>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Email Address</span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-10 w-px bg-slate-100 flex-shrink-0" />

                            {/* Phone / WA */}
                            <div className="flex items-center gap-3 group/phone flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/phone:bg-green-50 group-hover/phone:text-green-600 transition-colors">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        {quotation.phone ? (
                                            <a
                                                href={`https://wa.me/${quotation.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-bold text-slate-700 hover:text-green-600 transition-colors block leading-none whitespace-nowrap decoration-slate-300 hover:underline underline-offset-2"
                                            >
                                                {quotation.phone}
                                            </a>
                                        ) : (
                                            <span className="text-sm font-bold text-slate-700 block leading-none whitespace-nowrap">-</span>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Contact Number</span>
                                </div>
                            </div>
                        </div>

                        {
                            quotation.notes && (
                                <>
                                    {/* Divider */}
                                    <div className="h-10 w-px bg-slate-100 hidden 2xl:block" />

                                    {/* Quick Note */}
                                    <div className="flex-1 min-w-[300px] bg-red-50/30 border border-red-100/50 p-3 rounded-2xl flex items-start gap-3 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-5">
                                            <MessageSquare className="w-8 h-8" />
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-red-100/50 flex items-center justify-center flex-shrink-0">
                                            <MessageSquare className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest block mb-0.5">Catatan Customer</span>
                                            <p className="text-[11px] font-bold text-red-900 leading-tight line-clamp-2">"{quotation.notes}"</p>
                                        </div>
                                    </div>
                                </>
                            )
                        }

                        {
                            quotation.specialDiscountRequest && (
                                <>
                                    <div className="h-10 w-px bg-slate-100 hidden 2xl:block" />
                                    <div className="flex-1 min-w-[320px] bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-start gap-4 relative overflow-hidden group shadow-sm">
                                        <div className="absolute top-0 right-0 p-3 opacity-10">
                                            <Tag className="w-12 h-12 text-amber-500" />
                                        </div>
                                        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <Tag className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div className="flex-1 z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Permintaan Diskon Khusus</span>
                                                    <Badge className="bg-amber-600 text-white text-[9px] font-black h-5 px-2 rounded-lg uppercase shadow-sm">Special Request</Badge>
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-amber-900 leading-relaxed mb-4 italic bg-white/50 p-3 rounded-2xl border border-amber-100/50">
                                                "{quotation.specialDiscountNote || "User meminta diskon tambahan tanpa catatan."}"
                                            </p>
                                            <div className="flex items-center gap-2 mt-auto">
                                                <Button
                                                    size="sm"
                                                    onClick={handleAcceptDiscountRequest}
                                                    disabled={isProcessingRequest}
                                                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-4 rounded-xl shadow-lg shadow-emerald-200"
                                                >
                                                    <Check className="w-3 h-3 mr-1.5" />
                                                    Terima & Atur Diskon
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setIsRejectionDialogOpen(true)}
                                                    disabled={isProcessingRequest}
                                                    className="h-8 border-amber-200 bg-white text-amber-600 hover:bg-amber-100 font-bold text-[10px] uppercase tracking-widest px-4 rounded-xl shadow-sm"
                                                >
                                                    <X className="w-3 h-3 mr-1.5" />
                                                    Tolak Permintaan
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )
                        }
                    </div>

                    {/* Product Items + Pricing Summary */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
                        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
                                <Package className="w-4 h-4 text-red-600" /> Daftar Produk Penawaran
                            </CardTitle>
                            <div className="flex items-center gap-3">
                                {!fromOrders && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-xl border-dashed border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-black text-[10px] uppercase px-3 shadow-none transition-all"
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setSearchResults([]);
                                                    setStockFilter("all");
                                                    setSelectedCategory("All");
                                                    searchAltProducts("", "All", "Produk Baru", "all");
                                                }}
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Produk
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="w-[90vw] max-w-[1400px] min-w-[320px] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
                                            <div className="bg-white px-8 py-6 relative border-b border-slate-100">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 text-center">Tambah Produk Baru</DialogTitle>
                                                </DialogHeader>
                                            </div>
                                            <div className="flex flex-col flex-1 overflow-hidden bg-white">
                                                <div className="px-8 pt-6 pb-4 border-b border-slate-100">
                                                    <div className="relative">
                                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                        <Input
                                                            placeholder="Cari produk untuk ditambahkan..."
                                                            className="pl-14 h-14 text-sm font-bold border-slate-200 focus-visible:ring-red-500 rounded-2xl shadow-sm bg-slate-50/50"
                                                            value={searchQuery}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setSearchQuery(val);
                                                                clearTimeout((window as any).__newSearchTimer);
                                                                (window as any).__newSearchTimer = setTimeout(() => {
                                                                    searchAltProducts(val, selectedCategory, "Produk Baru", stockFilter);
                                                                }, 300);
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                                        {/* Category Selector */}
                                                        <div className="space-y-1.5 transition-all">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kategori Produk</Label>
                                                            <Select
                                                                value={selectedCategory}
                                                                onValueChange={(val) => {
                                                                    setSelectedCategory(val);
                                                                    setCurrentPage(1);
                                                                    searchAltProducts(searchQuery, val, "Produk Baru", stockFilter, 1);
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm focus:ring-red-500">
                                                                    <SelectValue placeholder="Pilih Kategori" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-2xl border-slate-200 shadow-xl max-h-[300px]">
                                                                    <SelectItem value="All" className="font-bold">Semua Kategori</SelectItem>
                                                                    {categories.map((cat) => (
                                                                        <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Stock Filter Selector */}
                                                        <div className="space-y-1.5 transition-all">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status Stok</Label>
                                                            <Select
                                                                value={stockFilter}
                                                                onValueChange={(val) => {
                                                                    setStockFilter(val);
                                                                    setCurrentPage(1);
                                                                    searchAltProducts(searchQuery, selectedCategory, "Produk Baru", val, 1);
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm focus:ring-red-500">
                                                                    <SelectValue placeholder="Pilih Status Stok" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-2xl border-slate-200 shadow-xl">
                                                                    <SelectItem value="all" className="font-bold">Semua Status</SelectItem>
                                                                    <SelectItem value="ready" className="font-bold text-green-600">Stock Ready</SelectItem>
                                                                    <SelectItem value="indent" className="font-bold text-orange-600">Indent / Pre-order</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Info Result */}
                                                        <div className="flex flex-col justify-end items-end pb-1 px-1">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Total Hasil</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xl font-black text-slate-900">{totalCount}</span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produk</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-8">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                        {searchResults.map((res: any) => (
                                                            <div key={res.sku} className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-red-200 hover:bg-red-50/20 transition-all group/res overflow-hidden relative">
                                                                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover/res:scale-105 transition-all">
                                                                    {res.image ? <img src={res.image} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-200" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-[11px] font-black text-slate-800 line-clamp-2 leading-tight uppercase tracking-tight">{res.name}</h4>
                                                                    <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{res.sku}</div>
                                                                    {(() => {
                                                                        const pInfo = pricingData ? calculatePriceInfo(
                                                                            res.price,
                                                                            res.category,
                                                                            pricingData.customer,
                                                                            pricingData.categoryMappings,
                                                                            res.availableToSell || 0,
                                                                            pricingData.discountRules
                                                                        ) : null;

                                                                        if (pInfo?.hasDiscount) {
                                                                            return (
                                                                                <div className="mt-1 space-y-0.5">
                                                                                    <div className="flex items-center gap-1.5 opacity-60">
                                                                                        <span className="text-[8px] font-bold text-slate-400 line-through">
                                                                                            <span>Rp</span> {fmtPrice(res.price)}
                                                                                        </span>
                                                                                        <span className="text-[8px] font-black text-red-600 bg-red-50 px-1 rounded uppercase tracking-tighter">-{pInfo.discountStr}%</span>
                                                                                    </div>
                                                                                    <div className="text-sm font-black text-red-600 tracking-tight">
                                                                                        <span className="text-[10px] font-bold mr-0.5">Rp</span>{fmtPrice(pInfo.discountedPrice)}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <div className="text-sm font-black text-red-600 mt-1 tracking-tight">
                                                                                <span className="text-[10px] font-bold mr-0.5">Rp</span>{fmtPrice(res.price)}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    className="rounded-xl font-black text-[9px] uppercase bg-white border-2 border-slate-200 text-slate-900 hover:bg-red-600 hover:text-white hover:border-red-600 h-8 px-2.5 transition-all flex-shrink-0 active:scale-95"
                                                                    onClick={() => addNewItemToQuotation(res)}
                                                                >
                                                                    Tambah
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Pagination Controls */}
                                                    {totalPages > 1 && (
                                                        <div className="flex items-center justify-center gap-2 mt-10 mb-6 bg-white py-4 sticky bottom-0 border-t border-slate-100">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                disabled={currentPage === 1 || isSearching}
                                                                className="rounded-xl h-10 w-10 border-slate-200"
                                                                onClick={() => {
                                                                    const next = currentPage - 1;
                                                                    setCurrentPage(next);
                                                                    searchAltProducts(searchQuery, selectedCategory, "Produk Baru", stockFilter, next);
                                                                }}
                                                            >
                                                                <ChevronLeft className="w-4 h-4" />
                                                            </Button>
                                                            <div className="flex items-center gap-1.5 mx-2">
                                                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Halaman</span>
                                                                <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">{currentPage}</span>
                                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">dari {totalPages}</span>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                disabled={currentPage === totalPages || isSearching}
                                                                className="rounded-xl h-10 w-10 border-slate-200"
                                                                onClick={() => {
                                                                    const next = currentPage + 1;
                                                                    setCurrentPage(next);
                                                                    searchAltProducts(searchQuery, selectedCategory, "Produk Baru", stockFilter, next);
                                                                }}
                                                            >
                                                                <ChevronRight className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {searchResults.length === 0 && !isSearching && (
                                                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                                            <Search className="w-12 h-12 mb-4" />
                                                            <p className="text-sm font-black uppercase tracking-widest text-center">Produk tidak ditemukan.<br />Coba ganti kata kunci atau kategori.</p>
                                                        </div>
                                                    )}
                                                    {isSearching && (
                                                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                                            <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
                                                            <p className="text-sm font-black uppercase tracking-widest">Memuat produk...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                                <span className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-slate-400 border border-slate-100 shadow-sm uppercase tracking-[0.2em]">
                                    {items.length} Item
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {items.map((item, idx) => {
                                    const stockSufficient = item.currentStock >= item.quantity;
                                    const discountDisplay = item.discountStr ?
                                        (item.discountStr.includes('%') ? item.discountStr : `${item.discountStr}%`) :
                                        (item.discountPercent && item.discountPercent > 0 ? `${Math.round(item.discountPercent)}%` : null);

                                    return (
                                        <div key={item.id} className="group transition-all">
                                            {/* Main Item Section */}
                                            <div className="p-5 px-6 hover:bg-slate-50/40 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    {/* Product Image */}
                                                    <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden hover:shadow-md transition-all flex-shrink-0">
                                                        {item.image ? (
                                                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-8 h-8 text-slate-300" />
                                                        )}
                                                    </div>

                                                    {/* Product Details */}
                                                    <div className="flex-1 min-w-0">
                                                        {/* Row 1: Product Info - compact */}
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                                                            <div className="space-y-1.5">
                                                                <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                                                                    {item.productName}
                                                                </h3>
                                                                <div className="flex items-center gap-3 flex-wrap">
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                                        {item.productSku}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 text-[10px] font-bold">
                                                                        <span className={stockSufficient ? "text-green-600" : "text-red-500 uppercase"}>
                                                                            {stockSufficient ? "Ready Stock" : "Indent"}
                                                                        </span>
                                                                        <span className="text-slate-300">•</span>
                                                                        <span className="text-slate-600 font-black">{item.quantity} Unit</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Pricing & Subtotal - inline */}
                                                            <div className="flex items-center gap-4 md:gap-6 flex-wrap md:flex-nowrap">
                                                                <div className="flex flex-col items-start md:items-end gap-0.5">
                                                                    {discountDisplay && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-[9px] font-bold text-slate-400 line-through opacity-70">
                                                                                <span className="text-[7px]">Rp</span> {fmtPrice(item.basePrice || item.price)}
                                                                            </span>
                                                                            <Badge className="bg-red-500 hover:bg-red-500 text-[9px] h-4 px-1.5 font-black rounded-md border-none shadow-sm">
                                                                                {discountDisplay}
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-baseline gap-0.5">
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">@</span>
                                                                        <span className="text-base font-black text-slate-900 tracking-tight">
                                                                            <span className="text-xs font-bold mr-0.5">Rp</span>{fmtPrice(item.price)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right md:block">
                                                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-70">Subtotal</div>
                                                                    <div className="text-base font-black text-red-600 tracking-tight">
                                                                        <span className="text-xs font-bold mr-0.5">Rp</span>{fmtPrice(item.price * item.quantity)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Status & Options row */}
                                                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100/50">


                                                            {/* Admin Note Section */}
                                                            <div className="flex-1 min-w-[200px]">
                                                                {isEditable && !fromOrders ? (
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Keterangan:</span>
                                                                        <div className="flex-1 relative group/input">
                                                                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within/input:text-red-500 transition-colors pointer-events-none" />
                                                                            <Input
                                                                                value={item.adminNote}
                                                                                onChange={(e) => updateItem(item.id, { adminNote: e.target.value })}
                                                                                placeholder="Catatan untuk item ini..."
                                                                                className="pl-9 h-9 text-xs font-bold border-slate-200 focus-visible:ring-red-500 bg-slate-50/30 rounded-lg shadow-none"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ) : item.adminNote && (
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Keterangan:</span>
                                                                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 h-9 flex items-center gap-2 flex-1">
                                                                            <MessageSquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                                            <p className="text-[10px] font-bold text-slate-600 italic line-clamp-1">"{item.adminNote}"</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Alternative Products Trigger - shown for all items when admin can edit */}
                                                            {(isAdminEditable && !fromOrders) && (
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="rounded-lg border-dashed border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-red-300 hover:text-red-600 font-black text-[9px] uppercase h-9 px-3 transition-all whitespace-nowrap"
                                                                            onClick={() => {
                                                                                setActiveItemForAlt(item.id);
                                                                                setSearchQuery("");
                                                                                setSearchResults([]);
                                                                                setStockFilter("all");
                                                                                searchAltProducts("", item.category, item.productName, "all"); // Auto-load on open
                                                                            }}
                                                                        >
                                                                            <Plus className="w-3 h-3 mr-1" /> Alternatif
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="w-[90vw] max-w-[1400px] min-w-[320px] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
                                                                        {/* Header */}
                                                                        <div className="bg-white px-8 py-6 overflow-hidden relative flex-shrink-0 border-b border-slate-100">
                                                                            <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none text-red-600">
                                                                                <Package className="w-48 h-48" />
                                                                            </div>
                                                                            <DialogHeader>
                                                                                <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Produk Alternatif</DialogTitle>
                                                                                <p className="text-red-600 text-[11px] font-bold uppercase tracking-widest mt-2 bg-red-50 px-4 py-1.5 rounded-full inline-block border border-red-200">
                                                                                    Untuk: {item.productName}
                                                                                </p>
                                                                            </DialogHeader>
                                                                        </div>
                                                                        {/* Body */}
                                                                        <div className="flex flex-col flex-1 overflow-hidden bg-white">
                                                                            {/* Search bar */}
                                                                            <div className="px-8 pt-6 pb-4 border-b border-slate-100">
                                                                                <div className="relative group/search">
                                                                                    {isSearching
                                                                                        ? <Loader2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500 animate-spin" />
                                                                                        : <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/search:text-red-500 transition-colors" />
                                                                                    }
                                                                                    <Input
                                                                                        placeholder="Cari SKU atau nama produk..."
                                                                                        className="pl-14 h-14 text-sm font-bold border-slate-200 focus-visible:ring-red-500 rounded-2xl shadow-sm bg-slate-50/50"
                                                                                        value={searchQuery}
                                                                                        onChange={(e) => {
                                                                                            const val = e.target.value;
                                                                                            setSearchQuery(val);
                                                                                            // Debounced auto-search
                                                                                            clearTimeout((window as any).__altSearchTimer);
                                                                                            (window as any).__altSearchTimer = setTimeout(() => {
                                                                                                searchAltProducts(val, item.category, item.productName, stockFilter);
                                                                                            }, 300);
                                                                                        }}
                                                                                        onKeyDown={(e) => e.key === "Enter" && searchAltProducts(searchQuery, item.category, item.productName, stockFilter)}
                                                                                        autoFocus
                                                                                    />
                                                                                </div>
                                                                                <div className="flex items-center justify-between mt-3 px-1">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                                            Kategori: {item.category || "Semua"}
                                                                                        </span>
                                                                                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                                                                            {["all", "ready", "indent"].map((s) => (
                                                                                                <button
                                                                                                    key={s}
                                                                                                    onClick={() => {
                                                                                                        setStockFilter(s);
                                                                                                        searchAltProducts(searchQuery, item.category, item.productName, s);
                                                                                                    }}
                                                                                                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all whitespace-nowrap ${stockFilter === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                                                                                                >
                                                                                                    {s === "all" ? "Semua Status" : s === "ready" ? "Stock Ready" : "Indent"}
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    <span className="text-[10px] font-bold text-slate-400">
                                                                                        {searchResults.length} produk ditemukan
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            {/* Results grid */}
                                                                            <div className="flex-1 overflow-y-auto p-8">
                                                                                {isSearching && searchResults.length === 0 ? (
                                                                                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                                                                        <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                                                                        <p className="text-sm font-black uppercase tracking-widest">Memuat produk...</p>
                                                                                    </div>
                                                                                ) : searchResults.length === 0 ? (
                                                                                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                                                                        <Search className="w-12 h-12 mb-4" />
                                                                                        <p className="text-sm font-black uppercase tracking-widest">Produk tidak ditemukan</p>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                                                                                        {searchResults.map((res: any) => {
                                                                                            const alreadyAdded = item.alternatives.some(a => a.productSku === res.sku);
                                                                                            return (
                                                                                                <div key={res.sku} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all group/res ${alreadyAdded
                                                                                                    ? "bg-green-50 border-green-200"
                                                                                                    : "bg-slate-50 border-slate-100 hover:border-red-200 hover:bg-red-50/20 cursor-pointer"
                                                                                                    }`}>
                                                                                                    {/* Image */}
                                                                                                    <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0 group-hover/res:scale-105 transition-all">
                                                                                                        {res.image ? <img src={res.image} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-slate-200" />}
                                                                                                    </div>
                                                                                                    {/* Info */}
                                                                                                    <div className="flex-1 min-w-0">
                                                                                                        <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug group-hover/res:text-red-700 transition-colors">{res.name}</h4>
                                                                                                        <div className="flex items-center gap-2 mt-1">
                                                                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{res.sku}</span>
                                                                                                            {res.availableToSell > 0
                                                                                                                ? <span className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">Ready</span>
                                                                                                                : <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">Indent</span>
                                                                                                            }
                                                                                                        </div>
                                                                                                        <div className="text-sm font-black text-red-600 mt-1">Rp {fmtPrice(res.price)}</div>
                                                                                                    </div>
                                                                                                    {/* Action */}
                                                                                                    {alreadyAdded ? (
                                                                                                        <span className="text-[9px] font-black text-green-600 uppercase tracking-widest flex-shrink-0">✓ Dipilih</span>
                                                                                                    ) : (
                                                                                                        <Button
                                                                                                            size="sm"
                                                                                                            className="rounded-xl font-black text-[10px] uppercase bg-white border-2 border-slate-200 text-slate-900 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all px-4 h-9 flex-shrink-0"
                                                                                                            onClick={() => addAlternative(item.id, res)}
                                                                                                        >
                                                                                                            Pilih
                                                                                                        </Button>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}
                                                            {(isAdminEditable && !fromOrders) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeItem(item.id)}
                                                                    className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Selected Alternatives List */}
                                            {item.alternatives.length > 0 && (
                                                <div className="mt-0 space-y-1.5 px-6 pb-4 border-t border-slate-100">
                                                    <div className="flex items-center gap-2 py-2">
                                                        <Badge className="bg-slate-700 text-[8px] font-black tracking-[0.15em] px-2 py-0.5 rounded-md uppercase">
                                                            {item.alternatives.length} Alternatif Ditawarkan
                                                        </Badge>
                                                    </div>
                                                    {item.alternatives.map((alt) => (
                                                        <div key={alt.productSku} className="flex flex-col gap-2 bg-white border border-slate-200 p-3 rounded-2xl hover:border-slate-300 transition-all group/alt shadow-sm">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                                        {alt.image ? <img src={alt.image} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-300" />}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="text-[11px] font-black text-slate-900 tracking-tight leading-tight line-clamp-1">{alt.productName}</div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{alt.productSku}</span>
                                                                            {alt.availableToSell !== undefined && (
                                                                                <span className={`text-[8px] font-black px-1 rounded-sm ${alt.availableToSell > 0 ? "text-green-600 bg-green-50" : "text-orange-500 bg-orange-50"}`}>
                                                                                    {alt.availableToSell > 0 ? "Ready" : "Indent"}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                                    <div className="text-xs font-black text-red-600 tracking-tight">Rp {fmtPrice(alt.price)}</div>
                                                                    {(isAdminEditable && !fromOrders) && (
                                                                        <div className="flex items-center gap-1">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 px-2 rounded-lg text-[9px] font-black uppercase text-red-600 hover:bg-red-50 transition-all flex-shrink-0 border border-transparent hover:border-red-100"
                                                                                onClick={() => replaceWithAlternative(item.id, alt)}
                                                                            >
                                                                                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Ganti Langsung
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 px-2 rounded-lg text-[9px] font-black uppercase text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0"
                                                                                onClick={() => removeAlternative(item.id, alt.productSku)}
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Batal
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Alternative Note */}
                                                            <div className="flex items-center gap-2 pl-1 mt-0.5">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">Keterangan:</span>
                                                                {(isAdminEditable && !fromOrders) ? (
                                                                    <div className="flex-1 relative group/altnote">
                                                                        <MessageSquare className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 group-focus-within/altnote:text-red-400 transition-colors pointer-events-none" />
                                                                        <input
                                                                            type="text"
                                                                            value={alt.note || ""}
                                                                            onChange={(e) => updateAlternative(item.id, alt.productSku, { note: e.target.value })}
                                                                            placeholder="Catatan untuk produk alternatif ini..."
                                                                            className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-7 pr-3 py-1 text-[10px] font-bold text-slate-600 placeholder:text-slate-300 focus:outline-none focus:border-red-200 focus:bg-white transition-all"
                                                                        />
                                                                    </div>
                                                                ) : alt.note && (
                                                                    <div className="flex-1 flex items-center gap-2 px-2 py-1 bg-slate-50/50 rounded-lg">
                                                                        <MessageSquare className="w-2.5 h-2.5 text-slate-300" />
                                                                        <p className="text-[10px] font-bold text-slate-600 italic">"{alt.note}"</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}


                            </div>



                            {/* Pricing Summary */}
                            <div className="border-t border-slate-100 bg-white rounded-b-[2rem]">
                                <div className="px-6 py-6 space-y-6">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">SUBTOTAL</span>
                                        <span className="text-sm font-black text-slate-900">
                                            <span className="text-xs font-bold mr-0.5">Rp</span>{fmtPrice(originalTotal)}
                                        </span>
                                    </div>

                                    {(isAdminEditable && !fromOrders) && (
                                        <div id="discount-box" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-20">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Diskon SQ (%)</Label>
                                                <span className="text-[9px] font-bold text-slate-400">Gunakan &quot;+&quot; untuk diskon bertahap (Mis: 10+5)</span>
                                            </div>
                                            <div className="relative group/disc">
                                                <BadgePercent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/disc:text-red-600 transition-colors pointer-events-none" />
                                                <Input
                                                    type="text"
                                                    value={specialDiscount}
                                                    onChange={(e) => setSpecialDiscount(e.target.value)}
                                                    placeholder="0 (Contoh: 10 atau 10+5)"
                                                    className="pl-10 bg-slate-50 border-slate-200 text-slate-900 font-black rounded-xl focus:ring-red-500 h-10 text-sm transition-all w-full shadow-inner"
                                                />
                                            </div>
                                            {effectiveTotalPercent > 0 && (
                                                <div className="flex justify-between items-center p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Potongan Terhitung</span>
                                                        <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter">
                                                            {specialDiscount.includes('+')
                                                                ? `${specialDiscount} → Eff: ${effectiveTotalPercent.toFixed(2)}%`
                                                                : `${effectiveTotalPercent}%`
                                                            }
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-black text-red-600">
                                                        <span className="text-xs font-bold mr-0.5">- Rp</span>{fmtPrice(discountAmount)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col items-end justify-end pt-4 border-t-2 border-slate-900/5">
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Net Penawaran (Inc. PPN)</div>
                                        <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1.5 animate-in fade-in slide-in-from-right-1">
                                            <span className="text-sm text-red-600">Rp</span>
                                            <span>{fmtPrice(finalTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quotation Global Notes (Internal) - Always shown when editable or if fromOrders is true */}
                    {(isEditable || fromOrders) && (
                        <div className={fromOrders ? "" : "pt-0"}>
                            <Card className="border border-slate-100 shadow-sm bg-slate-50/30 overflow-hidden rounded-[2rem]">
                                <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 shadow-sm">
                                            <FileText className="w-3.5 h-3.5 text-red-600" />
                                        </div>
                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">
                                            Catatan Global Penawaran (Internal)
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-4">
                                        <Textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Tambahkan catatan khusus untuk tim..."
                                            className="min-h-[100px] text-xs font-bold border-slate-200 focus-visible:ring-red-500 rounded-2xl bg-white border-none shadow-inner"
                                        />
                                        {fromOrders && (
                                            <div className="flex justify-end pt-2">
                                                <Button
                                                    onClick={() => triggerSaveDraft()}
                                                    disabled={isSaving}
                                                    className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest px-6 rounded-xl shadow-lg shadow-red-200"
                                                >
                                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                                                    Simpan Catatan Internal
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>


                {/* Right Column (Sidebar) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* ── HPO Customer Card: muncul jika ada dokumen HPO dari customer ── */}
                    {
                        quotation.userPoPath && (
                            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
                                <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4 px-6">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
                                        <FileUp className="w-3.5 h-3.5 text-red-600" /> HPO Customer
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                                        <FileText className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-violet-900">Purchase Order Customer</p>
                                            {quotation.poNotes && (
                                                <p className="text-[10px] text-violet-600 mt-0.5 font-medium">{quotation.poNotes}</p>
                                            )}
                                        </div>
                                    </div>
                                    <a
                                        href={quotation.userPoPath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Unduh Dokumen HPO
                                    </a>
                                </CardContent>
                            </Card>
                        )
                    }

                    {/* ── HSO Card: muncul saat status PROCESSING, SHIPPED, atau COMPLETED ── */}
                    {
                        ["PROCESSING", "SHIPPED", "COMPLETED"].includes(quotation.status) && (
                            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
                                <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4 px-6">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
                                        <FileText className="w-3.5 h-3.5 text-red-600" /> Sales Order (HSO)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    {/* HSO Number */}
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">No. HSO Accurate</span>
                                        <span className="font-mono font-bold text-blue-900 text-sm">{quotation.accurateHsoNo ?? "—"}</span>
                                    </div>

                                    {/* Upload file SO */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                            Dokumen SO (PDF)
                                        </label>
                                        {quotation.adminSoPdfPath ? (
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                    <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">
                                                        {quotation.adminSoPdfPath.split("/").pop()}
                                                    </span>
                                                </div>
                                                <a href={quotation.adminSoPdfPath} target="_blank" rel="noopener noreferrer"
                                                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest">
                                                    Buka
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 text-center p-4 border-2 border-dashed border-slate-200 rounded-xl">
                                                Belum ada file SO
                                            </div>
                                        )}
                                        <label className="flex items-center gap-2 cursor-pointer w-full">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const fd = new FormData();
                                                    fd.append("file", file);
                                                    const sanitized = (quotation.accurateHsoNo ?? quotation.quotationNo).replace(/\//g, "-");
                                                    const now = new Date();
                                                    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
                                                    fd.append("filename", `${sanitized}-SO-${stamp}.pdf`);
                                                    const res = await uploadFile(fd, true, "files");
                                                    if (res.success && res.url) {
                                                        await fetch("/api/quotation/update-field", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ id: quotation.id, field: "adminSoPdfPath", value: res.url }),
                                                        });
                                                        toast.success("File SO berhasil diunggah");
                                                        loadData();
                                                    }
                                                }}
                                            />
                                            <span className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">
                                                <FileUp className="w-3.5 h-3.5" />
                                                {quotation.adminSoPdfPath ? "Ganti File SO" : "Upload File SO"}
                                            </span>
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    }

                    {/* ── HDO Card: muncul saat status SHIPPED atau lebih ── */}
                    {
                        ["SHIPPED", "COMPLETED"].includes(quotation.status) && (
                            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
                                <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4 px-6">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
                                        <PackageCheck className="w-3.5 h-3.5 text-red-600" /> Pengiriman & Penagihan (HDO/HINV)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-5">
                                    {/* HDO Number */}
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-green-600">No. HDO Accurate</span>
                                        <span className="font-mono font-bold text-green-900 text-sm">{quotation.accurateDoNo ?? "—"}</span>
                                    </div>

                                    {/* Surat Jalan */}
                                    {(["adminDoPdfPath", "adminInvoicePdfPath", "taxInvoiceUrl"] as const).map((field) => {
                                        const labels: Record<string, string> = {
                                            adminDoPdfPath: "Surat Jalan",
                                            adminInvoicePdfPath: "Invoice / Faktur Penjualan",
                                            taxInvoiceUrl: "Faktur Pajak",
                                        };
                                        const fileUrl = quotation[field];
                                        return (
                                            <div key={field} className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                    {labels[field]}
                                                </label>
                                                {fileUrl ? (
                                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[130px]">
                                                                {fileUrl.split("/").pop()}
                                                            </span>
                                                        </div>
                                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                                            className="text-[10px] font-black text-green-600 hover:text-green-800 uppercase tracking-widest">
                                                            Buka
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-400 text-center p-3 border-2 border-dashed border-slate-200 rounded-xl">
                                                        Belum ada file
                                                    </div>
                                                )}
                                                <label className="flex items-center gap-2 cursor-pointer w-full">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            const fd = new FormData();
                                                            fd.append("file", file);
                                                            const tag = field === "adminDoPdfPath" ? "DO" : field === "adminInvoicePdfPath" ? "INV" : "TAX";
                                                            const sanitized = (quotation.accurateDoNo ?? quotation.quotationNo).replace(/\//g, "-");
                                                            const now = new Date();
                                                            const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
                                                            fd.append("filename", `${sanitized}-${tag}-${stamp}.pdf`);
                                                            const res = await uploadFile(fd, true, "files");
                                                            if (res.success && res.url) {
                                                                await fetch("/api/quotation/update-field", {
                                                                    method: "POST",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({ id: quotation.id, field, value: res.url }),
                                                                });
                                                                toast.success(`${labels[field]} berhasil diunggah`);
                                                                loadData();
                                                            }
                                                        }}
                                                    />
                                                    <span className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-700 transition-colors cursor-pointer">
                                                        <FileUp className="w-3.5 h-3.5" />
                                                        {fileUrl ? `Ganti ${labels[field]}` : `Upload ${labels[field]}`}
                                                    </span>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )
                    }



                    {/* Activity Log Card */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem] sticky top-6">
                        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4 px-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
                                <History className="w-3.5 h-3.5 text-red-600" /> Log Aktivitas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[calc(100vh-500px)] min-h-[300px]">
                                <div className="space-y-6 pl-2">
                                    {(quotation.activities || []).map((activity: any, idx: number) => (
                                        <div key={activity.id || idx} className="relative pl-6 pb-2">
                                            {idx !== (quotation.activities?.length || 0) - 1 && (
                                                <div className="absolute left-[7px] top-6 bottom-[-24px] w-[2px] bg-slate-100" />
                                            )}
                                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-2 ring-slate-100 bg-slate-300 z-10" />
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">{activity.title}</span>
                                                    <span className="text-[9px] font-bold text-slate-400">{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: localeId })}</span>
                                                </div>
                                                <div className="text-xs font-bold text-slate-700 leading-relaxed">
                                                    {activity.description.split(/(\[.*?\]\(.*?\))/g).map((part: string, i: number) => {
                                                        const match = part.match(/\[(.*?)\]\((.*?)\)/);
                                                        if (match) {
                                                            return (
                                                                <a
                                                                    key={i}
                                                                    href={match[2]}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    download
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100 ml-1 font-black uppercase text-[9px] tracking-widest mt-1"
                                                                >
                                                                    <FileText className="w-3 h-3" />
                                                                    {match[1]}
                                                                </a>
                                                            );
                                                        }
                                                        return <span key={i}>{part}</span>;
                                                    })}
                                                </div>
                                                <div className="flex flex-col gap-1.5 mt-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
                                                            <User className="w-2.5 h-2.5 text-slate-400" />
                                                        </div>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            Oleh: {
                                                                !activity.performedBy ? "System" :
                                                                    activity.performedBy.toUpperCase() === "USER" ?
                                                                        (quotation.customerCompany || quotation.customerName || "User") :
                                                                        activity.performedBy
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(quotation.activities || []).length === 0 && (
                                        <div className="text-center py-10">
                                            <Clock className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada aktivitas tercatat</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>


                </div>

                {/* Modal Penolakan Diskon */}
                <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
                    <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white animate-in zoom-in-95 duration-300">
                        <div className="p-8 pb-4">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-900 uppercase">
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                        <XCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    Tolak Permintaan Diskon
                                </DialogTitle>
                                <DialogDescription className="text-xs font-bold text-slate-400 mt-2">
                                    Masukkan alasan penolakan untuk diinformasikan kepada customer melalui history transaksi.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="px-8 pb-8 pt-2 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Alasan Penolakan</Label>
                                <textarea
                                    placeholder="Masukkan alasan penolakan..."
                                    className="w-full h-32 p-4 text-sm font-bold border-2 border-slate-100 focus:border-red-500 rounded-2xl bg-slate-50 transition-all outline-none resize-none"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12 rounded-2xl border-slate-200 font-black text-xs uppercase tracking-wider"
                                    onClick={() => setIsRejectionDialogOpen(false)}
                                    disabled={isProcessingRequest}
                                >
                                    Batal
                                </Button>
                                <Button
                                    className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-red-900/20 active:scale-95 transition-all"
                                    onClick={handleRejectDiscountRequest}
                                    disabled={isProcessingRequest || !rejectionReason.trim()}
                                >
                                    {isProcessingRequest ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    Kirim Penolakan
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    );
}
