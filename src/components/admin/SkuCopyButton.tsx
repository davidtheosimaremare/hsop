"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SkuCopyButton({ sku }: { sku: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(sku);
        setCopied(true);
        toast.success(`SKU ${sku} disalin`);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2 group">
            <code className="text-xs font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                {sku}
            </code>
            <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-all active:scale-95"
                title="Salin SKU"
            >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}
