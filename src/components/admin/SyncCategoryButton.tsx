"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { syncCategoriesFromAccurateAction } from "@/app/actions/category";
import { Loader2, CloudDownload } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncCategoryButton() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSync = () => {
        if (!confirm("Ini akan mengambil semua kategori dari Accurate dan mengupdate database. Lanjutkan?")) return;

        startTransition(async () => {
            const res = await syncCategoriesFromAccurateAction();
            if (res.success) {
                alert(`Berhasil sinkronisasi! Memproses ${res.count} kategori.`);
                router.refresh();
            } else {
                alert(`Gagal sinkronisasi: ${res.error}`);
            }
        });
    };

    return (
        <Button
            onClick={handleSync}
            disabled={isPending}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <CloudDownload className="h-4 w-4" />
            )}
            Sync dari Accurate
        </Button>
    );
}
