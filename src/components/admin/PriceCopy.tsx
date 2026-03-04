"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PriceCopy({ price }: { price: number }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const priceStr = price.toString();
        navigator.clipboard.writeText(priceStr);
        setCopied(true);
        toast.success("Harga disalin", { description: `Rp ${price.toLocaleString("id-ID")}` });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "p-1 rounded-md transition-all opacity-0 group-hover:opacity-100 ml-auto",
                copied ? "bg-emerald-50 text-emerald-600" : "hover:bg-red-100 text-red-300 hover:text-red-700"
            )}
            title="Salin Angka Harga"
        >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
    );
}
