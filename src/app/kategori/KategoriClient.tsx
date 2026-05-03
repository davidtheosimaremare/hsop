"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SubCategory {
    id: string;
    name: string;
    alias?: string;
    count?: number;
    link?: string;
}

interface MenuItem {
    id: string;
    name: string;
    alias?: string;
    icon: string;
    categoryId?: string;
    subcategories: SubCategory[];
}

interface Props {
    menuItems: MenuItem[];
}

export default function KategoriClient({ menuItems }: Props) {
    const [activeId, setActiveId] = useState<string>(menuItems[0]?.id ?? "");
    const activeMenu = menuItems.find(m => m.id === activeId) ?? menuItems[0];

    if (menuItems.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-gray-400">
                Belum ada kategori yang dikonfigurasi.
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Breadcrumb */}
            <nav className="text-sm mb-5 text-gray-500">
                <Link prefetch={false}  href="/" className="hover:text-red-600 transition-colors">Beranda</Link>
                <span className="mx-2 text-gray-300">›</span>
                <span className="text-red-600 font-medium">Kategori</span>
            </nav>

            {/* ── Mobile: horizontal pill tabs ── */}
            <div className="flex gap-2 flex-wrap sm:hidden mb-4">
                {menuItems.map((item) => {
                    const isActive = item.id === activeId;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveId(item.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                                ${isActive
                                    ? "bg-red-600 text-white border-red-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
                                }`}
                        >
                            {item.alias || item.name}
                        </button>
                    );
                })}
            </div>

            {/* ── Desktop + Mobile content wrapper ── */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm min-h-[72vh] flex flex-col sm:flex-row">

                {/* Sidebar — hidden on mobile (uses pills above instead) */}
                <aside className="hidden sm:flex w-52 lg:w-56 flex-shrink-0 bg-white border-r border-gray-100 flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Kategori Produk
                        </p>
                    </div>
                    <nav className="flex-1">
                        {menuItems.map((item) => {
                            const isActive = item.id === activeId;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveId(item.id)}
                                    className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors border-l-[3px]
                                        ${isActive
                                            ? "border-red-600 bg-red-50 text-red-700 font-semibold"
                                            : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <span className="flex-1 truncate">{item.alias || item.name}</span>
                                    <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-red-400" : "text-gray-300"}`} />
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content */}
                <div className="flex-1 min-w-0 bg-white">
                    {activeMenu && (
                        <div className="p-5 sm:p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                                        {activeMenu.alias || activeMenu.name}
                                    </h1>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {activeMenu.subcategories.length} sub-kategori
                                    </p>
                                </div>
                                <Link prefetch={false} 
                                    href={`/pencarian?q=&category=${encodeURIComponent(activeMenu.name).replace(/%20/g, "+")}`}
                                    className="flex-shrink-0 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                >
                                    Semua produk
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {/* Sub-category text links */}
                            {activeMenu.subcategories.length > 0 ? (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-0.5">
                                    {activeMenu.subcategories.map((sub) => {
                                        const label = sub.alias || sub.name;
                                        const href = `/pencarian?q=&category=${encodeURIComponent(sub.name).replace(/%20/g, "+")}`;
                                        return (
                                            <li key={sub.id}>
                                                <Link prefetch={false} 
                                                    href={href}
                                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors group"
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-red-500 transition-colors flex-shrink-0" />
                                                    <span className="flex-1 leading-snug">{label}</span>
                                                    {sub.count !== undefined && sub.count > 0 && (
                                                        <span className="text-[10px] text-gray-400 tabular-nums">
                                                            {sub.count}
                                                        </span>
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-16">
                                    Belum ada sub-kategori.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
