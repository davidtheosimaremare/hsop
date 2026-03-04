"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Loader2, 
    Save, 
    XCircle, 
    RefreshCw,
    TrendingUp,
    Zap,
    Pencil
} from "lucide-react";
import { updateProductDetails } from "@/app/actions/product";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditablePriceSectionProps {
    productId: string;
    sku: string;
    initialPrice: number;
    brand?: string | null;
    productName?: string | null;
}

export function EditablePriceSection({ productId, sku, initialPrice, brand, productName }: EditablePriceSectionProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [price, setPrice] = useState(initialPrice);
    const [isPending, startTransition] = useTransition();

    const handleCancel = () => {
        setPrice(initialPrice);
        setIsEditing(false);
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateProductDetails(productId, { price } as any);
            if (result.success) {
                setIsEditing(false);
                toast.success("Harga produk berhasil diperbarui");
                router.refresh();
            } else {
                toast.error("Gagal menyimpan perubahan harga");
            }
        });
    };

    const isSiemens = 
        brand?.toLowerCase().includes("siemens") || 
        productName?.toLowerCase().includes("siemens") || 
        sku.startsWith("6ES") || 
        sku.startsWith("3RT");

    if (!isEditing) {
        return (
            <div className="group relative">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga Satuan</p>
                        <h3 className="text-2xl font-black text-gray-900">
                            Rp {initialPrice.toLocaleString("id-ID")}
                        </h3>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsEditing(true)}
                            className="h-8 w-8 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Edit Harga</Label>
                <button onClick={handleCancel} disabled={isPending} className="text-gray-400 hover:text-red-600 transition-colors">
                    <XCircle className="h-5 w-5" />
                </button>
            </div>

            <div className="space-y-2">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</span>
                    <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        disabled={isPending}
                        className="pl-10 h-11 rounded-xl border-gray-200 text-lg font-black focus:ring-red-200 focus:border-red-500"
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <Button 
                    onClick={handleSave} 
                    disabled={isPending} 
                    className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-95"
                >
                    {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan
                </Button>
            </div>
        </div>
    );
}
