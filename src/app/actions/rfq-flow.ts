"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

// --- Stage 1: Admin Confirm Quotation (Link HRSQ) ---
export async function adminConfirmQuotation(
    quotationId: string,
    accurateHsqId?: number | null,
    accurateHsqNo?: string | null,
    adminQuotePdfPath?: string,
    adminNotes?: string
) {
    try {
        await db.salesQuotation.update({
            where: { id: quotationId },
            data: {
                status: "OFFERED",
                accurateHsqId: accurateHsqId || null,
                accurateHsqNo: accurateHsqNo || null,
                adminQuotePdfPath,
                adminNotes,
                offeredAt: new Date()
            }
        });

        // Log Activity: Offer Sent
        const logPromises: Promise<any>[] = [];
        if (accurateHsqNo) {
            logPromises.push(
                logActivity(quotationId, "OFFER_SENT", "Penawaran (SQ) dikirim ke user", `Admin mengirimkan Sales Quotation resmi nomor ${accurateHsqNo}.`, "ADMIN")
            );
        } else {
            logPromises.push(
                logActivity(quotationId, "OFFER_SENT", "Tagihan / Konfirmasi dikirim ke user", `Admin telah mengkonfirmasi pesanan. Tagihan telah tersedia.`, "ADMIN")
            );
        }
        if (adminQuotePdfPath) {
            logPromises.push(
                logActivity(quotationId, "SQ_UPLOADED", "Dokumen SQ diupload", `Admin mengunggah dokumen penawaran resmi (SQ).`, "ADMIN")
            );
        }
        await Promise.all(logPromises);
        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminConfirmQuotation error:", error);
        return { success: false, error: "Failed to confirm quotation" };
    }
}

// --- Stage 2: User Submit PO & Negotiation ---
export async function userSubmitPO(
    quotationId: string,
    userPoPath: string,
    specialDiscountRequest: boolean,
    specialDiscountNote?: string
) {
    try {
        // Verify ownership
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const quote = await db.salesQuotation.findUnique({ where: { id: quotationId } });
        if (!quote || quote.userId !== session.user.id) return { success: false, error: "Unauthorized" };

        await db.salesQuotation.update({
            where: { id: quotationId },
            data: {
                status: "CONFIRMED", // Or stay OFFERED if discount requested? Let's say CONFIRMED means user responded.
                // Actually, if discount requested, maybe status should be PROCESSING or back to PENDING? 
                // Plan says: "Admin memproses pesanan". So CONFIRMED is good.
                userPoPath,
                specialDiscountRequest,
                specialDiscountNote,
                confirmedAt: new Date()
            }
        });

        // Log Activity: PO Upload + Discount Request (separate events)
        await logActivity(quotationId, "PO_UPLOADED", "Purchase Order (PO) diupload", "User mengunggah dokumen Purchase Order untuk dikonfirmasi admin.", "USER");
        if (specialDiscountRequest) {
            const discountDesc = specialDiscountNote
                ? `User mengajukan permintaan diskon tambahan: "${specialDiscountNote}"`
                : "User mengajukan permintaan diskon tambahan tanpa catatan.";
            await logActivity(quotationId, "DISCOUNT_REQUESTED", "Pengajuan diskon tambahan", discountDesc, "USER");
        }
        revalidatePath(`/dashboard/transaksi`);
        return { success: true };
    } catch (error) {
        console.error("userSubmitPO error:", error);
        return { success: false, error: "Failed to submit PO" };
    }
}

