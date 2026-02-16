"use client";

import { useEffect, useState } from "react";
import { Send, Truck, ShoppingCart, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getUserQuotations } from "@/app/actions/quotation";

export default function DashboardPage() {
    const [counts, setCounts] = useState({ offered: 0, confirmed: 0, shipped: 0 });

    useEffect(() => {
        getUserQuotations().then(result => {
            if (result.success) {
                setCounts({
                    offered: result.quotations.filter((q: any) => q.status === "OFFERED").length,
                    confirmed: result.quotations.filter((q: any) => q.status === "CONFIRMED").length,
                    shipped: result.quotations.filter((q: any) => q.status === "SHIPPED").length,
                });
            }
        });
    }, []);

    const notifications = [
        { count: counts.offered, icon: Send, label: "Penawaran Baru", desc: "Ada penawaran harga menunggu konfirmasi Anda", color: "bg-purple-50 border-purple-200 text-purple-800", iconBg: "bg-purple-100", iconColor: "text-purple-600", linkColor: "text-purple-600" },
        { count: counts.confirmed, icon: ShoppingCart, label: "Pesanan Diproses", desc: "Pesanan Anda sedang diproses", color: "bg-indigo-50 border-indigo-200 text-indigo-800", iconBg: "bg-indigo-100", iconColor: "text-indigo-600", linkColor: "text-indigo-600" },
        { count: counts.shipped, icon: Truck, label: "Pesanan Dikirim", desc: "Barang sedang dalam perjalanan", color: "bg-sky-50 border-sky-200 text-sky-800", iconBg: "bg-sky-100", iconColor: "text-sky-600", linkColor: "text-sky-600" },
    ];

    const activeNotifications = notifications.filter(n => n.count > 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Overview</h2>

            {/* Notification Banners */}
            {activeNotifications.length > 0 && (
                <div className="space-y-3 mb-6">
                    {activeNotifications.map((n, idx) => (
                        <Link key={idx} href="/dashboard/transaksi">
                            <div className={`p-4 border rounded-xl flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer ${n.color}`}>
                                <div className={`p-2 ${n.iconBg} rounded-lg`}>
                                    <n.icon className={`w-5 h-5 ${n.iconColor}`} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{n.count} {n.label}</p>
                                    <p className="text-xs opacity-80">{n.desc}</p>
                                </div>
                                <span className={`text-sm font-medium ${n.linkColor}`}>Lihat →</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Welcome */}
            <div className="flex flex-col items-center justify-center py-10 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Selamat Datang di Dashboard</h3>
                <p className="text-gray-500 max-w-md mb-6">
                    Kelola Sales Order, Sales Quotation, dan profil akun Anda di sini.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
                    <Link href="/pencarian" className="p-4 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">
                        <p className="font-semibold text-red-700">Belanja Baru</p>
                        <p className="text-xs text-red-600 mt-1">Cari Produk Siemens Electrical</p>
                    </Link>
                    <Link href="/dashboard/transaksi" className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors relative">
                        <p className="font-semibold text-gray-900">Transaksi</p>
                        <p className="text-xs text-gray-500 mt-1">Lihat status pesanan</p>
                        {(counts.confirmed + counts.shipped) > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {counts.confirmed + counts.shipped}
                            </span>
                        )}
                    </Link>
                    <Link href="/dashboard/transaksi" className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors relative">
                        <p className="font-semibold text-purple-700">Penawaran Harga</p>
                        <p className="text-xs text-purple-600 mt-1">Cek penawaran masuk</p>
                        {counts.offered > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {counts.offered}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </div>
    );
}
