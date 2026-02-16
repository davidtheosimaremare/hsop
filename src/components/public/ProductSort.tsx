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
            <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:inline">Urutkan:</span>
            <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                    <SelectValue placeholder="Urutkan..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="relevansi">Relevansi</SelectItem>
                    <SelectItem value="abjad">Abjad A-Z</SelectItem>
                    <SelectItem value="price-low">Harga Terendah</SelectItem>
                    <SelectItem value="price-high">Harga Tertinggi</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
