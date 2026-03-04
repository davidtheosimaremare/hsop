"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { ModernConfirm } from "@/components/ui/modern-confirm";
import { deleteCustomerAction } from "@/app/actions/customer";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CustomerDeleteButtonProps {
    customerId: string;
    customerName: string | null;
}

export function CustomerDeleteButton({ customerId, customerName }: CustomerDeleteButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        startTransition(async () => {
            const res = await deleteCustomerAction(customerId);
            if (res.success) {
                toast.success("Customer berhasil dihapus permanen");
                router.push("/admin/customers");
                router.refresh();
            } else {
                toast.error(res.error || "Gagal menghapus customer");
                setIsOpen(false);
            }
        });
    };

    return (
        <>
            <Button
                variant="ghost"
                onClick={() => setIsOpen(true)}
                className="rounded-xl h-10 w-10 text-gray-400 hover:text-red-600 hover:bg-red-50 p-0 transition-colors"
                title="Hapus Customer"
            >
                <Trash2 className="w-5 h-5" />
            </Button>

            <ModernConfirm
                open={isOpen}
                onOpenChange={setIsOpen}
                title="Hapus Customer Permanen?"
                description={`Apakah Anda yakin ingin menghapus ${customerName || 'customer ini'}? Seluruh data transaksi, alamat, dan akses user akan dihapus permanen dari database.`}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                confirmText="Ya, Hapus Permanen"
                variant="destructive"
            />
        </>
    );
}
