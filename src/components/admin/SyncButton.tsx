"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Package } from "lucide-react";
import { syncProductsAction, syncStockOnlyAction } from "@/app/actions/product";

export default function SyncButton() {
    const [isPendingFull, startFullTransition] = useTransition();
    const [isPendingStock, startStockTransition] = useTransition();
    const [message, setMessage] = useState("");

    const handleFullSync = () => {
        startFullTransition(async () => {
            const result = await syncProductsAction();
            setMessage(result.message);
            setTimeout(() => setMessage(""), 5000);
        });
    };

    const handleStockSync = () => {
        startStockTransition(async () => {
            const result = await syncStockOnlyAction();
            setMessage(result.message);
            setTimeout(() => setMessage(""), 5000);
        });
    };

    const isPending = isPendingFull || isPendingStock;

    return (
        <div className="flex items-center gap-2">
            {message && (
                <span className="text-sm font-medium text-green-600 animate-in fade-in transition-all">
                    {message}
                </span>
            )}
            <Button
                onClick={handleStockSync}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
                disabled={isPending}
            >
                <Package className={`w-4 h-4 mr-2 ${isPendingStock ? "animate-pulse" : ""}`} />
                {isPendingStock ? "Syncing..." : "Sync Stock"}
            </Button>
            <Button
                onClick={handleFullSync}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isPending}
            >
                <RefreshCw className={`w-4 h-4 mr-2 ${isPendingFull ? "animate-spin" : ""}`} />
                {isPendingFull ? "Syncing..." : "Sync Accurate"}
            </Button>
        </div>
    );
}
