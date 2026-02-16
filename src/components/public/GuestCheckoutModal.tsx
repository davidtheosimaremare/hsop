"use client";

import { useState } from "react";
import { X, Mail, Phone, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitCartQuotation } from "@/app/actions/cart";
import { useCart } from "@/lib/useCart";
import Image from "next/image";

interface GuestCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function GuestCheckoutModal({ isOpen, onClose, onSuccess }: GuestCheckoutModalProps) {
    const { items, totalPrice, clearCart } = useCart();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [showLoginCta, setShowLoginCta] = useState(true);

    const formatPrice = (price: number) => new Intl.NumberFormat("id-ID").format(Math.round(price));

    const isFormValid = email.includes("@") && phone.length >= 8;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setError("");
        setIsSubmitting(true);

        const cartItems = items.map(item => {
            let readyStock = 0;
            let indent = 0;

            if (item.availableToSell > 0) {
                if (item.quantity <= item.availableToSell) {
                    readyStock = item.quantity;
                } else {
                    readyStock = item.availableToSell;
                    indent = item.quantity - item.availableToSell;
                }
            } else {
                indent = item.quantity;
            }

            return {
                sku: item.sku,
                name: item.name,
                brand: item.brand,
                price: item.price,
                quantity: item.quantity,
                readyStock,
                indent
            };
        });

        const result = await submitCartQuotation(email, phone, cartItems, totalPrice);

        setIsSubmitting(false);

        if (result.success) {
            setIsSuccess(true);
            setTimeout(() => {
                clearCart();
                onSuccess();
                onClose();
            }, 2000);
        } else {
            setError(result.error || "Terjadi kesalahan");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-red-600 text-white px-5 py-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Request for Quotation</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="p-8 text-center">
                        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Permintaan Terkirim!</h3>
                        <p className="text-sm text-gray-600">
                            Tim sales kami akan menghubungi Anda segera.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
                            {/* Cart Items Summary - Compact */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-semibold text-gray-900">Produk ({items.length})</h3>
                                    <span className="font-bold text-red-600">Rp {formatPrice(totalPrice)}</span>
                                </div>
                                <div className="space-y-1.5 max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-2">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2 text-xs">
                                            <div className="w-8 h-8 bg-white rounded flex-shrink-0 relative overflow-hidden border">
                                                {item.image ? (
                                                    <Image src={item.image} alt={item.name} fill className="object-contain p-0.5" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-900 line-clamp-1">{item.name}</p>
                                            </div>
                                            <span className="text-gray-500">{item.quantity}x</span>
                                            <span className="font-medium text-gray-900">Rp {formatPrice(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contact Form - Compact Inline */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900">Informasi Kontak</h3>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email *"
                                            required
                                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="No. HP *"
                                            required
                                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                                        {error}
                                    </div>
                                )}

                                <p className="text-[11px] text-gray-500">
                                    Harga belum termasuk ongkos kirim. Tim sales akan menghubungi Anda secepatnya.
                                </p>
                            </div>

                            {/* Login/Register CTA - Dismissable */}
                            {showLoginCta && (
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-100 relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginCta(false)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <p className="text-xs font-medium text-gray-800 mb-1 pr-4">
                                        💡 Ingin transaksi tersimpan otomatis?
                                    </p>
                                    <p className="text-[11px] text-gray-600 mb-2">
                                        Daftar untuk tidak perlu isi data berulang & dapatkan <span className="font-semibold text-red-600">diskon spesial</span>!
                                    </p>
                                    <div className="flex gap-2">
                                        <a
                                            href="/masuk"
                                            className="flex-1 text-center py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            Masuk
                                        </a>
                                        <a
                                            href="/daftar"
                                            className="flex-1 text-center py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Daftar Sekarang
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 bg-gray-50 border-t flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 h-9 text-sm"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !isFormValid}
                                className="flex-1 h-9 text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                        Mengirim...
                                    </>
                                ) : (
                                    "Kirim Permintaan"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
