"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductSort() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "relevansi";

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", value);
        params.set("page", "1"); // Reset pagination
        router.push(`/pencarian?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:inline">Urutkan:</span>
            <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[150px] md:w-[170px] h-9 text-xs font-semibold rounded-xl border-slate-200 text-slate-700 bg-white shadow-xs focus:ring-1 focus:ring-red-500/10">
                    <SelectValue placeholder="Urutkan..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-lg text-xs font-medium">
                    <SelectItem value="relevansi" className="text-xs">Relevansi</SelectItem>
                    <SelectItem value="abjad" className="text-xs">Abjad A-Z</SelectItem>
                    <SelectItem value="price-low" className="text-xs">Harga Terendah</SelectItem>
                    <SelectItem value="price-high" className="text-xs">Harga Tertinggi</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
