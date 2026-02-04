"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toggleProductVisibility } from "@/app/actions/product";

interface ProductVisibilityToggleProps {
    productId: string;
    isVisible: boolean;
}

export function ProductVisibilityToggle({ productId, isVisible }: ProductVisibilityToggleProps) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const handleConfirm = () => {
        startTransition(async () => {
            await toggleProductVisibility(productId, !isVisible);
            setOpen(false);
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {isVisible ? (
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}
                        Sembunyikan Produk
                    </Button>
                ) : (
                    <Button variant="default" className="bg-green-600 hover:bg-green-700" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                        Tampilkan Produk
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isVisible ? "Sembunyikan Produk ini?" : "Tampilkan Produk ini?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isVisible
                            ? "Produk akan disembunyikan dari hasil pencarian dan halaman depan website. Pengunjung tidak akan bisa melihat produk ini."
                            : "Produk akan ditampilkan kembali di website dan dapat dilihat oleh pengunjung."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault(); // Prevent auto-close to handle async
                            handleConfirm();
                        }}
                        disabled={isPending}
                        className={isVisible ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                    >
                        {isPending ? "Memproses..." : isVisible ? "Ya, Sembunyikan" : "Ya, Tampilkan"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
