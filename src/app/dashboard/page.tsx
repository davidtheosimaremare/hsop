"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
    FileText,
    Receipt,
    FileCheck,
    User,
    Key,
    MapPin,
    LogOut,
    CheckCircle2,
    Handshake
} from "lucide-react";
import { Button } from "@/components/ui/button";

type MenuType = "negosiasi" | "transaksi" | "invoice" | "profil" | "password" | "alamat";

const pesananMenu = [
    { id: "negosiasi" as MenuType, label: "Daftar Negosiasi", icon: FileText },
    { id: "transaksi" as MenuType, label: "Daftar Transaksi", icon: Receipt },
    { id: "invoice" as MenuType, label: "Daftar Invoice", icon: FileCheck },
];

const akunMenu = [
    { id: "profil" as MenuType, label: "Profil Pengguna", icon: User },
    { id: "password" as MenuType, label: "Ubah kata sandi", icon: Key },
    { id: "alamat" as MenuType, label: "Alamat Pengiriman", icon: MapPin },
];

const menuTitles: Record<MenuType, string> = {
    negosiasi: "Daftar Negosiasi",
    transaksi: "Daftar Transaksi",
    invoice: "Daftar Invoice",
    profil: "Profil Pengguna",
    password: "Ubah Kata Sandi",
    alamat: "Alamat Pengiriman",
};

export default function DashboardPage() {
    const [activeMenu, setActiveMenu] = useState<MenuType>("negosiasi");

    const renderEmptyState = (title: string, description: string) => (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="w-32 h-32 mb-6 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <Handshake className="w-20 h-20 text-teal-500" />
                </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">{description}</p>
            <a href="/pencarian">
                <Button className="bg-red-600 hover:bg-red-700 text-white px-6">
                    Mulai Belanja
                </Button>
            </a>
        </div>
    );

    const renderContent = () => {
        switch (activeMenu) {
            case "negosiasi":
                return renderEmptyState(
                    "Belum Ada Pengajuan Negosiasi Harga",
                    "Beli produk kebutuhan material dan ajukan negosiasi harga yang sesuai dengan anggaran proyek Anda."
                );
            case "transaksi":
                return renderEmptyState(
                    "Belum Ada Transaksi",
                    "Anda belum memiliki transaksi. Mulai belanja untuk melihat daftar transaksi Anda."
                );
            case "invoice":
                return renderEmptyState(
                    "Belum Ada Invoice",
                    "Anda belum memiliki invoice. Invoice akan muncul setelah transaksi selesai."
                );
            case "profil":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    defaultValue="David Theo Nanda Saputra"
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    defaultValue="david@hokiindo.com"
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">No. Handphone</label>
                                <input
                                    type="tel"
                                    defaultValue="+62 812 6222 0021"
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Akun</label>
                                <input
                                    type="text"
                                    defaultValue="Retail"
                                    disabled
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50"
                                />
                            </div>
                        </div>
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                            Simpan Perubahan
                        </Button>
                    </div>
                );
            case "password":
                return (
                    <div className="max-w-md space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Lama</label>
                            <input
                                type="password"
                                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Baru</label>
                            <input
                                type="password"
                                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                            <input
                                type="password"
                                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                            Ubah Kata Sandi
                        </Button>
                    </div>
                );
            case "alamat":
                return (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm text-gray-500">Anda belum menambahkan alamat pengiriman.</p>
                            <Button className="bg-red-600 hover:bg-red-700 text-white">
                                Tambah Alamat
                            </Button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Sidebar */}
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {/* User Profile */}
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-teal-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                    David Theo Nanda Saputra
                                                </h3>
                                                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                                            </div>
                                            <p className="text-xs text-teal-600 font-medium">Retail</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pesanan Menu */}
                                <div className="p-3">
                                    <h4 className="px-2 text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
                                        Pesanan
                                    </h4>
                                    <div className="space-y-1">
                                        {pesananMenu.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveMenu(item.id)}
                                                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${activeMenu === item.id
                                                        ? "bg-red-50 text-red-600"
                                                        : "text-gray-600 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <item.icon className="w-4 h-4" />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Akun Menu */}
                                <div className="p-3 border-t border-gray-100">
                                    <h4 className="px-2 text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
                                        Akun
                                    </h4>
                                    <div className="space-y-1">
                                        {akunMenu.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveMenu(item.id)}
                                                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${activeMenu === item.id
                                                        ? "bg-red-50 text-red-600"
                                                        : "text-gray-600 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <item.icon className="w-4 h-4" />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Logout */}
                                <div className="p-3 border-t border-gray-100">
                                    <button className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
                                        <LogOut className="w-4 h-4" />
                                        Keluar Akun
                                    </button>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <div className="flex-1">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    {menuTitles[activeMenu]}
                                </h2>
                                {renderContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
