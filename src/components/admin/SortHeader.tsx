"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortHeaderProps {
    title: string;
    field: string;
}

export default function SortHeader({ title, field }: SortHeaderProps) {
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "name";
    const currentOrder = searchParams.get("order") || "asc";

    const isCurrent = currentSort === field;
    const nextOrder = isCurrent && currentOrder === "asc" ? "desc" : "asc";

    // Reconstruct params
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", field);
    params.set("order", nextOrder);

    return (
        <Link
            href={`?${params.toString()}`}
            className="flex items-center gap-1 hover:text-gray-900 group"
        >
            {title}
            <span className="text-gray-400 group-hover:text-gray-600">
                {isCurrent ? (
                    currentOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                ) : (
                    <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                )}
            </span>
        </Link>
    );
}
