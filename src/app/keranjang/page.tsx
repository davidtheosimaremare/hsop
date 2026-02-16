"use client";

import { useState } from "react";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/useCart";
import Image from "next/image";
import Link from "next/link";
import GuestCheckoutModal from "@/components/public/GuestCheckoutModal";
import { saveQuotationToDb } from "@/app/actions/cart";

interface CartPageProps {
    user?: { id: string; email: string; name?: string } | null;
}

export default function CartPage({ user }: CartPageProps) {
    const { items: cartItems, updateQuantity, removeItem, totalItems, totalPrice, clearCart } = useCart();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID").format(Math.round(price));
    };

    const handleQuotationSuccess = () => {
        setSuccessMessage("Permintaan terkirim! Tim sales akan menghubungi Anda.");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
    };

    const handleLoggedInSubmit = async () => {
        setIsSubmitting(true);

        const items = cartItems.map(item => {
            return {
                sku: item.sku,
                name: item.name,
                brand: item.brand,
                price: item.price,
                quantity: item.quantity,
                // If item is marked as READY explicitly, put qty there. If INDENT, put there.
                // If no status (legacy), fallback to old logic?
                // For now user wants split, so we trust stockStatus.
                readyStock: item.stockStatus === 'READY' ? item.quantity : 0,
                indent: item.stockStatus === 'INDENT' ? item.quantity : 0
            };
        });

        const result = await saveQuotationToDb(items, totalPrice);

        setIsSubmitting(false);

        if (result.success) {
            clearCart();
            setSuccessMessage(`Quotation #${result.quotationNo?.slice(-8).toUpperCase()} berhasil dibuat!`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
        } else {
            alert(result.error || "Gagal menyimpan quotation");
        }
    };

    const handleRFQClick = () => {
        if (user) {
            handleLoggedInSubmit();
        } else {
            setIsModalOpen(true);
        }
    };


    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Keranjang</h1>

            {cartItems.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-500 mb-4">Keranjang Anda kosong</p>
                    <Link href="/pencarian">
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                            Mulai Belanja
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left - Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Cart Items List */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h2 className="font-semibold text-gray-900">
                                    Produk Yang Akan Dibeli ({cartItems.length} item)
                                </h2>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="p-4 flex gap-4">
                                        {/* Product Image */}
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-contain p-1"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 bg-gray-200 rounded" />
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 mb-0.5">{item.brand}</p>
                                                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                                                        {item.name}
                                                    </h3>
                                                    {/* Status Badge */}
                                                    <div className="mt-1.5">
                                                        {item.stockStatus === 'READY' ? (
                                                            <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                <span>Ready Stock</span>
                                                            </div>
                                                        ) : item.stockStatus === 'INDENT' ? (
                                                            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                                <span>Indent</span>
                                                            </div>
                                                        ) : (
                                                            // Fallback for old items without status
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                                <span>-</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Price & Quantity */}
                                            <div className="flex items-center justify-between mt-3">
                                                <div className="flex flex-col">
                                                    {item.originalPrice && item.originalPrice > item.price && (
                                                        <span className="text-xs text-gray-400 line-through">
                                                            Rp {formatPrice(item.originalPrice)}
                                                        </span>
                                                    )}
                                                    <p className="text-sm font-bold text-red-600">
                                                        Rp {formatPrice(item.price)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (item.quantity <= 1) {
                                                                removeItem(item.id);
                                                            } else {
                                                                updateQuantity(item.id, item.quantity - 1);
                                                            }
                                                        }}
                                                        className={`w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center transition-colors ${item.quantity <= 1
                                                            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                                                            : "hover:bg-gray-50 text-gray-600"
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
                                                        className="w-12 h-7 text-center text-sm font-medium border border-gray-300 rounded focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-xs text-gray-500 ml-1">
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

                    {/* Right - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
                            <h2 className="font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h2>

                            {/* Summary Items */}
                            <div className="space-y-3 pb-4 border-b border-gray-100">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-contain p-0.5"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 bg-gray-200 rounded" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-900 line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.quantity} x Rp {formatPrice(item.price)}</p>
                                        </div>
                                        <p className="text-xs font-medium text-gray-900 flex-shrink-0">
                                            Rp {formatPrice(item.price * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="py-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Item</span>
                                    <span className="font-medium text-gray-900">{totalItems} item</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium text-gray-900">Rp {formatPrice(totalPrice)}</span>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between mb-4">
                                    <span className="font-semibold text-gray-900">Total</span>
                                    <span className="font-bold text-lg text-red-600">
                                        Rp {formatPrice(totalPrice)}
                                    </span>
                                </div>

                                {/* Request for Quotation Button */}
                                <Button
                                    onClick={handleRFQClick}
                                    disabled={isSubmitting}
                                    className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        "Request for Quotation"
                                    )}
                                </Button>

                                <p className="text-xs text-gray-500 text-center mt-3">
                                    Harga belum termasuk ongkos kirim. Tim sales akan menghubungi Anda secepatnya.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-right">
                    <p className="font-medium">{successMessage || "Berhasil!"}</p>
                </div>
            )}

            {/* Guest Checkout Modal */}
            <GuestCheckoutModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleQuotationSuccess}
            />
        </div>
    );
}

