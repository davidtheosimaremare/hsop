"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { scrapeAndSaveProduct } from "@/app/actions/scraper-save";
import { useRouter } from "next/navigation";

interface ScrapeButtonProps {
    productId: string;
    sku: string;
}

export function ScrapeButton({ productId, sku }: ScrapeButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    // const { toast } = useToast(); // Assuming standard shadcn toast

    const handleScrape = () => {
        if (!confirm("Fitur ini akan menimpa Deskripsi, Spesifikasi, dan Gambar produk ini dengan data dari Siemens. Lanjutkan?")) return;

        startTransition(async () => {
            const result = await scrapeAndSaveProduct(productId, sku);
            if (result.success) {
                alert("Berhasil! Data produk telah diperbarui dari Siemens.");
                router.refresh();
            } else {
                alert(`Gagal: ${result.error}`);
            }
        });
    };

    return (
        <Button
            variant="outline"
            onClick={handleScrape}
            disabled={isPending}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sedang Mengambil...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Ambil Data Siemens
                </>
            )}
        </Button>
    );
}
