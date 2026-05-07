"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function StockFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const stockStatus = searchParams.get("stockStatus") || "all";
    const isReadyActive = stockStatus === "ready";

    const handleToggle = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (!isReadyActive) {
            params.set("stockStatus", "ready");
        } else {
            params.delete("stockStatus");
        }
        params.set("page", "1"); // Reset pagination
        router.push(`/pencarian?${params.toString()}`);
    };

    return (
        <button
            onClick={handleToggle}
            className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center gap-1.5 shadow-xs outline-none select-none ${
                isReadyActive 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100/10" 
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            }`}
            title={isReadyActive ? "Menampilkan Ready Stock saja (Klik untuk menampilkan semua)" : "Klik untuk memfilter Ready Stock"}
        >
            <span className={`w-2 h-2 rounded-full transition-all duration-200 ${
                isReadyActive 
                    ? "bg-emerald-500 scale-110 animate-pulse" 
                    : "bg-gray-300"
            }`} />
            <span>Ready Stock Only</span>
        </button>
    );
}
