"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { syncCustomersAction } from "@/app/actions/customer";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function CustomerSyncButton() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    // Assuming useToast is available, if not I'll just use alert or internal state for simplicity like ProductSync
    // ProductSync use basic state logic? Let's check ProductSyncButton code if needed, 
    // but I'll implement simple state feedback here.
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleSync = () => {
        startTransition(async () => {
            const result = await syncCustomersAction();
            if (result.success) {
                setStatus("success");
                router.refresh();
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                setTimeout(() => setStatus("idle"), 3000);
            }
        });
    };

    return (
        <Button
            variant="outline"
            onClick={handleSync}
            disabled={isPending}
            className={status === "success" ? "border-green-500 text-green-600 bg-green-50" : status === "error" ? "border-red-500 text-red-600 bg-red-50" : ""}
        >
            {isPending ? (
                <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                </>
            ) : status === "success" ? (
                <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Synced
                </>
            ) : status === "error" ? (
                <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Failed
                </>
            ) : (
                <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Customers
                </>
            )}
        </Button>
    );
}
