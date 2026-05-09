"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, Trash2, Loader2, MapPin, Shield, Sparkles, MessageCircle, Clock, Check, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/useCart";
import Image from "next/image";
import Link from "next/link";
import GuestCheckoutModal from "@/components/public/GuestCheckoutModal";
import { saveQuotationToDb } from "@/app/actions/cart";
import { useAuth } from "@/components/auth/CanAccess";
import { useToast, ToastManager } from "@/components/ui/toast";

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
    const { items: cartItems, updateQuantity, removeItem, totalItems, totalPrice, clearCart } = useCart();
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

    const handleLoggedInSubmit = async (isDraft: boolean = false) => {
        setIsSubmitting(true);

        const items = cartItems.map(item => {
            return {
                sku: item.sku,
                name: item.name,
                brand: item.brand,
                price: item.price,
                quantity: item.quantity,
                readyStock: item.stockStatus === 'READY' ? item.quantity : 0,
                indent: item.stockStatus === 'INDENT' ? item.quantity : 0,
                discountStr: item.discountStr,
                originalPrice: item.originalPrice,
                stockStatus: item.stockStatus
            };
        });

        const result = await saveQuotationToDb(
            items,
            totalPrice,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            
            {/* Page Header with Decorative Accent */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-100 select-none">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-red-600 font-extrabold mb-1">
                        Hokiindo Portal
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                        <ShoppingBag className="w-7 h-7 text-red-600" />
                        Keranjang Belanja
                    </h1>
                </div>
                {cartItems.length > 0 && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">{totalItems} Item</span>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                        <span className="text-red-600">Proses Penawaran</span>
                    </div>
                )}
            </div>

            {cartItems.length === 0 ? (
                /* Elegant & Modern Empty State Container */
                <div className="bg-white rounded-3xl border border-slate-100 p-10 md:p-16 text-center shadow-xs max-w-2xl mx-auto select-none">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 relative shadow-2xs">
                        <ShoppingBag className="w-10 h-10 text-slate-400" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white" />
                    </div>
                    <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Keranjang Anda Masih Kosong</h2>
                    <p className="text-slate-400 text-xs md:text-sm max-w-sm mx-auto mb-8 font-medium leading-relaxed">
                        Anda belum menambahkan produk apa pun ke keranjang belanja Anda. Jelajahi katalog kami untuk memulai.
                    </p>
                    <Link prefetch={false} href="/pencarian">
                        <Button className="h-11 px-8 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:shadow-lg hover:scale-102 transition-all active:scale-98">
                            Mulai Belanja
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Left - Cart Items List (lg:col-span-2) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
                            
                            {/* Card Header */}
                            <div className="p-5 border-b border-slate-50 bg-slate-50/20 select-none">
                                <h2 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">
                                    Daftar Belanja ({cartItems.length} Produk)
                                </h2>
                            </div>

                            {/* Cart Items Rows */}
                            <div className="divide-y divide-slate-100">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="p-5 md:p-6 flex flex-col sm:flex-row gap-5 md:gap-6 hover:bg-slate-50/20 transition-colors">
                                        
                                        {/* Product Image Panel */}
                                        <div className="w-20 h-20 bg-slate-50/30 border border-slate-100 rounded-2xl flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-2xs select-none">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-contain p-2"
                                                    sizes="80px"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                                                    No Image
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info Panel */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-3 select-none">
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[9px] uppercase tracking-wider text-red-600 font-extrabold mb-1 block">
                                                            {item.brand || "SIEMENS"}
                                                        </span>
                                                        <h3 className="text-xs md:text-sm font-bold text-slate-800 line-clamp-2 uppercase leading-snug hover:text-red-600 transition-colors" title={item.name}>
                                                            {item.name}
                                                        </h3>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-1">SKU: <span className="text-slate-600 font-semibold">{item.sku}</span></p>
                                                    </div>
                                                    
                                                    {/* Premium Trash Icon Button */}
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-100/30 shadow-2xs active:scale-90"
                                                        title="Hapus dari Keranjang"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Premium Status Badge */}
                                                <div className="mt-2.5 select-none">
                                                    {item.stockStatus === 'READY' ? (
                                                        <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/50 font-bold tracking-wide flex items-center gap-1.5 w-fit">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            Stok Tersedia (Ready)
                                                        </span>
                                                    ) : item.stockStatus === 'INDENT' ? (
                                                        <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 font-bold tracking-wide flex items-center gap-1.5 w-fit">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            Indent
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 font-medium flex items-center gap-1 w-fit">
                                                            -
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price & iOS-Style Quantity Spinner */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 border-t border-slate-50/60 pt-3">
                                                
                                                {/* Subtotal / Price Display */}
                                                <div className="select-none">
                                                    {item.isCustomerDiscount && item.originalPrice && item.originalPrice > item.price && (
                                                        <span className="text-xs text-slate-400 line-through font-semibold block mb-0.5">
                                                            Rp {formatPrice(item.originalPrice)}
                                                        </span>
                                                    )}
                                                    <p className="text-sm md:text-base font-extrabold text-red-600 tracking-tight">
                                                        Rp {formatPrice(item.price)}
                                                    </p>
                                                </div>

                                                {/* iOS Style Numeric Input Spinner */}
                                                <div className="flex items-center gap-2 select-none">
                                                    <div className="flex items-center justify-between border border-slate-200/80 rounded-xl p-1 bg-slate-50/50">
                                                        <button
                                                            onClick={() => {
                                                                if (item.quantity <= 1) {
                                                                    removeItem(item.id);
                                                                } else {
                                                                    updateQuantity(item.id, item.quantity - 1);
                                                                }
                                                            }}
                                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-transparent border border-transparent text-slate-600 font-bold active:scale-95 hover:bg-white hover:shadow-2xs ${
                                                                item.quantity <= 1 ? "hover:text-red-600 hover:bg-red-50 hover:border-red-100" : ""
                                                            }`}
                                                        >
                                                            {item.quantity <= 1 ? (
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <Minus className="w-3 h-3" />
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
                                                            className="w-12 h-7 text-center text-xs font-black text-slate-800 bg-transparent border-0 focus:outline-none focus:ring-0"
                                                        />
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white active:bg-slate-100 hover:shadow-2xs transition-all bg-transparent border border-transparent text-slate-600 font-bold active:scale-95"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider ml-1">
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
                        <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs relative overflow-hidden sticky top-24">
                            
                            {/* Premium Red Top Accent Line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600" />

                            <h2 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest mb-5 select-none">Ringkasan Pesanan</h2>

                            {/* Summary Items Thumbnail List */}
                            <div className="space-y-4 pb-5 border-b border-slate-100">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3.5">
                                        <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-2xs select-none">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-contain p-1"
                                                    sizes="44px"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 bg-slate-100 rounded-md" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-800 line-clamp-1 uppercase" title={item.name}>{item.name}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">{item.quantity} x Rp {formatPrice(item.price)}</p>
                                        </div>
                                        <p className="text-xs font-extrabold text-slate-700 flex-shrink-0 select-none">
                                            Rp {formatPrice(item.price * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Totals Section */}
                            <div className="py-4 space-y-3 border-b border-slate-100/60 select-none">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="text-slate-500">Total Kuantitas</span>
                                    <span className="text-slate-800">{totalItems} Unit</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="text-slate-800">Rp {formatPrice(totalPrice)}</span>
                                </div>
                            </div>

                            {/* Grand Total */}
                            <div className="pt-4 mb-6 select-none">
                                <div className="flex justify-between items-baseline mb-6">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Total</span>
                                    <div className="text-right">
                                        <span className="font-extrabold text-xl text-red-600 tracking-tight block">
                                            Rp {formatPrice(totalPrice)}
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
                                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-98 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
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
                                        className="w-full h-12 border-slate-200 hover:border-slate-300 text-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all mt-3 transform active:scale-98 shadow-2xs"
                                    >
                                        Simpan Sebagai Estimasi
                                    </Button>
                                )}

                                <p className="text-[10px] font-medium text-slate-400 text-center mt-4 leading-normal select-none">
                                    Harga belum termasuk ongkos kirim. Tim Sales Hokiindo akan menghubungi Anda secepatnya setelah penawaran dikirim.
                                </p>
                            </div>

                            {/* Premium assurance badges consistent with product detail page */}
                            <div className="border-t border-slate-100 pt-5 space-y-3 text-[10px] font-semibold text-slate-500 select-none">
                                <div className="flex items-center gap-2.5">
                                    <Shield className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span>Garansi Resmi Siemens Indonesia</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Sparkles className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span>100% Produk Original & Baru</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <MessageCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span>Layanan Dukungan Teknik (Technical Support)</span>
                                </div>
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