// --- Stage 4: Admin Process Order (Link HSO) ---
export async function adminProcessOrder(
    quotationId: string,
    accurateHsoId?: number | null,
    accurateHsoNo?: string | null,
    adminSoPdfPath?: string,
    adminNotes?: string,
    adminInvoicePdfPath?: string,
    nextStatus: string = "PROCESSING"
) {
    try {
        await db.salesQuotation.update({
            where: { id: quotationId },
            data: {
                status: nextStatus,
                accurateHsoId: accurateHsoId || null,
                accurateHsoNo: accurateHsoNo || null,
                adminSoPdfPath,
                adminNotes,
                adminInvoicePdfPath,
                processedAt: new Date()
            }
        });

        // Log Activity: SO Processing + document uploads
        const soLogPromises: Promise<any>[] = [];
        if (accurateHsoNo) {
            soLogPromises.push(
                logActivity(quotationId, "SO_UPLOADED", "Sales Order (SO) diterbitkan", `Admin memproses pesanan dan menerbitkan SO nomor ${accurateHsoNo}.`, "ADMIN")
            );
        } else {
            soLogPromises.push(
                logActivity(quotationId, "ORDER_PROCESSED", "Pesanan Diterima & Diproses", `Admin memproses pesanan ini untuk disiapkan dan dikirimkan.`, "ADMIN")
            );
        }
        if (adminSoPdfPath) {
            soLogPromises.push(
                logActivity(quotationId, "SO_DOC_UPLOADED", "Dokumen SO diupload", "Admin mengunggah dokumen Sales Order (SO).", "ADMIN")
            );
        }
        if (adminInvoicePdfPath) {
            soLogPromises.push(
                logActivity(quotationId, "INVOICE_UPLOADED", "Invoice/Faktur diupload", "Admin mengunggah dokumen Faktur Penjualan.", "ADMIN")
            );
        }
        if (adminNotes) {
            soLogPromises.push(
                logActivity(quotationId, "ADMIN_NOTE", "Catatan admin diperbarui", adminNotes, "ADMIN")
            );
        }
        await Promise.all(soLogPromises);
        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminProcessOrder error:", error);
        return { success: false, error: "Failed to process order" };
    }
}

