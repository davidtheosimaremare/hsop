"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sample cart items
const initialCartItems = [
    {
        id: 1,
        name: "Besi Beton AS Asia Steel 10mm Polos TP280",
        brand: "AS Asia Steel",
        price: 85350,
        quantity: 1,
        inStock: true,
        unit: "Batang"
    },
    {
        id: 2,
        name: "Besi Beton JAS 12mm Polos TP280",
        brand: "JAS",
        price: 104804,
        quantity: 1,
        inStock: true,
        unit: "Batang"
    },
    {
        id: 3,
        name: "Besi Beton Perwira 16mm Ulir TS420",
        brand: "Perwira",
        price: 196563,
        quantity: 2,
        inStock: false,
        unit: "Batang"
    },
];

export default function CartPage() {
    const [cartItems, setCartItems] = useState(initialCartItems);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    const updateQuantity = (id: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        setCartItems(items =>
            items.map(item =>
                item.id === id ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const removeItem = (id: number) => {
        setCartItems(items => items.filter(item => item.id !== id));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Keranjang</h1>

                    {cartItems.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                            <p className="text-gray-500 mb-4">Keranjang Anda kosong</p>
                            <a href="/pencarian">
                                <Button className="bg-red-600 hover:bg-red-700 text-white">
                                    Mulai Belanja
                                </Button>
                            </a>
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
                                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                                    <div className="w-14 h-14 bg-gray-200 rounded" />
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-500 mb-0.5">{item.brand}</p>
                                                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                                                                {item.name}
                                                            </h3>
                                                            {/* Stock Status */}
                                                            <div className="mt-1.5">
                                                                {item.inStock ? (
                                                                    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                                                                        Stok Tersedia
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                                                                        Inden (Pre-Order)
                                                                    </span>
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
                                                        <p className="text-sm font-bold text-red-600">
                                                            Rp {formatPrice(item.price)}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="w-8 text-center text-sm font-medium">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                            <span className="text-xs text-gray-500 ml-1">
                                                                {item.unit}
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
                                                <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                                                    <div className="w-6 h-6 bg-gray-200 rounded" />
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
                                            <span className="font-medium text-gray-900">Rp {formatPrice(subtotal)}</span>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex justify-between mb-4">
                                            <span className="font-semibold text-gray-900">Total</span>
                                            <span className="font-bold text-lg text-red-600">
                                                Rp {formatPrice(subtotal)}
                                            </span>
                                        </div>

                                        {/* Request for Quotation Button */}
                                        <Button className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium">
                                            Request for Quotation
                                        </Button>

                                        <p className="text-xs text-gray-500 text-center mt-3">
                                            Tim kami akan menghubungi Anda untuk konfirmasi pesanan dan penawaran harga terbaik
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
