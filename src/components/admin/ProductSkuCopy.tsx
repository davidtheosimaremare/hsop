"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ProductSkuCopy({ sku }: { sku: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(sku);
        setCopied(true);
        toast.success("SKU disalin ke clipboard", { description: sku });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100",
                copied ? "bg-emerald-50 text-emerald-600" : "hover:bg-red-50 text-slate-400 hover:text-red-600"
            )}
            title="Copy SKU"
        >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
}
