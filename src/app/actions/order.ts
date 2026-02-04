"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateOrder(id: string, data: {
    status?: string;
    discount?: number;
    notes?: string;
    attachmentQuote?: string;
    attachmentPO?: string;
    attachmentInvoice?: string;
}) {
    try {
        await db.order.update({
            where: { id },
            data: {
                ...data,
            },
        });
        revalidatePath("/admin/orders");
        revalidatePath(`/admin/orders/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update order:", error);
        return { success: false, error: "Gagal mengupdate pesanan." };
    }
}

export async function updateOrderStatus(id: string, status: string) {
    return updateOrder(id, { status });
}