// --- User Upload Payment Proof ---
export async function userUploadPaymentProof(quotationId: string, paymentProofPath: string) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        await db.salesQuotation.update({
            where: { id: quotationId },
            data: { paymentProofPath }
        });

        // Log Activity
        await logActivity(quotationId, "PAYMENT_UPLOADED", "Bukti bayar diupload", "User telah mengupload bukti pembayaran.", "USER");

        revalidatePath(`/dashboard/transaksi/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("userUploadPaymentProof error:", error);
        return { success: false, error: "Gagal mengupload bukti pembayaran" };
    }
}

// --- Admin Rollback Stage ---
const ROLLBACK_MAP: Record<string, string> = {
    "OFFERED": "PENDING",
    "CONFIRMED": "OFFERED",
    "PROCESSING": "CONFIRMED",
    "SHIPPED": "PROCESSING",
};

export async function adminRollbackStage(quotationId: string) {
    try {
        const quotation = await db.salesQuotation.findUnique({
            where: { id: quotationId }
        });

        if (!quotation) return { success: false, error: "Quotation not found" };

        const previousStatus = ROLLBACK_MAP[quotation.status];
        if (!previousStatus) {
            return { success: false, error: "Tidak bisa kembali dari tahap ini" };
        }

        await db.salesQuotation.update({
            where: { id: quotationId },
            data: { status: previousStatus }
        });

        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        return { success: true, newStatus: previousStatus };
    } catch (error) {
        console.error("adminRollbackStage error:", error);
        return { success: false, error: "Gagal kembali ke tahap sebelumnya" };
    }
}

export async function adminUploadInvoice(quotationId: string, adminInvoicePdfPath: string) {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
            return { success: false, error: "Unauthorized" };
        }

        await db.salesQuotation.update({
            where: { id: quotationId },
            data: { adminInvoicePdfPath }
        });

        // Log Activity
        await logActivity(quotationId, "INVOICE_UPLOADED", "Invoice diterbitkan", "Admin telah mengunggah faktur penjualan.", "ADMIN");

        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminUploadInvoice error:", error);
        return { success: false, error: "Gagal menyimpan invoice" };
    }
}

// --- Stage 6: Admin Ship Order (Link DO) ---
export async function adminShipOrder(
    quotationId: string,
    accurateDoId?: number | null,
    accurateDoNo?: string | null,
    adminDoPdfPath?: string,
    trackingNumber?: string,
    shippingNotes?: string
) {
    try {
        await db.salesQuotation.update({
            where: { id: quotationId },
            data: {
                status: "SHIPPED",
                accurateDoId: accurateDoId || null,
                accurateDoNo: accurateDoNo || null,
                adminDoPdfPath,
                trackingNumber,
                shippingNotes,
                shippedAt: new Date()
            }
        });

        // Log Activity
        let desc = "Admin telah memproses dan mengirimkan pesanan";
        if (accurateDoNo) desc += ` menggunakan Surat Jalan (DO) No. ${accurateDoNo}`;
        if (trackingNumber) desc += ` dengan Nomor Resi ${trackingNumber}`;
        if (shippingNotes && shippingNotes.trim() !== "") desc += ` (${shippingNotes})`;
        desc += ".";

        await logActivity(quotationId, "DO_UPLOADED", "Pesanan Dikirim", desc, "ADMIN");
        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminShipOrder error:", error);
        return { success: false, error: "Failed to ship order" };
    }
}

// --- Stage 7: User Confirm Receipt ---
export async function userConfirmReceipt(
    quotationId: string,
    receiptEvidencePath: string
) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        await db.salesQuotation.update({
            where: { id: quotationId },
            data: {
                status: "COMPLETED",
                receiptEvidencePath,
                completedAt: new Date()
            }
        });

        // Log Activity
        await logActivity(quotationId, "COMPLETED", "Pesanan selesai", "User telah mengonfirmasi penerimaan barang.", "USER");
        revalidatePath(`/dashboard/transaksi`);
        return { success: true };
    } catch (error) {
        console.error("userConfirmReceipt error:", error);
        return { success: false, error: "Failed to confirm receipt" };
    }
}

// --- Stage 8: User Request Return ---
export async function userRequestReturn(
    quotationId: string,
    returnReason: string,
    returnEvidencePath: string
) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        await db.salesQuotation.update({
            where: { id: quotationId },
            data: {
                returnRequest: true,
                returnReason,
                returnEvidencePath
            }
        });

        // Log Activity
        await logActivity(quotationId, "RETURN_REQUESTED", "Pengajuan retur", `User mengajukan pengembalian barang dengan alasan: ${returnReason}`, "USER");
        revalidatePath(`/dashboard/transaksi`);
        return { success: true };
    } catch (error) {
        console.error("userRequestReturn error:", error);
        return { success: false, error: "Failed to request return" };
    }
}

export async function adminJumpToStatus(quotationId: string, targetStatus: string) {
    try {
        const session = await getSession();
        if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
            return { success: false, error: "Unauthorized" };
        }

        const quotation = await db.salesQuotation.findUnique({
            where: { id: quotationId }
        });

        if (!quotation) return { success: false, error: "Quotation not found" };

        const validStatuses = ["PENDING", "OFFERED", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED"];
        if (!validStatuses.includes(targetStatus)) {
            return { success: false, error: "Status tidak valid" };
        }

        await db.salesQuotation.update({
            where: { id: quotationId },
            data: { status: targetStatus }
        });

        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminJumpToStatus error:", error);
        return { success: false, error: "Gagal merubah status" };
    }
}

// --- Admin Upload Tax Invoice (Faktur Pajak) ---
export async function adminUploadTaxInvoice(quotationId: string, taxInvoiceUrl: string) {
    try {
        await db.salesQuotation.update({
            where: { id: quotationId },
            data: { taxInvoiceUrl }
        });

        await logActivity(
            quotationId,
            "TAX_INVOICE_UPLOADED",
            "Faktur Pajak diupload",
            "Admin telah mengunggah dokumen Faktur Pajak (e-Faktur).",
            "ADMIN"
        );

        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        revalidatePath(`/dashboard/transaksi/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminUploadTaxInvoice error:", error);
        return { success: false, error: "Failed to upload tax invoice" };
    }
}
