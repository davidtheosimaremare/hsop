"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ProductEditForm } from "./ProductEditForm";

interface ProductEditDialogProps {
    product: any; // Using any for simplicity in matching the server object structure
}

export function ProductEditDialog({ product }: ProductEditDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Detail
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Edit Produk: {product.name}</DialogTitle>
                    <DialogDescription>
                        Ubah deskripsi, gambar, spesifikasi, dan datasheet. Perubahan ini tidak akan tertimpa oleh sinkronisasi otomatis.
                    </DialogDescription>
                </DialogHeader>
                <ProductEditForm product={product} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
