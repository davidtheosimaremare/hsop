"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { scrapeSiemensProduct } from "@/app/actions/scraper";
import { updateProductDetails } from "@/app/actions/product";
import { useRouter } from "next/navigation";

interface ProductAutoUpdateProps {
    productId: string;
    sku: string;
    targets?: ("description" | "image" | "specifications")[];
}

export function ProductAutoUpdate({ productId, sku, targets = ["description"] }: ProductAutoUpdateProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleAutoUpdate = async () => {
        const targetNames = targets.join(", ");
        if (!confirm(`Fitur ini akan mengambil data terbaru (${targetNames}) dari Siemens dan menimpa data yang ada. Lanjutkan?`)) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await scrapeSiemensProduct(sku);
            if (result.success && result.data) {
                // Prepare update data
                const updateData: any = {};
                if (targets.includes("description") && result.data.description) updateData.description = result.data.description;
                if (targets.includes("image") && result.data.image) updateData.image = result.data.image;
                if (targets.includes("specifications") && result.data.specifications) updateData.specifications = result.data.specifications;

                if (Object.keys(updateData).length > 0) {
                    const saveResult = await updateProductDetails(productId, updateData);
                    if (saveResult.success) {
                        alert("Berhasil memperbarui informasi produk dari Siemens!");
                        router.refresh();
                    } else {
                        alert("Gagal menyimpan data ke database.");
                    }
                } else {
                    alert("Scraper berhasil berjalan tetapi tidak menemukan data baru yang signifikan.");
                }
            } else {
                alert(result.error || "Gagal mengambil data dari Siemens.");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan sistem.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleAutoUpdate}
            disabled={isLoading}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
            {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : (
                <RefreshCw className="h-3 w-3 mr-2" />
            )}
            {isLoading ? "Updating..." : `Update ${targets[0] === 'image' ? 'Image' : 'Info'}`}
        </Button>
    );
}
