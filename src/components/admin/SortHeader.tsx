"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortHeaderProps {
    title: string;
    field: string;
    className?: string;
}

export default function SortHeader({ title, field, className }: SortHeaderProps) {
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
        <Link prefetch={false} 
            href={`?${params.toString()}`}
            className={cn("flex items-center gap-1 group transition-colors", className)}
        >
            {title}
            <span className="text-gray-300 group-hover:text-gray-900 transition-colors">
                {isCurrent ? (
                    currentOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                )}
            </span>
        </Link>
    );
}
