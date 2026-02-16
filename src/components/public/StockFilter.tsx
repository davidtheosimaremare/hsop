"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function StockFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const stockStatus = searchParams.get("stockStatus") || "all";

    const handleFilterChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") {
            params.set("stockStatus", value);
        } else {
            params.delete("stockStatus");
        }
        params.set("page", "1"); // Reset pagination
        router.push(`/pencarian?${params.toString()}`);
    };

    return (
        <Select value={stockStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Status Stok" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Stok</SelectItem>
                <SelectItem value="ready">Ready Stock</SelectItem>
                <SelectItem value="indent">Indent</SelectItem>
            </SelectContent>
        </Select>
    );
}
