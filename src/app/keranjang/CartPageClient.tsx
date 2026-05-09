"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, Trash2, Loader2, Clock, Check, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/useCart";
import Image from "next/image";
import Link from "next/link";
import GuestCheckoutModal from "@/components/public/GuestCheckoutModal";
import { saveQuotationToDb } from "@/app/actions/cart";
import { useAuth } from "@/components/auth/CanAccess";
import { useToast, ToastManager } from "@/components/ui/toast";
import { usePricing } from "@/lib/PricingContext";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CartPageClient() {
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const { items: cartItems, updateQuantity, removeItem, totalItems, clearCart } = useCart();
    const { getPriceInfo } = usePricing();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const { toasts, removeToast, toast } = useToast();

    // Estimate Modal State
    const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
    const [estimateName, setEstimateName] = useState("");

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID").format(Math.round(price));
    };

    const handleQuotationSuccess = () => {
        toast.success("Permintaan terkirim! Silakan login jika ingin melihat riwayat transaksi ini.");
    };

    // Calculate dynamic pricing and split conditions for each item in the cart
    const calculatedItems = cartItems.map(item => {
        const basePrice = item.basePrice || item.price;
        const category = item.category || null;

        // Calculate specific ready and indent prices using context
        const readyPriceInfo = getPriceInfo(basePrice, category, 1);
        const indentPriceInfo = getPriceInfo(basePrice, category, 0);

        // A split happens if it's a general product (no explicit split stockStatus like READY/INDENT from detail page)
        // and its cart quantity is strictly greater than available ready stock, and there is ready stock available (> 0)
        const isSplit = !item.stockStatus && item.availableToSell > 0 && item.quantity > item.availableToSell;

        let displayPrice = item.price;
        let displayOriginalPrice = item.originalPrice;
        let displayDiscountStr = item.discountStr;
        let displayIsCustomerDiscount = item.isCustomerDiscount;
        let itemSubtotal = item.price * item.quantity;

        // Ready and Indent portions for calculation
        const readyQty = isSplit ? item.availableToSell : (item.stockStatus === 'INDENT' ? 0 : item.quantity);
        const indentQty = isSplit ? (item.quantity - item.availableToSell) : (item.stockStatus === 'INDENT' ? item.quantity : 0);

        if (item.stockStatus === 'READY') {
            displayPrice = readyPriceInfo.discountedPriceWithPPN;
            displayOriginalPrice = readyPriceInfo.originalPriceWithPPN;
            displayDiscountStr = readyPriceInfo.discountStr;
            displayIsCustomerDiscount = readyPriceInfo.isCustomerDiscount;
            itemSubtotal = displayPrice * item.quantity;
        } else if (item.stockStatus === 'INDENT') {
            displayPrice = indentPriceInfo.discountedPriceWithPPN;
            displayOriginalPrice = indentPriceInfo.originalPriceWithPPN;
            displayDiscountStr = indentPriceInfo.discountStr;
            displayIsCustomerDiscount = indentPriceInfo.isCustomerDiscount;
            itemSubtotal = displayPrice * item.quantity;
        } else if (isSplit) {
            const readySubtotal = readyPriceInfo.discountedPriceWithPPN * readyQty;
            const indentSubtotal = indentPriceInfo.discountedPriceWithPPN * indentQty;
            itemSubtotal = readySubtotal + indentSubtotal;
            displayPrice = readyPriceInfo.discountedPriceWithPPN; // fallback/primary
        } else {
            // Unsplit general item
            const isReady = item.availableToSell > 0;
            const pInfo = isReady ? readyPriceInfo : indentPriceInfo;
            displayPrice = pInfo.discountedPriceWithPPN;
            displayOriginalPrice = pInfo.originalPriceWithPPN;
            displayDiscountStr = pInfo.discountStr;
            displayIsCustomerDiscount = pInfo.isCustomerDiscount;
            itemSubtotal = displayPrice * item.quantity;
        }

        return {
            ...item,
            basePrice,
            category,
            readyPriceInfo,
            indentPriceInfo,
            isSplit,
            readyQty,
            indentQty,
            displayPrice,
            displayOriginalPrice,
            displayDiscountStr,
            displayIsCustomerDiscount,
            itemSubtotal
        };
    });

    const cartTotalPrice = calculatedItems.reduce((sum, item) => sum + item.itemSubtotal, 0);

    const handleLoggedInSubmit = async (isDraft: boolean = false) => {
        setIsSubmitting(true);

        const items: any[] = [];
        for (const item of calculatedItems) {
            if (item.isSplit) {
                // Split into two separate items for database and processing
                items.push({
                    sku: item.sku,
                    name: `${item.name} (Ready Stock)`,
                    brand: item.brand,
                    price: item.readyPriceInfo.discountedPriceWithPPN,
                    quantity: item.readyQty,
                    readyStock: item.readyQty,
                    indent: 0,
                    discountStr: item.readyPriceInfo.discountStr,
                    originalPrice: item.readyPriceInfo.originalPriceWithPPN,
                    stockStatus: 'READY'
                });

                items.push({
                    sku: item.sku,
                    name: `${item.name} (Indent)`,
                    brand: item.brand,
                    price: item.indentPriceInfo.discountedPriceWithPPN,
                    quantity: item.indentQty,
                    readyStock: 0,
                    indent: item.indentQty,
                    discountStr: item.indentPriceInfo.discountStr,
                    originalPrice: item.indentPriceInfo.originalPriceWithPPN,
                    stockStatus: 'INDENT'
                });
            } else {
                const isReady = item.stockStatus === 'READY' || (item.stockStatus !== 'INDENT' && item.availableToSell > 0);
                items.push({
                    sku: item.sku,
                    name: item.name,
                    brand: item.brand,
                    price: item.displayPrice,
                    quantity: item.quantity,
                    readyStock: isReady ? item.quantity : 0,
                    indent: !isReady ? item.quantity : 0,
                    discountStr: item.displayDiscountStr,
                    originalPrice: item.displayOriginalPrice,
                    stockStatus: item.stockStatus || (isReady ? 'READY' : 'INDENT')
                });
            }
        }

        const result = await saveQuotationToDb(
            items,
            cartTotalPrice,
            isDraft ? 'DRAFT' : 'PENDING',
            undefined, // No userClientId for now
            isDraft ? estimateName : undefined // Pass estimate name if draft
        );

        setIsSubmitting(false);

        if (result.success) {
            clearCart();
            if (isDraft) {
                toast.success("Estimasi berhasil disimpan!");
                setTimeout(() => router.push('/dashboard/estimasi'), 1500);
            } else {
                toast.success(`SQ #${result.quotationNo?.slice(-8).toUpperCase()} berhasil dibuat!`);
                setTimeout(() => router.push('/dashboard/transaksi'), 2000);
            }
        } else {
            toast.error(result.error || "Gagal menyimpan quotation");
        }
    };

    const handleSaveEstimate = async () => {
        setIsEstimateModalOpen(false);
        await handleLoggedInSubmit(true);
        setEstimateName(""); // Reset
    };

    const handleRFQClick = () => {
        if (user) {
            if (!user.address) {
                setIsModalOpen(true);
            } else {
                handleLoggedInSubmit(false); // Default is RFQ (not draft)
            }
        } else {
            setIsModalOpen(true);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6">
            
            {/* Page Header with Compact Decorative Accent */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 select-none">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2.5">
                        <ShoppingBag className="w-6 h-6 text-red-600" />
                        Keranjang Belanja
                    </h1>
                </div>
                {calculatedItems.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{totalItems} Item</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-red-600 uppercase tracking-wider">Proses Penawaran</span>
                    </div>
                )}
            </div>

            {calculatedItems.length === 0 ? (
                /* Elegant & Compact Empty State Container */
                <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12 text-center shadow-xs max-w-xl mx-auto select-none">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 relative shadow-2xs">
                        <ShoppingBag className="w-8 h-8 text-slate-400" />
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                    </div>
                    <h2 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight mb-1.5">Keranjang Belanja Kosong</h2>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto mb-6 font-semibold leading-relaxed">
                        Anda belum menambahkan produk apa pun ke keranjang belanja Anda. Jelajahi katalog kami untuk memulai.
                    </p>
                    <Link prefetch={false} href="/pencarian">
                        <Button className="h-10 px-6 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xs hover:shadow-sm hover:scale-101 transition-all active:scale-99">
                            Mulai Belanja
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 items-start">
                    
                    {/* Left - Cart Items List (lg:col-span-2) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs">
                            
                            {/* Card Header */}
                            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/20 select-none">
                                <h2 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">
                                    Daftar Belanja ({calculatedItems.length} Produk)
                                </h2>
                            </div>

                            {/* Cart Items Rows */}
                            <div className="divide-y divide-slate-100">
                                {calculatedItems.map((item) => (
                                    <div key={item.id} className="p-4 flex flex-col sm:flex-row gap-4 hover:bg-slate-50/10 transition-colors">
                                        
                                        {/* Compact Product Image Panel */}
                                        <div className="w-16 h-16 bg-slate-50/30 border border-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-2xs select-none">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-contain p-1.5"
                                                    sizes="64px"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">
                                                    No Image
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info Panel */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-3 select-none">
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[9px] uppercase tracking-wider text-red-600 font-extrabold block">
                                                            {item.brand || "SIEMENS"}
                                                        </span>
                                                        <h3 className="text-xs font-bold text-slate-800 line-clamp-2 uppercase leading-snug hover:text-red-600 transition-colors" title={item.name}>
                                                            {item.name}
                                                        </h3>
                                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">SKU: <span className="text-slate-600 font-bold">{item.sku}</span></p>
                                                    </div>
                                                    
                                                    {/* Compact Trash Icon Button */}
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-100/20 shadow-2xs active:scale-90"
                                                        title="Hapus dari Keranjang"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Compact Status Badge */}
                                                <div className="mt-1.5 select-none">
                                                    {item.isSplit ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100/40 font-bold tracking-wide flex items-center gap-1 w-fit">
                                                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                                Ready: {item.readyQty}
                                                            </span>
                                                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 font-bold tracking-wide flex items-center gap-1 w-fit">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                Indent: {item.indentQty}
                                                            </span>
                                                        </div>
                                                    ) : item.stockStatus === 'READY' || (!item.stockStatus && item.availableToSell > 0) ? (
                                                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100/40 font-bold tracking-wide flex items-center gap-1 w-fit">
                                                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                            Ready Stock
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 font-bold tracking-wide flex items-center gap-1 w-fit">
                                                            <Clock className="w-3 h-3" />
                                                            Indent
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price & iOS-Style Quantity Spinner */}
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mt-3 border-t border-slate-50/50 pt-2.5">
                                                
                                                {/* Subtotal / Price Display */}
                                                <div className="select-none flex-1">
                                                    {item.isSplit ? (
                                                        <div className="space-y-1">
                                                            {/* Split Total Subtotal */}
                                                            <p className="text-xs md:text-sm font-extrabold text-slate-800 tracking-tight">
                                                                Total: <span className="text-red-600">Rp {formatPrice(item.itemSubtotal)}</span>
                                                            </p>
                                                            {/* Split Breakdown Details */}
                                                            <div className="text-[10px] text-slate-500 font-semibold space-y-0.5 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100 max-w-sm">
                                                                <div className="flex justify-between gap-4">
                                                                    <span>• {item.readyQty} Unit Ready Stock:</span>
                                                                    <span className="font-bold text-slate-700">Rp {formatPrice(item.readyPriceInfo.discountedPriceWithPPN)} / Unit</span>
                                                                </div>
                                                                <div className="flex justify-between gap-4">
                                                                    <span>• {item.indentQty} Unit Indent:</span>
                                                                    <span className="font-bold text-slate-700">Rp {formatPrice(item.indentPriceInfo.discountedPriceWithPPN)} / Unit</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            {item.displayIsCustomerDiscount && item.displayOriginalPrice && item.displayOriginalPrice > item.displayPrice && (
                                                                <span className="text-[10px] text-slate-400 line-through font-semibold block">
                                                                    Rp {formatPrice(item.displayOriginalPrice)}
                                                                </span>
                                                            )}
                                                            <p className="text-xs md:text-sm font-extrabold text-red-600 tracking-tight">
                                                                Rp {formatPrice(item.displayPrice)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Compact iOS Style Quantity Spinner */}
                                                <div className="flex items-center gap-1.5 select-none self-end sm:self-center">
                                                    <div className="flex items-center justify-between border border-slate-200/60 rounded-lg p-0.5 bg-slate-50/50">
                                                        <button
                                                            onClick={() => {
                                                                if (item.quantity <= 1) {
                                                                    removeItem(item.id);
                                                                } else {
                                                                    updateQuantity(item.id, item.quantity - 1);
                                                                }
                                                            }}
                                                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all bg-transparent border border-transparent text-slate-600 font-bold active:scale-95 hover:bg-white hover:shadow-2xs ${
                                                                item.quantity <= 1 ? "hover:text-red-600 hover:bg-red-50 hover:border-red-100" : ""
                                                            }`}
                                                        >
                                                            {item.quantity <= 1 ? (
                                                                <Trash2 className="w-3 h-3" />
                                                            ) : (
                                                                <Minus className="w-2.5 h-2.5" />
                                                            )}
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            min="1"
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (!isNaN(val) && val >= 1) {
                                                                    updateQuantity(item.id, val);
                                                                }
                                                            }}
                                                            className="w-10 h-6 text-center text-xs font-black text-slate-800 bg-transparent border-0 focus:outline-none focus:ring-0"
                                                        />
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white active:bg-slate-100 hover:shadow-2xs transition-all bg-transparent border border-transparent text-slate-600 font-bold active:scale-95"
                                                        >
                                                            <Plus className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-0.5">
                                                        Unit
                                                    </span>
                                                </div>

                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right - Order Summary Sidebar (lg:col-span-1) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-155 p-4 shadow-2xs relative overflow-hidden sticky top-24">
                            
                            {/* Premium Red Top Accent Line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600" />

                            <h2 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest mb-4 select-none">Ringkasan Pesanan</h2>

                            {/* Compact Summary Items Thumbnail List */}
                            <div className="space-y-3 pb-4 border-b border-slate-100">
                                {calculatedItems.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-2xs select-none">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-contain p-1"
                                                    sizes="36px"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 bg-slate-100 rounded-md" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 line-clamp-1 uppercase" title={item.name}>{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-semibold">
                                                {item.isSplit ? (
                                                    <span>{item.readyQty} Ready + {item.indentQty} Indent</span>
                                                ) : (
                                                    <span>{item.quantity} x Rp {formatPrice(item.displayPrice)}</span>
                                                )}
                                            </p>
                                        </div>
                                        <p className="text-xs font-extrabold text-slate-700 flex-shrink-0 select-none">
                                            Rp {formatPrice(item.itemSubtotal)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Totals Section */}
                            <div className="py-3 space-y-2 border-b border-slate-100/50 select-none">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="text-slate-500">Total Kuantitas</span>
                                    <span className="text-slate-800">{totalItems} Unit</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="text-slate-800 font-bold text-slate-900">Rp {formatPrice(cartTotalPrice)}</span>
                                </div>
                            </div>

                            {/* Grand Total */}
                            <div className="pt-3 select-none">
                                <div className="flex justify-between items-baseline mb-4">
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Total</span>
                                    <div className="text-right">
                                        <span className="font-extrabold text-lg text-red-600 tracking-tight block">
                                            Rp {formatPrice(cartTotalPrice)}
                                        </span>
                                        <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5 block">
                                            *Sudah Termasuk PPN 11%
                                        </span>
                                    </div>
                                </div>

                                {/* Premium RFQ Button */}
                                <Button
                                    onClick={handleRFQClick}
                                    disabled={isSubmitting}
                                    className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 transform active:scale-98 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            Minta Penawaran Harga
                                        </>
                                    )}
                                </Button>

                                {/* Premium Save Estimate Button */}
                                {user && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEstimateModalOpen(true)}
                                        disabled={isSubmitting}
                                        className="w-full h-11 border-slate-200 hover:border-slate-300 text-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all mt-2.5 transform active:scale-98 shadow-2xs"
                                    >
                                        Simpan Sebagai Estimasi
                                    </Button>
                                )}

                                <p className="text-[9px] font-semibold text-slate-400 text-center mt-3.5 leading-normal select-none">
                                    Harga belum termasuk ongkos kirim. Tim Sales Hokiindo akan menghubungi Anda secepatnya setelah penawaran dikirim.
                                </p>
                            </div>

                        </div>
                    </div>

                </div>
            )}

            {/* Toast notifications */}
            <ToastManager toasts={toasts} removeToast={removeToast} />

            {/* Estimate Modal */}
            <Dialog open={isEstimateModalOpen} onOpenChange={setIsEstimateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-extrabold text-slate-900 tracking-tight uppercase">Simpan Estimasi</DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs font-semibold leading-relaxed">
                            Simpan keranjang ini sebagai draft untuk dikirim nanti.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="estimateName" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Proyek (Opsional)</Label>
                            <Input
                                id="estimateName"
                                placeholder="Contoh: Proyek Apartemen A / Gedung B"
                                value={estimateName}
                                onChange={(e) => setEstimateName(e.target.value)}
                                className="h-10 rounded-xl border-slate-200 focus:border-red-500 focus:ring-red-500 font-semibold"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsEstimateModalOpen(false)} className="h-10 rounded-xl border-slate-200 text-slate-600 font-bold">
                            Batal
                        </Button>
                        <Button onClick={handleSaveEstimate} className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold">
                            Simpan Estimasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Checkout Modal */}
            <GuestCheckoutModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleQuotationSuccess}
                user={user}
                refreshUser={refreshUser}
            />
        </div>
    );
}
