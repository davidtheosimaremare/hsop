"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncProductsAction } from "@/app/actions/product";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SyncButton() {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState("");

    const handleSync = () => {
        startTransition(async () => {
            const result = await syncProductsAction();
            setMessage(result.message);
            // Clear message after 3 seconds
            setTimeout(() => setMessage(""), 5000);
        });
    };

    return (
        <div className="flex items-center gap-2">
            {message && (
                <span className="text-sm font-medium text-green-600 animate-in fade-in transition-all">
                    {message}
                </span>
            )}
            <Button
                onClick={handleSync}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isPending}
            >
                <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
                {isPending ? "Syncing..." : "Sync Accurate"}
            </Button>
        </div>
    );
}
