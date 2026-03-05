"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteQuotation } from "@/app/actions/quotation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DeleteQuotationButton({ id, quotationNo }: { id: string; quotationNo: string }) {
    const router = useRouter();

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
            onClick={async (e) => {
                e.stopPropagation();
                if (window.confirm(`Hapus penawaran ${quotationNo}?`)) {
                    const res = await deleteQuotation(id);
                    if (res.success) {
                        toast.success("Penawaran dihapus");
                        router.refresh();
                    } else {
                        toast.error(res.error || "Gagal menghapus");
                    }
                }
            }}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
